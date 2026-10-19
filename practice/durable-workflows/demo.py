"""Run a complete local workflow with injected recovery boundaries."""
import tempfile
from pathlib import Path

from lab import Crash, OutboxLab, SagaLab


def main():
    with tempfile.TemporaryDirectory(prefix="workflow-lesson-") as directory:
        path = Path(directory)
        outbox = OutboxLab(path)
        saga = SagaLab(path)
        try:
            outbox.create("order-1", 10)
            try:
                outbox.relay_one(crash_after_publish=True)
            except Crash:
                print("Publish committed; relay confirmation was lost.")
            outbox.close()
            outbox = OutboxLab(path)
            outbox.relay_one()
            while outbox.consume_one():
                pass
            print("Broker deliveries:", outbox.broker.execute("SELECT COUNT(*) FROM messages").fetchone()[0])
            print("Business effects:", outbox.consumer.execute("SELECT COUNT(*) FROM effects").fetchone()[0])
            saga.start("saga-1")
            print("After reserve:", saga.advance("saga-1"))
            print("After declined charge:", saga.advance("saga-1", decline=True))
            saga.close()
            saga = SagaLab(path)
            print("After restart and release:", saga.advance("saga-1"))
        finally:
            outbox.close()
            saga.close()


if __name__ == "__main__":
    main()
