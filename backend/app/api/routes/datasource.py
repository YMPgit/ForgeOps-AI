import json
import os
import re
import shutil
import sqlite3
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.dependencies import get_current_user
from app.database.connection import (
    get_user_data_db,
    get_table_names,
    get_table_row_count,
    switch_user_data_database,
    reset_user_data_database,
    sqlite_url_from_path,
)
from app.models.schemas import DataSourceInfo

router = APIRouter()

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
UPLOAD_ROOT = BACKEND_DIR / "uploads"

SUPPORTED_EXTENSIONS = {".db", ".sqlite", ".sqlite3", ".csv", ".xlsx", ".xls", ".json"}


def _user_upload_dir(user_id: int) -> Path:
    directory = UPLOAD_ROOT / str(user_id)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _user_active_source(user_id: int) -> Path:
    return _user_upload_dir(user_id) / "active_source.json"


def _clean_filename(name: str) -> str:
    cleaned = re.sub(r'[^a-zA-Z0-9_.-]', '_', name)
    return cleaned if cleaned else "custom.db"


def _sanitize_table_name(name: str) -> str:
    stem = Path(name).stem
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", stem)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned[:60] or "data"


def _dedupe_columns(columns):
    seen = {}
    deduped = []
    for column in columns:
        name = str(column).strip().replace(" ", "_").replace("-", "_")[:64]
        if not name:
            name = "column"
        if name in seen:
            seen[name] += 1
            deduped.append(f"{name}_{seen[name]}")
        else:
            seen[name] = 0
            deduped.append(name)
    return deduped


def _convert_tabular_to_sqlite(user_id: int, src: Path, raw_name: str) -> Path:
    """Convert CSV/XLSX/JSON into a SQLite database file."""
    import pandas as pd

    dest = _user_upload_dir(user_id) / f"{uuid.uuid4().hex[:12]}_converted.db"
    suffix = Path(raw_name).suffix.lower()
    try:
        if suffix == ".json":
            parsed = pd.read_json(src)
            if isinstance(parsed, dict):
                parsed = pd.DataFrame(parsed)
            df = parsed
        elif suffix in (".xlsx", ".xls"):
            df = pd.read_excel(src)
        else:
            df = pd.read_csv(src)

        if df is None:
            raise ValueError("unsupported file type")
        if df.empty:
            raise ValueError("the file contains no rows")

        df = df.reset_index(drop=True)
        df.columns = _dedupe_columns(df.columns)
        table_name = _sanitize_table_name(raw_name)

        conn = sqlite3.connect(str(dest))
        try:
            df.to_sql(table_name, conn, if_exists="replace", index=False)
        finally:
            conn.close()
    except Exception as e:
        dest.unlink(missing_ok=True)
        raise ValueError(str(e))
    return dest


def _read_upload(file: UploadFile, dest_file: Path):
    with open(dest_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)


def _cleanup_old_uploads(user_id: int, current_active_path: Path):
    user_dir = _user_upload_dir(user_id)
    if not user_dir.exists():
        return
    for item in user_dir.glob("*.db"):
        if item.resolve() != current_active_path.resolve():
            try:
                item.unlink(missing_ok=True)
            except Exception:
                pass


def _active_source_name(user_id: int) -> str:
    active = _user_active_source(user_id)
    if active.exists():
        try:
            data = json.loads(active.read_text(encoding="utf-8"))
            if data.get("name"):
                return data["name"]
        except Exception:
            return "Custom SQLite Database"
    return "Demo Database (SQLite)"


def _datasource_info(user_id: int) -> DataSourceInfo:
    name = _active_source_name(user_id)
    db = next(get_user_data_db(user_id))
    try:
        table_names = get_table_names(db)
        total_rows = sum(get_table_row_count(db, table) for table in table_names)
        return DataSourceInfo(
            name=name,
            tables=len(table_names),
            total_rows=total_rows,
        )
    finally:
        db.close()


@router.get("/datasource/info", response_model=DataSourceInfo)
def get_datasource_info(current_user: dict = Depends(get_current_user)):
    return _datasource_info(current_user["id"])


@router.post("/datasource/upload", response_model=DataSourceInfo)
async def upload_datasource(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    raw_name = file.filename or "uploaded.db"
    lower_name = raw_name.lower()
    suffix = Path(lower_name).suffix

    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Supported formats: .db, .sqlite, .sqlite3, .csv, .xlsx, .xls, .json"
        )

    user_dir = _user_upload_dir(user_id)
    clean_name = _clean_filename(raw_name)

    is_tabular = suffix in {".csv", ".xlsx", ".xls", ".json"}
    dest_file = user_dir / f"{uuid.uuid4().hex[:12]}_{clean_name}"

    try:
        if is_tabular:
            tmp_file = user_dir / f"{uuid.uuid4().hex[:8]}_tmp_{clean_name}"
            try:
                _read_upload(file, tmp_file)
                dest_file = _convert_tabular_to_sqlite(user_id, tmp_file, raw_name)
            finally:
                tmp_file.unlink(missing_ok=True)
        else:
            _read_upload(file, dest_file)
    except Exception as e:
        if dest_file.exists():
            dest_file.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded file: {str(e)}")

    # Validate that dest_file is a valid SQLite database
    try:
        conn = sqlite3.connect(str(dest_file))
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables_found = cursor.fetchall()
        cursor.execute("PRAGMA quick_check;")
        check_result = cursor.fetchone()
        conn.close()
        if not tables_found:
            raise ValueError("No tables found in the file")
        if not check_result or check_result[0] != "ok":
            raise ValueError("SQLite integrity check failed")
    except Exception as e:
        if dest_file.exists():
            dest_file.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Could not read the uploaded file as a database: {str(e)}"
        )

    # Reset this user's data engine back to default and switch it to the new upload
    reset_user_data_database(user_id)
    switch_user_data_database(user_id, sqlite_url_from_path(dest_file))

    # Save per-user active metadata
    try:
        _user_active_source(user_id).write_text(
            json.dumps({"name": raw_name, "path": dest_file.as_posix()}),
            encoding="utf-8",
        )
    except Exception:
        pass

    # Clean up older unreferenced files for this user only
    _cleanup_old_uploads(user_id, dest_file)

    return _datasource_info(user_id)


@router.post("/datasource/reset", response_model=DataSourceInfo)
def reset_datasource(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    reset_user_data_database(user_id)

    active = _user_active_source(user_id)
    if active.exists():
        try:
            active.unlink(missing_ok=True)
        except Exception:
            pass

    user_dir = _user_upload_dir(user_id)
    if user_dir.exists():
        for item in user_dir.glob("*.db"):
            try:
                item.unlink(missing_ok=True)
            except Exception:
                pass

    return _datasource_info(user_id)