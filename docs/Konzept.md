# Konzept – Drive Cleanup (Arbeitstitel: „DriveLens")

> Status: Entwurf · Stand: 2026-06-14 · Phase: Konzept (vor Umsetzung)
> Lizenz: GPL-3.0 (siehe [LICENSE](../LICENSE))

Ein einfach zu installierendes Windows-Desktop-Tool, das die Festplatte scannt
und übersichtlich zeigt, **wo wie viel Speicherplatz verbraucht wird** – nach
Kategorien (Videos, Bilder, Installer, Cache, …) und zum Reinzoomen nach Ordnern.
Ziel: schnell erkennen, was Platz frisst, um später gezielt aufzuräumen.

---

## 1. Ziele & Scope

### Ziel der App

Transparenz über Speicherverbrauch schaffen. Der Nutzer wählt ein Laufwerk oder
einen Ordner, die App scannt, aggregiert und visualisiert das Ergebnis so, dass
„Speicherfresser" auf einen Blick sichtbar sind.

### In-Scope (Version 1 – „Nur Analyse")

- Laufwerk **oder** Ordner auswählen und scannen
- Live-Fortschritt während des Scans (responsive UI, kein Einfrieren)
- **Kategorie-Übersicht** mit Balken (Größe, Anteil %, Dateianzahl pro Kategorie)
- **Detail-Ansicht**: größte Ordner / größte Dateien, Drill-down in den Ordnerbaum
- Sortieren & Filtern in der Detailliste
- Scan-Ergebnis im Speicher halten; optional als Datei exportieren (JSON/CSV)

### Bewusst **nicht** in v1 (kommt später)

- **Löschen / Aufräumen** von Dateien (nur lesende Analyse in v1)
- Duplikat-Erkennung
- Geplante/automatische Scans
- Cloud, Telemetrie, Account

> Begründung: Erst Vertrauen in Scan & Anzeige aufbauen. Löschen ist
> sicherheitskritisch und bekommt eine eigene, abgesicherte Phase (siehe
> [Roadmap](#10-roadmap--phasen)).

### Nicht-Ziele (dauerhaft)

- Kein Festplatten-„Optimizer", keine Registry-Cleaner-Spielereien
- Keine versteckten Systemeingriffe

---

## 2. Zielgruppe & Verteilung

- **Open-Source-Tool** unter GPL-3.0. Verteilung über das Git-Repository.
- **Keine fertigen signierten Installer** in v1. Jeder installiert selbst per
  Repo-Checkout. Damit das einfach bleibt, gibt es ein **Setup-Skript** und
  klare npm-Scripts (siehe [Abschnitt 9](#9-installation--setup)).
- Optional kann `electron-builder` lokal einen portablen Build / NSIS-Installer
  erzeugen – für Leute, die nicht über die Konsole gehen wollen. Nicht
  zwingend für v1.

---

## 3. Tech-Stack

| Bereich               | Wahl                                              | Begründung                                                 |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| Runtime / Shell       | **Electron**                                      | Vom Nutzer gewünscht; native Datei-/OS-Zugriffe + Web-UI   |
| Sprache               | **TypeScript** (strict)                           | Typsicherheit über Prozessgrenzen (IPC) hinweg             |
| UI-Framework          | **React**                                         | Größtes Ökosystem, viele Komponenten                       |
| Styling               | **Tailwind CSS**                                  | Schnelle, konsistente, „schöne" UI                         |
| UI-Komponenten        | **shadcn/ui** (Radix + Tailwind)                  | Saubere, barrierearme Bausteine ohne schweres Framework    |
| Build / Dev-Server    | **electron-vite**                                 | Schnelles HMR, sauberes TS-Setup für Main/Preload/Renderer |
| Packaging (opt.)      | **electron-builder**                              | Portable-Build / NSIS-Installer bei Bedarf                 |
| Charts/Visualisierung | Eigene Balken (Tailwind) + optional **D3** später | Balken brauchen kaum Lib; Treemap erst später              |
| State (Renderer)      | **Zustand** (leichtgewichtig)                     | Einfacher als Redux, reicht für diesen Umfang              |
| Tests                 | **Vitest** (+ ggf. Playwright später)             | Schnell, passt zu Vite                                     |
| Lint/Format           | ESLint + Prettier                                 | Konsistenz im Open-Source-Projekt                          |

> Node-Version: aktuelle LTS (z. B. Node 20+). Wird im Setup-Skript geprüft.

---

## 4. Architektur

Electron hat mehrere Prozesse. Wichtig für eine flüssige UI: **der Scan darf
den Renderer/UI-Thread nicht blockieren.**

```
┌─────────────────────────────────────────────────────────────┐
│  Main-Prozess (Node)                                         │
│  - Fensterverwaltung, App-Lifecycle                          │
│  - Startet/stoppt Scan-Worker                                │
│  - Vermittelt IPC zwischen Renderer und Worker              │
│  - Datei-Dialoge (Laufwerk/Ordner wählen)                   │
└───────────────┬──────────────────────────┬──────────────────┘
                │ IPC (Progress/Result)     │ spawn / messages
                │                            ▼
┌───────────────▼───────────┐   ┌────────────────────────────────┐
│  Renderer (React + Tailwind)│   │  Scan-Worker (utilityProcess)  │
│  - UI, Charts, Listen      │   │  - Rekursiver Dateisystem-Walk  │
│  - Zustand-State           │   │  - Aggregation Größe/Kategorie  │
│  - Kein direkter FS-Zugriff│   │  - Fortschritts-Events          │
└────────────────────────────┘   └────────────────────────────────┘
        ▲  contextBridge (preload, sicher)
```

**Begründung der Prozesstrennung**

- **Scan-Worker** als `utilityProcess` (oder `worker_threads`): CPU-/IO-intensiver
  Walk läuft isoliert, UI bleibt flüssig. Bei Absturz (z. B. exotischer Pfad)
  reißt er nicht das ganze Fenster mit.
- **Renderer** bekommt nur fertige, aggregierte Daten und Fortschritt – nie
  direkten Dateisystemzugriff.

**Sicherheit (Electron-Best-Practices)**

- `contextIsolation: true`, `nodeIntegration: false`
- Schmale, getypte API über ein **Preload-Skript** via `contextBridge`
  (z. B. `window.api.scan.start(path)`, `onProgress`, `onDone`)
- Renderer lädt nur lokale Inhalte; keine Remote-URLs

---

## 5. Scan-Engine

### Vorgehen (v1)

Klassischer rekursiver Walk mit `fs.opendir` / `readdir({ withFileTypes: true })`
und kontrollierter Parallelität (begrenzte Anzahl gleichzeitiger Verzeichnisse,
damit IO nicht überläuft).

Pro Eintrag wird erfasst: Pfad, Größe (`stat`/`lstat`), Typ (Datei/Ordner),
Kategorie (aus Endung/Pfad), letzte Änderung (für spätere „alt & groß"-Filter).

### Wichtige Windows-Spezialfälle (müssen sauber behandelt werden)

- **Berechtigungen:** Systemordner / gesperrte Dateien → Fehler abfangen,
  überspringen, am Ende als „nicht zugänglich" ausweisen (nicht abstürzen).
- **Reparse Points / Junctions / Symlinks:** mit `lstat` erkennen, **nicht**
  hineinlaufen bzw. nicht doppelt zählen → verhindert Endlosschleifen &
  aufgeblähte Zahlen.
- **Hardlinks:** können Größe mehrfach zählen; in v1 akzeptiert, dokumentiert.
  (Exakte Behandlung via NTFS-Daten ist Phase-2-Thema.)
- **Lange Pfade** (> 260 Zeichen): `\\?\`-Präfix berücksichtigen.
- **Belegter vs. logischer Speicher:** v1 nutzt die logische Dateigröße. Hinweis
  in der UI, dass Komprimierung/Cluster-Größe abweichen können.

### Performance-Hinweis (Optimierung für später)

Tools wie WizTree lesen direkt die **NTFS-MFT** (Master File Table) → extrem
schnell, aber komplex und braucht Admin-Rechte. Für v1 bewusst **nicht**.
Ein rekursiver Walk ist langsamer, aber einfach, robust und ohne Admin
nutzbar. MFT-Lesen ist als spätere Beschleunigung vorgemerkt.

### Fortschritt

Der Worker meldet gedrosselt (z. B. alle 200 ms) Zwischenstände:
gescannte Dateien/Ordner, bisher summierte Größe, aktueller Pfad. So sieht der
Nutzer sofort, dass etwas passiert, auch bei großen Laufwerken.

---

## 6. Kategorisierung

Jede Datei wird einer Kategorie zugeordnet – primär über die Endung, für
Cache/Temp zusätzlich über den Pfad.

| Kategorie             | Beispiele (Endungen / Pfade)                  |
| --------------------- | --------------------------------------------- |
| 🎬 Videos             | mp4, mkv, mov, avi, webm                      |
| 🖼️ Bilder             | jpg, png, gif, heic, raw, psd                 |
| 🎵 Audio              | mp3, flac, wav, m4a                           |
| 📄 Dokumente          | pdf, docx, xlsx, pptx, txt, md                |
| 📦 Archive            | zip, rar, 7z, tar, gz                         |
| ⬇️ Installer          | exe, msi, msix, appx                          |
| 💾 Datenträger-Images | iso, vhd, vmdk, img                           |
| 🗄️ Datenbanken        | db, sqlite, mdf                               |
| 👨‍💻 Code/Projekte      | node_modules, .git, build-Ordner, src-Dateien |
| 🧹 Cache/Temp         | %TEMP%, AppData\…\Cache, _.tmp, _.log         |
| ⚙️ System             | Windows-, ProgramData-Pfade                   |
| ❓ Sonstiges          | alles ohne Treffer                            |

Mapping liegt zentral in einer Konfig (`src/shared/categories.ts`), damit es
leicht erweiterbar ist. Cache/Temp ist absichtlich eigene Kategorie, weil das
typische „gefahrlos aufräumbare" Daten sind (für spätere Cleanup-Phase relevant).

---

## 7. UI / UX-Konzept

### Bildschirme

1. **Start / Auswahl** – Laufwerksliste (mit freiem/belegtem Platz) + „Ordner
   wählen"-Button. Großer „Scannen"-Button.
2. **Scan läuft** – Fortschritt (Spinner/Balken), Live-Zähler, aktueller Pfad,
   „Abbrechen".
3. **Ergebnis** – zweigeteilt:
   - **Oben: Kategorie-Übersicht** (Balken, der primäre Einstieg)
   - **Unten/rechts: Detailliste** (größte Ordner/Dateien, Drill-down)

### Ergebnis-Ansicht (ASCII-Mockup)

```
┌──────────────────────────────────────────────────────────────────┐
│  C:\   •   932 GB belegt von 1 TB        [ Neu scannen ]  [Export]│
├──────────────────────────────────────────────────────────────────┤
│  Nach Kategorie                                                   │
│  🎬 Videos      ███████████████████░░░░░░░░  412 GB  44%  1.203   │
│  📦 Archive     ████████░░░░░░░░░░░░░░░░░░░░  168 GB  18%    340   │
│  ⬇️ Installer   █████░░░░░░░░░░░░░░░░░░░░░░░   96 GB  10%    512   │
│  🧹 Cache/Temp  ████░░░░░░░░░░░░░░░░░░░░░░░░   71 GB   8%  88.901  │
│  🖼️ Bilder      ███░░░░░░░░░░░░░░░░░░░░░░░░░   54 GB   6%  12.400  │
│  ❓ Sonstiges   ██░░░░░░░░░░░░░░░░░░░░░░░░░░   33 GB   4%   …       │
├──────────────────────────────────────────────────────────────────┤
│  Detail   [ Größte Ordner ▾ ]   [ Filter: alle Kategorien ▾ ]     │
│  ▸ C:\Users\me\Videos                         310 GB              │
│  ▸ C:\Users\me\Downloads                      142 GB              │
│  ▾ C:\Users\me\AppData\Local                   68 GB              │
│      └ …\Temp                                   41 GB             │
│      └ …\Packages                               19 GB             │
│  ▸ C:\ProgramData                              22 GB              │
└──────────────────────────────────────────────────────────────────┘
```

### Designprinzipien

- **Kategorie-Balken zuerst** – schneller Überblick, was die Platzfresser sind.
- **Drill-down** in der Detailliste: vom Ordner zum Unterordner bis zur Datei.
- Klick auf eine Kategorie **filtert** die Detailliste auf diese Kategorie.
- „Im Explorer öffnen" pro Eintrag (bereitet späteres Aufräumen vor).
- Dunkles & helles Theme, klare Typografie, dezente Kategoriefarben.

### Offene UX-Frage (bewusst markiert)

Du warst dir bei der Detailliste noch unsicher. Vorschlag: **Ordnerbaum-Drill-down
als Standard** + umschaltbar auf **„Top 100 größte Dateien"** (flache Liste).
Eine **Treemap** kann später als dritte Ansicht ergänzt werden. → siehe
[Offene Punkte](#11-offene-punkte--zu-entscheiden).

---

## 8. Datenmodell (Entwurf)

```ts
// Aggregierter Knoten im Ordnerbaum
interface ScanNode {
  name: string;
  path: string;
  type: "dir" | "file";
  sizeBytes: number; // bei Ordnern: rekursiv aggregiert
  fileCount: number; // bei Ordnern: rekursiv
  category?: Category; // bei Dateien gesetzt
  mtimeMs?: number;
  children?: ScanNode[]; // nur bei Ordnern; ggf. lazy/gekappt
  accessError?: boolean; // true, wenn nicht lesbar
}

interface CategorySummary {
  category: Category;
  sizeBytes: number;
  fileCount: number;
  percent: number;
}

interface ScanResult {
  root: string;
  startedAt: number;
  finishedAt: number;
  totalSizeBytes: number;
  totalFiles: number;
  categories: CategorySummary[];
  tree: ScanNode; // Root-Knoten zum Drill-down
  skipped: string[]; // nicht zugängliche Pfade
}
```

**Speicher-/Skalierungshinweis:** Bei Millionen Dateien wird ein vollständiger
Baum im RAM teuer. Strategie für v1: Baum aggregiert halten, Detail-Children
**lazy** nachladen bzw. pro Ordner nur die größten N Einträge materialisieren.
Kategorien werden während des Scans als Summen mitgeführt (kein zweiter Durchlauf).

---

## 9. Installation & Setup

Ziel: „Repo klonen, ein Skript starten, läuft." Vorgesehene Scripts:

```jsonc
// package.json (Auszug)
{
  "scripts": {
    "dev": "electron-vite dev", // Entwicklung mit HMR
    "build": "electron-vite build", // Produktions-Build
    "start": "electron-vite preview", // gebaute App starten
    "package": "electron-builder", // optionaler Installer/Portable
    "lint": "eslint .",
    "test": "vitest",
  },
}
```

**Setup-Skript** `scripts/setup.ps1` (PowerShell, Windows):

- prüft, ob Node (LTS) installiert ist – sonst klare Anleitung/Abbruch
- `npm install`
- optional gleich `npm run dev` starten

So sieht der typische Ablauf aus:

```powershell
git clone <repo-url>
cd drive-cleanup
./scripts/setup.ps1        # installiert Abhängigkeiten
npm run dev                # App starten (Entwicklung)
```

Für Endnutzer ohne Toolchain optional: `npm run package` erzeugt einen
portablen Build / NSIS-Installer im `release`-Ordner.

---

## 10. Roadmap / Phasen

| Phase                     | Inhalt                                                                    | Status                   |
| ------------------------- | ------------------------------------------------------------------------- | ------------------------ |
| **v1 – Analyse**          | Scan, Kategorie-Balken, Detail-Drill-down, Export                         | geplant (dieses Konzept) |
| v1.1                      | Treemap-Ansicht, „alt & groß"-Filter, Scan-Ergebnis cachen                | Idee                     |
| **v2 – Cleanup (sicher)** | Löschen in den **Papierkorb**, Mehrfachauswahl, Bestätigung, Undo-Hinweis | später                   |
| v2.1                      | Duplikat-Erkennung (Hash), leere Ordner, Temp-/Cache-Aufräum-Profile      | später                   |
| v3                        | Performance: NTFS-MFT-Scan, geplante Scans                                | Idee                     |

---

## 11. Offene Punkte / Zu entscheiden

1. **Detailliste:** Ordnerbaum-Drill-down (Vorschlag-Standard) vs. flache
   „größte Dateien"-Liste – oder beides umschaltbar? (Tendenz: beides.)
2. **App-Name:** „DriveLens" ist Arbeitstitel. Alternativen: „SpaceScout",
   „SpeicherLupe", „DiskScope". → festlegen, wirkt sich auf Repo/Branding aus.

- Drive cleaner

3. **Mehrere Laufwerke gleichzeitig** scannen – nötig für v1 oder reicht eins?

- nein nur ein laufwerk

4. **Export-Formate:** JSON reicht, oder zusätzlich CSV für Excel?

- json reicht

5. **Optionaler fertiger Installer** in v1 mitliefern oder rein „aus dem Repo"?

- rein aus repo

---

## 12. Nächste Schritte (nach Konzept-Freigabe)

1. Projektgerüst mit electron-vite (Main / Preload / Renderer, TS strict)
2. IPC-Grundgerüst + sicheres Preload-API
3. Scan-Worker (Walk + Aggregation + Fortschritt) als isolierter Prozess
4. UI-Skeleton: Start → Scan → Ergebnis (mit Dummy-Daten)
5. Kategorie-Balken an echte Scan-Daten anbinden
6. Detailliste + Drill-down
7. Setup-Skript & README für einfache Installation
