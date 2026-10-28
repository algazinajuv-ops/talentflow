
import re
from io import BytesIO

import pymupdf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TalentFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 5 * 1024 * 1024

SKILLS = [
    "Python",
    "Excel",
    "SQL",
    "CRM",
    "B2B",
    "Переговоры",
    "Продажи",
]


def extract_salary(text: str):
    patterns = [
        r"(?:ожидаемая зарплата|зарплатные ожидания|желаемая зарплата|"
        r"желаемый доход|зарплата)\s*[:\-]?\s*"
        r"(\d{2,3}(?:[\s\u00a0]\d{3})+|\d{4,7})\s*(?:₽|руб\.?)?",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(re.sub(r"\D", "", match.group(1)))

    return None


def extract_experience(text: str):
    match = re.search(
        r"(?:общий\s+)?опыт\s+работы\s*[:\-]?\s*"
        r"(\d{1,2})\s*(?:лет|года|год)",
        text,
        re.IGNORECASE,
    )

    return int(match.group(1)) if match else None


def extract_skills(text: str):
    found = []

    for skill in SKILLS:
        pattern = (
            r"(?<!\w)" + re.escape(skill) + r"(?!\w)"
        )

        if re.search(pattern, text, re.IGNORECASE):
            found.append(skill)

    return found


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/resumes/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    filename = file.filename or ""

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Поддерживаются только PDF-файлы",
        )

    data = await file.read(MAX_FILE_SIZE + 1)

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Размер PDF не должен превышать 5 МБ",
        )

    if not data.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Файл не является корректным PDF",
        )

    try:
        with pymupdf.open(stream=BytesIO(data), filetype="pdf") as doc:
            if doc.needs_pass:
                raise ValueError("PDF защищён паролем")

            if doc.page_count > 30:
                raise ValueError("Слишком много страниц")

            text = "\n".join(page.get_text() for page in doc)

    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Не удалось прочитать PDF: {exc}",
        ) from exc

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="В PDF не найден текстовый слой",
        )

    return {
        "filename": filename,
        "salary": extract_salary(text),
        "total_experience_years": extract_experience(text),
        "skills": extract_skills(text),
        "text_preview": text[:1500],
        "warnings": [
            "Это предварительное извлечение по правилам.",
            "Общий опыт не равен автоматически релевантному стажу.",
            "Отсутствующий навык означает 'не найден', а не 'не умеет'.",
        ],
    }
