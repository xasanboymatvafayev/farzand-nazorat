FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

# Mana shu qator yo'q edi — qo'shing:
CMD python manage.py migrate && gunicorn farzad.wsgi:application --bind 0.0.0.0:${PORT:-8000}
