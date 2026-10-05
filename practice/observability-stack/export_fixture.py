"""Explicit opt-in export of synthetic values to an approved existing backend."""
import argparse
from datetime import datetime, timezone
import os
from urllib.parse import urlsplit
from uuid import uuid4


def endpoint(value):
    url = urlsplit(value)
    if (url.scheme != 'https' or not url.hostname or url.username or url.password
            or url.query or url.fragment):
        raise ValueError('explicit approved HTTPS backend required')
    return value


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('backend', choices=['langsmith', 'langfuse', 'mlflow'])
    parser.add_argument('--endpoint', required=True, type=endpoint)
    parser.add_argument('--approve-synthetic-export', action='store_true')
    args = parser.parse_args()
    if not args.approve_synthetic_export:
        raise PermissionError('explicit_export_approval_required')
    # Deliberately invented fixture values, not observations from an LLM.
    values = {'fixture_case_count': 4, 'fixture_pass_count': 3}
    if args.backend == 'langsmith':
        from langsmith import Client
        client = Client(api_url=args.endpoint, api_key=os.environ['LANGSMITH_API_KEY'], auto_batch_tracing=False)
        run = uuid4()
        client.create_run('synthetic-lesson', inputs={'synthetic': True}, run_type='chain',
                          id=run, project_name='lesson-synthetic', start_time=datetime.now(timezone.utc))
        client.update_run(run, outputs=values, end_time=datetime.now(timezone.utc))
    elif args.backend == 'langfuse':
        from langfuse import Langfuse
        client = Langfuse(public_key=os.environ['LANGFUSE_PUBLIC_KEY'],
                          secret_key=os.environ['LANGFUSE_SECRET_KEY'], base_url=args.endpoint)
        try:
            with client.start_as_current_observation(as_type='span', name='synthetic-lesson',
                                                      input={'synthetic': True}) as observation:
                observation.update(output=values)
            client.flush()
        finally:
            client.shutdown()
    else:
        import mlflow
        mlflow.set_tracking_uri(args.endpoint)
        mlflow.set_experiment('lesson-synthetic')
        with mlflow.start_run(run_name='synthetic-lesson', tags={'synthetic': 'true'}):
            mlflow.log_metrics(values)
    print('Export call completed. Verify ingestion and retention in the approved backend.')


if __name__ == '__main__':
    main()
