# Restore a private value once, for its intended recipient

`Vault` stores Fernet-encrypted mappings in SQLite. The authenticated encrypted envelope binds token, tenant/user/run scope, expiry and value. Random placeholder IDs go to the model; mappings and keys do not. This is reversible pseudonymization, not anonymization.

An approved local environment needs `cryptography`. Nothing is installed or executed here. Inject the key from a protected secret manager. Do not put it in the database, source, command line or logs. Loss of the key makes mappings unreadable; compromise exposes all mappings encrypted with it. Plan key rotation with the platform owner. [Fernet documentation](https://cryptography.io/en/latest/fernet/) describes authenticated encryption and MultiFernet rotation. Encryption timestamps are not secret.

The server must derive scope from verified identity and a server-owned run. It calls `put` for recognized values, then replaces their original spans before generation. This module does not detect PII. Use the detector's offsets, working from the end of the string so earlier offsets stay valid. Never let model output choose the original value to store.

At restoration, `authorized(scope)` checks current recipient access. `rescan(output, scope)` must apply the actual release policy to the entire restored answer, including any raw PII generated outside placeholders. Returning True blindly is only a test fixture. Approved restoration may permit specific entities for this recipient; it must not globally disable scanning. Scanner errors propagate without releasing output. Authorization is rechecked before return.

Unknown, expired, wrong-scope, duplicate or malformed placeholders fail closed. Tokens are consumed transactionally before re-scan. A failed scan or crash after consumption requires a new reviewed run; it cannot replay the old token. Duplicate use of one placeholder within an answer is deliberately rejected. If a task genuinely needs repetition, define and test that policy before relaxing it.

TTL is at most fifteen minutes. Call `purge_expired` from a controlled maintenance job. Limit access to the database directory and backups. Deleting a row is logical removal, not proof of physical erasure from journals, storage snapshots or memory. Apply encrypted storage, backup retention and key-retirement policy. Tenant/user/run metadata remains visible to database readers.

Worked example: store a synthetic email under `(tenant-a, user-1, run-7)`, obtain an opaque token, then restore it for that same verified scope. A second request using the token fails. A token from run-6 fails even for the same user. Tests include scope, expiry, replay, duplicate and scan-failure cases. They are unexecuted; after approval run `python3 -m unittest -v` from this directory.

Interview: why scan after restoration? The answer may include unmasked private text or combine permitted values into an unauthorized disclosure. Placeholder validity alone does not establish release safety. Ask your teacher to review recipient policy and failure recovery before connecting a model.
