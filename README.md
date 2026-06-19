# Football League Management Portal

A full-stack football league management application with Django REST API and React frontend.

## Tech Stack

- **Backend:** Django 5 + Django REST Framework + PostgreSQL
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + ShadCN-style UI
- **State:** TanStack Query + Zustand

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL (local install)

## Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE footy_league;
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Edit `.env` with your PostgreSQL credentials:

```env
DB_NAME=footy_league
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

For quick local testing without PostgreSQL, set `USE_SQLITE=true` in `.env`.

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API runs at `http://localhost:8000/api/`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## User Flow

1. **Home** — Create a new league or load an existing one
2. **Add Teams** — Add at least 2 teams
3. **Add Players** — Add players to each team
4. **League Settings** — Choose Single or Double Round Robin, generate fixtures
5. **Dashboard** — View standings, results, awards, and upcoming fixtures
6. **Match Page** — Start matches, record goals/cards, end matches

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/leagues/` | List/create leagues |
| GET/PATCH | `/api/leagues/{id}/` | Get/update league |
| GET/POST | `/api/leagues/{id}/teams/` | List/add teams |
| GET/POST | `/api/teams/{id}/players/` | List/add players |
| POST | `/api/leagues/{id}/generate-fixtures/` | Generate fixtures |
| GET | `/api/leagues/{id}/standings/` | League table |
| GET | `/api/leagues/{id}/awards/` | Individual awards |
| GET | `/api/matches/leagues/{id}/matches/` | League matches |
| POST | `/api/matches/{id}/start/` | Start match |
| POST | `/api/matches/{id}/goal/` | Record goal |
| POST | `/api/matches/{id}/yellow-card/` | Yellow card |
| POST | `/api/matches/{id}/red-card/` | Red card |
| POST | `/api/matches/{id}/end/` | End match |

## Clean Sheets Rule

When a match ends, all goalkeepers on a team that conceded zero goals receive a clean sheet.

## Project Structure

```text
footyLeaguePortal/
├── backend/
│   ├── apps/
│   │   ├── leagues/
│   │   ├── teams/
│   │   ├── players/
│   │   ├── fixtures/
│   │   ├── matches/
│   │   └── league_stats/
│   └── config/
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── api/
│       └── types/
└── .env.example
```
