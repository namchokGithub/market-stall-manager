# Market Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Market Map page — an interactive, pannable/zoomable market layout with View Mode (read-only) and Edit Mode (select/drag/add/delete/undo/redo/save/cancel), backed entirely by in-memory React state.

**Architecture:** A Vite + React + TS SPA. `MarketMapPage` owns `savedLayout` (View Mode source of truth) plus a `useMapHistory` hook whose `present` value acts as `draftLayout` while in Edit Mode. `MapCanvas` (react-konva `Stage`/`Layer`) is a controlled, mode-agnostic canvas driven entirely by props/callbacks; `Toolbar` is a dumb button row driven by props. No backend, no persistence beyond session state.

**Tech Stack:** React + TypeScript, Vite, pnpm, Tailwind CSS, shadcn/ui, lucide-react, konva + react-konva.

**Spec:** `docs/superpowers/specs/2026-08-15-market-map-design.md`

## Global Constraints

- Package manager is `pnpm` for every install/run command — never `npm`/`yarn`.
- Icons come only from `lucide-react`. No emoji anywhere in UI.
- No backend, no API calls, no database, no Firebase, no auth this iteration.
- No stall resize or rotate — `width`/`height` are fixed at creation.
- Toolbar button order is fixed: `Market Map | View/Edit toggle | Undo | Redo | Add Stall | Delete | Zoom− | 100% | Zoom+ | Reset View | Save | Cancel`.
- `Stall` shape is exactly: `{ id: string; code: string; x: number; y: number; width: number; height: number }`.
- **No automated test framework this iteration** (per spec). Every task's "verify" step is: `pnpm typecheck` (must pass with zero errors) + a manual `pnpm dev` browser check described in the task. Do not add Vitest/Jest/Playwright — that would be scope creep.

---

### Task 1: Project scaffold (Vite + React + TS + Tailwind + pnpm)

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working `pnpm dev` dev server rendering `App` at `src/App.tsx`, Tailwind utility classes available, `pnpm typecheck` script, `@/*` path alias resolving to `src/*` (needed by shadcn/ui in Task 4).

The repo already has `.gitignore`, `LICENSE`, `.git` — do not overwrite or remove them.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "market-stall-manager",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Write `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 5: Write `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Market Stall Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Write `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 9: Write `src/App.tsx`**

```tsx
function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <h1 className="text-2xl font-semibold text-slate-800">Market Map</h1>
    </div>
  )
}

export default App
```

- [ ] **Step 10: Install dependencies**

Run:
```bash
pnpm add react react-dom
pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss postcss autoprefixer
```

- [ ] **Step 11: Verify**

Run: `pnpm typecheck` — expect zero errors.
Run: `pnpm dev`, open the printed local URL. Expect a centered "Market Map" heading on a light gray background, styled with Tailwind (proves Tailwind is wired up). Stop the dev server.

- [ ] **Step 12: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts tsconfig.json tailwind.config.js postcss.config.js index.html src/main.tsx src/App.tsx src/index.css
git commit -m "chore: scaffold Vite + React + TS + Tailwind project"
```

---

### Task 2: Stall model + mock data

**Files:**
- Create: `src/types/stall.ts`
- Create: `src/data/mockStalls.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Stall` type (used by every later task), `mockStalls: Stall[]` (18 stalls), `ROW_CAPACITY: number`, `nextStallCode(stalls: Stall[], rowCapacity?: number): string` (used by Task 4's Add Stall handler).

- [ ] **Step 1: Write `src/types/stall.ts`**

```ts
export interface Stall {
  id: string
  code: string
  x: number
  y: number
  width: number
  height: number
}
```

- [ ] **Step 2: Write `src/data/mockStalls.ts`**

3 rows (A, B, C) of 6 stalls each, 120x100px, 20px gaps, 18 stalls total:

```ts
import type { Stall } from '../types/stall'

export const ROW_CAPACITY = 6

const STALL_WIDTH = 120
const STALL_HEIGHT = 100
const GAP_X = 20
const GAP_Y = 80
const ORIGIN_X = 40
const ORIGIN_Y = 40

function buildRow(prefix: string, rowIndex: number): Stall[] {
  return Array.from({ length: ROW_CAPACITY }, (_, i) => {
    const code = `${prefix}${String(i + 1).padStart(2, '0')}`
    return {
      id: code.toLowerCase(),
      code,
      x: ORIGIN_X + i * (STALL_WIDTH + GAP_X),
      y: ORIGIN_Y + rowIndex * (STALL_HEIGHT + GAP_Y),
      width: STALL_WIDTH,
      height: STALL_HEIGHT,
    }
  })
}

export const mockStalls: Stall[] = [
  ...buildRow('A', 0),
  ...buildRow('B', 1),
  ...buildRow('C', 2),
]

export function nextStallCode(stalls: Stall[], rowCapacity: number = ROW_CAPACITY): string {
  if (stalls.length === 0) return 'A01'
  const prefixes = stalls.map((s) => s.code.charAt(0))
  const lastPrefix = [...prefixes].sort().at(-1) as string
  const numbersInPrefix = stalls
    .filter((s) => s.code.charAt(0) === lastPrefix)
    .map((s) => parseInt(s.code.slice(1), 10))
  const maxNumber = Math.max(...numbersInPrefix)
  if (maxNumber >= rowCapacity) {
    const nextPrefix = String.fromCharCode(lastPrefix.charCodeAt(0) + 1)
    return `${nextPrefix}01`
  }
  return `${lastPrefix}${String(maxNumber + 1).padStart(2, '0')}`
}
```

This produces exactly: `A01..A06, B01..B06, C01..C06` (18 stalls). `nextStallCode(mockStalls)` returns `'D01'`.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck` — expect zero errors.
Manually confirm by reading the file: 18 stalls, codes `A01`-`A06`, `B01`-`B06`, `C01`-`C06`, no duplicate `id`/`code` values, all `width`/`height` equal 120/100.

- [ ] **Step 4: Commit**

```bash
git add src/types/stall.ts src/data/mockStalls.ts
git commit -m "feat: add Stall type and mock market layout data"
```

---

### Task 3: MapCanvas + StallShape (pan, zoom, select, drag mechanics)

**Files:**
- Create: `src/components/market-map/StallShape.tsx`
- Create: `src/components/market-map/MapCanvas.tsx`
- Modify: `src/App.tsx` (temporary manual-test harness, replaced in Task 4)

**Interfaces:**
- Consumes: `Stall` from `src/types/stall.ts`, `mockStalls` from `src/data/mockStalls.ts` (harness only).
- Produces:
  - `StallShape` props: `{ stall: Stall; selected: boolean; draggable: boolean; onSelect: () => void; onDragStart: () => void; onDragEnd: (x: number, y: number) => void }`.
  - `MapCanvas` (forwardRef) props: `{ stalls: Stall[]; editable: boolean; selectedId: string | null; onSelect: (id: string | null) => void; onStallDragEnd: (id: string, x: number, y: number) => void; onScaleChange: (scalePercent: number) => void }`.
  - `MapCanvasHandle` (exported type): `{ zoomIn: () => void; zoomOut: () => void; resetView: () => void }` — consumed by Task 4's `Toolbar` wiring.

This task is mode-agnostic: `MapCanvas` has no concept of "view"/"edit", only `editable: boolean`. `MarketMapPage` (Task 4) decides what that boolean is.

- [ ] **Step 1: Install konva + react-konva**

Run: `pnpm add konva react-konva`

- [ ] **Step 2: Write `src/components/market-map/StallShape.tsx`**

```tsx
import { Group, Rect, Text } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { Stall } from '../../types/stall'

interface StallShapeProps {
  stall: Stall
  selected: boolean
  draggable: boolean
  onSelect: () => void
  onDragStart: () => void
  onDragEnd: (x: number, y: number) => void
}

export function StallShape({
  stall,
  selected,
  draggable,
  onSelect,
  onDragStart,
  onDragEnd,
}: StallShapeProps) {
  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    onDragEnd(e.target.x(), e.target.y())
  }

  return (
    <Group
      x={stall.x}
      y={stall.y}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
    >
      <Rect
        width={stall.width}
        height={stall.height}
        fill={selected ? '#dbeafe' : '#ffffff'}
        stroke={selected ? '#2563eb' : '#94a3b8'}
        strokeWidth={selected ? 3 : 1}
        cornerRadius={4}
      />
      <Text
        text={stall.code}
        width={stall.width}
        height={stall.height}
        align="center"
        verticalAlign="middle"
        fontSize={16}
        fontStyle="600"
        fill="#1e293b"
        listening={false}
      />
    </Group>
  )
}
```

- [ ] **Step 3: Write `src/components/market-map/MapCanvas.tsx`**

```tsx
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { Stall } from '../../types/stall'
import { StallShape } from './StallShape'

const MIN_SCALE = 0.3
const MAX_SCALE = 3
const ZOOM_STEP = 1.1

export interface MapCanvasHandle {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

interface MapCanvasProps {
  stalls: Stall[]
  editable: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
  onStallDragEnd: (id: string, x: number, y: number) => void
  onScaleChange: (scalePercent: number) => void
}

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvas(
  { stalls, editable, selectedId, onSelect, onStallDragEnd, onScaleChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [draggingStallId, setDraggingStallId] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const applyScale = (nextScale: number, focal?: { x: number; y: number }) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale))
    const center = focal ?? { x: size.width / 2, y: size.height / 2 }
    const mousePointTo = {
      x: (center.x - stagePos.x) / scale,
      y: (center.y - stagePos.y) / scale,
    }
    setStagePos({
      x: center.x - mousePointTo.x * clamped,
      y: center.y - mousePointTo.y * clamped,
    })
    setScale(clamped)
    onScaleChange(Math.round(clamped * 100))
  }

  useImperativeHandle(ref, () => ({
    zoomIn: () => applyScale(scale * ZOOM_STEP),
    zoomOut: () => applyScale(scale / ZOOM_STEP),
    resetView: () => {
      setScale(1)
      setStagePos({ x: 0, y: 0 })
      onScaleChange(100)
    },
  }))

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const direction = e.evt.deltaY > 0 ? -1 : 1
    applyScale(direction > 0 ? scale * ZOOM_STEP : scale / ZOOM_STEP, pointer)
  }

  const handleStageDragEnd = (e: KonvaEventObject<DragEvent>) => {
    if (e.target !== e.target.getStage()) return
    setStagePos({ x: e.target.x(), y: e.target.y() })
  }

  const draggingStall = stalls.find((s) => s.id === draggingStallId) ?? null

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-100">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={draggingStallId === null}
        onWheel={handleWheel}
        onDragEnd={handleStageDragEnd}
        onClick={(e) => {
          if (e.target === e.target.getStage()) onSelect(null)
        }}
      >
        <Layer>
          {stalls
            .filter((s) => s.id !== draggingStallId)
            .map((stall) => (
              <StallShape
                key={stall.id}
                stall={stall}
                selected={stall.id === selectedId}
                draggable={editable}
                onSelect={() => onSelect(stall.id)}
                onDragStart={() => setDraggingStallId(stall.id)}
                onDragEnd={(x, y) => {
                  setDraggingStallId(null)
                  onStallDragEnd(stall.id, x, y)
                }}
              />
            ))}
        </Layer>
        <Layer>
          {draggingStall && (
            <StallShape
              stall={draggingStall}
              selected={draggingStall.id === selectedId}
              draggable={editable}
              onSelect={() => onSelect(draggingStall.id)}
              onDragStart={() => setDraggingStallId(draggingStall.id)}
              onDragEnd={(x, y) => {
                setDraggingStallId(null)
                onStallDragEnd(draggingStall.id, x, y)
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
})
```

The second `Layer` renders only the stall currently being dragged, so it always paints above the first `Layer` — this is the "dragged stall shows above others" requirement.

- [ ] **Step 4: Temporarily wire up `src/App.tsx` for manual testing**

Replace its full contents with:

```tsx
import { useState } from 'react'
import { MapCanvas } from './components/market-map/MapCanvas'
import { mockStalls } from './data/mockStalls'

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="h-screen w-screen">
      <MapCanvas
        stalls={mockStalls}
        editable={true}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onStallDragEnd={() => {}}
        onScaleChange={() => {}}
      />
    </div>
  )
}

export default App
```

- [ ] **Step 5: Verify**

Run: `pnpm typecheck` — expect zero errors.
Run: `pnpm dev`, open the browser. Confirm:
- All 18 stalls render in a 3-row grid, each showing its code (`A01`..`C06`).
- Dragging empty canvas space pans the whole map.
- Mouse wheel zooms in/out centered on the cursor.
- Clicking a stall selects it (blue highlight); clicking empty space deselects.
- Dragging a stall moves it and it visually stays above the others while dragging.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/components/market-map/StallShape.tsx src/components/market-map/MapCanvas.tsx src/App.tsx
git commit -m "feat: add pannable/zoomable MapCanvas with selectable, draggable stalls"
```

---

### Task 4: MarketMapPage + Toolbar (mode toggle, select/drag/add/delete/undo/redo, zoom controls)

**Files:**
- Create: `src/state/useMapHistory.ts`
- Create: `src/components/market-map/Toolbar.tsx`
- Create: `src/components/market-map/MarketMapPage.tsx`
- Modify: `src/App.tsx` (replace Task 3's harness)

**Interfaces:**
- Consumes: `Stall`, `mockStalls`, `nextStallCode`, `ROW_CAPACITY` (Task 2); `MapCanvas`, `MapCanvasHandle`, `StallShape` (Task 3).
- Produces: `useMapHistory(initial: Stall[])` returning `{ present: Stall[]; canUndo: boolean; canRedo: boolean; commit: (next: Stall[]) => void; undo: () => void; redo: () => void; reset: (next: Stall[]) => void }` — used by Task 5's Save/Cancel wiring. `Toolbar` props (see below) — extended by Task 5 with `onSave`/`onCancel`. `MarketMapPage` — the page component `App` renders.

Save/Cancel are intentionally not part of this task — the toggle button only enters Edit Mode here, and there is no way back to View Mode yet via the UI (reload the page to reset while testing). Task 5 closes that loop. Every button that IS rendered in this task is fully functional — no dead buttons.

- [ ] **Step 1: Install shadcn/ui + lucide-react**

Run: `pnpm dlx shadcn@latest init -d` (non-interactive, accepts defaults — it will add `src/lib/utils.ts`, a `components.json`, and update `tailwind.config.js`/`src/index.css` with its CSS variables; accept its changes).
Run: `pnpm dlx shadcn@latest add button`
Run: `pnpm add lucide-react`

- [ ] **Step 2: Write `src/state/useMapHistory.ts`**

```ts
import { useCallback, useState } from 'react'
import type { Stall } from '../types/stall'

interface MapHistoryState {
  past: Stall[][]
  present: Stall[]
  future: Stall[][]
}

export interface UseMapHistoryResult {
  present: Stall[]
  canUndo: boolean
  canRedo: boolean
  commit: (next: Stall[]) => void
  undo: () => void
  redo: () => void
  reset: (next: Stall[]) => void
}

export function useMapHistory(initial: Stall[]): UseMapHistoryResult {
  const [state, setState] = useState<MapHistoryState>({
    past: [],
    present: initial,
    future: [],
  })

  const commit = useCallback((next: Stall[]) => {
    setState((prev) => ({ past: [...prev.past, prev.present], present: next, future: [] }))
  }, [])

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev
      const previous = prev.past[prev.past.length - 1]
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev
      const next = prev.future[0]
      return { past: [...prev.past, prev.present], present: next, future: prev.future.slice(1) }
    })
  }, [])

  const reset = useCallback((next: Stall[]) => {
    setState({ past: [], present: next, future: [] })
  }, [])

  return {
    present: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    commit,
    undo,
    redo,
    reset,
  }
}
```

- [ ] **Step 3: Write `src/components/market-map/Toolbar.tsx`**

```tsx
import { Eye, Pencil, Undo2, Redo2, Plus, Trash2, ZoomOut, ZoomIn, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ToolbarProps {
  mode: 'view' | 'edit'
  zoomPercent: number
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  onEnterEdit: () => void
  onUndo: () => void
  onRedo: () => void
  onAddStall: () => void
  onDeleteStall: () => void
  onZoomOut: () => void
  onZoomIn: () => void
  onResetView: () => void
}

export function Toolbar({
  mode,
  zoomPercent,
  canUndo,
  canRedo,
  hasSelection,
  onEnterEdit,
  onUndo,
  onRedo,
  onAddStall,
  onDeleteStall,
  onZoomOut,
  onZoomIn,
  onResetView,
}: ToolbarProps) {
  const isEdit = mode === 'edit'

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
      <span className="mr-2 font-semibold text-slate-800">Market Map</span>

      <Button variant="outline" size="sm" disabled={isEdit} onClick={onEnterEdit}>
        {isEdit ? <Eye className="mr-1 h-4 w-4" /> : <Pencil className="mr-1 h-4 w-4" />}
        Edit Mode
      </Button>

      <Button variant="ghost" size="icon" disabled={!isEdit || !canUndo} onClick={onUndo} aria-label="Undo">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled={!isEdit || !canRedo} onClick={onRedo} aria-label="Redo">
        <Redo2 className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" disabled={!isEdit} onClick={onAddStall} aria-label="Add Stall">
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!isEdit || !hasSelection}
        onClick={onDeleteStall}
        aria-label="Delete Stall"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="mx-2 h-6 w-px bg-slate-200" />

      <Button variant="ghost" size="icon" onClick={onZoomOut} aria-label="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center text-sm text-slate-600">{zoomPercent}%</span>
      <Button variant="ghost" size="icon" onClick={onZoomIn} aria-label="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onResetView} aria-label="Reset view">
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/market-map/MarketMapPage.tsx`**

```tsx
import { useRef, useState } from 'react'
import { MapCanvas, type MapCanvasHandle } from './MapCanvas'
import { Toolbar } from './Toolbar'
import { useMapHistory } from '../../state/useMapHistory'
import { mockStalls, nextStallCode } from '../../data/mockStalls'
import type { Stall } from '../../types/stall'

const NEW_STALL_SIZE = { width: 120, height: 100 }
const NEW_STALL_ANCHOR = { x: 40, y: 460 }

export function MarketMapPage() {
  const [savedLayout, setSavedLayout] = useState<Stall[]>(mockStalls)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoomPercent, setZoomPercent] = useState(100)
  const history = useMapHistory(savedLayout)
  const canvasRef = useRef<MapCanvasHandle>(null)

  const draftLayout = history.present
  const stalls = mode === 'edit' ? draftLayout : savedLayout

  const handleEnterEdit = () => {
    history.reset(savedLayout)
    setSelectedId(null)
    setMode('edit')
  }

  const handleAddStall = () => {
    const code = nextStallCode(draftLayout)
    const newStall: Stall = {
      id: code.toLowerCase(),
      code,
      x: NEW_STALL_ANCHOR.x,
      y: NEW_STALL_ANCHOR.y,
      ...NEW_STALL_SIZE,
    }
    history.commit([...draftLayout, newStall])
    setSelectedId(newStall.id)
  }

  const handleDeleteStall = () => {
    if (!selectedId) return
    history.commit(draftLayout.filter((s) => s.id !== selectedId))
    setSelectedId(null)
  }

  const handleStallDragEnd = (id: string, x: number, y: number) => {
    history.commit(draftLayout.map((s) => (s.id === id ? { ...s, x, y } : s)))
  }

  return (
    <div className="flex h-screen w-screen flex-col">
      <Toolbar
        mode={mode}
        zoomPercent={zoomPercent}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        hasSelection={selectedId !== null}
        onEnterEdit={handleEnterEdit}
        onUndo={history.undo}
        onRedo={history.redo}
        onAddStall={handleAddStall}
        onDeleteStall={handleDeleteStall}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onResetView={() => canvasRef.current?.resetView()}
      />
      <div className="flex-1">
        <MapCanvas
          ref={canvasRef}
          stalls={stalls}
          editable={mode === 'edit'}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onStallDragEnd={handleStallDragEnd}
          onScaleChange={setZoomPercent}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Replace `src/App.tsx`**

```tsx
import { MarketMapPage } from './components/market-map/MarketMapPage'

function App() {
  return <MarketMapPage />
}

export default App
```

- [ ] **Step 6: Verify**

Run: `pnpm typecheck` — expect zero errors.
Run: `pnpm dev`, open the browser. Confirm:
- Toolbar shows: `Market Map`, `Edit Mode` button, Undo, Redo, Add Stall, Delete, Zoom−, `100%`, Zoom+, Reset View — in that order.
- In View Mode: Undo/Redo/Add Stall/Delete are disabled (grayed, unclickable); stalls are not draggable.
- Click `Edit Mode`: button becomes disabled, stalls become draggable/selectable.
- Select a stall: Delete enables. Drag it: it moves, releases at the new spot, Undo enables.
- Click Undo: stall returns to its previous position, Redo enables. Click Redo: stall moves back.
- Click Add Stall: a new stall labeled `D01` appears at a fixed spot, auto-selected; Delete works on it.
- Zoom−/Zoom+/Reset View all work as in Task 3, in both modes.
- Reload the page to get back to a clean View Mode (Save/Cancel land in Task 5).

Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/state/useMapHistory.ts src/components/market-map/Toolbar.tsx src/components/market-map/MarketMapPage.tsx src/App.tsx components.json src/lib/utils.ts tailwind.config.js src/index.css package.json pnpm-lock.yaml src/components/ui
git commit -m "feat: wire up MarketMapPage with edit mode, select/drag/add/delete/undo/redo"
```

---

### Task 5: Save Layout + Cancel Edit

**Files:**
- Modify: `src/components/market-map/Toolbar.tsx` (add `Save`/`Cancel` buttons + props, final button order)
- Modify: `src/components/market-map/MarketMapPage.tsx` (add save/cancel handlers)

**Interfaces:**
- Consumes: everything from Task 4.
- Produces: complete `ToolbarProps` (adds `onSave: () => void; onCancel: () => void`) and a fully closed Edit Mode loop — nothing later depends on new exports beyond this.

- [ ] **Step 1: Update `src/components/market-map/Toolbar.tsx`**

Add `Save` and `X` to the lucide-react import, add two props, and append the buttons after Reset View (this is the final, exact toolbar order from the spec). Replace the full file contents with:

```tsx
import {
  Eye,
  Pencil,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  ZoomOut,
  ZoomIn,
  Maximize,
  Save,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ToolbarProps {
  mode: 'view' | 'edit'
  zoomPercent: number
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  onEnterEdit: () => void
  onUndo: () => void
  onRedo: () => void
  onAddStall: () => void
  onDeleteStall: () => void
  onZoomOut: () => void
  onZoomIn: () => void
  onResetView: () => void
  onSave: () => void
  onCancel: () => void
}

export function Toolbar({
  mode,
  zoomPercent,
  canUndo,
  canRedo,
  hasSelection,
  onEnterEdit,
  onUndo,
  onRedo,
  onAddStall,
  onDeleteStall,
  onZoomOut,
  onZoomIn,
  onResetView,
  onSave,
  onCancel,
}: ToolbarProps) {
  const isEdit = mode === 'edit'

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
      <span className="mr-2 font-semibold text-slate-800">Market Map</span>

      <Button variant="outline" size="sm" disabled={isEdit} onClick={onEnterEdit}>
        {isEdit ? <Eye className="mr-1 h-4 w-4" /> : <Pencil className="mr-1 h-4 w-4" />}
        Edit Mode
      </Button>

      <Button variant="ghost" size="icon" disabled={!isEdit || !canUndo} onClick={onUndo} aria-label="Undo">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" disabled={!isEdit || !canRedo} onClick={onRedo} aria-label="Redo">
        <Redo2 className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" disabled={!isEdit} onClick={onAddStall} aria-label="Add Stall">
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!isEdit || !hasSelection}
        onClick={onDeleteStall}
        aria-label="Delete Stall"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="mx-2 h-6 w-px bg-slate-200" />

      <Button variant="ghost" size="icon" onClick={onZoomOut} aria-label="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center text-sm text-slate-600">{zoomPercent}%</span>
      <Button variant="ghost" size="icon" onClick={onZoomIn} aria-label="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onResetView} aria-label="Reset view">
        <Maximize className="h-4 w-4" />
      </Button>

      <div className="mx-2 h-6 w-px bg-slate-200" />

      <Button variant="default" size="sm" disabled={!isEdit} onClick={onSave}>
        <Save className="mr-1 h-4 w-4" />
        Save
      </Button>
      <Button variant="outline" size="sm" disabled={!isEdit} onClick={onCancel}>
        <X className="mr-1 h-4 w-4" />
        Cancel
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Update `src/components/market-map/MarketMapPage.tsx`**

Add these two handlers (place them after `handleStallDragEnd`):

```tsx
  const handleSave = () => {
    setSavedLayout(draftLayout)
    console.log(JSON.stringify(draftLayout, null, 2))
    setSelectedId(null)
    setMode('view')
  }

  const handleCancel = () => {
    setSelectedId(null)
    setMode('view')
  }
```

And pass them to `Toolbar`, updating its JSX to:

```tsx
      <Toolbar
        mode={mode}
        zoomPercent={zoomPercent}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        hasSelection={selectedId !== null}
        onEnterEdit={handleEnterEdit}
        onUndo={history.undo}
        onRedo={history.redo}
        onAddStall={handleAddStall}
        onDeleteStall={handleDeleteStall}
        onZoomOut={() => canvasRef.current?.zoomOut()}
        onZoomIn={() => canvasRef.current?.zoomIn()}
        onResetView={() => canvasRef.current?.resetView()}
        onSave={handleSave}
        onCancel={handleCancel}
      />
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck` — expect zero errors.
Run: `pnpm dev`, open the browser, open the devtools console. Confirm the full golden path:
- Enter Edit Mode, drag a stall to a new spot, click **Save**: mode returns to View Mode, the stall stays at its new spot, and the console shows the pretty-printed JSON array of all 18 (or more) stalls.
- Enter Edit Mode again, drag a stall, click **Cancel**: mode returns to View Mode and the stall is back at its pre-edit position (the drag was discarded).
- Enter Edit Mode, add a stall, delete a different stall, undo twice, redo once, then Save — confirm the final on-screen state matches what's logged to the console.
- Confirm Save/Cancel are disabled in View Mode.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/market-map/Toolbar.tsx src/components/market-map/MarketMapPage.tsx
git commit -m "feat: wire up Save Layout and Cancel Edit"
```

---

### Task 6: Documentation

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: nothing (documents the finished feature).
- Produces: nothing consumed by other tasks — this is the last task.

- [ ] **Step 1: Write `README.md`**

```markdown
# Market Stall Manager

Interactive Market Map for a market-stall management system. This
iteration covers layout creation and editing only — no booking, no
vendor, no payment, no backend.

## Tech Stack

- React + TypeScript
- Vite
- pnpm
- Tailwind CSS
- shadcn/ui
- lucide-react (all icons — no emoji)
- konva / react-konva (canvas rendering)

State is entirely in-memory React state for this iteration. There is
no backend, no API, no database, and no Firebase connection yet — a
future iteration is expected to add Firebase as the persistence layer,
which is why the layout data is kept as plain JSON (`Stall[]`).

## Running locally

```bash
pnpm install
pnpm dev
```

Type-check only (no automated test suite in this iteration):

```bash
pnpm typecheck
```

## Stall model

```ts
interface Stall {
  id: string;
  code: string;   // e.g. "A01", "A02", "B01"
  x: number;
  y: number;
  width: number;
  height: number;
}
```

Mock data (18 stalls across rows A/B/C) lives in
`src/data/mockStalls.ts`, alongside `nextStallCode`, which computes the
next stall code when adding a new stall.

## Market Map page

`src/components/market-map/`:

- `MarketMapPage.tsx` — owns `savedLayout` (View Mode's source of
  truth) and a `useMapHistory` (`src/state/useMapHistory.ts`) instance
  whose `present` value is the Edit Mode working copy (`draftLayout`).
- `Toolbar.tsx` — the button row (mode toggle, undo/redo, add/delete,
  zoom controls, save/cancel), fully controlled by props.
- `MapCanvas.tsx` — react-konva `Stage`/`Layer`: pan, zoom, select,
  drag. Mode-agnostic (`editable: boolean`); the actively-dragged
  stall renders on its own top `Layer` so it stays visually above the
  rest.
- `StallShape.tsx` — a single stall (`Rect` + code `Text`).

**View Mode:** pan, zoom, see all stalls and their codes. Stalls are
not draggable. An "Edit Mode" button enters Edit Mode.

**Edit Mode:** select a stall, drag to reposition, add a stall,
delete the selected stall, undo/redo, then either **Save** (commits
the draft as the new saved layout and `console.log`s the layout JSON)
or **Cancel** (discards the draft, reverting to the last saved
layout).

## Current scope / non-scope

In scope: Market Map view/edit, pan, zoom, select, drag, add/delete
stall, undo/redo, save/cancel.

Explicitly not built yet (future sub-projects, each to get its own
brainstorm → spec → plan cycle): Booking, Vendor, Payment, Dashboard,
stall resize/rotate, Authentication, API integration, Database,
Firebase connection.

## Design docs

- `docs/superpowers/specs/2026-08-15-market-map-design.md`
- `docs/superpowers/plans/2026-08-15-market-map.md`
```

- [ ] **Step 2: Verify**

Read the file back and confirm every code reference (`MarketMapPage.tsx`, `useMapHistory.ts`, `mockStalls.ts`, `nextStallCode`) matches the actual files created in Tasks 1-5.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add README covering Market Map scope, stack, and structure"
```
