# LOVABLE AI RULES FOR JUSTACHAT VPS

## SUPERSEDES ALL PREVIOUS RULES

---

### RULE 1: VPS IS THE ONLY SOURCE OF TRUTH
- Unless the user explicitly says "Lovable" or "Lovable Cloud", **ALL references are to the VPS** at `24.199.122.60` / `justachat.net`.
- The VPS is the production environment. Nothing else matters.
- Lovable Cloud/preview is only for testing UI changes before pushing to VPS.

### RULE 2: ALWAYS PROVIDE VPS COMMAND-LINE INSTRUCTIONS
- When creating or editing files, **always provide copy-paste commands** for the VPS terminal.
- Format: `nano <filepath>`, paste content, save, then run.
- Or: create the script in this repo, push to GitHub, then provide `git pull` + run instructions.
- **Always diagnose the VPS first** before making any changes. Run health checks, check logs, verify the current state.

### RULE 3: KNOWLEDGE BASE SYSTEM
- Every issue encountered gets a file in `docs/vps-kb/issues/` named after the issue.
- Each issue file contains: **Problem**, **Symptoms**, **Root Cause**, **Solution**, **Prevention**.
- System documentation lives in `docs/vps-kb/system/` covering frontend, backend, edge functions, database, and infrastructure.
- This knowledge base is committed to GitHub and serves as persistent memory across sessions.

---

*Last updated: 2026-02-14*
