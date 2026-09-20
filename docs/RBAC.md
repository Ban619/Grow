RBAC and Permissions

Roles:
- admin: full control (manage allowlists, roles, audit logs)
- maintainer: configure agents and workflows, run scans
- viewer: read-only access to telemetry and reports

Guidelines:
- Use least-privilege for agents and CI jobs.
- Keep changes to allowlist and RBAC in pull requests requiring 2 reviewers.
- Record changes in docs/RBAC.md and audit logs.

Update process:
1. Propose change in a PR
2. Run CI (secret-scan + tests)
3. Two approvers required to merge
