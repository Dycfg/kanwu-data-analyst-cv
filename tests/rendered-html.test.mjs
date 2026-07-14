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
  assert.match(page, /Data analyst signal/);
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
    adminPage,
    loginPage,
    cvApi,
    adminApi,
    contentApi,
    adminContentApi,
    loginApi,
    usersApi,
    userApi,
    passwordApi,
    authStore,
    analyticsApi,
    analyticsTrackApi,
    analyticsStore,
    hosting,
  ] = await Promise.all([
    readProjectFile("app/cv/page.tsx"),
    readProjectFile("app/admin/page.tsx"),
    readProjectFile("app/admin/login/page.tsx"),
    readProjectFile("app/api/cv/[locale]/route.ts"),
    readProjectFile("app/api/admin/cv/route.ts"),
    readProjectFile("app/api/content/route.ts"),
    readProjectFile("app/api/admin/content/route.ts"),
    readProjectFile("app/api/admin/auth/login/route.ts"),
    readProjectFile("app/api/admin/users/route.ts"),
    readProjectFile("app/api/admin/users/[id]/route.ts"),
    readProjectFile("app/api/admin/password/route.ts"),
    readProjectFile("app/server/auth-store.ts"),
    readProjectFile("app/api/admin/analytics/route.ts"),
    readProjectFile("app/api/analytics/track/route.ts"),
    readProjectFile("app/server/analytics-store.ts"),
    readProjectFile(".openai/hosting.json"),
  ]);

  assert.match(cvPage, /\/api\/cv\/\$\{lang\}/);
  assert.match(cvPage, /\/api\/analytics\/track/);
  assert.match(cvPage, /Download English CV/);
  assert.match(cvPage, /paper-preview/);
  assert.match(cvPage, /cv-preview-en\.png/);
  assert.match(cvPage, /Open full PDF/);
  assert.doesNotMatch(cvPage, /iframe|pdf-frame|pdf-placeholder/);
  assert.doesNotMatch(cvPage, /admin page|后台页面/i);
  assert.match(adminPage, /Site management/);
  assert.match(adminPage, /Signed in/);
  assert.match(adminPage, /Content CMS/);
  assert.match(adminPage, /Save content/);
  assert.match(adminPage, /Administrator accounts/);
  assert.match(adminPage, /Change password/);
  assert.match(adminPage, /Password changed successfully/);
  assert.match(adminPage, /At least 10 characters with uppercase, lowercase, number, and symbol/);
  assert.match(adminPage, /Visitor overview/);
  assert.match(adminPage, /\/api\/admin\/analytics/);
  assert.match(adminPage, /\/api\/admin\/auth\/me/);
  assert.match(adminPage, /\/api\/admin\/auth\/logout/);
  assert.match(adminPage, /\/api\/admin\/users/);
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
  assert.match(loginApi, /Set-Cookie/);
  assert.match(usersApi, /requireSuperAdmin/);
  assert.match(usersApi, /createAdminUser/);
  assert.match(userApi, /deleteAdminUser/);
  assert.match(userApi, /updateAdminUser/);
  assert.match(passwordApi, /changeOwnPassword/);
  assert.match(authStore, /admin_users/);
  assert.match(authStore, /admin_sessions/);
  assert.match(authStore, /PBKDF2/);
  assert.match(authStore, /password_hash/);
  assert.match(authStore, /Password must be at least 10 characters/);
  assert.match(authStore, /Password must include an uppercase letter/);
  assert.match(authStore, /Password must include a lowercase letter/);
  assert.match(authStore, /Password must include a number/);
  assert.match(authStore, /Password must include a symbol/);
  assert.match(analyticsApi, /requireAdminUser/);
  assert.match(analyticsApi, /readAnalyticsSummary/);
  assert.match(analyticsTrackApi, /recordPageView/);
  assert.match(analyticsStore, /traffic_events/);
  assert.match(analyticsStore, /visitor_hash/);
  assert.match(analyticsStore, /COUNT\(DISTINCT visitor_hash\)/);
  assert.match(cvApi, /assetPath/);
  assert.match(cvApi, /Response\.redirect/);
  assert.match(hosting, /"d1":\s*"DB"/);
  assert.match(hosting, /"r2":\s*"CV_BUCKET"/);
});

test("declares editable default content and D1 migration", async () => {
  const [content, schema, contentMigration, authMigration, indexMigration, trafficMigration] = await Promise.all([
    readProjectFile("app/site-content.ts"),
    readProjectFile("db/schema.ts"),
    readProjectFile("drizzle/0000_tiresome_mattie_franklin.sql"),
    readProjectFile("drizzle/0001_abandoned_piledriver.sql"),
    readProjectFile("drizzle/0002_curly_midnight.sql"),
    readProjectFile("drizzle/0003_big_the_professor.sql"),
  ]);

  assert.match(content, /defaultSiteContent/);
  assert.match(content, /Data Analyst with a focus on business insight/);
  assert.match(content, /专注于业务洞察、数据报告与数据驱动决策的数据分析师/);
  assert.match(schema, /siteContent/);
  assert.match(schema, /adminUsers/);
  assert.match(schema, /adminSessions/);
  assert.match(schema, /trafficEvents/);
  assert.match(contentMigration, /CREATE TABLE `site_content`/);
  assert.match(authMigration, /CREATE TABLE `admin_users`/);
  assert.match(authMigration, /CREATE TABLE `admin_sessions`/);
  assert.match(indexMigration, /admin_sessions_user_id_idx/);
  assert.match(indexMigration, /admin_sessions_expires_at_idx/);
  assert.match(trafficMigration, /CREATE TABLE `traffic_events`/);
  assert.match(trafficMigration, /traffic_events_created_at_idx/);
  assert.match(trafficMigration, /traffic_events_visitor_hash_idx/);
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
