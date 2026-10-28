
FROM node:22-bookworm-slim AS frontend

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt

RUN pip install --no-cache-dir \
    -r /app/backend/requirements.txt

COPY backend /app/backend
COPY --from=frontend /app/dist /app/dist

WORKDIR /app/backend

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 10000

CMD ["sh", "-c", "uvicorn talentflow_web:app --host 0.0.0.0 --port ${PORT:-10000}"]