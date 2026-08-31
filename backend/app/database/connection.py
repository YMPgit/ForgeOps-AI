from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from typing import List, Dict, Any
import os
import json
import shutil
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/main.db")


def _make_engine(db_url: str) -> Engine:
    if db_url.startswith("sqlite"):
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            poolclass=NullPool,
        )
    return create_engine(db_url, pool_pre_ping=True)


# Main database — used for authentication / users table (lives for the lifetime of the app).
engine: Engine = _make_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ---------------------------------------------------------------------------
# Per-user data databases — every account gets its own SQLite file, its own
# uploaded files, and its own active datasource. This keeps one user's data,
# queries, and uploads completely isolated from another's.
# ---------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BACKEND_DIR / "data"
USER_DATA_ROOT = DATA_DIR / "users"
DEMO_DB_PATH = DATA_DIR / "demo.db"

_user_engines: Dict[int, Engine] = {}
_user_session_factories: Dict[int, Any] = {}


def get_engine() -> Engine:
    return engine


def sqlite_url_from_path(file_path) -> str:
    return "sqlite:///" + Path(file_path).as_posix()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Demo seed database used to bootstrap each new user's data database.
# ---------------------------------------------------------------------------
def ensure_demo_seed() -> Path:
    DEMO_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not DEMO_DB_PATH.exists():
        from app.database.demo_data import create_demo_database

        demo_engine = _make_engine(sqlite_url_from_path(DEMO_DB_PATH))
        try:
            create_demo_database(engine=demo_engine)
        finally:
            try:
                demo_engine.dispose()
            except Exception:
                pass
    return DEMO_DB_PATH


def _user_data_dir(user_id: int) -> Path:
    directory = USER_DATA_ROOT / str(user_id)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _user_seed_db_path(user_id: int) -> Path:
    return _user_data_dir(user_id) / "data.db"


def _ensure_user_seed(user_id: int) -> Path:
    db_path = _user_seed_db_path(user_id)
    if not db_path.exists():
        seed = ensure_demo_seed()
        shutil.copy(seed, db_path)
    return db_path


def _dispose_user(user_id: int):
    existing = _user_engines.pop(user_id, None)
    if existing is not None:
        try:
            existing.dispose()
        except Exception:
            pass
    _user_session_factories.pop(user_id, None)


def _user_session_factory(user_id: int) -> Any:
    factory = _user_session_factories.get(user_id)
    if factory is None:
        factory = sessionmaker(autocommit=False, autoflush=False, bind=get_user_data_engine(user_id))
        _user_session_factories[user_id] = factory
    return factory


def _user_upload_active_path(user_id: int):
    active = BACKEND_DIR / "uploads" / str(user_id) / "active_source.json"
    if active.exists():
        try:
            data = json.loads(active.read_text(encoding="utf-8"))
            path = Path(data.get("path", ""))
            if path.exists():
                return path
        except Exception:
            return None
    return None


def get_user_data_engine(user_id: int) -> Engine:
    if user_id in _user_engines:
        return _user_engines[user_id]

    active_path = _user_upload_active_path(user_id)
    if active_path is not None:
        data_engine = _make_engine(sqlite_url_from_path(active_path))
    else:
        db_path = _ensure_user_seed(user_id)
        data_engine = _make_engine(sqlite_url_from_path(db_path))

    _user_engines[user_id] = data_engine
    return data_engine


def switch_user_data_database(user_id: int, db_url: str) -> Engine:
    _dispose_user(user_id)
    data_engine = _make_engine(db_url)
    _user_engines[user_id] = data_engine
    return data_engine


def reset_user_data_database(user_id: int) -> Engine:
    _dispose_user(user_id)
    return get_user_data_engine(user_id)


def get_user_data_db(user_id: int):
    db = _user_session_factory(user_id)()
    try:
        yield db
    finally:
        db.close()


def _is_sqlite(db: Session) -> bool:
    bind = db.bind
    return bool(bind) and bind.dialect.name == "sqlite"


def get_table_names(db: Session) -> List[str]:
    if _is_sqlite(db):
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'users' ORDER BY name"))
        return [row[0] for row in result.fetchall()]
    else:
        result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"))
        return [row[0] for row in result.fetchall()]


def get_table_schema(db: Session, table_name: str) -> List[Dict[str, Any]]:
    if _is_sqlite(db):
        safe_name = table_name.replace("'", "''")
        result = db.execute(text(f"PRAGMA table_info('{safe_name}')"))
        columns = []
        for row in result.fetchall():
            columns.append({
                "name": row[1],
                "type": row[2] or "TEXT",
                "notnull": bool(row[3]),
                "default_value": row[4],
                "pk": bool(row[5]),
            })
        return columns
    else:
        result = db.execute(text(
            f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = :table_name"
        ), {"table_name": table_name})
        return [{"name": row[0], "type": row[1], "notnull": False} for row in result.fetchall()]


def get_table_row_count(db: Session, table_name: str) -> int:
    try:
        safe_name = table_name.replace('"', '""')
        result = db.execute(text(f'SELECT COUNT(*) FROM "{safe_name}"'))
        count = result.scalar()
        return count if count is not None else 0
    except Exception:
        return 0


def execute_raw_sql(db: Session, sql: str) -> List[Dict[str, Any]]:
    result = db.execute(text(sql))
    columns = list(result.keys())
    rows = [dict(row._mapping) for row in result.fetchall()]
    return {"columns": columns, "rows": rows}