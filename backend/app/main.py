import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, query, schema, history, datasource, settings_route
from app.models.models import create_user_table
from app.database.connection import engine, ensure_demo_seed
from app.services.legacy_migration import run_legacy_migration
from sqlalchemy import inspect

app = FastAPI(
    title="Talk to Data API",
    description="AI-powered SQL Data Analyst Assistant",
    version="1.0.0",
)

_default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_env_origins = os.getenv("CORS_ORIGINS", "")
if _env_origins:
    allow_origins = [o.strip() for o in _env_origins.split(",") if o.strip()]
else:
    allow_origins = _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(query.router, prefix="/api", tags=["query"])
app.include_router(schema.router, prefix="/api", tags=["schema"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(datasource.router, prefix="/api", tags=["datasource"])
app.include_router(settings_route.router, prefix="/api", tags=["settings"])


@app.on_event("startup")
def on_startup():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        create_user_table()
    ensure_demo_seed()
    run_legacy_migration()


@app.get("/")
async def root():
    return {"status": "ok", "message": "Talk to Data API is running"}
