"""Synthetic signed assertions; creates ephemeral keys only when tests are run."""
import base64
from contextlib import closing
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from lxml import etree
from onelogin.saml2.utils import OneLogin_Saml2_Utils
from login import Login, digest

ACS = 'https://sp.example.test/saml/acs'
SP = 'https://sp.example.test/metadata'
IDP = 'https://idp.example.test/metadata'
S = 'urn:oasis:names:tc:SAML:2.0:assertion'
P = 'urn:oasis:names:tc:SAML:2.0:protocol'


def keypair():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'Synthetic IdP')])
    now = datetime.now(timezone.utc)
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name)
        .public_key(key.public_key()).serial_number(x509.random_serial_number())
        .not_valid_before(now-timedelta(days=1)).not_valid_after(now+timedelta(days=1))
        .sign(key, hashes.SHA256()))
    return (key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                              serialization.NoEncryption()), cert.public_bytes(serialization.Encoding.PEM).decode())


def settings(certs):
    return {'strict': True, 'sp': {'entityId': SP, 'assertionConsumerService': {'url': ACS,
        'binding': P.replace(':protocol', ':bindings:HTTP-POST')}},
        'idp': {'entityId': IDP, 'singleSignOnService': {'url': 'https://idp.example.test/sso',
        'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'},
        'x509certMulti': {'signing': certs}}}


def signed(request_id, key, cert, audience=SP, expired=False, assertion_id=None):
    now = datetime.now(timezone.utc)
    stamp = lambda t: t.strftime('%Y-%m-%dT%H:%M:%SZ')
    expires = stamp(now+timedelta(seconds=-600 if expired else 180))
    def child(parent, namespace, name, text=None, **attrs):
        element = etree.SubElement(parent, '{'+namespace+'}'+name, **attrs)
        element.text = text
        return element
    response = etree.Element('{'+P+'}Response', nsmap={'samlp': P, 'saml': S},
        ID='_'+uuid4().hex, Version='2.0', IssueInstant=stamp(now), Destination=ACS, InResponseTo=request_id)
    child(response, S, 'Issuer', IDP)
    status = child(response, P, 'Status')
    child(status, P, 'StatusCode', Value='urn:oasis:names:tc:SAML:2.0:status:Success')
    assertion = etree.Element('{'+S+'}Assertion', nsmap={'saml': S},
        ID=assertion_id or '_'+uuid4().hex, Version='2.0', IssueInstant=stamp(now))
    child(assertion, S, 'Issuer', IDP)
    subject = child(assertion, S, 'Subject')
    child(subject, S, 'NameID', 'synthetic-reader', Format='urn:oasis:names:tc:SAML:2.0:nameid-format:persistent')
    confirmation = child(subject, S, 'SubjectConfirmation', Method='urn:oasis:names:tc:SAML:2.0:cm:bearer')
    child(confirmation, S, 'SubjectConfirmationData', Recipient=ACS, InResponseTo=request_id, NotOnOrAfter=expires)
    conditions = child(assertion, S, 'Conditions', NotBefore=stamp(now-timedelta(minutes=20)), NotOnOrAfter=expires)
    restriction = child(conditions, S, 'AudienceRestriction')
    child(restriction, S, 'Audience', audience)
    statement = child(assertion, S, 'AuthnStatement', AuthnInstant=stamp(now), SessionIndex='synthetic-session', SessionNotOnOrAfter=expires)
    context = child(statement, S, 'AuthnContext')
    child(context, S, 'AuthnContextClassRef', 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport')
    response.append(etree.fromstring(OneLogin_Saml2_Utils.add_sign(etree.tostring(assertion), key, cert)))
    encoded = OneLogin_Saml2_Utils.add_sign(etree.tostring(response), key, cert)
    return base64.b64encode(encoded.encode() if isinstance(encoded, str) else encoded).decode()


def request(login):
    _, nonce = login.begin()
    with closing(login.connect()) as db:
        return nonce, db.execute('SELECT request FROM requests WHERE nonce=?', (digest(nonce),)).fetchone()[0]


def test_signed_login_replay_and_rollover(tmp_path):
    old_key, old_cert = keypair()
    new_key, new_cert = keypair()
    login = Login(str(tmp_path/'saml.db'), settings([old_cert, new_cert]))
    for key, cert in [(old_key, old_cert), (new_key, new_cert)]:
        nonce, request_id = request(login)
        response = signed(request_id, key, cert)
        token = login.finish(nonce, response)
        assert login.current(token) == (IDP, 'synthetic-reader')
        with pytest.raises(PermissionError):
            login.finish(nonce, response)
    rotated = Login(login.path, settings([new_cert]))
    nonce, request_id = request(rotated)
    with pytest.raises(PermissionError):
        rotated.finish(nonce, signed(request_id, old_key, old_cert))


@pytest.mark.parametrize('mode', ['audience', 'request', 'expired', 'tampered', 'browser'])
def test_invalid_signed_responses(tmp_path, mode):
    key, cert = keypair()
    login = Login(str(tmp_path/'saml.db'), settings([cert]))
    nonce, request_id = request(login)
    response = signed('_wrong' if mode == 'request' else request_id, key, cert,
        audience='https://other.example/metadata' if mode == 'audience' else SP, expired=mode == 'expired')
    if mode == 'tampered':
        response = base64.b64encode(base64.b64decode(response).replace(b'synthetic-reader', b'changed-reader')).decode()
    with pytest.raises(PermissionError):
        login.finish('x'*32 if mode == 'browser' else nonce, response)


def test_assertion_id_reuse_across_requests(tmp_path):
    key, cert = keypair()
    login = Login(str(tmp_path/'saml.db'), settings([cert]))
    for attempt in range(2):
        nonce, request_id = request(login)
        response = signed(request_id, key, cert, assertion_id='_same_assertion')
        if attempt == 0:
            login.finish(nonce, response)
        else:
            with pytest.raises(PermissionError):
                login.finish(nonce, response)
