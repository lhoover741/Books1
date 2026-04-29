# Books and Brews — Public Website Redesign + CRM Backend

This repository contains the Books and Brews public website redesigned to match the layout, spacing, and premium feel of GovDirect while preserving the existing CRM backend, Cloudflare Pages Functions, and D1 lead storage.

## What is included

### Public-facing website
- `index.html`
- `about.html`
- `services.html`
- `portfolio.html`
- `quote.html`
- `contact.html`
- `assets/css/styles.css`
- `assets/js/main.js`

### Cloudflare Pages backend routes
- `functions/api/contact.js`
- `functions/api/leads/index.js`
- `functions/api/leads/[id].js`
- `functions/api/notes/add.js`
- `schema.sql`

### Admin CRM
- `admin/index.html`
- `admin/assets/admin.css`
- `admin/assets/admin.js`

### Original source preserved
- `crm-source/`

## Deployment instructions

### Cloudflare Pages settings
- Framework preset: `None`
- Build command: leave blank
- Output directory: `/`

### D1 setup
1. Create a D1 database in Cloudflare.
2. Run the schema in `schema.sql`.
3. Add a Pages binding with the name:

```txt
LEADS_DB
```

### Environment variables
For lead notification email support, add these secrets:

```txt
RESEND_API_KEY
LEAD_NOTIFY_TO
LEAD_FROM_EMAIL
```

Recommended values:

```txt
LEAD_NOTIFY_TO=you@example.com
LEAD_FROM_EMAIL="Books and Brews <leads@booksnbrew.net>"
```

## Admin route
- Public admin dashboard is available at `/admin/index.html`

## Form route
- Quote and contact submissions POST to `/api/contact`
- The route saves leads into D1 and sends optional email notifications

## Notes
- The public site has been redesigned to match the GovDirect-style homepage layout, section rhythm, button style, and footer structure.
- Backend and CRM files were preserved and not removed.
- The redesigned site keeps Books and Brews branding, website development business content, and the existing quote/contact flow.
