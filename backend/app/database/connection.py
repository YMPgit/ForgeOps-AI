from sqlalchemy import create_engine, text, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

engine: Engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_user_engines: Dict[int, Engine] = {}
_schema_bootstrapped: set = set()


def _schema_for(user_id: int) -> str:
    return f"user_{user_id}"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_engine() -> Engine:
    return engine


def _user_engine(user_id: int) -> Engine:
    if user_id in _user_engines:
        return _user_engines[user_id]
    schema = _schema_for(user_id)
    user_engine = create_engine(
        DATABASE_URL,
        connect_args={"options": f"-csearch_path={schema}"},
        pool_pre_ping=True,
        pool_size=3,
        max_overflow=5,
    )
    _user_engines[user_id] = user_engine
    return user_engine


def ensure_user_schema(user_id: int):
    schema = _schema_for(user_id)
    with engine.connect() as conn:
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))
        conn.commit()
    if user_id not in _schema_bootstrapped:
        has_tables = _user_has_tables(user_id)
        if not has_tables:
            _seed_demo_data(user_id)
        _schema_bootstrapped.add(user_id)


def _user_has_tables(user_id: int) -> bool:
    schema = _schema_for(user_id)
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = :schema"),
            {"schema": schema},
        )
        return result.scalar() > 0


def _seed_demo_data(user_id: int):
    from app.database.demo_data import create_demo_schema
    create_demo_schema(user_id)


def get_user_data_db(user_id: int):
    ensure_user_schema(user_id)
    user_engine = _user_engine(user_id)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=user_engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()


def get_table_names(db: Session) -> List[str]:
    result = db.execute(
        text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = current_schema() AND table_name NOT LIKE 'user_%' "
            "ORDER BY table_name"
        )
    )
    return [row[0] for row in result.fetchall()]


def get_table_schema(db: Session, table_name: str) -> List[Dict[str, Any]]:
    result = db.execute(
        text(
            "SELECT column_name, data_type, is_nullable, column_default "
            "FROM information_schema.columns "
            "WHERE table_schema = current_schema() AND table_name = :table_name "
            "ORDER BY ordinal_position"
        ),
        {"table_name": table_name},
    )
    columns = []
    for row in result.fetchall():
        columns.append({
            "name": row[0],
            "type": row[1] or "text",
            "notnull": row[2] == "NO",
            "default_value": row[3],
            "pk": False,
        })
    return columns


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


def reset_user_data_schema(user_id: int):
    schema = _schema_for(user_id)
    with engine.connect() as conn:
        conn.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
        conn.commit()
    _schema_bootstrapped.discard(user_id)
    old = _user_engines.pop(user_id, None)
    if old is not None:
        old.dispose()
    ensure_user_schema(user_id)
