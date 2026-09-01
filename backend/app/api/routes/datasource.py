import re
import tempfile
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy import text
from app.core.dependencies import get_current_user
from app.database.connection import (
    get_user_data_db,
    get_table_names,
    get_table_row_count,
    reset_user_data_schema,
    SessionLocal,
    _user_engine,
)
from app.models.schemas import DataSourceInfo

router = APIRouter()

SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}


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


def _import_tabular_to_postgres(user_id: int, file_path: Path, raw_name: str, user_id_for_table: int):
    import pandas as pd
    suffix = Path(raw_name).suffix.lower()
    try:
        if suffix == ".json":
            parsed = pd.read_json(file_path)
            if isinstance(parsed, dict):
                parsed = pd.DataFrame(parsed)
            df = parsed
        elif suffix in (".xlsx", ".xls"):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path)

        if df is None or df.empty:
            raise ValueError("The file contains no rows")

        df = df.reset_index(drop=True)
        df.columns = _dedupe_columns(df.columns)
        table_name = _sanitize_table_name(raw_name)

        from app.database.connection import ensure_user_schema
        ensure_user_schema(user_id)
        user_engine = _user_engine(user_id)
        schema = f"user_{user_id}"

        df.to_sql(
            table_name,
            user_engine,
            schema=schema,
            if_exists="replace",
            index=False,
            chunksize=500,
        )
        return table_name
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(str(e))


def _set_active_source_name(user_id: int, name: str):
    db = SessionLocal()
    try:
        db.execute(
            text(
                "INSERT INTO user_profiles (user_id, active_source_name) VALUES (:user_id, :name) "
                "ON CONFLICT (user_id) DO UPDATE SET active_source_name = :name"
            ),
            {"user_id": user_id, "name": name},
        )
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _get_active_source_name(user_id: int) -> str:
    db = SessionLocal()
    try:
        result = db.execute(
            text("SELECT active_source_name FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": user_id},
        )
        row = result.fetchone()
        return row[0] if row else "Demo Database"
    except Exception:
        return "Demo Database"
    finally:
        db.close()


def _datasource_info(user_id: int) -> DataSourceInfo:
    name = _get_active_source_name(user_id)
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
    raw_name = file.filename or "uploaded.csv"
    suffix = Path(raw_name).suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Supported formats: .csv, .xlsx, .xls, .json"
        )

    tmp_dir = Path(tempfile.gettempdir()) / "datasource_uploads"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp_file = tmp_dir / f"{user_id}_{uuid.uuid4().hex}_{raw_name}"
    try:
        with open(tmp_file, "wb") as buffer:
            import shutil
            shutil.copyfileobj(file.file, buffer)

        _import_tabular_to_postgres(user_id, tmp_file, raw_name, user_id)
        _set_active_source_name(user_id, raw_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded file: {str(e)}")
    finally:
        tmp_file.unlink(missing_ok=True)

    return _datasource_info(user_id)


@router.post("/datasource/reset", response_model=DataSourceInfo)
def reset_datasource(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    reset_user_data_schema(user_id)
    _set_active_source_name(user_id, "Demo Database")
    return _datasource_info(user_id)
