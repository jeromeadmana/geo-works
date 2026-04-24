import { chromium } from 'playwright';

const URL = process.env.DIAGNOSE_URL ?? 'http://localhost:3000/map';
const WAIT_MS = Number(process.env.DIAGNOSE_WAIT ?? 8000);

type ConsoleEntry = { type: string; text: string };

async function main() {
  console.log(`→ launching headless Chromium`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // tsx's esbuild wraps evaluated callbacks with __name() for function-name
  // preservation, but the browser has no __name. Inject a no-op shim.
  await context.addInitScript(() => {
    // @ts-expect-error — browser shim for tsx-compiled evaluate callbacks
    globalThis.__name = (fn: unknown) => fn;
  });
  const page = await context.newPage();

  const consoleLog: ConsoleEntry[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];

  page.on('console', (msg) => {
    consoleLog.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.stack ?? String(err));
  });
  page.on('requestfailed', (req) => {
    requestFailures.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });

  console.log(`→ navigating to ${URL}`);
  await page.goto(URL, { waitUntil: 'networkidle' }).catch((err) => {
    console.log(`  (navigation threw: ${err.message})`);
  });

  console.log(`→ waiting ${WAIT_MS}ms for map load / tiles`);
  await page.waitForTimeout(WAIT_MS);

  // Measure the real post-layout box of the map container + canvas.
  const measurements = await page.evaluate(() => {
    const query = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        className: el.className,
        rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
        computed: {
          position: cs.position,
          display: cs.display,
          height: cs.height,
          width: cs.width,
          top: cs.top,
          bottom: cs.bottom,
        },
      };
    };

    const canvas = document.querySelector('canvas.mapboxgl-canvas') as HTMLCanvasElement | null;

    return {
      fixedWrapper: query('.fixed'),
      mapboxMap: query('.mapboxgl-map'),
      canvasContainer: query('.mapboxgl-canvas-container'),
      canvas: canvas
        ? {
            attrWidth: canvas.width,
            attrHeight: canvas.height,
            styleWidth: canvas.style.width,
            styleHeight: canvas.style.height,
            rect: (() => {
              const r = canvas.getBoundingClientRect();
              return { width: r.width, height: r.height };
            })(),
          }
        : null,
      viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
    };
  });

  const screenshotPath = 'tmp-map-diagnostic.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });

  console.log('\n================ RESULTS ================');
  console.log('viewport:', measurements.viewport);
  console.log('\n.fixed wrapper:', JSON.stringify(measurements.fixedWrapper, null, 2));
  console.log('\n.mapboxgl-map:', JSON.stringify(measurements.mapboxMap, null, 2));
  console.log('\n.mapboxgl-canvas-container:', JSON.stringify(measurements.canvasContainer, null, 2));
  console.log('\ncanvas:', JSON.stringify(measurements.canvas, null, 2));

  console.log(`\nconsole messages (${consoleLog.length}):`);
  for (const { type, text } of consoleLog) {
    console.log(`  [${type}] ${text}`);
  }

  if (pageErrors.length > 0) {
    console.log(`\npage errors (${pageErrors.length}):`);
    for (const e of pageErrors) console.log(`  ${e}`);
  } else {
    console.log('\npage errors: none');
  }

  if (requestFailures.length > 0) {
    console.log(`\nfailed requests (${requestFailures.length}):`);
    for (const f of requestFailures) console.log(`  ${f}`);
  } else {
    console.log('\nfailed requests: none');
  }

  console.log(`\nscreenshot saved: ${screenshotPath}`);
  console.log('=========================================\n');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
