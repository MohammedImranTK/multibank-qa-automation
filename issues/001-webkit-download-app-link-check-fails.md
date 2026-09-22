Title: `content-links.spec.js` "App Store and Google Play download links resolve correctly" fails on webkit-desktop only

Status: Open
Project: webkit-desktop
Test: `tests/content-links.spec.js` — "App Store and Google Play download links resolve correctly"

## Summary

The universal "Download the app" link (`https://mbio.go.link/6OW91`, an
adjust.com/go.link attribution redirector) consistently fails the
`checkLinkStatus` HTTP resolution check when the request is made under the
`webkit-desktop` Playwright project, while the same check passes on
`chromium-desktop` and `firefox-desktop`.

## Reproduction

```
npx playwright test tests/content-links.spec.js -g "App Store and Google Play" --project=webkit-desktop
```

Fails deterministically — reproduced 3/3 consecutive runs.

## Investigation so far

- `curl -I -L https://mbio.go.link/6OW91` resolves cleanly: `302` →
  `play.google.com/store/apps/details?...` → `200`.
- The same `checkLinkStatus` call (Playwright's `request` fixture, HEAD with
  GET fallback on 405) passes on chromium-desktop and firefox-desktop.
- Playwright's `request` fixture is not tied to a specific browser engine's
  network stack, so the failure is most likely the adjust.com/go.link
  redirector applying bot/attribution heuristics (UA string, TLS
  fingerprint, or request-header ordering) that reject requests carrying
  webkit-desktop's client signature specifically — not a bug in the
  application under test or in the framework's link-checking logic.

## Decision

Left failing intentionally rather than skipped or silently retried — the
test still exercises a real, valid assertion (the download link should
resolve), and suppressing it would hide a genuine third-party dependency
limitation. Tracked here instead of masking it in the suite.

## Suggested next steps

- Confirm with the marketing/growth team whether `go.link`/adjust is known
  to reject certain automated clients.
- If confirmed as expected redirector behavior for non-mobile UAs, consider
  scoping this specific check out of `webkit-desktop` with a documented
  `test.skip()` and a linked ticket, rather than a bare exclusion.
