---
name: frontend-guidelines
description: "Frontend architecture rules and conventions for React/TypeScript apps using Atomic Design. Use when: creating or editing files in a frontend source tree; adding atoms/molecules/organisms/templates/pages; building forms, lists, dashboards, or detail screens; introducing a new route; wiring server state with a data-fetching library (e.g. TanStack Query, SWR, RTK Query); adding UI-kit components (e.g. shadcn/ui, MUI, Chakra); adding icons; writing Storybook stories; adding or changing i18n / translatable strings; deciding which atomic layer a component or hook belongs in; reviewing a diff for layering, naming, or duplication violations. DO NOT USE FOR: backend changes; infrastructure/Docker; auth/role/permission matrix changes; non-React frontends."
---

# Frontend Guidelines

Reusable checklist for any React + TypeScript frontend organised by Atomic Design. The skill encodes layer boundaries, file conventions, data-flow rules, and a mandatory duplicate scan. Project-specific overrides (paths, libraries, templates) belong in the host repo's `agents.md` / `AGENTS.md` and take precedence over this skill.

## When to Use

- Touching any file in the frontend source tree (typical root: `src/`).
- Adding or refactoring a component, hook, service, route, or page.
- Reviewing a PR/diff for layering, naming, or duplication issues.
- Deciding which atomic layer (atom / molecule / organism / template / page) a piece of UI belongs in.

## Assumed Stack (adapt to project)

- React 18+ with TypeScript in strict mode (no `any`, no unexplained `@ts-ignore`).
- A utility-CSS or design-system layer (e.g. Tailwind) — no inline `style={{}}`.
- A headless/UI primitive kit (e.g. shadcn/ui, Radix, Headless UI) imported **only** from the atoms layer.
- A client-side router with route paths defined as constants; non-home routes lazy-loaded.
- A server-state library (e.g. TanStack Query, SWR, RTK Query) — components never call `fetch`/`axios` directly.
- A global UI-state mechanism (React Context preferred; avoid global stores unless measured perf requires).
- Storybook (CSF3) for atoms, molecules, organisms, and templates.
- A single icon library; **no inline SVG icons**.

> If the host project mandates specific libraries (check `agents.md` / `AGENTS.md`), use those exact ones.

## Atomic Design Layer Map

| Layer     | Folder (typical) | Holds                                                           | Forbidden                                            |
| --------- | ---------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| Atoms     | `src/atoms/`     | Smallest UI primitives; thin wrappers over UI-kit components    | Business logic; direct domain types                  |
| Molecules | `src/molecules/` | 2+ atoms composed into a meaningful piece (FormField, StatCard) | Page/domain logic; implicit prop spreading           |
| Organisms | `src/organisms/` | Reusable complex sections (DataTable, PageHeader, Modal, Form)  | Direct data fetching — data comes via props          |
| Templates | `src/templates/` | Page layout shells with named slots                             | Domain content; one-off layouts living inside a page |
| Pages     | `src/pages/`     | Route-level screens that pick a template and fill slots         | Structural `div`s / custom layout markup             |
| Features  | `src/features/`  | Domain modules (hooks, context, domain-specific components)     | Cross-domain coupling                                |
| Hooks     | `src/hooks/`     | Cross-cutting reusable hooks                                    | Domain-specific logic (put it under `features/`)     |
| Services  | `src/services/`  | Query/mutation definitions for the server-state library         | Component imports of raw `fetch`/`axios`             |
| Context   | `src/context/`   | Global UI state providers                                       | Server state (use the data layer)                    |
| Router    | `src/router/`    | Route definitions, guards, path constants                       | Inline string paths scattered across the codebase    |
| Types     | `src/types/`     | Shared DTOs / API shapes                                        | Component-local prop types                           |
| Lib       | `src/lib/`       | Pure utility functions                                          | React imports                                        |

## Layer Dependency Direction (hard rule)

Imports may only point **downward** through the layer stack. A file may import from its own layer or any layer below it, **never** from a layer above it.

```
pages  →  templates  →  organisms  →  molecules  →  atoms
  │            │             │            │
  └─ features/<domain> (hooks, context, domain components)
         │
         └─ services  →  types / lib
```

Concrete rules:

- **Atoms / molecules / organisms / templates MUST NOT import from `pages/`.** A reusable lower layer that reaches up into a route-level screen is an inverted dependency. The data/hook it needs belongs in `features/<domain>/hooks/` (or `hooks/`), and the page wires it in.
- **Do not type a prop as `ReturnType<typeof someHook>`** when the hook lives in a higher layer (e.g. a page hook). This silently couples a reusable component to a page. Define an explicit `<Component>Props` shape (or a shared type in `types/`) and pass only the data/handlers the component actually needs.
- Shared logic two layers need lives in the **lowest** layer that satisfies both (move it down: page → feature/hook → service/lib), never up.

Review check: open the import block of any atom/molecule/organism/template. If you see `pages/...`, it is a violation — relocate the imported thing downward.

## Layer Decision Flow

Pick the right folder **before** creating a file:

1. Primitive UI unit, no business logic → **atoms/**.
2. Composes 2+ atoms into a meaningful piece → **molecules/**.
3. Complex reusable section that takes data via props → **organisms/**.
4. Page-level layout shell with slots → **templates/** (justify any new one).
5. Route-level screen → **pages/** (template + slot content only).
6. Domain-specific code → **features/<domain>/**.
7. Pure util → **lib/** · Shared hook → **hooks/** · Shared type → **types/**.

## Procedure: Create a New Component

1. **Search first.** Look in atoms/molecules/organisms for similar components. If one exists, pause and ask the user:
   > **Similar component found: `<Name>`** — `<what it does>`. **Use as-is / Extend / Create new (justify)?**
2. **Pick the layer** using the Decision Flow.
3. **File layout.**
   - Simple: `atoms/Button.tsx`.
   - With stories/types: `molecules/FormField/FormField.tsx` + `FormField.stories.tsx` (+ `FormField.types.ts` if non-trivial).
4. **Naming.** PascalCase component & file. Props interface named `<Component>Props`; do not export unless consumed elsewhere.
5. **One component per file; filename = component name.** A file named `Foo.tsx` exports a component `Foo`. Don't park several unrelated components (e.g. `RecentsList` + `SearchResults`) in a mis-named file (`UserList.tsx`). Split them into their own files (each in the correct layer) or, if they're genuinely one cohesive unit, name the file after the exported component. Small private subcomponents used only inside the file are fine and need not be exported.
6. **Exports.** Named exports only — no default exports.
7. **Story.** Co-locate a `.stories.tsx`. Cover default + meaningful variants + empty/loading/error where applicable. Use CSF3 with `satisfies Meta<typeof Component>` and `@storybook/test` for interactions.

## Procedure: Build a Page

1. Create `pages/<Name>Page.tsx`.
2. Choose an existing template. **No structural `div`s in the page.**
3. Fetch data via feature hooks (`features/<domain>/hooks/`) that wrap services (`services/`).
4. Pass data + organisms into template slots.
5. Register the route in `router/` using a path constant; lazy-load unless it is the home route.
6. Handle loading and error states explicitly — no silent failures.

## Procedure: Add Data Fetching

1. Define the query/mutation in `services/<domain>.ts` using the project's server-state library.
2. Add request/response types in `types/`.
3. If local composition is needed, expose via a hook in `features/<domain>/hooks/`.
4. Components consume only via the hook — never `fetch`/`axios` directly.

## Procedure: i18n Messages (react-intl / FormatJS)

Keep translatable strings out of view components.

1. **Co-locate a `messages.ts`** next to the component / page (e.g. `pages/orchestrations/messages.ts`, `components/molecules/foo/messages.ts`). One `messages.ts` per view unit.
2. The file contains **only** `defineMessages` and exports a `messages` (or domain-named) const. No JSX, no hooks, no other logic.
3. The component imports `{ messages }` and uses `f(messages.x)` / `<FormattedMessage {...messages.x} />`. **Do not call `defineMessages` inside a `.tsx`** view file.
4. Message IDs follow `<view-kebab>.<key-kebab>` (e.g. `orchestrations-dashboard.no-results`) so the extracted catalog stays grouped.
5. Truly shared strings (≥ 2 unrelated views) go to a project-level shared messages module (e.g. `i18n/commonMessages.ts`), not duplicated per view.
6. After adding/changing messages, run the project's extraction script (e.g. `npm run intl`) and never hand-edit the generated `messages/*.json` / `translations/*.json` files.

Red flags:

- `defineMessages({ ... })` inside a `.tsx` file.
- Hardcoded user-facing English in JSX (`<h1>Users</h1>`, `placeholder="Search…"`).
- Message IDs that don't share a prefix with sibling messages of the same view.

## Procedure: Add a UI-Kit Component (shadcn/ui, MUI, etc.)

1. Generate/install per the kit's instructions; place the resulting file in `atoms/` (move it there if the tool put it elsewhere).
2. If project defaults are needed (fixed variant/size/theme), wrap it in an atom that applies them.
3. Export from the atom. **All other layers import the atom, never the kit's path directly.**

## Proactive Duplicate Scan (mandatory before finishing an edit)

Before committing changes to a page/organism, scan surrounding JSX for structurally identical blocks differing only in props / variant / icon / color / handler. If found:

1. Extract into a shared component first.
2. Then continue with the original change.

Red flags:

- Two `<button>` / `<div>` blocks with the same className skeleton, swapping only icon/label/handler.
- Repeated layout `div`s with no domain logic.
- A diff showing the same markup copy-pasted with minor tweaks.

## Forbidden Patterns (hard rules)

- Layout markup in page components.
- Business logic in atoms or molecules.
- **Upward layer imports** — an atom/molecule/organism/template importing from `pages/` (or any higher layer).
- **`ReturnType<typeof pageHook>` (or any higher-layer hook) used as a prop type** — couples a reusable component to a page; pass an explicit props shape instead.
- **Mis-named multi-component files** — filename must match the single exported component; split unrelated components into their own files.
- Direct UI-kit imports outside the atoms layer.
- `fetch` / `axios` calls inside components.
- New page layouts that bypass the template system.
- Inline styles (`style={{}}`) — use the project's CSS approach.
- Inline SVG icons — use the project's icon library.
- `defineMessages(...)` inlined inside a view (`.tsx`) file — extract to a co-located `messages.ts`.
- Hardcoded user-facing English in JSX — every visible string goes through `react-intl`.
- `any` type or unexplained `@ts-ignore`.
- Default exports.
- Two JSX blocks with identical structure differing only in props/data/color — extract instead.

## Naming Cheat Sheet

| Thing                  | Convention             | Example                          |
| ---------------------- | ---------------------- | -------------------------------- |
| Component & file       | PascalCase             | `DataTable.tsx`                  |
| Hook                   | `use` + camelCase      | `useMemberList`                  |
| Service / queries file | camelCase              | `memberService.ts`               |
| Context                | PascalCase + `Context` | `AuthContext`                    |
| Types/Interfaces       | PascalCase             | `MemberDto`, `CreateMemberInput` |
| Props interface        | `<Component>Props`     | `FormFieldProps`                 |
| Global constants       | UPPER_SNAKE_CASE       | `API_BASE_URL`                   |

## Completion Checklist

Before declaring a frontend change done:

- [ ] Component sits in the correct atomic layer.
- [ ] No duplicate JSX structures left behind (proactive scan done).
- [ ] No forbidden patterns introduced.
- [ ] Storybook story exists for new atoms/molecules/organisms/templates.
- [ ] Icons come from the project's icon library; sizing via class names, not `width`/`height` props.
- [ ] Server state goes through the project's data layer (`services/` + hooks).
- [ ] Loading and error states handled.
- [ ] Translatable strings live in a co-located `messages.ts` (no `defineMessages` in `.tsx`); intl extraction script run if messages changed.
- [ ] Named exports only; no `any`.
- [ ] Any project-specific rules in the repo's `agents.md` / `AGENTS.md` are respected (they override this skill).
