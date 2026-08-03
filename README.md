# Trading Bot Console

> Language / 语言: [English](README.en.md) | [简体中文](README.zh-CN.md)

A React, TypeScript, and Vite dashboard for exploring trading-console UI,
symbol ordering, equity-series presentation, and mock API-driven workflows.
The repository intentionally excludes exchange credentials, account records,
live trading configuration, build bundles, and local runtime data.

*中文简介*

这是一个基于 React、TypeScript 和 Vite 的交易机器人控制台，用于展示交易界面、
标的排序、权益曲线和由模拟 API 驱动的工作流。仓库不包含交易所凭据、账户记录、
实盘交易配置、构建产物或本地运行数据。

## Quick Start

```bash
npm ci
npm run dev
```

## Verification

```bash
npm run test:sort
npm run build
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

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), keep changes focused, and run the
narrowest relevant verification before opening a pull request.

## License

Source code is released under the [MIT License](LICENSE). See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for third-party attribution.
