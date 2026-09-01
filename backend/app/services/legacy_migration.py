from sqlalchemy import text
from app.database.connection import SessionLocal


def run_legacy_migration():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        pass
    finally:
        db.close()
