# Trading Bot Console

> 语言 / Language: [English](README.en.md) | [简体中文](README.zh-CN.md)

Trading Bot Console 是一个基于 React、TypeScript 与 Vite 的交易机器人运营控制台，
用于展示控制台界面、交易对排序、权益曲线呈现以及由模拟 API 驱动的工作流。
仓库刻意不包含交易所凭据、账户记录、实盘交易配置、构建产物或本地运行时数据。

## 快速开始

```bash
npm ci
npm run dev
```

## 验证

```bash
npm run test:sort
```

## 项目结构

```text
src/       控制台组件、模拟 API、展示逻辑与类型
scripts/   聚焦的开发检查脚本
tests/     可复现的展示测试
public/    公共静态资源
```

## 项目范围

这是一个界面与模拟数据项目，不是实盘交易系统、交易建议服务或交易所凭据存放位置。
使用或扩展项目前请阅读 [DISCLAIMER.md](DISCLAIMER.md)。

## 贡献与许可

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，保持修改聚焦，并在提交 Pull Request 前运行最小相关检查。
源代码采用 [MIT License](LICENSE) 发布；第三方归属见
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
