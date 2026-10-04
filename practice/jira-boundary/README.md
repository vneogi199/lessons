# A timeout is an unknown result

The Jira server creates a ticket, but the response is lost. Repeating the POST may create a second ticket. This adapter stores an operation before sending and leaves uncertain operations in `unknown`. Repeated calls with that ID return the stored state; they do not POST again.

`jira.py` supplies an issue reader, narrow creator and reconciliation search. It uses an injected HTTPX client with approved authentication, `trust_env=False` and TLS verification. The site must be one reviewed Jira Cloud hostname. Project and issue-type IDs are fixed server configuration. Nothing connects at import. Tests use MockTransport and are unexecuted; no Jira issue was read or created.

The authorization callback checks the current local user, tenant, action and issue/project. It must also enforce issue-level visibility, not just the bot's broader access. `approved` must compare the exact canonical field hash with the durable approval record. Creation fields are limited to project, issue type, summary, plain-text description converted to ADF and an operation label. Configure the approval producer to hash this same canonical field object; do not approve a summary while allowing a different destination or description.

To provision an optional integration, approve a sandbox site/project and dedicated bot identity. Review Jira's current create metadata and required fields for that issue type. This narrow lab rejects workflows that need unspecified custom fields rather than guessing them. Give the bot only the required read/create permissions and corresponding API scopes. Store its credential in the deployment secret store; rotate and verify revocation before using real accounts. Never put a token in a lesson fixture.

ADF is Jira's structured rich-text format. The reader accepts a small document/paragraph/list/heading/text subset. It does not fetch links or attachments, and it rejects media and unknown nodes. Returned strings are plain text; callers must escape them when rendering HTML. ADF parsing does not make embedded instructions trustworthy for a model.

The reconciliation query uses the enhanced `/rest/api/3/search/jql` endpoint with a generated operation label. One matching result must have the expected bot creator and exact fields. Missing, multiple, edited or incomplete results remain unknown. Search visibility is eventually consistent, so an empty search never authorizes a second POST. A label is a correlation aid, not a remote uniqueness constraint. For unresolved cases, an operator inspects the local record and Jira audit evidence. Never clear the ledger just to make a retry possible.

The ledger is SQLite for one host. Retain it longer than the maximum business replay period and back it up. It stores potentially sensitive ticket descriptions; protect the volume and limit access. A crash after POST but before updating the ledger follows the same reconciliation path. Local DB failure before the initial commit prevents sending. Cancellation after sending leaves unknown state. No automatic creation retry exists.

Jira issues are not Confluence pages. Reading internal wiki content needs a separately approved Confluence API connection, space/page restrictions and separate credentials/scopes. Do not reuse Jira project permission as permission to ingest a linked page. The adapter deliberately never follows description links.

Practice: lose a successful POST response and call create twice. Expect one POST and an unknown record, then one matching reconciliation result. Change the payload under the same operation ID; expect rejection. Remove read permission between fetch and release; expect no content. Ask the teacher why local idempotency cannot make Jira's POST and your SQLite transaction atomic.

Sources: [Jira issue API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/), [enhanced search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/), [ADF structure](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/).
