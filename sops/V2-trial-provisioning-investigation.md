# V2: Trial-Account Provisioning — Investigation Notes

> Goal: when a deal in fi-map reaches stage = "ready for trial",
> automatically create a FieldInsight trial account (org + admin user +
> password) and email the credentials to the prospect, then mark MAP
> "trial active" with a creds-issued timestamp.

## What I found

| Asset | URL / Location | Role |
|---|---|---|
| Production app | https://app.fieldinsight.com/ → AWS (13.237.197.231, ap-southeast-2) | Django web app, login at `/accounts/login/`, admin at `/admin/` |
| Setup wizard | https://fieldinsight-setup-wizard-87b29f2975f7.herokuapp.com/ | **Just a menu viewer**, NOT a trial-create API. Misleading name. |
| Consolidated app | `fieldinsight-consolidated-app` (Heroku) | Owned by Paul — likely the codebase / dev environment. Worth investigating. |
| Public signup page | None found (`/signup/`, `/trial/`, `/api/trial/` all 404) | No self-serve trial in prod today |

## What's missing for V2

1. **No HTTP API for trial creation today.** The wizard is just a menu
   visualisation, not a provisioning endpoint.
2. **Admin is human-only.** Trials are created manually via Django admin
   right now (best guess based on no signup URL existing).

## Three V2 paths

### Path A — Django management command + token endpoint (cleanest)

Add to the FieldInsight Django codebase:
```python
# api/views/trial_provisioning.py
@require_POST
@validate_token  # bearer matching FI_TRIAL_PROVISION_TOKEN
def create_trial(request):
    data = json.loads(request.body)
    org = Organization.objects.create(name=data['company'], plan='trial', trial_ends=now()+timedelta(days=14))
    user = User.objects.create_user(email=data['email'], password=gen_password())
    org.add_member(user, role='admin')
    send_welcome_email(user, password=raw_password)
    return JsonResponse({'org_id': org.id, 'login_url': '...', 'username': user.email})
```

Then fi-map posts to `https://app.fieldinsight.com/api/internal/trial`
when the MAP signals "ready for trial".

**Effort: 4-6h Django work.** Needs the FI dev team or access to the
prod Django repo.

### Path B — Headless browser script

If Path A is blocked: spin up a Playwright/Puppeteer worker that logs
into Django admin as a service account, fills in the org-create form,
and reads back the new credentials. Brittle — breaks if Django UI changes.

**Effort: 4h scripting + ongoing fragility.**

### Path C — Manual confirmation, then automation in V3

Skip auto-provisioning for V2. Instead, fi-map sends Paul/Natasha a
push notification ("Acme is ready for trial — click to provision"),
they click, manually create the account in Django admin, then paste
the credentials back into the MAP. Alfred sends the welcome email.

**Effort: 1h. Buys time to design Path A properly.**

## Recommended next step

I'd go **Path C now → Path A in 2-3 weeks**, but it needs your call:

- Do you have access to the FieldInsight Django repo from this Mac Studio?
- Or should we contact the dev team to add the trial endpoint?

Once Path A lands, V2 ships in an afternoon (fi-map already has the
deal+meeting+action data model; only the "ready for trial" trigger and
the POST-to-FI call need adding).

## Files I touched while investigating

(read-only — no production code was modified)
- Listed `paul@fieldinsight.com` Heroku apps
- Probed unauthenticated GET on app.fieldinsight.com paths
- Inspected setup-wizard HTML
- No POSTs, no auth attempts, no writes
