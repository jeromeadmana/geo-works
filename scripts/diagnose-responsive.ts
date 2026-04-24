import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.DIAGNOSE_BASE ?? 'http://localhost:3000';
const EMAIL = process.env.DIAGNOSE_EMAIL ?? 'admin@geoworks.local';
const PASSWORD = process.env.DIAGNOSE_PASSWORD ?? 'geoworks-admin';
const OUT_DIR = 'tmp-responsive';

const VIEWPORTS = [
  { id: 'mobile', width: 375, height: 667 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'desktop', width: 1440, height: 900 },
] as const;

const SCHEMES = [
  { id: 'light', colorScheme: 'light' as const },
  { id: 'dark', colorScheme: 'dark' as const },
];

type Route = {
  id: string;
  path: string;
  auth?: boolean;
  waitFor?: string;
};

const ROUTES: Route[] = [
  { id: '01-home', path: '/' },
  { id: '02-parcels', path: '/parcels' },
  { id: '03-parcel-detail', path: '/parcels/160-acres-in-brewster-county-tx' },
  { id: '04-map', path: '/map', waitFor: 'canvas.mapboxgl-canvas' },
  { id: '05-404', path: '/this-does-not-exist' },
  { id: '06-admin-login', path: '/admin/login' },
  { id: '07-admin-parcels', path: '/admin/parcels', auth: true },
  { id: '08-admin-new', path: '/admin/parcels/new', auth: true },
  { id: '09-admin-audit', path: '/admin/audit', auth: true },
];

type Issue = { route: string; viewport: string; scheme: string; detail: string };

async function signIn(page: Page): Promise<void> {
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL('**/admin/parcels', { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function auditRoute(
  page: Page,
  route: Route,
  viewport: (typeof VIEWPORTS)[number],
  scheme: (typeof SCHEMES)[number],
): Promise<Issue[]> {
  const url = `${BASE}${route.path}`;
  const issues: Issue[] = [];

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    if (route.waitFor) {
      await page.waitForSelector(route.waitFor, { timeout: 10000 }).catch(() => {});
    }

    const metrics = await page.evaluate(() => {
      const docScrollWidth = document.documentElement.scrollWidth;
      const viewportWidth = window.innerWidth;
      const overflowX = docScrollWidth > viewportWidth + 1;

      const offenders: Array<{ tag: string; cls: string; width: number }> = [];
      if (overflowX) {
        const all = Array.from(document.querySelectorAll<HTMLElement>('body *'));
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.width > viewportWidth + 1 && rect.height > 0) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className || '').toString().slice(0, 80),
              width: Math.round(rect.width),
            });
            if (offenders.length >= 3) break;
          }
        }
      }
      return { docScrollWidth, viewportWidth, overflowX, offenders };
    });

    if (metrics.overflowX) {
      issues.push({
        route: route.id,
        viewport: viewport.id,
        scheme: scheme.id,
        detail: `horizontal overflow — doc=${metrics.docScrollWidth}px vs viewport=${metrics.viewportWidth}px. Offenders: ${metrics.offenders
          .map((o) => `<${o.tag} class="${o.cls}" width=${o.width}>`)
          .join(' · ')}`,
      });
    }

    const file = join(OUT_DIR, `${route.id}__${viewport.id}__${scheme.id}.png`);
    await page.screenshot({ path: file, fullPage: true });
  } catch (err) {
    issues.push({
      route: route.id,
      viewport: viewport.id,
      scheme: scheme.id,
      detail: `navigation failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  return issues;
}

async function runScheme(
  browser: Browser,
  scheme: (typeof SCHEMES)[number],
  viewport: (typeof VIEWPORTS)[number],
): Promise<Issue[]> {
  const context: BrowserContext = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: scheme.colorScheme,
  });
  await context.addInitScript(() => {
    // @ts-expect-error — shim for tsx-compiled evaluate callbacks
    globalThis.__name = (fn: unknown) => fn;
  });
  const page = await context.newPage();

  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const issues: Issue[] = [];

  for (const route of ROUTES) {
    if (route.auth) continue;
    issues.push(...(await auditRoute(page, route, viewport, scheme)));
  }

  await signIn(page).catch((err) => {
    issues.push({
      route: 'signin',
      viewport: viewport.id,
      scheme: scheme.id,
      detail: `sign-in failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  });

  for (const route of ROUTES.filter((r) => r.auth)) {
    issues.push(...(await auditRoute(page, route, viewport, scheme)));
  }

  if (pageErrors.length > 0) {
    issues.push({
      route: 'any',
      viewport: viewport.id,
      scheme: scheme.id,
      detail: `page errors: ${pageErrors.slice(0, 3).join(' | ')}`,
    });
  }

  await context.close();
  return issues;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`→ responsive audit against ${BASE}`);
  console.log(`  viewports: ${VIEWPORTS.map((v) => `${v.id}(${v.width})`).join(', ')}`);
  console.log(`  schemes: ${SCHEMES.map((s) => s.id).join(', ')}`);
  console.log(`  screenshots will land in ./${OUT_DIR}/`);

  const browser = await chromium.launch({ headless: true });
  const allIssues: Issue[] = [];

  for (const viewport of VIEWPORTS) {
    for (const scheme of SCHEMES) {
      console.log(`\n— ${viewport.id} / ${scheme.id}`);
      const issues = await runScheme(browser, scheme, viewport);
      for (const issue of issues) {
        console.log(`  ⚠ [${issue.route}] ${issue.detail}`);
      }
      allIssues.push(...issues);
    }
  }

  await browser.close();

  console.log('\n=============== summary ===============');
  console.log(`total issues: ${allIssues.length}`);
  if (allIssues.length === 0) {
    console.log('✓ no overflow, navigation, or runtime errors detected');
  } else {
    const byRoute = new Map<string, number>();
    for (const i of allIssues) byRoute.set(i.route, (byRoute.get(i.route) ?? 0) + 1);
    console.log('by route:');
    for (const [r, n] of [...byRoute.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  · ${r}: ${n}`);
    }
  }
  console.log(`screenshots: ${OUT_DIR}/`);

  process.exit(allIssues.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
