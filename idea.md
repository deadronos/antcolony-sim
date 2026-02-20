# Ant Colony Simulator — Idea & Build Plan

## Overview

Build a web-based **ant colony simulator / game** with a **simulation-first architecture**:

- **Pure TypeScript simulation engine** (authoritative colony logic)
- **React UI layer** for controls and stats
- **2D renderer first** (Canvas or PixiJS) for speed and iteration
- Optional **3D renderer later** with React Three Fiber (R3F)

The main goal is to get **emergent ant behavior** (food trails, returning to nest, colony growth) working first, then improve visuals.

---

## Why this architecture

### Sim-first (recommended)
The simulation should be separate from rendering and React.

Benefits:
- easier to tune and debug ant behavior
- easier to test
- better performance
- can swap renderers later (2D → 3D) without rewriting gameplay
- clean path to Web Worker offloading

### 2D first, 3D later
Start with 2D because:
- pheromone + ant behavior is the hard/important part
- much faster to iterate and balance
- easier debugging (you can visualize trails and state directly)
- supports many more ants earlier

Later, add a 3D “skin” if desired:
- terrain/tunnels
- instanced ants
- better visual atmosphere

---

## Recommended Stack

### MVP stack (fastest path)
- **Vite**
- **React + TypeScript**
- **Zustand** (UI state)
- **PixiJS** (2D rendering) or plain Canvas for earliest prototype
- **Web Worker** for simulation thread
- **Comlink** (worker communication)

### Optional later additions
- **React Three Fiber + drei** (3D renderer mode)
- **simplex-noise** (map generation)
- **OffscreenCanvas** (advanced optimization phase)

---

## High-Level Architecture

## 1) Simulation Engine (authoritative)
A pure TypeScript module, independent of React and rendering.

Responsibilities:
- fixed tick updates (20–30 ticks/sec)
- ant AI/state updates
- pheromone deposit / evaporation / diffusion
- food / nest / colony economy
- spawning workers
- world/tile updates

Important rules:
- no React imports
- no renderer-specific logic
- deterministic-ish update order
- data-oriented structures where possible

## 2) Renderer Layer (replaceable)
Consumes snapshots/deltas from the simulation and draws them.

### Option A (MVP): 2D renderer
- PixiJS or Canvas
- draw ants, food, nest, and pheromone heatmap overlays
- fastest to build and debug

### Option B (Later): 3D renderer
- React Three Fiber
- instanced meshes for ants/food/debris
- terrain/tunnel visuals
- sim remains source of truth

## 3) React UI Layer
UI and control surface, separate from sim logic.

Examples:
- pause/resume
- speed multiplier
- ant count
- colony food
- toggles (show pheromones, show sensors, debug paths)
- upgrade buttons (later)

## 4) Worker Boundary (performance-critical)
Simulation should run in a Web Worker for smooth UI/rendering.

Do NOT send full object graphs every tick.

Send:
- compact snapshots
- typed arrays
- deltas for changed entities/cells
- lower-frequency full sync snapshots (for recovery)

---

## Core Simulation Design (MVP)

## World
A 2D grid world (start simple):
- size: `128x128` or `256x256`
- tile types:
  - empty
  - wall
  - nest
  - food
- optional random obstacles

## Ants
Each ant stores minimal state:
- position (`x`, `y`)
- direction / heading (`angle`)
- state:
  - `searching`
  - `returning`
- carried food (`boolean`)
- optional timers/energy (later)

## Pheromone Grids
Use typed arrays (`Float32Array`) for performance.

Start with two channels:
- `foodPheromone`
- `homePheromone`

Each tick:
- ants deposit trails
- grids evaporate
- optional diffusion step (cheap spread/blur)

## Ant Sensing & Movement
Use a classic 3-sensor approach:
- sample **ahead**
- sample **left**
- sample **right**

Behavior:
- while searching: bias toward food pheromone
- while returning: bias toward home pheromone
- add randomness/noise to avoid lock-in
- steer around walls/obstacles

## Colony Economy
Minimal economy to make it feel like a colony:
- delivered food increases colony food stock
- colony food enables worker spawning
- optional passive drain (queen/brood upkeep)

This creates a basic gameplay loop:
**find food → reinforce trail → colony grows**

---

## MVP Feature Set (Playable Fast)

## Phase 1 — Prototype (core behavior)
Goal: prove emergent trail behavior

Features:
- grid world
- one nest
- one or more food sources
- 100 ants
- searching/returning states
- pheromone deposit + evaporation
- simple rendering (dots/tiles)
- pause + reset

Deliverable:
- You can watch ants discover food and form visible trails.

## Phase 2 — Playable MVP
Goal: stable sim + good UX + better performance

Features:
- simulation in Web Worker
- Comlink bridge
- PixiJS renderer (or optimized Canvas)
- UI panel (stats + toggles)
- ant count and colony food display
- time speed controls (1x / 2x / 4x)
- pheromone overlay toggle
- multiple food sources
- worker spawning from colony food

Deliverable:
- A polished, replayable ant colony sim prototype in the browser.

## Phase 3 — “Game” Layer
Goal: add progression and player agency

Features:
- upgrades:
  - sensor range
  - turn speed
  - pheromone strength
  - spawn rate
- map generation
- obstacles / walls
- colony expansion mechanics
- basic digging/chamber system
- brood lifecycle (eggs → larvae → workers)

Deliverable:
- Feels like a simulation game, not just a visual experiment.

## Phase 4 — Optional 3D Visual Mode
Goal: visual wow-factor without rewriting the sim

Features:
- R3F renderer mode
- instanced ants
- simple terrain/tunnel geometry
- 3D nest chamber visuals
- optional camera presets / orbit mode

Deliverable:
- Same sim core, upgraded visual presentation.

---

## Folder Structure (suggested)

```text
src/
  app/
    App.tsx
    main.tsx

  ui/
    panels/
      StatsPanel.tsx
      ControlsPanel.tsx
      DebugPanel.tsx
    store/
      uiStore.ts

  sim/
    core/
      world.ts
      ants.ts
      pheromones.ts
      colony.ts
      tick.ts
      types.ts
    systems/
      antSenseSystem.ts
      antMoveSystem.ts
      pheromoneDepositSystem.ts
      pheromoneDecaySystem.ts
      foodPickupSystem.ts
      nestDeliverySystem.ts
      spawnSystem.ts
    utils/
      rng.ts
      grid.ts

  worker/
    simWorker.ts
    simBridge.ts   # Comlink wrapper/types

  render2d/
    pixiRenderer.ts
    layers/
      antsLayer.ts
      gridLayer.ts
      pheromoneLayer.ts
      foodLayer.ts
      nestLayer.ts

  render3d/        # optional later
    AntScene.tsx
    instancing.ts
    terrain.ts

  shared/
    snapshot.ts
    constants.ts
    messages.ts
```

---

## Technical Notes / Constraints

## Tick Rates
Recommended defaults:
- **Simulation tick:** 20–30 Hz
- **Render frame:** browser-driven (`requestAnimationFrame`)

The sim tick should stay fixed even if rendering fluctuates.

## Performance guardrails
- Use typed arrays for pheromones
- Avoid per-ant object churn in hot loops
- Reuse arrays/buffers where possible
- Send deltas instead of full state every tick
- Keep React out of per-frame ant updates

## Debug Views (high value)
Add these early:
- pheromone heatmap overlay
- ant state coloring (`searching` vs `returning`)
- sensor ray visualization (toggle)
- colony graph/stats

These make tuning ant behavior dramatically easier.

---

## Why not build both 2D and 3D at once?

Avoid parallel renderer development early.

Better approach:
1. build a single simulation core
2. define a small renderer-facing snapshot interface
3. ship one renderer first (2D)
4. add 3D only after the sim is fun

This controls scope and avoids rewriting behavior while debugging graphics.

---

## Stretch Ideas (later)

- multiple castes (workers, soldiers, scouts)
- threats/predators
- weather / rain affecting pheromones
- day/night cycle
- procedural underground generation
- queen chamber management
- species traits / mutations
- sandbox vs challenge maps
- idle/progression layer (prestige = new biome/species)

---

## First Build Target (recommended)

Build this first and stop only when it works:

- `128x128` grid
- nest + 2 food patches
- 200 ants
- food/home pheromones
- searching/returning states
- evaporation + simple diffusion
- Canvas/Pixi top-down view
- pause/reset/speed controls
- colony food counter

Once this is stable and fun to watch, everything else becomes much easier.

---

## Summary

The strongest plan is:

- **Sim-first**
- **2D first**
- **Worker-based simulation**
- **React UI**
- **Optional R3F visual upgrade later**

This gives you the best balance of:
- performance
- iteration speed
- clean architecture
- future visual flexibility
