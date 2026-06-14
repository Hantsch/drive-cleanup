# Drive Cleaner

Scan a Windows drive and see, by category and folder, **where the space actually goes** —
so you know what to clean up later. Version 1 is read-only: it analyses and
visualises, it never deletes anything.

> Status: v1 (analysis only). See [docs/Konzept.md](docs/Konzept.md) for the full concept and roadmap.

## Features

- Pick a fixed drive or any folder and scan it.
- Live progress (files, folders, size) while scanning — the UI never freezes.
- **Storage composition** bar and a per-category breakdown (Videos, Archives,
  Installers, Cache/Temp, …).
- **Drill-down** into the largest folders and files, with expand/collapse.
- Filter by name or path, or click a category to isolate it.
- Reveal any item's folder in Explorer.

## Tech stack

Electron · TypeScript (strict) · React · Tailwind CSS v4 · Zustand · electron-vite.
The filesystem walk runs in an isolated utility process, so the UI stays smooth
on large drives.

## Getting started

Requires [Node.js](https://nodejs.org/) LTS (v20 or newer) on Windows.

```powershell
git clone <repo-url>
cd drive-cleanup
./scripts/setup.ps1   # checks Node and installs dependencies
npm run dev           # launch in development mode
```

Or manually: `npm install` then `npm run dev`.

## Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Run the app with hot reload                  |
| `npm run build`     | Type-check and build the production bundle   |
| `npm run preview`   | Run the built app                            |
| `npm run typecheck` | Type-check main, preload and renderer        |
| `npm run lint`      | Lint the source                              |
| `npm run package`   | Build a distributable installer (optional)   |

## Project structure

```
src/
  main/              Electron main process
    scan/            scan controller + worker (walk, categorize, aggregate)
    system/          OS queries (drive list)
  preload/           typed contextBridge bridge (window.api)
  renderer/          React UI
    src/
      components/    small, single-responsibility components
      store/         Zustand state
      lib/           pure helpers (format, tree, usage)
  shared/            types, category catalogue and IPC contract used everywhere
```

## Notes

- This repo's `.npmrc` points at the public npm registry so the bundled fonts
  resolve regardless of any private registry configured globally.
- If `npm run dev` ever launches Node instead of the app, make sure the
  `ELECTRON_RUN_AS_NODE` environment variable is **not** set.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
