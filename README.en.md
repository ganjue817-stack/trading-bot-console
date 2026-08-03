# Trading Bot Console

> Language / 语言: [English](README.en.md) | [简体中文](README.zh-CN.md)

Trading Bot Console is a React, TypeScript, and Vite dashboard for exploring
trading-console UI, symbol ordering, equity-series presentation, and mock
API-driven workflows. It intentionally excludes exchange credentials, account
records, live trading configuration, build bundles, and local runtime data.

## Quick Start

```bash
npm ci
npm run dev
```

## Verification

```bash
npm run test:sort
```

## Project Layout

```text
src/       Dashboard components, mock API, display logic, and types
scripts/   Focused developer checks
tests/     Reproducible presentation tests
public/    Public static assets
```

## Scope

This is a user-interface and mock-data project. It is not a live trading
system, a trading recommendation, or a place to store exchange credentials.
Read [DISCLAIMER.md](DISCLAIMER.md) before using or extending it.

## Contributing and License

Read [CONTRIBUTING.md](CONTRIBUTING.md), keep changes focused, and run the
narrowest relevant check before opening a pull request. Source code is released
under the [MIT License](LICENSE); see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution.
