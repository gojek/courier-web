---
id: Installation
title: Installation
sidebar_position: 2
---

# Installation

## Requirements

- Node.js >= 18
- npm, yarn, or pnpm

## Install

```bash
npm install @armaanjain/courier-web-sdk
```

## Peer Dependencies

React is an **optional** peer dependency. Install it only if you plan to use the React hooks:

```bash
npm install react
```

## What's Included

The package ships two entry points:

| Import | Contents |
|--------|----------|
| `@armaanjain/courier-web-sdk` | Core SDK (framework-agnostic) |
| `@armaanjain/courier-web-sdk/react` | React bindings (hooks + context provider) |

## Module Formats

The package provides:

- **ESM** (`dist/index.js`, `dist/react.js`) — for modern bundlers
- **CJS** (`dist/index.cjs`, `dist/react.cjs`) — for Node.js / legacy bundlers
- **TypeScript declarations** (`dist/index.d.ts`, `dist/react.d.ts`)

## Dependencies

| Package | Role |
|---------|------|
| `mqtt` ^5.x | Underlying MQTT client (mqtt.js) |
| `rxjs` ^7.x | Internal reactive streams |
| `react` >=18 | Optional — only for React hooks |
