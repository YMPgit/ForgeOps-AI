from sqlalchemy import text
from app.database.connection import SessionLocal


def get_user_model(user_id: int):
    db = SessionLocal()
    try:
        result = db.execute(
            text("SELECT model_preference FROM user_profiles WHERE user_id = :user_id"),
            {"user_id": user_id},
        )
        row = result.fetchone()
        return row[0] if row and row[0] else None
    except Exception:
        return None
    finally:
        db.close()


def set_user_model(user_id: int, model: str):
    db = SessionLocal()
    try:
        db.execute(
            text(
                "INSERT INTO user_profiles (user_id, model_preference) VALUES (:user_id, :model) "
                "ON CONFLICT (user_id) DO UPDATE SET model_preference = :model"
            ),
            {"user_id": user_id, "model": model},
        )
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
