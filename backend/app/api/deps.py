from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database.connection import get_user_data_db


def get_current_data_db(current_user: dict = Depends(get_current_user)):
    yield from get_user_data_db(current_user["id"])


def get_data_db_for_user(user_id: int):
    yield from get_user_data_db(user_id)
