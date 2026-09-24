# Project Hub

I built Project Hub as a personal development kanban I can run in the browser. I wanted Linear-style issue keys and shortcuts, Trello-style columns I can drag across, and Jira-style WIP limits, without standing up a database or an account.

All of the board data lives in this browser (`localStorage`). **Reset demo data** in the sidebar restores the sample workspace (API Platform, Field App, Marketing Site).

## Run it

```bash
npm install
npm run dev
```

Then open [http://localhost:43127](http://localhost:43127).

```bash
npm run build
npm start -- --port 43127
```

## What works today

- **Projects.** I can create a project from the home page or the sidebar. Each project has a name, color, description, and a **key** — the short prefix for issue IDs. A project named Payments with key `PAY` numbers work as `PAY-1`, `PAY-2`, and so on.
- **Boards.** Every project gets Backlog → Todo → In Progress → In Review → Done. In Progress is capped at 3 and In Review at 4; the column header warns when I go over.
- **Issues.** `C` opens the create dialog. Click a card to edit title, description, status, priority, assignee, labels, and story points. Search with `/`. Filter by assignee, priority, and label.
- **Story points.** Fibonacci estimates (1, 2, 3, 5, 8, 13). Open issues sum as “pts remaining” in the board header.
- **Drag and drop.** I can grab a card with the mouse and drop it on another column, including empty columns. Status in the issue sheet still works as a fallback.
- **Delete.** Deleting an issue asks **Are you sure you want to delete this issue?** before it is removed.
- **Appearance.** Night is the original dark theme. Day is off-white with navy. The sidebar switch toggles between them. Titles (Project Hub, Projects, project names, column names, issue titles) use **Playfair Display**.

Everything is local to this browser. Clearing site data clears the board.

## Stack

Next.js 16 (App Router) and TypeScript, Tailwind v4, shadcn/ui, Zustand with `localStorage`. No auth, no API, no second component library. I kept it that way on purpose so the first slice is actually usable.

## What I am planning next

### Downloadable on my iMac

Right now Project Hub is a local web app: `npm run dev` or a production `next start`. I want it to live on the machine like a real app, not a terminal tab.

I have not implemented this yet. The realistic options, from lightest to heaviest:

1. **Add to Dock** (Safari or Chrome) as a standalone window. Small amount of work: a web app manifest, icons, and `display: standalone`. It would still be the browser engine under the hood.
2. **A real `.app`.** Wrap the UI in Tauri (preferred) or Electron. The board itself would not need a rewrite. The extra work is the native shell, icons, a production build, and — if I want double-click without Gatekeeper warnings — Apple notarization.

I will start with Add to Dock if I only want it on the desktop. A signed Mac app is a separate packaging pass.

### Offline use

I want to use Project Hub with no wifi — on a plane, in a cafe, or anywhere the connection drops. The board should keep rendering and I should still be able to create, edit, drag, and delete issues. Those changes get registered locally and shared with the rest of the team the next time the app is online. I know people will not see each other’s live updates while anyone is offline; that is fine. Catch-up on reconnect is the point.

This pairs with the downloadable Mac app: a local install that still works when the network is gone.

### Multiple user login

Right now there is no login; the board is whoever opened this browser. I want multiple user accounts so people can sign in as themselves, keep their own identity on issues (assignee, activity), and share a project when connected. Offline work still belongs to the signed-in user and syncs under that account when the app is back online.

I also want shareable links for issues and boards. Anyone with the link should have to register (or sign in) before they can open it — no anonymous access, just an easy invite path.

### Later, if I keep using this

- Persist somewhere other than one browser profile (file on disk, or a tiny local server) so a Mac app and the web UI share the same board.
- Custom columns and WIP limits per project, instead of the fixed five-column workflow.
- Keyboard move (e.g. `Cmd+→`) in addition to drag.

None of that is in the way of using the board now.
