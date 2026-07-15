import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

test("defines the bilingual public CV site", async () => {
  const [page, layout, css] = await Promise.all([
    readProjectFile("app/page.tsx"),
    readProjectFile("app/layout.tsx"),
    readProjectFile("app/globals.css"),
  ]);

  assert.match(layout, /title:\s*"KanWu \| Data Analyst"/);
  assert.match(page, /defaultSiteContent/);
  assert.match(page, /\/api\/content/);
  assert.match(page, /siteContent\[lang\]/);
  assert.match(page, /lucide-react/);
  assert.match(page, /MessageCircle/);
  assert.match(page, /\/cv\?lang=\$\{lang\}/);
  assert.match(page, /Analytical workflow/);
  assert.match(page, /workflowSteps/);
  assert.match(page, /workflow-board/);
  assert.match(page, /section-index/);
  assert.match(page, /signalMetrics/);
  assert.match(page, /cv-mini-preview/);
  assert.doesNotMatch(page, /social-strip|Profile links/);
  assert.doesNotMatch(page, /href="\/admin"|admin page/i);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /backdrop-filter:\s*blur/);
  assert.doesNotMatch(css, /social-strip/);
  assert.doesNotMatch(css, /analysis-card|axis-line/);
});

test("keeps CV and admin upload routes wired", async () => {
  const [
    cvPage,
    adminLayout,
    adminPage,
    loginPage,
    cvApi,
    adminApi,
    contentApi,
    adminContentApi,
    loginApi,
    usersApi,
    userApi,
    auditApi,
    passwordApi,
    authStore,
    auditStore,
    analyticsApi,
    analyticsTrackApi,
    analyticsStore,
    productionDocs,
    backupScript,
    hosting,
  ] = await Promise.all([
    readProjectFile("app/cv/page.tsx"),
    readProjectFile("app/admin/layout.tsx"),
    readProjectFile("app/admin/page.tsx"),
    readProjectFile("app/admin/login/page.tsx"),
    readProjectFile("app/api/cv/[locale]/route.ts"),
    readProjectFile("app/api/admin/cv/route.ts"),
    readProjectFile("app/api/content/route.ts"),
    readProjectFile("app/api/admin/content/route.ts"),
    readProjectFile("app/api/admin/auth/login/route.ts"),
    readProjectFile("app/api/admin/users/route.ts"),
    readProjectFile("app/api/admin/users/[id]/route.ts"),
    readProjectFile("app/api/admin/audit-logs/route.ts"),
    readProjectFile("app/api/admin/password/route.ts"),
    readProjectFile("app/server/auth-store.ts"),
    readProjectFile("app/server/audit-log-store.ts"),
    readProjectFile("app/api/admin/analytics/route.ts"),
    readProjectFile("app/api/analytics/track/route.ts"),
    readProjectFile("app/server/analytics-store.ts"),
    readProjectFile("docs/PRODUCTION.md"),
    readProjectFile("scripts/backup-data.sh"),
    readProjectFile(".openai/hosting.json"),
  ]);

  assert.match(cvPage, /\/api\/cv\/\$\{lang\}/);
  assert.match(cvPage, /\/api\/analytics\/track/);
  assert.match(cvPage, /cv_download/);
  assert.match(cvPage, /Download English CV/);
  assert.match(cvPage, /paper-preview/);
  assert.match(cvPage, /cv-preview-en\.png/);
  assert.match(cvPage, /Open full PDF/);
  assert.doesNotMatch(cvPage, /iframe|pdf-frame|pdf-placeholder/);
  assert.doesNotMatch(cvPage, /admin page|后台页面/i);
  assert.match(adminLayout, /robots/);
  assert.match(adminLayout, /index:\s*false/);
  assert.match(adminLayout, /follow:\s*false/);
  assert.match(adminPage, /Site management/);
  assert.match(adminPage, /Signed in/);
  assert.match(adminPage, /Content CMS/);
  assert.match(adminPage, /Save content/);
  assert.match(adminPage, /User directory/);
  assert.match(adminPage, /Change password/);
  assert.match(adminPage, /Password changed successfully/);
  assert.match(adminPage, /At least 10 characters with uppercase, lowercase, number, and symbol/);
  assert.match(adminPage, /Visitor overview/);
  assert.match(adminPage, /trafficPeriod/);
  assert.match(adminPage, /weekly/);
  assert.match(adminPage, /monthly/);
  assert.match(adminPage, /Day/);
  assert.match(adminPage, /Week/);
  assert.match(adminPage, /Month/);
  assert.match(adminPage, /TrafficVisualization/);
  assert.match(adminPage, /traffic-visual/);
  assert.match(adminPage, /traffic-svg/);
  assert.match(adminPage, /traffic-grid/);
  assert.match(adminPage, /traffic-tooltip/);
  assert.match(adminPage, /traffic-hit-zone/);
  assert.doesNotMatch(adminPage, /className="traffic-hit-zone"[\s\S]{0,180}tabIndex/);
  assert.match(adminPage, /Selected point/);
  assert.match(adminPage, /onMouseEnter/);
  assert.match(adminPage, /visitors/);
  assert.match(adminPage, /AnalyticsInsightList/);
  assert.match(adminPage, /analytics-insight/);
  assert.match(adminPage, /insightGroups/);
  assert.match(adminPage, /CV downloads/);
  assert.match(adminPage, /Contact clicks/);
  assert.match(adminPage, /Countries/);
  assert.match(adminPage, /Operation log/);
  assert.match(adminPage, /\/api\/admin\/audit-logs/);
  assert.match(adminPage, /\/api\/admin\/analytics/);
  assert.match(adminPage, /\/api\/admin\/auth\/me/);
  assert.match(adminPage, /\/api\/admin\/auth\/logout/);
  assert.match(adminPage, /\/api\/admin\/users/);
  assert.match(adminPage, /currentUser\.role === "super_admin"/);
  assert.match(adminPage, /User directory/);
  assert.match(adminPage, /Password is required/);
  assert.match(adminPage, /Encrypted/);
  assert.match(adminPage, /Reset only/);
  assert.match(adminPage, /New username/);
  assert.match(adminPage, /Root administrator username is locked/);
  assert.match(adminPage, /locked-field/);
  assert.match(adminPage, /Optional reset password/);
  assert.match(adminPage, /currentUserIsRoot/);
  assert.match(adminPage, /window\.alert\("Super administrators cannot be deleted\."/);
  assert.match(adminPage, /Upload \$\{labels\[locale\]\}/);
  assert.match(adminPage, /en:\s*"English CV"/);
  assert.match(adminPage, /removeCv/);
  assert.match(adminPage, /removeExperience/);
  assert.match(adminPage, /removeSkill/);
  assert.match(adminPage, /removeProject/);
  assert.match(adminPage, /updateExperience/);
  assert.match(adminPage, /updateSkillItems/);
  assert.match(adminPage, /updateProject/);
  assert.doesNotMatch(adminPage, /Administrator key|x-admin-key|adminKey/);
  assert.match(loginPage, /Admin login/);
  assert.match(loginPage, /\/api\/admin\/auth\/login/);
  assert.match(loginPage, /placeholder="Username"/);
  assert.match(loginPage, /EyeOff/);
  assert.match(loginPage, /Show password/);
  assert.match(loginPage, /Hide password/);
  assert.match(loginPage, /password-toggle/);
  assert.match(loginPage, /password-field/);
  assert.doesNotMatch(loginPage, /Use a database-backed administrator account/);
  assert.doesNotMatch(loginPage, /Local first-use account|kanwu-admin|value="admin"/);
  assert.match(cvApi, /CV_BUCKET/);
  assert.match(adminApi, /requireAdminUser/);
  assert.match(adminApi, /Only PDF files are supported/);
  assert.match(adminApi, /export async function DELETE/);
  assert.match(contentApi, /readSiteContent/);
  assert.match(adminContentApi, /requireAdminUser/);
  assert.match(adminContentApi, /writeSiteContent/);
  assert.match(adminContentApi, /export async function PUT/);
  assert.match(loginApi, /bootstrapSuperAdmin/);
  assert.match(loginApi, /getClientIp/);
  assert.match(loginApi, /retryAfterSeconds/);
  assert.match(loginApi, /Too many failed login attempts/);
  assert.match(loginApi, /status:\s*429/);
  assert.match(loginApi, /Set-Cookie/);
  assert.match(usersApi, /requireSuperAdmin/);
  assert.match(usersApi, /createAdminUser/);
  assert.match(usersApi, /auth\.user/);
  assert.match(userApi, /deleteAdminUser/);
  assert.match(userApi, /updateAdminUser/);
  assert.match(auditApi, /readAuditLogs/);
  assert.match(auditApi, /requireSuperAdmin/);
  assert.match(passwordApi, /changeOwnPassword/);
  assert.match(auditStore, /admin_audit_logs/);
  assert.match(auditStore, /writeAuditLog/);
  assert.match(auditStore, /readAuditLogs/);
  assert.match(authStore, /admin_users/);
  assert.match(authStore, /admin_sessions/);
  assert.match(authStore, /admin_login_attempts/);
  assert.match(authStore, /maxFailedLoginAttempts = 5/);
  assert.match(authStore, /loginLockMinutes = 10/);
  assert.match(authStore, /recordFailedLoginAttempt/);
  assert.match(authStore, /clearLoginAttempt/);
  assert.match(authStore, /PBKDF2/);
  assert.match(authStore, /password_hash/);
  assert.match(authStore, /rootAdminUsername = "admin"/);
  assert.doesNotMatch(authStore, /defaultLocalAdminPassword|Kanwu-Admin#2026/);
  assert.match(authStore, /Permission denied/);
  assert.match(authStore, /Only the root administrator can create super administrators/);
  assert.match(authStore, /Only the root administrator can promote super administrators/);
  assert.match(authStore, /Super administrators cannot be deleted/);
  assert.match(authStore, /isRootSuperAdmin/);
  assert.match(authStore, /Password must be at least 10 characters/);
  assert.match(authStore, /Password is required/);
  assert.match(authStore, /Password must include an uppercase letter/);
  assert.match(authStore, /Password must include a lowercase letter/);
  assert.match(authStore, /Password must include a number/);
  assert.match(authStore, /Password must include a symbol/);
  assert.match(analyticsApi, /requireAdminUser/);
  assert.match(analyticsApi, /readAnalyticsSummary/);
  assert.match(analyticsTrackApi, /recordPageView/);
  assert.match(analyticsTrackApi, /eventType/);
  assert.match(analyticsStore, /traffic_events/);
  assert.match(analyticsStore, /event_type/);
  assert.match(analyticsStore, /cv_download/);
  assert.match(analyticsStore, /contact_click/);
  assert.match(analyticsStore, /countries/);
  assert.match(analyticsStore, /visitor_hash/);
  assert.match(analyticsStore, /weekly/);
  assert.match(analyticsStore, /monthly/);
  assert.match(analyticsStore, /strftime\('%Y-W%W'/);
  assert.match(analyticsStore, /-84 days/);
  assert.match(analyticsStore, /COUNT\(DISTINCT visitor_hash\)/);
  assert.match(productionDocs, /Production runbook/);
  assert.match(productionDocs, /kanwu-cv/);
  assert.match(productionDocs, /scripts\/backup-data\.sh/);
  assert.match(backupScript, /kanwu-backups/);
  assert.match(backupScript, /systemctl stop/);
  assert.match(backupScript, /\.data \.env/);
  assert.match(cvApi, /assetPath/);
  assert.match(cvApi, /Response\.redirect/);
  assert.match(hosting, /"d1":\s*"DB"/);
  assert.match(hosting, /"r2":\s*"CV_BUCKET"/);
});

test("declares editable default content and D1 migration", async () => {
  const [
    content,
    schema,
    contentMigration,
    authMigration,
    indexMigration,
    trafficMigration,
    auditMigration,
    loginAttemptMigration,
  ] = await Promise.all([
    readProjectFile("app/site-content.ts"),
    readProjectFile("db/schema.ts"),
    readProjectFile("drizzle/0000_tiresome_mattie_franklin.sql"),
    readProjectFile("drizzle/0001_abandoned_piledriver.sql"),
    readProjectFile("drizzle/0002_curly_midnight.sql"),
    readProjectFile("drizzle/0003_big_the_professor.sql"),
    readProjectFile("drizzle/0004_classy_maelstrom.sql"),
    readProjectFile("drizzle/0005_lock_login_attempts.sql"),
  ]);

  assert.match(content, /defaultSiteContent/);
  assert.match(content, /Data Analyst with a focus on business insight/);
  assert.match(content, /专注于业务洞察、数据报告与数据驱动决策的数据分析师/);
  assert.match(schema, /siteContent/);
  assert.match(schema, /adminUsers/);
  assert.match(schema, /adminSessions/);
  assert.match(schema, /adminLoginAttempts/);
  assert.match(schema, /trafficEvents/);
  assert.match(schema, /adminAuditLogs/);
  assert.match(contentMigration, /CREATE TABLE `site_content`/);
  assert.match(authMigration, /CREATE TABLE `admin_users`/);
  assert.match(authMigration, /CREATE TABLE `admin_sessions`/);
  assert.match(indexMigration, /admin_sessions_user_id_idx/);
  assert.match(indexMigration, /admin_sessions_expires_at_idx/);
  assert.match(trafficMigration, /CREATE TABLE `traffic_events`/);
  assert.match(trafficMigration, /traffic_events_created_at_idx/);
  assert.match(trafficMigration, /traffic_events_visitor_hash_idx/);
  assert.match(auditMigration, /CREATE TABLE `admin_audit_logs`/);
  assert.match(auditMigration, /ALTER TABLE `traffic_events` ADD `event_type`/);
  assert.match(auditMigration, /traffic_events_event_type_idx/);
  assert.match(loginAttemptMigration, /CREATE TABLE `admin_login_attempts`/);
  assert.match(loginAttemptMigration, /admin_login_attempts_locked_until_idx/);
  assert.match(loginAttemptMigration, /admin_login_attempts_username_idx/);
});

test("includes default English and Chinese CV PDFs", async () => {
  const [english, chinese, englishPreview, chinesePreview] = await Promise.all([
    stat(new URL("public/CV_EN.pdf", root)),
    stat(new URL("public/CV_CN.pdf", root)),
    stat(new URL("public/cv-preview-en.png", root)),
    stat(new URL("public/cv-preview-cn.png", root)),
  ]);

  assert.ok(english.size > 100_000);
  assert.ok(chinese.size > 100_000);
  assert.ok(englishPreview.size > 100_000);
  assert.ok(chinesePreview.size > 100_000);
});

test("removes starter preview artifacts", async () => {
  const [page, layout, packageJson, css] = await Promise.all([
    readProjectFile("app/page.tsx"),
    readProjectFile("app/layout.tsx"),
    readProjectFile("package.json"),
    readProjectFile("app/globals.css"),
  ]);

  assert.doesNotMatch(page, /SkeletonPreview|codex-preview|_sites-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);

  await assert.rejects(access(new URL("app/_sites-preview", root)));
});
