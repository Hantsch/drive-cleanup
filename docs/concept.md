# Concept – Drive Cleanup (Working title: "DriveLens")

> Status: Draft · As of: 2026-06-14 · Phase: Concept (pre-implementation)
> License: GPL-3.0 (see [LICENSE](../LICENSE))

An easy-to-install Windows desktop tool that scans the hard drive and clearly
shows **where and how much disk space is being used** – by category (videos,
images, installers, cache, …) and, for drilling in, by folder.
Goal: quickly identify what eats up space, in order to clean up in a targeted
way later.

---

## 1. Goals & Scope

### Goal of the App

Create transparency about disk space usage. The user selects a drive or a
folder, the app scans, aggregates and visualizes the result so that
"space hogs" are visible at a glance.

### In-Scope (Version 1 – "Analysis only")

- Select and scan a drive **or** a folder
- Live progress during the scan (responsive UI, no freezing)
- **Category overview** with bars (size, share %, file count per category)
- **Detail view**: largest folders / largest files, drill-down into the folder tree
- Sorting & filtering in the detail list
- Keep scan result in memory; optionally export as a file (JSON/CSV)

### Deliberately **not** in v1 (coming later)

- **Deleting / cleaning up** files (read-only analysis only in v1)
- Duplicate detection
- Scheduled/automatic scans
- Cloud, telemetry, account

> Rationale: First build trust in scanning & display. Deleting is
> safety-critical and gets its own, secured phase (see
> [Roadmap](#10-roadmap--phases)).

### Non-Goals (permanent)

- No disk "optimizer", no registry-cleaner gimmicks
- No hidden system interventions

---

## 2. Audience & Distribution

- **Open-source tool** under GPL-3.0. Distributed via the Git repository.
- **No ready-made signed installers** in v1. Everyone installs themselves via
  repo checkout. To keep this simple, there is a **setup script** and clear
  npm scripts (see [Section 9](#9-installation--setup)).
- Optionally, `electron-builder` can locally produce a portable build / NSIS
  installer – for people who don't want to use the console. Not mandatory
  for v1.

---

## 3. Tech Stack

| Area                 | Choice                                         | Rationale                                                   |
| -------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| Runtime / Shell      | **Electron**                                   | Requested by the user; native file/OS access + web UI       |
| Language             | **TypeScript** (strict)                        | Type safety across process boundaries (IPC)                 |
| UI framework         | **React**                                      | Largest ecosystem, many components                          |
| Styling              | **Tailwind CSS**                               | Fast, consistent, "pretty" UI                               |
| UI components        | **shadcn/ui** (Radix + Tailwind)               | Clean, accessible building blocks without a heavy framework |
| Build / dev server   | **electron-vite**                              | Fast HMR, clean TS setup for main/preload/renderer          |
| Packaging (opt.)     | **electron-builder**                           | Portable build / NSIS installer when needed                 |
| Charts/visualization | Custom bars (Tailwind) + optional **D3** later | Bars need barely any lib; treemap only later                |
| State (renderer)     | **Zustand** (lightweight)                      | Simpler than Redux, enough for this scope                   |
| Tests                | **Vitest** (+ possibly Playwright later)       | Fast, fits with Vite                                        |
| Lint/format          | ESLint + Prettier                              | Consistency in the open-source project                      |

> Node version: current LTS (e.g. Node 20+). Checked in the setup script.

---

## 4. Architecture

Electron has multiple processes. Important for a smooth UI: **the scan must not
block the renderer/UI thread.**

```
┌─────────────────────────────────────────────────────────────┐
│  Main process (Node)                                         │
│  - Window management, app lifecycle                          │
│  - Starts/stops scan worker                                  │
│  - Mediates IPC between renderer and worker                  │
│  - File dialogs (select drive/folder)                        │
└───────────────┬──────────────────────────┬──────────────────┘
                │ IPC (progress/result)     │ spawn / messages
                │                            ▼
┌───────────────▼───────────┐   ┌────────────────────────────────┐
│  Renderer (React + Tailwind)│   │  Scan worker (utilityProcess)  │
│  - UI, charts, lists       │   │  - Recursive file system walk   │
│  - Zustand state           │   │  - Size/category aggregation    │
│  - No direct FS access     │   │  - Progress events              │
└────────────────────────────┘   └────────────────────────────────┘
        ▲  contextBridge (preload, secure)
```

**Rationale for process separation**

- **Scan worker** as a `utilityProcess` (or `worker_threads`): the CPU/IO-intensive
  walk runs isolated, the UI stays smooth. On a crash (e.g. an exotic path) it
  doesn't take down the whole window.
- **Renderer** only receives finished, aggregated data and progress – never
  direct file system access.

**Security (Electron best practices)**

- `contextIsolation: true`, `nodeIntegration: false`
- A narrow, typed API via a **preload script** through `contextBridge`
  (e.g. `window.api.scan.start(path)`, `onProgress`, `onDone`)
- Renderer only loads local content; no remote URLs

---

## 5. Scan Engine

### Approach (v1)

A classic recursive walk with `fs.opendir` / `readdir({ withFileTypes: true })`
and controlled concurrency (a limited number of simultaneous directories, so
IO doesn't get overwhelmed).

For each entry it records: path, size (`stat`/`lstat`), type (file/folder),
category (from extension/path), last modified (for later "old & large" filters).

### Important Windows special cases (must be handled cleanly)

- **Permissions:** system folders / locked files → catch errors, skip them,
  report them at the end as "inaccessible" (don't crash).
- **Reparse points / junctions / symlinks:** detect with `lstat`, do **not**
  descend into them or count them twice → prevents infinite loops & inflated
  numbers.
- **Hard links:** can count size multiple times; accepted and documented in v1.
  (Exact handling via NTFS data is a phase-2 topic.)
- **Long paths** (> 260 characters): account for the `\\?\` prefix.
- **Allocated vs. logical size:** v1 uses the logical file size. Note in the UI
  that compression/cluster size may differ.

### Performance note (optimization for later)

Tools like WizTree read the **NTFS MFT** (Master File Table) directly → extremely
fast, but complex and requires admin rights. Deliberately **not** for v1.
A recursive walk is slower, but simple, robust and usable without admin.
MFT reading is noted as a later speed-up.

### Progress

The worker reports throttled (e.g. every 200 ms) interim states:
scanned files/folders, size summed so far, current path. So the user
immediately sees that something is happening, even on large drives.

---

## 6. Categorization

Each file is assigned to a category – primarily via the extension, for
cache/temp additionally via the path.

| Category         | Examples (extensions / paths)                |
| ---------------- | -------------------------------------------- |
| 🎬 Videos        | mp4, mkv, mov, avi, webm                     |
| 🖼️ Images        | jpg, png, gif, heic, raw, psd                |
| 🎵 Audio         | mp3, flac, wav, m4a                          |
| 📄 Documents     | pdf, docx, xlsx, pptx, txt, md               |
| 📦 Archives      | zip, rar, 7z, tar, gz                        |
| ⬇️ Installers    | exe, msi, msix, appx                         |
| 💾 Disk images   | iso, vhd, vmdk, img                          |
| 🗄️ Databases     | db, sqlite, mdf                              |
| 👨‍💻 Code/projects | node_modules, .git, build folders, src files |
| 🧹 Cache/temp    | %TEMP%, AppData\…\Cache, _.tmp, _.log        |
| ⚙️ System        | Windows, ProgramData paths                   |
| ❓ Other         | everything without a match                   |

The mapping lives centrally in a config (`src/shared/categories.ts`) so it's
easily extensible. Cache/temp is intentionally its own category, because that's
typically "safely cleanable" data (relevant for the later cleanup phase).

---

## 7. UI / UX Concept

### Screens

1. **Start / selection** – drive list (with free/used space) + "select folder"
   button. Big "Scan" button.
2. **Scan running** – progress (spinner/bar), live counters, current path,
   "Cancel".
3. **Result** – split in two:
   - **Top: category overview** (bars, the primary entry point)
   - **Bottom/right: detail list** (largest folders/files, drill-down)

### Result view (ASCII mockup)

```
┌──────────────────────────────────────────────────────────────────┐
│  C:\   •   932 GB used of 1 TB           [ Rescan ]      [Export] │
├──────────────────────────────────────────────────────────────────┤
│  By category                                                     │
│  🎬 Videos      ███████████████████░░░░░░░░  412 GB  44%  1,203   │
│  📦 Archives    ████████░░░░░░░░░░░░░░░░░░░░  168 GB  18%    340   │
│  ⬇️ Installers  █████░░░░░░░░░░░░░░░░░░░░░░░   96 GB  10%    512   │
│  🧹 Cache/temp  ████░░░░░░░░░░░░░░░░░░░░░░░░   71 GB   8%  88,901  │
│  🖼️ Images      ███░░░░░░░░░░░░░░░░░░░░░░░░░   54 GB   6%  12,400  │
│  ❓ Other       ██░░░░░░░░░░░░░░░░░░░░░░░░░░   33 GB   4%   …       │
├──────────────────────────────────────────────────────────────────┤
│  Detail   [ Largest folders ▾ ]   [ Filter: all categories ▾ ]   │
│  ▸ C:\Users\me\Videos                         310 GB              │
│  ▸ C:\Users\me\Downloads                      142 GB              │
│  ▾ C:\Users\me\AppData\Local                   68 GB              │
│      └ …\Temp                                   41 GB             │
│      └ …\Packages                               19 GB             │
│  ▸ C:\ProgramData                              22 GB              │
└──────────────────────────────────────────────────────────────────┘
```

### Design principles

- **Category bars first** – a quick overview of what the space hogs are.
- **Drill-down** in the detail list: from folder to subfolder to file.
- Clicking a category **filters** the detail list to that category.
- "Open in Explorer" per entry (prepares the later cleanup).
- Dark & light theme, clear typography, subtle category colors.

### Open UX question (intentionally flagged)

You were still unsure about the detail list. Suggestion: **folder-tree drill-down
as default** + toggleable to **"Top 100 largest files"** (flat list). A
**treemap** can be added later as a third view. → see
[Open points](#11-open-points--to-decide).

---

## 8. Data Model (draft)

```ts
// Aggregated node in the folder tree
interface ScanNode {
  name: string
  path: string
  type: 'dir' | 'file'
  sizeBytes: number // for folders: recursively aggregated
  fileCount: number // for folders: recursive
  category?: Category // set for files
  mtimeMs?: number
  children?: ScanNode[] // only for folders; possibly lazy/capped
  accessError?: boolean // true if not readable
}

interface CategorySummary {
  category: Category
  sizeBytes: number
  fileCount: number
  percent: number
}

interface ScanResult {
  root: string
  startedAt: number
  finishedAt: number
  totalSizeBytes: number
  totalFiles: number
  categories: CategorySummary[]
  tree: ScanNode // root node for drill-down
  skipped: string[] // inaccessible paths
}
```

**Memory/scaling note:** With millions of files, holding a complete tree in RAM
gets expensive. Strategy for v1: keep the tree aggregated, load detail children
**lazily** or materialize only the largest N entries per folder. Categories are
carried along as sums during the scan (no second pass).

---

## 9. Installation & Setup

Goal: "Clone the repo, start a script, it runs." Planned scripts:

```jsonc
// package.json (excerpt)
{
  "scripts": {
    "dev": "electron-vite dev", // development with HMR
    "build": "electron-vite build", // production build
    "start": "electron-vite preview", // start the built app
    "package": "electron-builder", // optional installer/portable
    "lint": "eslint .",
    "test": "vitest"
  }
}
```

**Setup script** `scripts/setup.ps1` (PowerShell, Windows):

- checks whether Node (LTS) is installed – otherwise clear instructions/abort
- `npm install`
- optionally start `npm run dev` right away

A typical flow looks like this:

```powershell
git clone <repo-url>
cd drive-cleanup
./scripts/setup.ps1        # installs dependencies
npm run dev                # start the app (development)
```

For end users without a toolchain, optionally: `npm run package` produces a
portable build / NSIS installer in the `release` folder.

---

## 10. Roadmap / Phases

| Phase                   | Content                                                                | Status                 |
| ----------------------- | ---------------------------------------------------------------------- | ---------------------- |
| **v1 – Analysis**       | Scan, category bars, detail drill-down, export                         | planned (this concept) |
| v1.1                    | Treemap view, "old & large" filter, cache scan result                  | idea                   |
| **v2 – Cleanup (safe)** | Delete to the **Recycle Bin**, multi-select, confirmation, undo hint   | later                  |
| v2.1                    | Duplicate detection (hash), empty folders, temp/cache cleanup profiles | later                  |
| v3                      | Performance: NTFS MFT scan, scheduled scans                            | idea                   |

---

## 11. Open Points / To Decide

1. **Detail list:** folder-tree drill-down (suggested default) vs. a flat
   "largest files" list – or both, toggleable? (Tendency: both.)
2. **App name:** "DriveLens" is a working title. Alternatives: "SpaceScout",
   "SpeicherLupe", "DiskScope". → decide, affects repo/branding.

- Drive cleaner

3. **Multiple drives simultaneously** – needed for v1 or is one enough?

- no, only one drive

4. **Export formats:** is JSON enough, or additionally CSV for Excel?

- json is enough

5. **Optional ready-made installer** bundled in v1 or purely "from the repo"?

- purely from the repo

---

## 12. Next Steps (after concept approval)

1. Project scaffold with electron-vite (main / preload / renderer, TS strict)
2. IPC base scaffold + secure preload API
3. Scan worker (walk + aggregation + progress) as an isolated process
4. UI skeleton: start → scan → result (with dummy data)
5. Wire category bars to real scan data
6. Detail list + drill-down
7. Setup script & README for easy installation
