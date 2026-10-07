"""Optional SDK fixture. No remote export; use synthetic requests only."""
from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field
import logfire


class Review(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    quantity: int = Field(gt=0, le=100)


def create_app():
    # This is a local exercise. Do not change export settings without data review.
    logfire.configure(send_to_logfire=False, console=False, service_name="rfq-fixture")
    app = FastAPI()
    logfire.instrument_fastapi(
        app, capture_headers=False,
        request_attributes_mapper=lambda request, attributes: {},
    )

    @app.post("/review")
    async def review(body: Review):
        with logfire.span("rfq.review", item_count=1):
            return {"quantity": body.quantity, "status": "needs_review"}

    return app


# Application factory only. No listener or provider starts on import.
# No authentication: run on loopback with synthetic fixtures, never expose publicly.
