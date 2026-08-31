from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database.connection import get_user_data_db


def get_current_data_db(current_user: dict = Depends(get_current_user)):
    """Yields the authenticated user's private data database session."""
    yield from get_user_data_db(current_user["id"])


def get_data_db_for_user(user_id: int):
    """Programmatic access to a user's data db session (used outside routes)."""
    yield from get_user_data_db(user_id)