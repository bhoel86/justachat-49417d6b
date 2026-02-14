# VPS ISSUES LOG

Each file in this directory documents a specific issue encountered on the VPS.

## Format
Every issue file follows this template:

```
# ISSUE: <Short Title>
Date: YYYY-MM-DD

## Problem
What went wrong.

## Symptoms
What the user saw (errors, blank pages, etc.)

## Root Cause
Why it happened.

## Solution
Step-by-step fix.

## Prevention
How to avoid it in the future.
```

## Issue Index

| File | Issue | Date |
|------|-------|------|
| owner-transfer.md | Owner account transfer from bhoel86 to unix@justachat.net | 2026-02-14 |
| grant-permissions.md | Tables need explicit GRANT for anon/authenticated roles | 2026-02-14 |
| jwt-expired-retry.md | JWT expired token retry logic | 2026-02-14 |
| captcha-timeout.md | CAPTCHA verification hangs — switched to fetch+AbortController | 2026-02-14 |
| docker-startup-freeze.md | 500/502 errors on startup — port conflicts & analytics exclusion | 2026-02-14 |
| sasl-auth-errors.md | SASL auth failures — role password reset procedure | 2026-02-14 |
| anon-key-mismatch.md | Frontend/backend ANON_KEY mismatch causes 401s | 2026-02-14 |
| backup-freeze.md | Backup command freezes — split into 2 steps | 2026-02-14 |
| password-reset-protocol.md | Manual SQL password reset doesn't work — use GoTrue API | 2026-02-14 |
