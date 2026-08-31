# PillPlan PWA Update Strategy

Stand: 2026-08-31

## Problem

A cache-first strategy for `/` and `/index.html` can keep an installed PWA on stale application code even after a hotfix has been deployed.

## Rule

Navigation requests and the application shell must use network-first behavior with cached `/index.html` only as offline fallback.

Static same-origin assets may remain cache-first with runtime caching.

## Release rule

For every service-worker behavior change, bump the cache identifier and keep `skipWaiting()` plus `clients.claim()` so the new worker can take control as soon as the platform allows it.
