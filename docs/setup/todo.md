Create sync job table and sync result/error tables.
Add indexes, status enums, retry counters, audit columns.
Define posting contract and state machine
Trigger conditions (invoice_ready, payment_recorded).
Status flow (pending, posting, posted, failed, manual_review).
Retry rules (transient vs business errors).
Build core bridge logic (after service host exists)
Poll queue safely (single-worker lock).
Transform payloads using mapping tables.
Call AutoCount API methods for AR Invoice / AR Payment.
Persist external doc refs and error payload snapshots.
Add idempotency and reconciliation
Prevent duplicate posting by unique external keys.
Daily reconciliation report: app totals vs AutoCount posted totals.
Manual requeue flow for failed records.
Security and secrets
Store credentials outside code (env/secure store).
Lock down file ACLs/log access.
Confirm service account least privilege.
Monitoring and alerting
Health endpoint/file heartbeat checks.
Failure alerts (email/Teams/Slack) for queue backlog and repeated errors.
Operational dashboard for sync latency/success rate.
UAT and controlled rollout
Test in non-production account book first.
Run test matrix: success, duplicate, partial payment, missing mapping, network failure.
Go-live plan with rollback and freeze window.
Documentation and handover
Ops runbook (start/stop/restart/recovery).
Support playbook (common errors + fixes).
Change management log and ownership assignments.
