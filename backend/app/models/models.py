from sqlalchemy import text

from app.database.connection import engine


def create_user_table() -> None:
    with engine.connect() as conn:
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS users ("
                "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                "email TEXT NOT NULL UNIQUE, "
                "name TEXT NOT NULL, "
                "hashed_password TEXT NOT NULL, "
                "is_active INTEGER NOT NULL DEFAULT 1, "
                "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
                "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
            )
        )
        conn.commit()
