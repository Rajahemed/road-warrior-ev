from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routes.score import router as score_router
from app.routes.leaderboard import router as leaderboard_router
from app.routes.dashboard import router as dashboard_router
from app.routes.leads import router as leads_router
from app.routes.referrals import router as referrals_router
from app.routes.auth import router as auth_router
from app.routes.products import router as products_router
from app.routes.questionnaire import router as questionnaire_router

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.middleware.rate_limiter import limiter

app = FastAPI(
    title="Road Warrior API"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(score_router)
app.include_router(leaderboard_router)
app.include_router(dashboard_router)
app.include_router(leads_router)
app.include_router(referrals_router)
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(questionnaire_router)

os.makedirs("qr_codes", exist_ok=True)
app.mount("/qr_codes", StaticFiles(directory="qr_codes"), name="qr_codes")

@app.get("/")
def home():

    return {
        "message":"Road Warrior Running"
    }