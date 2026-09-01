from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.database.connection import get_db
from app.models.models import create_user_table
from app.models.schemas import Token, UserCreate, UserLogin, UserResponse

router = APIRouter()


@router.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    create_user_table()

    existing = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": user.email}).fetchone()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    hashed = get_password_hash(user.password)
    db.execute(
        text(
            "INSERT INTO users (email, name, hashed_password, is_active, created_at, updated_at) "
            "VALUES (:email, :name, :hashed, TRUE, NOW(), NOW())"
        ),
        {
            "email": user.email,
            "name": user.name,
            "hashed": hashed,
        },
    )
    db.commit()

    new_user = db.execute(
        text("SELECT id FROM users WHERE email = :email"), {"email": user.email}
    ).fetchone()

    access_token = create_access_token(
        data={"sub": str(new_user[0])},
        expires_delta=timedelta(minutes=60 * 24 * 7),
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/auth/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    create_user_table()

    result = db.execute(
        text("SELECT id, email, name, hashed_password, is_active FROM users WHERE email = :email"),
        {"email": form.username},
    ).fetchone()

    if not result or not result._mapping["hashed_password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form.password, result._mapping["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(result._mapping["id"])},
        expires_delta=timedelta(minutes=60 * 24 * 7),
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/auth/login-json", response_model=Token)
def login_json(payload: UserLogin, db: Session = Depends(get_db)):
    create_user_table()

    result = db.execute(
        text("SELECT id, email, name, hashed_password, is_active FROM users WHERE email = :email"),
        {"email": payload.email},
    ).fetchone()

    if not result or not result._mapping["hashed_password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not verify_password(payload.password, result._mapping["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(
        data={"sub": str(result._mapping["id"])},
        expires_delta=timedelta(minutes=60 * 24 * 7),
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get("/auth/me", response_model=UserResponse)
def read_current_user(current_user: dict = Depends(get_current_user)):
    return current_user
