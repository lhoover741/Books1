# Books and Brews - Merged Business Site + CRM

This package merges the polished public Books and Brews marketing website with a lead-management backend and CRM structure.

## What is included

### Public website
- `index.html`
- `about.html`
- `services.html`
- `portfolio.html`
- `quote.html`
- `contact.html`
- `assets/css/styles.css`
- `assets/js/main.js`

### Working lead capture backend for Cloudflare Pages
- `functions/api/contact.js`
- `functions/api/leads/index.js`
- `functions/api/leads/[id].js`
- `functions/api/notes/add.js`
- `schema.sql`

### Lightweight web CRM dashboard
- `admin/index.html`
- `admin/assets/admin.css`
- `admin/assets/admin.js`

### Original CRM source preserved
- `crm-source/`

Your uploaded CRM was preserved inside `crm-source/` so nothing is lost. The public website now submits quote/contact leads into the Cloudflare backend when D1 is connected.

## Cloudflare Pages setup

Build settings:
- Framework preset: None
- Build command: leave blank
- Output directory: `/`

## D1 setup

Create a D1 database, then run `schema.sql`.

Bind the database to your Pages project using this exact binding name:

```txt
LEADS_DB
```

## Optional Resend email setup

Add these Cloudflare Pages environment variables/secrets:

```txt
RESEND_API_KEY
LEAD_NOTIFY_TO
LEAD_FROM_EMAIL
```

Example:

```txt
LEAD_NOTIFY_TO=michael@example.com
LEAD_FROM_EMAIL=Books and Brews <leads@booksnbrew.net>
```

## How the merged flow works

1. Visitor lands on the public site.
2. Visitor submits quote/contact form.
3. `/api/contact` receives the lead.
4. Lead is saved into D1.
5. Optional Resend notification is sent.
6. Lead appears inside `/admin/index.html`.

## Important note

The original CRM/mobile app from your uploaded ZIP is still included in `crm-source/`. This merged package adds a Cloudflare-ready public website + lightweight admin CRM so you can deploy fast while keeping the bigger CRM system available for future expansion.
