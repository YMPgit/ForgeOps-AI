from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.core.dependencies import get_current_user
from app.services.groq_service import GroqService
from app.services.user_settings import get_user_model, set_user_model

router = APIRouter()
groq_service = GroqService()

AVAILABLE_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "qwen/qwen3.8-27b",
]


class SettingsResponse(BaseModel):
    model: str
    available_models: List[str]


class UpdateSettingsRequest(BaseModel):
    model: Optional[str] = None


@router.get("/settings", response_model=SettingsResponse)
def get_settings(current_user: dict = Depends(get_current_user)):
    user_model = get_user_model(current_user["id"])
    return SettingsResponse(
        model=user_model or groq_service.get_model(),
        available_models=AVAILABLE_MODELS,
    )


@router.post("/settings", response_model=SettingsResponse)
async def update_settings(req: UpdateSettingsRequest, current_user: dict = Depends(get_current_user)):
    if req.model is not None:
        model = req.model.strip()
        if model:
            set_user_model(current_user["id"], model)

    return get_settings(current_user)
