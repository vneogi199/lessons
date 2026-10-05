ARG RUNTIME_IMAGE
FROM ${RUNTIME_IMAGE}
WORKDIR /app
COPY projects/omniguard /app/projects/omniguard
COPY practice/secure-pipeline/pipeline.py /app/practice/secure-pipeline/pipeline.py
COPY practice/retrieval-permissions/access.py /app/practice/retrieval-permissions/access.py
COPY practice/legacy-integrations/typed_sql.py /app/practice/legacy-integrations/typed_sql.py
COPY practice/agent-workflows/approval.py /app/practice/agent-workflows/approval.py
COPY practice/rfq-api/app.py /app/practice/rfq-api/app.py
COPY practice/nemo-rails /app/practice/nemo-rails
COPY practice/pii-evaluation /app/practice/pii-evaluation
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app/projects/omniguard
USER 10001:10001
CMD ["python", "-m", "uvicorn", "entry:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log"]
