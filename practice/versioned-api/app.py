"""Public synthetic item, used to study version-specific representations."""
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse


def choose_version(path=None, header=None):
    if any(value is not None and value not in {"1", "2"} for value in (path, header)):
        raise HTTPException(400, "unsupported_version")
    if path and header and path != header:
        raise HTTPException(400, "conflicting_versions")
    return path or header or "1"


def public_item():
    return {"id": 7, "name": "Demo bond", "quantity": 10}


def render(item, version):
    if version == "1":
        return {"id": item["id"], "name": item["name"], "quantity": item["quantity"]}
    return {"id": str(item["id"]), "label": item["name"], "units": item["quantity"]}


def create_app():
    app = FastAPI()

    def response(item, path, header):
        version = choose_version(path, header)
        return JSONResponse(render(item, version), headers={
            "Vary": "X-API-Version", "Cache-Control": "public, max-age=60",
            "X-API-Version": version})

    @app.get("/item")
    def by_header(x_api_version: Annotated[str | None, Header()] = None,
                  item=Depends(public_item)):
        return response(item, None, x_api_version)

    @app.get("/v{version}/item")
    def by_path(version: str, x_api_version: Annotated[str | None, Header()] = None,
                item=Depends(public_item)):
        return response(item, version, x_api_version)
    return app


app = create_app()
