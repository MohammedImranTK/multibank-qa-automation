# MultiBank QA Automation

A production-grade Playwright UI automation framework for the MultiBank
Group trading platform, built as part of the MultiBank QA Automation Coding
Challenge (Task 1). Task 2 (written QA strategy) lives in [`docs/`](docs/).

**Target under test:** [`https://mb.io/en-AE`](https://mb.io/en-AE) — the
documented fallback from the assessment brief, used because
`trade.multibank.io` sits behind a login wall on every route and exposes no
anonymous-user surface to test.

## Quick start

```bash
npm install
npm run install:browsers   # one-time: downloads Chromium/Firefox/WebKit
npm test                   # runs the full suite on chromium-desktop, firefox-desktop, webkit-desktop
npm run report              # opens the last HTML report
```

That's the whole loop — no test data setup, no auth, no environment beyond
`npm install`.

## Architecture

```
fixtures/pageFixtures.js     Custom Playwright fixtures — inject Page Objects
                              into every test, plus an auto-use lifecycle hook
config/
  global-setup.js             Runs once before any test: environment health
                              check, fails the whole run fast on a bad target
  global-teardown.js          Runs once after all tests: logs total duration
src/
  pages/                      One class per page (Page Object Model).
                              Locators + page-specific behaviour only.
  components/
    NavigationComponent.js    The nav bar, modelled once and composed into
                              every page object (DRY) instead of duplicated
  utils/
    ConfigManager.js          Singleton — env-aware base URL / timeouts
    Logger.js                 Singleton — leveled, timestamped console logger
    TestDataProvider.js       Singleton — single access point for all
                              src/data/*.js fixtures
    linkChecker.js            Real HTTP link resolution via APIRequestContext
    NetworkConditions.js      Slow-network simulation for timeout tests
  data/                       Static fixtures (nav items, routes, expected
                              content) — never require()'d directly by tests
tests/                        Spec files, grouped by the brief's categories
issues/                       Known, investigated-but-unresolved findings
                              (e.g. a third-party link rejecting WebKit)
docs/                          Task 2 written deliverables (markdown + PDF)
scripts/                       One-off maintenance scripts (e.g. markdown to
                              PDF for the Task 2 docs)
```

### Design principles

- **Page Object Model** — every page is a class; tests read as user actions
  and assertions, never raw locators.
- **Singleton** — `ConfigManager`, `Logger`, and `TestDataProvider` are each
  instantiated once per process via `getInstance()`, so config parsing, log
  formatting, and test-data loading happen in exactly one place. Page
  objects are deliberately **not** singletons — Playwright gives each test
  its own isolated `page`, and a shared page-object instance would leak
  state across parallel tests.
- **DRY** — the nav bar is modelled once (`NavigationComponent`) and composed
  into every page object; all test data flows through `TestDataProvider`
  instead of being duplicated per spec file.
- **Suite-level + per-test lifecycle** — `config/global-setup.js` /
  `global-teardown.js` run once for the whole run (environment health check,
  duration logging); an `auto: true` fixture in `fixtures/pageFixtures.js`
  runs before/after **every** test (start/end logging, and on failure,
  attaches captured browser console errors + the final URL to the HTML
  report) — without every spec file re-declaring its own `beforeEach`/
  `afterEach`.
- **Role/text-based locators, not CSS/XPath** — the live site ships zero
  `data-testid`/`data-qa` attributes, so every locator uses
  `getByRole`/`getByText`, which is also what Playwright recommends as the
  most resilient-to-refactor locator strategy.

## Test coverage

| Category | File | What's covered |
|---|---|---|
| Navigation & Layout | `tests/navigation.spec.js` | Nav renders with all items, each item routes correctly (incl. one external link), layout holds across 3 desktop viewport sizes |
| Trading Functionality | `tests/trading.spec.js` | Spot market table renders pairs, category tabs (Explore) and category cards (homepage) group pairs correctly, pair rows expose symbol/name/price/% change in the right format |
| Content & Links | `tests/content-links.spec.js` | Marketing banners render in the expected region, app download link(s) resolve over real HTTP, About Us content (headings, stat cards, trust highlights) renders correctly |
| Negative / Edge Cases | `tests/negative-edge-cases.spec.js` | Invalid routes → friendly 404 (not a crash), broken-link detection across all nav links, mobile viewport (375px) regression, slow-network content loading handled gracefully |

All 4 negative/edge-case categories listed in the brief are implemented
(the brief asked for at least 2).

## Design decisions & assumptions

- **Base URL**: `https://mb.io/en-AE` (`.env` → `BASE_URL`). The locale
  segment lives in `BASE_URL`; page-object `PATH` constants and route
  fixtures are locale-relative, and `ConfigManager.url()` joins them with
  plain string concatenation rather than WHATWG `URL` resolution — a
  root-relative path resolved against a base with a subpath (`/en-AE`) would
  otherwise silently drop that subpath.
- **"Trading Functionality" scope**: there is no anonymous order-entry
  screen on this build — trading requires login. The public, reachable
  surface is the spot market price table at `/explore` (and the homepage's
  "Catch your next trade" module), so that's what's exercised.
- **"About Us" mapping**: the brief's "About Us > Why MultiBank" maps to the
  single `/company` route on this build — there's no separate About Us
  parent with a Why MultiBank sub-page.
- **App download links**: the build exposes one universal "Download the
  app" deep link (device-detecting redirector) rather than two dedicated
  App Store/Google Play badges. The content test checks whichever variant
  is actually present.

## Running tests

```bash
npm test                    # full suite, all desktop browsers
npm run test:headed         # headed mode, useful for local debugging
npm run test:ui             # Playwright's interactive UI mode

npm run test:chromium       # single project
npm run test:firefox
npm run test:webkit
npm run test:mobile         # mobile-chrome project (Pixel 7), @mobile-tagged tests only
npm run test:cross-browser  # chromium + firefox + webkit

npm run test:navigation     # single spec file
npm run test:trading
npm run test:content
npm run test:negative

npm run test:smoke          # everything tagged @smoke
npm run test:regression     # everything tagged @regression

npm run report              # open the last HTML report
npm run codegen              # Playwright codegen against the live site
```

## Cross-browser strategy

Four Playwright projects: `chromium-desktop`, `firefox-desktop`,
`webkit-desktop` (1440×900) run the full suite; `mobile-chrome` (Pixel 7
emulation) runs only tests tagged `@mobile` — the rest of the suite asserts
desktop nav structure that a collapsed mobile nav doesn't expose, so
re-running them under a mobile viewport would test the wrong thing rather
than add coverage.

CI (`.github/workflows/playwright.yml`) runs the same three desktop
projects in a matrix on every push/PR to `main`, uploading the HTML and
JUnit report as artifacts per project.

## Reports & evidence

- `npm run report` opens the HTML report from the last local run (pass/fail
  per test, screenshots + video + trace on failure).
- Failed tests also get browser console errors and the final page URL
  attached automatically (via the lifecycle fixture), so most failures are
  diagnosable from the report alone.
- `npx playwright show-trace <path-to-trace.zip>` opens the full
  step-by-step trace viewer for a specific failure.

## Known issues

Investigated-but-unresolved findings are tracked as individual files under
[`issues/`](issues/) rather than silently skipped or hidden — e.g.
[`001-webkit-download-app-link-check-fails.md`](issues/001-webkit-download-app-link-check-fails.md)
documents a third-party attribution redirector that rejects WebKit's
request signature specifically.

## Task 2 — QA Strategy

See [`docs/`](docs/) for the written strategy answers, test plan, release
readiness checklist, and risk matrix (markdown, source of truth). PDF
versions of the same four documents are in [`docs/pdf/`](docs/pdf/) for easy
standalone reading/printing:

- [`task2-qa-strategy.pdf`](docs/pdf/task2-qa-strategy.pdf)
- [`task2-test-plan.pdf`](docs/pdf/task2-test-plan.pdf)
- [`task2-release-readiness-checklist.pdf`](docs/pdf/task2-release-readiness-checklist.pdf)
- [`task2-risk-matrix.pdf`](docs/pdf/task2-risk-matrix.pdf)

Regenerate them after editing the markdown with:
`node scripts/generate-task2-pdfs.js`.
