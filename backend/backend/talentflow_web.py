
from pathlib import Path

from fastapi.staticfiles import StaticFiles
from main import app

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = PROJECT_ROOT / "dist"

if not DIST_DIR.is_dir():
    raise RuntimeError(
        "Не найдена папка dist. Сначала соберите React: npm run build"
    )

# API-маршруты уже зарегистрированы в main.py.
# Статический сайт подключаем последним.
app.mount(
    "/",
    StaticFiles(directory=str(DIST_DIR), html=True),
    name="frontend",
)
