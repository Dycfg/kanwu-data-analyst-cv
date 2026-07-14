# KanWu Data Analyst CV Site

Personal bilingual CV website for KanWu / Wu Kan. The public site includes a
portfolio-style homepage, a dedicated CV preview/download page, and a private
admin area for content, CV files, users, audit logs, and visitor analytics.

## Stack

- Vinext / Next app routes
- Cloudflare D1-compatible SQLite schema with Drizzle migrations
- R2-compatible object storage for English and Chinese CV PDFs
- Database-backed admin login and role permissions
- Public analytics events for page views, CV downloads, contact clicks, and
  country/source/device/browser summaries

## Local Development

```bash
npm install
npm run dev
```

Run checks before pushing changes:

```bash
npm test
```

Generate migrations after schema changes:

```bash
npm run db:generate
```

## Runtime Bindings

The site expects these production bindings:

- `DB`: D1-compatible database for admin users, sessions, content, analytics,
  and audit logs.
- `CV_BUCKET`: R2-compatible bucket for uploaded CV PDFs.

`.openai/hosting.json` stores only logical binding names:

```json
{
  "d1": "DB",
  "r2": "CV_BUCKET"
}
```

Do not commit real database credentials, bucket credentials, or admin passwords.

## Production Environment Variables

Set these in the hosting platform, not in source control:

- `INITIAL_ADMIN_USERNAME=admin`
- `INITIAL_ADMIN_PASSWORD=<strong-secret>`

The initial password is used only when a fresh database has no admin users yet.
After first sign-in, change the root admin password from `/admin`.

Password rule:

- at least 10 characters
- at least one uppercase letter
- at least one lowercase letter
- at least one number
- at least one symbol

Remove any old `ADMIN_KEY` variable after deploying the database-backed admin
version.

## Production Deployment Checklist

1. Run `npm test`.
2. Confirm migrations in `drizzle/` are committed.
3. Configure production bindings for `DB` and `CV_BUCKET`.
4. Set `INITIAL_ADMIN_USERNAME` and `INITIAL_ADMIN_PASSWORD` as production
   environment variables.
5. Deploy the validated build.
6. Sign in to `/admin/login` with the initial admin account.
7. Change the root admin password immediately.
8. Upload the English and Chinese CV PDFs from `/admin`.
9. Check `/`, `/cv?lang=en`, `/cv?lang=zh`, analytics, and audit logs.
10. When ready for a custom domain, add the domain and configure DNS records.

## Admin Security Notes

- `/admin` has `noindex`, `nofollow`, and `nocache` metadata to keep the admin
  area out of search engine indexes and caches.
- Only the root `admin` super administrator can create other super
  administrators.
- Super administrators cannot be deleted.
- Ordinary administrators cannot view or manage super administrator accounts.
- Audit logs record administrative content, CV, password, and user-management
  actions.

## Next Content Pass

Before formal job applications, refine the public copy against target job
descriptions:

- make the hero summary closer to each target data analyst role
- convert internship/work entries into measurable outcomes
- select 2-4 strongest analysis projects or work examples
- align skills with the job description while staying truthful
