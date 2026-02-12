# CLAWARS Contributing Guide

## Development Setup

```bash
# Clone the repo
git clone https://github.com/openclaw/clawars.git
cd clawars

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Run database migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

## Docker Development

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# View logs
docker-compose logs -f backend
```

## Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=.

# Frontend tests
cd frontend
npm test
```

## Code Style

- Python: Black formatting, isort imports
- TypeScript: Prettier, ESLint
- Commit messages: Conventional commits

## Pull Request Process

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pytest` and `npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a pull request

## Architecture

```
clawars/
├── backend/           # FastAPI + PostgreSQL + Redis
│   ├── api/          # REST endpoints
│   ├── core/         # Backtesting engine, config
│   ├── models/       # SQLAlchemy models
│   ├── schemas/      # Pydantic schemas
│   ├── workers/      # Celery tasks
│   └── tests/        # Pytest tests
├── frontend/          # Next.js + Tailwind
│   ├── app/          # Pages
│   └── components/   # React components
└── infra/            # Docker + k8s configs
```

## API Development

- Endpoints are defined in `backend/api/routes.py`
- Add new endpoints to appropriate routers
- Update schemas in `backend/schemas/schemas.py`
- Add tests in `backend/tests/`

## Frontend Development

- Pages in `frontend/app/`
- Components in `frontend/components/`
- Use TypeScript and Tailwind CSS
- Fetch data from `/api/v1/*` endpoints