import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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
  assert.match(page, /Data Analyst with a focus on business insight/);
  assert.match(page, /专注于业务洞察、数据报告与数据驱动决策的数据分析师/);
  assert.match(page, /https:\/\/github\.com\/Dycfg/);
  assert.match(page, /wuka@tcd\.ie/);
  assert.match(page, /W956994000/);
  assert.match(page, /\/cv\?lang=\$\{lang\}/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /backdrop-filter:\s*blur/);
});

test("keeps CV and admin upload routes wired", async () => {
  const [cvPage, adminPage, cvApi, adminApi, hosting] = await Promise.all([
    readProjectFile("app/cv/page.tsx"),
    readProjectFile("app/admin/page.tsx"),
    readProjectFile("app/api/cv/[locale]/route.ts"),
    readProjectFile("app/api/admin/cv/route.ts"),
    readProjectFile(".openai/hosting.json"),
  ]);

  assert.match(cvPage, /\/api\/cv\/\$\{lang\}/);
  assert.match(cvPage, /Download English CV/);
  assert.match(adminPage, /CV file management/);
  assert.match(adminPage, /Upload \$\{labels\[locale\]\}/);
  assert.match(adminPage, /en:\s*"English CV"/);
  assert.match(adminPage, /kanwu-admin/);
  assert.match(adminPage, /removeCv/);
  assert.match(cvApi, /CV_BUCKET/);
  assert.match(adminApi, /ADMIN_KEY/);
  assert.match(adminApi, /Only PDF files are supported/);
  assert.match(adminApi, /export async function DELETE/);
  assert.match(hosting, /"r2":\s*"CV_BUCKET"/);
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
