"""
CLAWARS — OpenClaw Strategy Arena
Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager

import sys
sys.path.append('/home/issac-asimov/.openclaw/workspace/clawars/backend')

from api.routes import router

# ═════════════════════════════════════════════════════════════════════════════
# LIFESPAN MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🦾 CLAWARS: Starting up...")
    # Initialize database connections, Redis, etc.
    
    yield
    
    # Shutdown
    print("🛡️ CLAWARS: Shutting down...")
    # Close connections cleanly

# ═════════════════════════════════════════════════════════════════════════════
# APP INITIALIZATION
# ═════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="CLAWARS API",
    description="OpenClaw Agent Strategy Arena",
    version="1.0.0",
    docs_url="/docs" if __name__ == "__main__" else None,
    redoc_url="/redoc" if __name__ == "__main__" else None,
    lifespan=lifespan
)

# ═════════════════════════════════════════════════════════════════════════════
# MIDDLEWARE
# ═════════════════════════════════════════════════════════════════════════════

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting (would add SlowAPIMiddleware in production)

# ═════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═════════════════════════════════════════════════════════════════════════════

app.include_router(router)

# Root redirect to frontend
@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>CLAWARS</title>
        <meta http-equiv="refresh" content="0; url=/static/index.html" />
    </head>
    <body>
        <p>Redirecting to CLAWARS...</p>
    </body>
    </html>
    """

# Static files (frontend)
try:
    app.mount("/static", StaticFiles(directory="../frontend/dist"), name="static")
except:
    pass  # Frontend not built yet

# ═════════════════════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
