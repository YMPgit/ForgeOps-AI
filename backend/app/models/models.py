from sqlalchemy import text
from app.database.connection import engine


def create_user_table() -> None:
    with engine.connect() as conn:
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS users ("
            "id BIGSERIAL PRIMARY KEY, "
            "email TEXT NOT NULL UNIQUE, "
            "name TEXT NOT NULL, "
            "hashed_password TEXT NOT NULL, "
            "is_active BOOLEAN NOT NULL DEFAULT TRUE, "
            "created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), "
            "updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())"
        ))
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS user_profiles ("
            "user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, "
            "active_source_name TEXT NOT NULL DEFAULT 'Demo Database', "
            "model_preference TEXT"
            ")"
        ))
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS user_history ("
            "id BIGSERIAL, "
            "user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, "
            "question TEXT NOT NULL, "
            "sql TEXT NOT NULL DEFAULT '', "
            "timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(), "
            "status TEXT NOT NULL DEFAULT 'success', "
            "execution_time DOUBLE PRECISION NOT NULL DEFAULT 0.0, "
            "session_id TEXT, "
            "PRIMARY KEY (user_id, id)"
            ")"
        ))
        conn.commit()
