from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    temperature: Optional[float] = Field(default=None, ge=0, le=2)
    max_tokens: Optional[int] = Field(default=None, ge=1, le=8192)
    session_id: Optional[str] = Field(default=None, max_length=128)


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    sub: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True



class ChartRecommendation(BaseModel):
    type: str
    x_axis: str
    y_axis: str


class Insights(BaseModel):
    summary: str
    key_findings: List[str]
    recommendations: List[str]


class QueryResponse(BaseModel):
    question: str
    sql: str
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    execution_time: float
    chart_recommendation: Optional[ChartRecommendation] = None
    insights: Optional[Insights] = None
    follow_up_questions: List[str] = []


class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool = True


class TableInfo(BaseModel):
    name: str
    row_count: int
    columns: List[ColumnInfo]


class SchemaInfo(BaseModel):
    tables: List[TableInfo]


class HistoryItem(BaseModel):
    id: int
    question: str
    sql: str
    timestamp: datetime
    status: str
    execution_time: float
    session_id: Optional[str] = None


class DataSourceInfo(BaseModel):
    name: str
    tables: int
    total_rows: int


class ErrorResponse(BaseModel):
    detail: str
