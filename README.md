# Lumen Engine

TypeScript engine that turns a single declarative `EngineConfig` into production-ready, high-performance interactive web frontends: validate → template composition → SceneIR → codegen → build → runtime hydration.

## Features

- **Declarative config** — one validated, versioned `EngineConfig` (JSON/JSONC) with migrations, defaults, and precise error paths (`packages/config`)
- **Four template kinds** — `scroll-video`, `cinematic-spa`, `viewer-3d`, `storytelling` (`packages/templates`)
- **Multi-target codegen** — emit a static site, a `<lumen-embed>` web component, an npm library, or a runtime JSON loader from the same config (`packages/codegen`)
- **Budget-gated builds** — content-hashed output, deploy manifest, gzip size budgets that can fail CI (`packages/build`)
- **Adaptive rendering** — DOM, Canvas2D, WebGL2 (Three.js optional peer) backends with automatic fallback (`packages/rendering`)
- **Deterministic interaction** — normalized input, gesture state machines, virtual scrolling, reduced-motion/keyboard fallbacks (`packages/interaction`)
- **Full SaaS backend** — Supabase schema migrations, RLS, storage, edge functions (`publish-pipeline`, `asset-pipeline`, `payouts`), cron, deploy script (`backend/`)
- **Builder SPA** — the visual builder frontend (`app/builder`; mirrors the standalone `lumen-builder` repo)
- **Platform apps** — 16 app packages under `app/` (projects, onboarding, marketplace, assets, publish, billing, team, AI, designer, dashboard, community, settings, telemetry, entitlements, cli, runtime)

## Tech stack

TypeScript, Node ≥ 20, npm workspaces, Supabase (Postgres, edge functions), Vercel. Core packages (kernel, scene, config, contracts) are zero-dependency and run in Node, browsers, and workers.

## Getting started

```bash
bash scripts/build-all.sh   # builds all packages (root build script)
npm test                    # node --test tests/e2e/
npm run example             # builds the simple-site example
```

Backend deploy runbook: `engine/DEPLOYMENT.md` (Supabase migrations → edge functions → Vercel SPA). Design docs: `engine/SPEC.md`, `engine/plan.md`, `engine/qa-report.md`.

## Project structure

```
engine/
  contracts/      # @lumen/contracts — all cross-module types (frozen)
  packages/       # kernel, rendering, scene, assets, interaction, templates,
                  #   codegen, config, build, runtime
  app/            # builder SPA + 15 platform packages
  backend/        # SCHEMA.md, migrations/, deploy/, functions/ (publish/asset/payouts)
  docs/ examples/ tests/ scripts/
work-codegen/     # codegen work package
work-p21/         # parallel work package (engine subset copy)
```

## Status

Real, large, actively developed project. The `engine/` subtree is the canonical build; `work-codegen/` and `work-p21/` are working copies. Sister repo `lumen-engine-v2` is a near-duplicate with deploy fixes applied.
