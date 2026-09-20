# Copilot CLI Security Policy

## Overview
This document outlines the security practices, threat model, and controls for the Copilot CLI system.

## Threat Model

### High-Risk Scenarios
1. **Privilege Escalation**: Unprivileged user gains admin/developer access
2. **Secret Leakage**: API keys, tokens, credentials committed to repo or leaked in logs
3. **Runaway Agent**: Agent consumes resources indefinitely or deletes files maliciously
4. **Malicious Plugin**: Third-party plugin executes unauthorized code

### Medium-Risk Scenarios
5. **Unauthorized Directory Access**: Agent accesses files outside permitted scope
6. **Audit Bypass**: Audit logs disabled or tampered with
7. **Tool Misuse**: Restricted tool used by unprivileged role

## Controls

### Access Control (RBAC)
- Role-based access control defined in `.github/copilot-rbac.yaml`
- Roles: `admin`, `developer`, `reviewer`, `ci_runner`
- Default role: `reviewer` (minimum privileges)
- Sensitive actions require approval (e.g., `/allow-all`, secret export)

**Enforcement**:
- Load RBAC config on agent startup
- Check user role before allowing agent execution
- Log all permission checks (success/failure)

### Secret Management
- Pre-commit hook via `detect-secrets` scans for credentials
- CI workflow runs secret scanning on all pushes/PRs
- Baseline: `.secrets.baseline` (maintained by security team only)
- No secrets in code; use environment variables or secure vaults

**Secrets to Block**:
- AWS Access Keys, Private Keys
- Slack/GitHub/Stripe tokens
- Base64-encoded high-entropy strings
- Database passwords, API keys

### Resource Limits
- Max concurrent agents: role-dependent (1–10)
- Max agent timeout: role-dependent (300–3600 seconds)
- Memory limit: 512MB per agent (default)
- Disk quota: 10GB per session

### Audit Logging
- All agent actions logged to `.logs/copilot-audit.log`
- Fields: timestamp, user, role, action, resource, result, duration
- Log retention: 90 days
- Rotation: automatic when file > 100MB
- Format: JSON for machine parsing

### Sandboxing
- CI runner (`ci_runner` role) uses strict sandbox
- Container-based execution (Docker or equivalent)
- No host filesystem access
- Network access restricted to approved endpoints

## Incident Response

### Secret Compromise
1. Rotate credentials immediately
2. Update `.secrets.baseline`
3. Audit commit logs for exposure window
4. Notify affected services (e.g., cloud provider)

### Unauthorized Access
1. Revoke user session
2. Audit agent logs for actions taken
3. Restore affected files from backup
4. Update RBAC rules if needed

### Runaway Agent
1. Kill agent process (`ctrl+c` or via task manager)
2. Review logs for resource consumption
3. Implement timeout override in RBAC if needed
4. Notify ops team

## Deployment & Review

- Security review required for all changes to `.github/copilot-rbac.yaml`
- Quarterly audit of RBAC roles and tool restrictions
- Annual penetration test (recommended)
- Security.md updated on each policy change

## Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities. Instead:
1. Email security@example.com with:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
2. Allow 30 days for fix before public disclosure

---

**Version**: 1.0  
**Last Updated**: 2026-06-19  
**Maintained By**: Security Team
