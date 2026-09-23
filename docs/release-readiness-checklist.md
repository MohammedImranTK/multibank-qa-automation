# Release Readiness Checklist — Mobile Trading App

To be run against the release candidate before go/no-go. Every unchecked
item needs an explicit, written waiver from the QA lead to ship anyway —
nothing gets silently skipped.

## Functional

- [ ] Sign-up / KYC flow completes on both iOS and Android
- [ ] Login, logout, and session expiry all behave correctly (no silent
      "logged in but writes fail" state)
- [ ] Biometric login works, and the fallback (PIN/password) works when
      biometrics fail or are unavailable
- [ ] Deposit flow completes and reflects correctly in balance (sandbox)
- [ ] Withdrawal flow completes and reflects correctly in balance (sandbox)
- [ ] Orders can be placed, viewed, and cancelled; cancelled orders cannot
      still fill
- [ ] Rapid double-submission of an order does not create duplicate orders
- [ ] Balance and portfolio values match the backend ledger after a burst
      of activity (deposit → trade → trade → withdraw)
- [ ] Order amounts respect correct decimal precision/rounding for every
      supported asset
- [ ] Push notifications for order fills / price alerts are delivered and
      deep-link to the correct screen
- [ ] Top navigation renders all expected items and routes correctly on
      both platforms
- [ ] Layout holds (no clipped/overlapping controls) across the supported
      device/breakpoint matrix

## Reliability / edge cases

- [ ] App behavior on connection loss mid-order is unambiguous to the user
      (clearly pending/failed/succeeded, never silent)
- [ ] App resumes correctly after being backgrounded mid-transaction
- [ ] Invalid/unknown deep links and routes fail gracefully, not with a
      crash or blank screen
- [ ] Broken/dead links across nav and content have been checked
      (App Store/Play Store links, support, legal)
- [ ] App handles a slow/degraded network without hanging indefinitely or
      showing stale data as if it were current

## Security

- [ ] No auth tokens, balances, or personal data in plaintext logs
- [ ] No sensitive data cached unencrypted on-device
- [ ] Certificate pinning active and verified in the release build
      (not just debug)
- [ ] Session tokens expire and are invalidated server-side on logout
- [ ] Rate limiting / abuse protection confirmed on auth and order
      endpoints

## Compliance

- [ ] App Store / Play Store financial-app disclosure and licensing
      requirements reviewed and satisfied
- [ ] Required legal/regulatory disclaimers present and correctly worded
- [ ] Age rating and content rating correctly set
- [ ] Privacy policy and data-handling disclosures match what the app
      actually does

## Operational readiness

- [ ] Crash reporting (Crashlytics/Sentry) wired up and alerting the team
- [ ] A remote kill switch / feature flag exists to disable trading (or a
      specific order type) without requiring an emergency app-store
      resubmission
- [ ] Rollback plan for the backend/API exists and has been tested
- [ ] On-call / incident response owner identified for launch day and the
      following 48 hours
- [ ] Support team briefed on known limitations and how to escalate a
      funds-related report

## Test evidence

- [ ] Full `@regression` suite green on the release candidate (or every
      failure explicitly triaged and waived)
- [ ] Device matrix run completed (top iOS versions + top Android
      OEM/OS combinations)
- [ ] Manual exploratory pass completed on the release candidate build
      specifically (not just an earlier build)
- [ ] Bug bash completed, all P1/P2 findings resolved or explicitly
      accepted

## Sign-off

- [ ] QA lead sign-off
- [ ] Engineering lead sign-off
- [ ] Product/business sign-off (aware of any accepted risk/waivers)
