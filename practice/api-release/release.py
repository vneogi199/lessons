"""Opt-in release script. Requires reviewed existing demo infrastructure and tools."""
import json
import os
from pathlib import Path
import re
import subprocess
import time


def run(*args, stdin=None):
    return subprocess.run(args, input=stdin, text=True, check=True,
                          stdout=subprocess.PIPE, timeout=1200).stdout.strip()


def aws(*args):
    return json.loads(run('aws', *args, '--output', 'json', '--no-cli-pager'))


def required(name, pattern):
    value = os.environ.get(name, '')
    if not re.fullmatch(pattern, value):
        raise ValueError('invalid release setting: ' + name)
    return value


def main():
    if os.environ.get('APPROVED_DEMO_DEPLOYMENT') != 'yes':
        raise PermissionError('explicit_demo_deployment_approval_required')
    account = required('AWS_ACCOUNT_ID', r'\d{12}')
    region = required('AWS_DEFAULT_REGION', r'[a-z]{2}-[a-z]+-\d')
    runtime = required('RUNTIME_IMAGE', r'[a-zA-Z0-9./:_-]+@sha256:[0-9a-f]{64}')
    repository = required('ECR_REPOSITORY', r'lesson-rfq-demo')
    cluster = required('ECS_CLUSTER', r'lesson-[a-z0-9-]+')
    service = required('ECS_SERVICE', r'lesson-rfq-demo')
    role = required('EXECUTION_ROLE_ARN', rf'arn:aws:iam::{account}:role/[a-zA-Z0-9/+=,.@_-]+')
    tag = required('GITHUB_SHA', r'[0-9a-f]{40}') + '-' + required('GITHUB_RUN_ID', r'\d+')
    tag += '-' + required('GITHUB_RUN_ATTEMPT', r'\d+')
    if aws('sts', 'get-caller-identity')['Account'] != account:
        raise PermissionError('wrong_aws_account')
    repos = aws('ecr', 'describe-repositories', '--repository-names', repository)['repositories']
    if len(repos) != 1 or repos[0]['imageTagMutability'] != 'IMMUTABLE':
        raise ValueError('immutable_demo_repository_required')
    target = aws('ecs', 'describe-services', '--cluster', cluster, '--services', service)
    if target.get('failures') or len(target['services']) != 1:
        raise ValueError('existing_demo_service_required')
    old = target['services'][0]
    breaker = old['deploymentConfiguration'].get('deploymentCircuitBreaker', {})
    if old['deploymentController']['type'] != 'ECS' or breaker != {'enable': True, 'rollback': True}:
        raise ValueError('reviewed_rolling_rollback_configuration_required')
    if not any(d.get('rolloutState') == 'COMPLETED' for d in old['deployments']):
        raise ValueError('completed_rollback_target_required')
    registry = f'{account}.dkr.ecr.{region}.amazonaws.com'
    image = f'{registry}/{repository}:{tag}'
    run('docker', 'build', '--platform', 'linux/amd64', '--network', 'none',
        '--build-arg', 'RUNTIME_IMAGE='+runtime, '-f', 'practice/api-release/Dockerfile', '-t', image, '.')
    image_id = run('docker', 'image', 'inspect', '--format', '{{.Id}}', image)
    run('docker', 'run', '--rm', '--network', 'none', '--read-only', '--tmpfs', '/tmp:uid=10001,gid=10001',
        image_id, 'python', '-m', 'pytest', '-q', '-p', 'no:cacheprovider', 'test_app.py')
    container = run('docker', 'run', '-d', '--network', 'none', '--read-only',
                    '--tmpfs', '/tmp:uid=10001,gid=10001', image_id)
    try:
        for attempt in range(20):
            try:
                run('docker', 'exec', container, 'python', 'smoke.py')
                break
            except subprocess.CalledProcessError:
                if attempt == 19:
                    raise
                time.sleep(1)
    finally:
        run('docker', 'stop', container)
        run('docker', 'rm', container)
    password = run('aws', 'ecr', 'get-login-password', '--region', region)
    run('docker', 'login', '--username', 'AWS', '--password-stdin', registry, stdin=password)
    run('docker', 'push', image)
    digest = aws('ecr', 'describe-images', '--repository-name', repository,
                 '--image-ids', 'imageTag='+tag)['imageDetails'][0]['imageDigest']
    if not re.fullmatch(r'sha256:[0-9a-f]{64}', digest):
        raise ValueError('invalid_registry_digest')
    immutable = f'{registry}/{repository}@{digest}'
    # Check the pushed content is the tested local image before deploying it.
    if immutable not in json.loads(run('docker', 'image', 'inspect', image))[0]['RepoDigests']:
        raise ValueError('pushed_digest_mismatch')
    task = json.loads(Path('practice/api-release/task.json').read_text())
    task['executionRoleArn'] = role
    task['containerDefinitions'][0]['image'] = immutable
    task['containerDefinitions'][0]['logConfiguration']['options']['awslogs-region'] = region
    revision = aws('ecs', 'register-task-definition', '--cli-input-json', json.dumps(task))['taskDefinition']['taskDefinitionArn']
    print(json.dumps({'previous': old['taskDefinition'], 'candidate': revision, 'image': immutable}))
    aws('ecs', 'update-service', '--cluster', cluster, '--service', service, '--task-definition', revision)
    run('aws', 'ecs', 'wait', 'services-stable', '--cluster', cluster, '--services', service)
    deployed = aws('ecs', 'describe-services', '--cluster', cluster, '--services', service)['services'][0]
    if deployed['taskDefinition'] != revision or not any(
            d['taskDefinition'] == revision and d.get('rolloutState') == 'COMPLETED'
            for d in deployed['deployments']):
        raise RuntimeError('candidate_not_deployed_possible_rollback')
    print('Candidate reached ECS steady state. Complete the application acceptance check separately.')


if __name__ == '__main__':
    main()
