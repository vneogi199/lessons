# Versioned API and debugger practice

Read the [worked lesson](../../reference/api-query-practice.html#versioning).

Open **this directory** as the VS Code workspace so `.vscode/launch.json` uses the
correct working directory. Use an existing Python interpreter with FastAPI,
Pydantic, pytest and HTTPX. The server debug configuration additionally needs
Uvicorn; debugging needs the already-approved Python Debugger extension. Nothing
has been installed or executed, and dependency compatibility is not verified.

When execution is authorized:

```sh
python -m pytest -q
# Only if pytest-cov is already present:
python -m pytest --cov=app --cov-branch --cov-report=term-missing
```

Tests override the domain-data dependency with a fixed item, leaving version
selection and serialization real. The fixture cache keys by URL and API version;
it also asserts Vary. This does not verify a real proxy or CDN. It intentionally
has no expiry implementation because it only models representation isolation.

The example serves one public synthetic record. Its public caching policy is
inappropriate for a private RFQ endpoint. Private data needs a separate cache policy
and authorization design. No user session or tenant exists in this example.

Expected tests: all pass. Recorded execution: none. Before release, freeze and
verify compatible dependency versions in an approved environment.
