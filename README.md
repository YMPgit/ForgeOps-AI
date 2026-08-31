# Talk to Data — AI SQL Data Analyst Assistant

**Talk to Data** is an AI-powered full-stack web application that allows users to connect to a SQLite database, ask questions in natural language, and automatically convert those questions into SQL queries using an LLM. The system executes the SQL safely, visualizes the results, and generates AI-powered business insights.

## Features

- **Natural Language to SQL**: Ask questions in plain English and get instant SQL queries powered by Groq LLM
- **Safe SQL Execution**: Read-only query validation with strict security rules
- **Dynamic Data Visualization**: Automatic chart recommendations (bar, line, pie) using Recharts
- **AI-Generated Insights**: Key findings, trends, and actionable recommendations from query results
- **Schema Explorer**: Browse database tables and columns in real-time
- **Query History**: Search, restore, and manage past queries
- **Follow-up Questions**: AI-suggested follow-up questions for deeper exploration
- **Dark/Light Mode**: Professional theme switching with localStorage persistence
- **Responsive Design**: Works seamlessly on desktop and mobile

## Architecture

```
User
  ↓
React Frontend (Vite + TypeScript + Tailwind CSS)
  ↓
FastAPI Backend (Python)
  ↓
Groq LLM (llama-3.3-70b-versatile)
  ↓
SQL Generation & Validation
  ↓
SQLite Database
  ↓
Query Results
  ↓
Visualization (Recharts) + AI Insights
```

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router v6
- TanStack Query v5
- Recharts
- Lucide React

### Backend
- Python 3.10+
- FastAPI
- SQLAlchemy
- Pydantic v2
- Uvicorn
- Groq API

### Database
- SQLite (primary/demo)
- PostgreSQL-ready architecture

## Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm or pnpm
- Groq API key (get yours at [console.groq.com](https://console.groq.com))

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Create demo database
python -m app.database.demo_data

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Demo Database

The application comes with a pre-built demo SQLite database containing:

- **26 customers** from various cities and countries
- **24 products** across 5 categories (Electronics, Clothing, Home & Kitchen, Sports, Books)
- **150 orders** spanning 2023-2024

### Demo Tables

#### customers
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Customer full name |
| email | TEXT | Email address |
| city | TEXT | City |
| country | TEXT | Country |
| created_at | TEXT | Registration date |

#### products
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| product_name | TEXT | Product name |
| category | TEXT | Product category |
| price | REAL | Unit price |

#### orders
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| customer_id | INTEGER | Foreign key to customers |
| product_id | INTEGER | Foreign key to products |
| quantity | INTEGER | Order quantity |
| total_amount | REAL | Order total |
| order_date | TEXT | Order date |

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user (body: `{ name, email, password }`)
- `POST /api/auth/login` — OAuth2 form login (username/email + password)
- `POST /api/auth/login-json` — JSON login (body: `{ email, password }`)
- `GET /api/auth/me` — Get current user (requires `Authorization: Bearer <token>`)

### Query
- `POST /api/query` — Submit a natural language question

### Schema
- `GET /api/schema` — Get full database schema
- `GET /api/schema/tables` — Get list of tables
- `GET /api/schema/tables/{table_name}` — Get specific table schema

### History
- `GET /api/history` — Get query history
- `DELETE /api/history/{id}` — Delete history item
- `DELETE /api/history` — Clear all history

### Data Source
- `GET /api/datasource/info` — Get current database info
- `POST /api/datasource/upload` — Upload SQLite database

## Example Questions

Try asking these questions:

- "What are the top 5 products by revenue?"
- "Show monthly sales trends for 2024"
- "Which customers generated the most revenue?"
- "Compare revenue across categories"
- "What is the average order value?"
- "Which regions have the highest customer count?"
- "Show me the total sales by product category"

## Security

The application implements strict SQL safety measures:

- Only SELECT statements are allowed
- Destructive commands (INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, REPLACE, ATTACH, DETACH, PRAGMA, VACUUM) are blocked
- Only single SQL statements are permitted
- Query timeout and row limits are enforced
- Database credentials are never exposed to the frontend
- Groq API key is stored securely in backend environment variables

## Project Structure

```
talk-to-data/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── datasource.py
│   │   │   │   ├── history.py
│   │   │   │   ├── query.py
│   │   │   │   └── schema.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   └── demo_data.py
│   │   ├── models/
│   │   │   ├── models.py
│   │   │   └── schemas.py
│   │   ├── services/
│   │   │   ├── chart_service.py
│   │   │   ├── groq_service.py
│   │   │   ├── insight_generator.py
│   │   │   ├── query_executor.py
│   │   │   └── sql_generator.py
│   │   └── utils/
│   │       └── sql_validator.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   ├── chat/
│   │   │   ├── charts/
│   │   │   ├── data-table/
│   │   │   └── ui/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── types/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── .env.example
└── README.md
```

## Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Your Groq API key | Required |
| `GROQ_MODEL` | Groq model to use | `llama-3.3-70b-versatile` |
| `DATABASE_URL` | SQLite database path | `sqlite:///./data/demo.db` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173, http://127.0.0.1:5173` |
| `SECRET_KEY` | JWT signing secret | Required for auth |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry in minutes | `10080` (7 days) |
| `MAX_QUERY_ROWS` | Maximum rows returned | `1000` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |

> **Note:** The frontend makes cross-origin requests to the backend by default. The backend's CORS middleware allows `http://localhost:5173` and `http://127.0.0.1:5173` by default; customize `CORS_ORIGINS` if you use a different dev host/port.

## Troubleshooting

### Backend won't start
- Ensure Python 3.10+ is installed
- Activate the virtual environment before running
- Verify `GROQ_API_KEY` is set in `.env`
- Check that port 8000 is not in use

### Frontend won't start
- Ensure Node.js 18+ is installed
- Run `npm install` to install dependencies
- Verify `VITE_API_BASE_URL` points to the correct backend URL
- Check that port 5173 is not in use

### Demo database not found
- Run `python -m app.database.demo_data` to create the demo database
- Ensure the `data/` directory exists in the backend folder

### CORS errors
- Verify `CORS_ORIGINS` in backend `.env` includes your frontend origin
- Defaults allow `http://localhost:5173` and `http://127.0.0.1:5173`
- Restart the backend after changing CORS settings

### "Failed to fetch" on sign in / sign up
- Ensure the backend is running: `uvicorn app.main:app --reload` (port 8000)
- Verify `VITE_API_BASE_URL` in the frontend `.env` points to the backend (`http://localhost:8000`)
- If your frontend is on a different host/port, add it to `CORS_ORIGINS` in the backend `.env`

## Demo

![Talk to Data Demo](./assets/demo.gif)

## License

MIT
