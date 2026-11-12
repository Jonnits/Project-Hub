# Project Hub

This is my development kanban. I run it in the browser. I wanted Linear-style issue keys, Trello-style columns I can drag across, and Jira-style WIP limits. I also wanted to sign in, share a board with someone else, and keep working when the network drops.

I have those last three working now. Board data lives on disk in `data/project-hub.json` — accounts, sessions, memberships, projects, and issues. This browser keeps a cache per account and a queue of my edits, so work I do offline replays when I am back online. Signing in as someone else here does not empty my saved boards. **Reset demo data** in the sidebar restores the sample workspace for the demo team (API Platform, Field App, Marketing Site).

## Where this folder is

There is no Project Hub folder under Applications until I install the Mac app. The project is the `Project-Hub` clone from GitHub — the directory that contains `package.json` and `data/project-hub.json`.

I find it without guessing `cd` paths:

- Spotlight (Cmd-Space): search `project-hub.json`
- Finder search (Cmd-F) in my home folder, file name `project-hub.json`
- Terminal: `mdfind -name project-hub.json`
- GitHub Desktop: Repository → Show in Finder (often `~/Documents/GitHub/Project-Hub`)

If I never cloned it, I put it somewhere I can see:

```bash
git clone https://github.com/Jonnits/Project-Hub.git ~/Desktop/Project-Hub
```

Boards I already created live in that clone’s `data/project-hub.json`. I run the install below from that same folder, not a second copy.

## Run it like a Mac app

Once, from the Project Hub folder I actually use (on this Mac, `~/Desktop/Project-Hub`):

```bash
npm install
npm run install-app
```

If this clone does not have `install-app` yet:

```bash
bash desktop/bootstrap-macos.sh
```

That writes **Project Hub** to `~/Applications`, starts the board with this Mac, and keeps it running at [http://127.0.0.1:43127](http://127.0.0.1:43127) after I close the window. Spotlight finds it. I can drag it to the Dock.

After that, closing and reopening the window does not need a terminal.

If I have not installed yet, I double-click `Project Hub.command` in Finder (right-click → Open the first time). Same folder as this README — no `cd`.

```bash
npm run app
```

also opens it. `npm run uninstall-app` removes the Applications entry and the login service.

`npm run dev` is still there for live code reload. I do not need it to use the board.

If an old Dock window comes back blank, I open Project Hub from Applications once, then Shift-reload the window. The boards are in `data/project-hub.json`; a blank window does not mean they are gone.

## Sign in

A new account of mine starts empty. I create a project, or I open an invite from someone who already has a board.

The demo team (password `demo`) already share the sample boards:

- `maya@projecthub.local`
- `jordan@projecthub.local`
- `sam@projecthub.local`
- `riley@projecthub.local`

This browser holds one signed-in account at a time. To watch two people on the same board, I use a second browser or a private window — not a second tab.

## What works today

- **Accounts.** I register with name, email, and password, or I sign in. Sessions are httpOnly cookies. Passwords are scrypt hashes, not stored in the clear.
- **Projects.** I create a project from the home page or the sidebar. Each project has a name, color, description, and a **key** — the short prefix for issue IDs. A project named Payments with key `PAY` numbers work as `PAY-1`, `PAY-2`, and so on.
- **Boards.** Every project gets Backlog → Todo → In Progress → In Review → Done. In Progress is capped at 3 and In Review at 4; the column header warns when I go over.
- **Issues.** `C` opens the create dialog. I click a card to edit title, description, status, priority, assignee, labels, and story points. Search with `/`. Filter by assignee, priority, and label.
- **Story points.** Fibonacci estimates (1, 2, 3, 5, 8, 13). Open issues sum as “pts remaining” in the board header.
- **Drag and drop.** I grab a card with the mouse and drop it on another column, including empty columns. Status in the issue sheet still works as a fallback.
- **Delete.** Deleting an issue asks **Are you sure you want to delete this issue?** before it is removed.
- **Share links.** From the board menu, **Copy board invite**. From an issue, **Copy issue link**. Recipients open `/join/…`, register or sign in, then join. The board only appears in their sidebar after that.
- **Offline.** The last workspace I loaded is cached under my account in this browser. Edits queue locally and sync when the connection returns. The sidebar shows offline / pending / saved. Last write wins if two people edit the same issue.
- **Appearance.** Night is the original dark theme. Day is off-white with navy. The sidebar switch toggles between them. Titles (Project Hub, Projects, project names, column names, issue titles) use **Playfair Display**.
- **Add to Dock.** Sidebar **Add to Dock** (and the same control on the sign-in screen). After `npm run install-app`, **Project Hub** lives in Applications and starts with the Mac, so Safari **File → Add to Dock** is just the window — not a second server I have to remember. Chrome can install from the address bar the same way. If the server is down, the window says so instead of going blank.

Clearing site data clears the local cache and signs me out of this browser. The JSON file on disk is the source of truth for the server.

## Stack

Next.js 16 (App Router) and TypeScript, Tailwind v4, shadcn/ui, Zustand on the client, a JSON file on the server. No second component library. TypeScript is my primary language because the board is a pile of tagged records (issue, column, share, outbox op) that move between the browser, the API, and disk. Shared types catch a drag payload, a share token, and a queued mutation disagreeing with each other before I click around and find out. The same types also keep the Next.js App Router honest when a route handler returns a workspace the UI then renders.

## What I am planning next

I finished the offline queue, multi-user login, shareable invites, Add to Dock, and a Mac app that starts the board without a terminal. What I still want:

### A signed `.app` I can move off this clone

`npm run install-app` already puts Project Hub in Applications and starts it at login. That app still points at this clone (Node + the JSON file in `data/`). I still want a self-contained, notarized `.app` I can copy to another Mac without the repo sitting next to it.

That wrap (Tauri, preferably) is a separate packaging pass. The board itself does not need a rewrite.

### Later, if I keep using this

- Custom columns and WIP limits per project, instead of the fixed five-column workflow.
- Keyboard move (e.g. `Cmd+→`) in addition to drag.
- Tighter reorder within a column, and drops on headers and gutters to always stick.
- Real-time collaboration instead of a few seconds of polling.

None of that is in the way of using the board now.
