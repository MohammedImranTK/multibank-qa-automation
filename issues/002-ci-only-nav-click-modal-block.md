Title: Navigation click tests hung in CI (all browsers) — traced to a fresh-context interstitial modal, now handled

Status: Resolved
Project: chromium-desktop, firefox-desktop, webkit-desktop (CI only)
Test: `tests/navigation.spec.js` — all `"<item>" nav item links to the correct destination` tests

## Summary

Every GitHub Actions run failed identically across all three browser
projects: the first "click a nav item, then wait for the URL to change"
test onward consistently timed out after ~33s on `page.waitForURL`, even
across the 2 built-in CI retries. None of this reproduced locally.

## Investigation

- Downloaded the CI run's HTML report artifacts (`gh run download`) and
  inspected the failure screenshots directly (not just the log tail).
- The screenshots show a "Subscribe to mb.insider" newsletter modal
  overlaying the page with a dimmed backdrop at the moment of failure.
- This modal never appeared in ~10 local repro attempts (fresh headless
  contexts, default and `en-US`/`America/New_York` locale/timezone,
  including 8 back-to-back fresh-context loads from the same local IP).
- Working theory: the popup (or the underlying personalization/bot-scoring
  layer that decides whether to show it — console logs from the same runs
  also show a `challenges.cloudflare.com` Turnstile-related postMessage
  error, consistent with bot-mitigation treating the request differently)
  buckets GitHub Actions' shared/datacenter IP ranges differently than a
  residential IP. A real first-time visitor could hit the same modal, so
  this isn't purely a "CI weirdness to ignore" — it's a real interstitial
  the suite should have been defending against regardless of why it shows.

## Fix

Added `src/utils/InterstitialHandler.js` (`dismissSubscribeModal`), called
from `BasePage.goto()` (handles the modal appearing at load) and
defensively again from `NavigationComponent.clickNavItem()` with a short
timeout (handles the modal appearing on a short delay, in the gap between
`goto()` finishing and the click). Matched by visible text/role rather than
a CSS class so it isn't brittle to a copy/style change from the marketing
side.

## Verification

- Local full cross-browser run after the fix: all navigation click tests
  pass on chromium-desktop, firefox-desktop, and webkit-desktop.
- CI re-run after the fix: see the linked Actions run in the repo — if any
  browser still fails there and not locally, that's a strong signal the
  root cause is IP/fingerprint-based rather than the modal alone, and this
  file will be updated rather than left silently stale.
