import asyncio
import socket
import pytest
from boundary import Policy, check_application_scope, policy
from lab import answer, build


def test_scope_is_not_a_user_claim():
    assert asyncio.run(check_application_scope()) is False
    token = policy.set(Policy(True, 'ticket_status'))
    try:
        assert asyncio.run(check_application_scope()) is True
    finally:
        policy.reset(token)


@pytest.fixture
def rails(monkeypatch):
    def no_network(*args, **kwargs):
        raise AssertionError('Network access is prohibited in this fixture')
    monkeypatch.setattr(socket.socket, 'connect', no_network)
    monkeypatch.setattr(socket.socket, 'connect_ex', no_network)
    return build()


@pytest.mark.parametrize('intent', ['policy_answer', 'ticket_status'])
def test_supported_topic(rails, intent):
    result = asyncio.run(answer(rails, 'Explain the approval policy.', Policy(True, intent)))
    assert result['status'] == 'processed'
    assert result['text'] == 'Synthetic policy: a reviewer must approve the ticket.'


def test_off_topic_and_authorization(rails):
    result = asyncio.run(answer(rails, 'Write a travel itinerary.', Policy(True, 'travel')))
    assert result['text'] == 'This request is outside the approved support workflow.'
    assert asyncio.run(answer(rails, 'Policy please', Policy(False, 'policy_answer')))['status'] == 'denied'


@pytest.mark.parametrize('input_unsafe,output_unsafe', [(True, False), (False, True)])
def test_self_check_refusal(rails, input_unsafe, output_unsafe):
    result = asyncio.run(answer(rails, 'Synthetic boundary case',
        Policy(True, 'policy_answer', input_unsafe, output_unsafe)))
    assert result['status'] == 'processed'
    assert result['text'] != 'Synthetic policy: a reviewer must approve the ticket.'


def test_dependency_failure():
    class Broken:
        async def generate_async(self, **kwargs):
            raise RuntimeError('synthetic outage')
    assert asyncio.run(answer(Broken(), 'Policy?', Policy(True, 'policy_answer'))) == {
        'status': 'review_required', 'text': None}
