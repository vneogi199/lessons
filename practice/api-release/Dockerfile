# The approved base already contains Python, FastAPI/Pydantic v2, Uvicorn,
# HTTPX and pytest. Supply its digest; this exercise installs nothing.
ARG RUNTIME_IMAGE
FROM ${RUNTIME_IMAGE}
WORKDIR /app
COPY practice/rfq-api/app.py practice/rfq-api/test_app.py ./
COPY practice/api-release/serve.py practice/api-release/smoke.py ./
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 10001:10001
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "serve:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log"]
