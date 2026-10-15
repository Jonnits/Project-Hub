# Project Hub

I built Project Hub as a personal development kanban I can run in the browser. I wanted Linear-style issue keys, Trello-style columns I can drag across, and Jira-style WIP limits, plus the ability to sign in, share a board with someone else, and keep working when the network drops.

Board data is stored on disk in `data/project-hub.json` (accounts, sessions, memberships, projects, issues). The browser also keeps a per-user cache and a mutation outbox, so edits I make offline replay when I am back online. **Reset demo data** in the sidebar restores the sample workspace for the demo team (API Platform, Field App, Marketing Site).

## Run it

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:43127](http://127.0.0.1:43127).

```bash
npm run build
npm start -- --hostname 127.0.0.1 --port 43127
```

The production build is the one that behaves like a PWA (service worker + Add to Dock). `next dev` still queues offline edits; it just does not cache the Next.js bundles.

## Sign in

New accounts start empty. Create a project, or open an invite from someone who already has a board.

Demo team (password `demo`) already share the sample boards:

- `maya@projecthub.local`
- `jordan@projecthub.local`
- `sam@projecthub.local`
- `riley@projecthub.local`

Sign in as two of them in different browsers (or a private window) to see the same cards move.

## What works today

- **Accounts.** Register with name, email, and password, or sign in. Sessions are httpOnly cookies. Passwords are scrypt hashes, not stored in the clear.
- **Projects.** Create a project from the home page or the sidebar. Each project has a name, color, description, and a **key** — the short prefix for issue IDs. A project named Payments with key `PAY` numbers work as `PAY-1`, `PAY-2`, and so on.
- **Boards.** Every project gets Backlog → Todo → In Progress → In Review → Done. In Progress is capped at 3 and In Review at 4; the column header warns when I go over.
- **Issues.** `C` opens the create dialog. Click a card to edit title, description, status, priority, assignee, labels, and story points. Search with `/`. Filter by assignee, priority, and label.
- **Story points.** Fibonacci estimates (1, 2, 3, 5, 8, 13). Open issues sum as “pts remaining” in the board header.
- **Drag and drop.** Grab a card with the mouse and drop it on another column, including empty columns. Status in the issue sheet still works as a fallback.
- **Delete.** Deleting an issue asks **Are you sure you want to delete this issue?** before it is removed.
- **Share links.** Copy a board invite or an issue invite. Recipients must register or sign in, then join, before the board appears in their sidebar.
- **Offline.** The last workspace I loaded is cached in this browser. Edits queue locally and sync when the connection returns. The sidebar shows offline / pending / saved. Last write wins if two people edit the same issue.
- **Appearance.** Night is the original dark theme. Day is off-white with navy. The sidebar switch toggles between them. Titles (Project Hub, Projects, project names, column names, issue titles) use **Playfair Display**.

Clearing site data clears the local cache and signs me out of this browser. The JSON file on disk is the source of truth for the server.

## Stack

Next.js 16 (App Router) and TypeScript, Tailwind v4, shadcn/ui, Zustand on the client, a JSON file on the server. No second component library. TypeScript is the primary language because the board is a pile of tagged records (issue, column, share, outbox op) that move between the browser, the API, and disk. Shared types catch a drag payload, a share token, and a queued mutation disagreeing with each other before I click around and find out. The same types also keep the Next.js App Router honest when a route handler returns a workspace the UI then renders.

## What I am planning next

### Downloadable on my iMac

Right now Project Hub is a local web app: `npm run dev` or a production `next start`. I want it to live on the machine like a real app, not a terminal tab.

I have not implemented this yet. The realistic options, from lightest to heaviest:

1. **Add to Dock** (Safari or Chrome) as a standalone window. The web app manifest and service worker are already in place. It would still be the browser engine under the hood.
2. **A real `.app`.** Wrap the UI in Tauri (preferred) or Electron. The board itself would not need a rewrite. The extra work is the native shell, icons, a production build, and — if I want double-click without Gatekeeper warnings — Apple notarization.

I will start with Add to Dock if I only want it on the desktop. A signed Mac app is a separate packaging pass.

### Later, if I keep using this

- Custom columns and WIP limits per project, instead of the fixed five-column workflow.
- Keyboard move (e.g. `Cmd+→`) in addition to drag.
- Tighter reorder within a column, and drops on headers and gutters to always stick.
- Real-time collaboration instead of a few seconds of polling.

None of that is in the way of using the board now.
