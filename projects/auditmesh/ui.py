"""Loopback teaching UI. Backend URL cannot be supplied by a browser user."""
import requests
import streamlit as st

st.title('Synthetic compliance review')
st.caption('No model or Jira connection. Approval does not execute a ticket.')
token = st.text_input('Short-lived backend session', type='password')
run = st.text_input('Run ID', max_chars=64)


def call(method, path, body=None):
    try:
        response = requests.request(method, 'http://127.0.0.1:8000' + path,
            headers={'Authorization': 'Bearer ' + token}, json=body, timeout=15,
            allow_redirects=False)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError):
        st.error('Request failed. Refresh status before trying another action.')
        st.stop()


if token and run and run.isalnum():
    if st.button('Start review'):
        call('POST', '/runs/' + run)
    if st.button('Load or refresh status'):
        st.session_state['review'] = call('GET', '/runs/' + run)
        st.session_state['identity'] = (token, run)
    item = st.session_state.get('review')
    if item and st.session_state.get('identity') == (token, run):
        st.json(item)  # Escaped renderer; no untrusted HTML.
        if 'operation' in item:
            body = {'operation': item['operation'], 'digest': item['hash'], 'approved': True}
            st.caption('Check the full payload and its hash before deciding.')
            if st.button('Approve exact payload'):
                call('POST', '/decisions', body)
                st.info('Decision saved. Refresh status.')
            if st.button('Reject exact payload'):
                call('POST', '/decisions', {**body, 'approved': False})
                st.info('Decision saved. Refresh status.')
            if st.button('Execute approved fake ticket'):
                call('POST', '/execute', body)
                st.info('Execution returned. Refresh status.')
