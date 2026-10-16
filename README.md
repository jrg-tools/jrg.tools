# JRG Tools

The projects page for [jrg.tools](https://jrg.tools): a single page that lists and describes the things I've
been building, in the same look as [jorgechato.com](https://jorgechato.com) (zinc and amber, Figtree, light and
dark following the system).

It shows two kinds of projects:

- **Hardware** I designed, 3D printed and soldered: **AB98** (a cassette-Walkman music player), **Máy Anh Cũ**
  (a tiny film camera) and **inkbridge** (an e-ink Home Assistant launcher). Each one comes with an interactive
  exploded drawing.
- **Web apps**: **Trip** (a family trip planner), **Generations** (a family tree), **Revelado** (an AI photo
  darkroom) and **E-ink Card** (a business card for e-ink readers), each with a small illustration.

The page only describes the projects; no code from them is shown.

## The exploded drawings

Each device is drawn as an isometric SVG, built from the real part sizes in that project's CAD script and
hardware notes: the printed shells, every module, and every hand-soldered wire (in amber).

- **Click** opens or closes it, pulling the layers apart.
- **Drag** turns it all the way round and tilts it over the top and underneath, so any side can be inspected.
  On touch screens a sideways swipe turns it and a vertical swipe scrolls the page.
- **Hover** a layer, or use the buttons under the drawing, to see what it is.
- **Keyboard:** Enter opens and closes, the arrow keys turn and tilt.
- When nobody touches it, it opens, visits each layer and closes again. It stays still under reduced motion.

Where things live:

| Path                                | What                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `src/lib/projects.ts`               | Every project's name, description, features and stack                               |
| `src/routes/+page.svelte`           | The page, and the illustrations for the web apps                                    |
| `src/lib/figures/ab98.ts` …         | One drawing per device, as a function of the viewing angle                          |
| `src/lib/figures/parts.ts`          | Shared parts (boards, chips, joints, switches, trays, shells) and the depth sorting |
| `src/lib/components/Anatomy.svelte` | The interactive card: opening, turning, tilting, hover, the idle tour               |
| `src/lib/iso/`                      | The isometric drawing kit and its CSS, with local changes for views from below      |

Rebuilding a view takes a few milliseconds, so each angle is drawn on demand and the recent ones are cached.

## Developing

Needs Node and pnpm (the Docker image uses Node 26 and pnpm 11).

```sh
pnpm install
pnpm dev        # http://localhost:5173
pnpm check      # type checking
pnpm lint       # prettier + eslint
pnpm format     # fix formatting
pnpm build      # production server in build/
```

## Deploying

The app builds to a standalone Node server (`@sveltejs/adapter-node`). The `Dockerfile` runs it on port 80.

Pushing to `main` (or a `v*` tag) runs `.github/workflows/publish-docker.yaml`, which builds the image for amd64
and arm64, pushes it to `ghcr.io/jrg-tools/jrg.tools`, and asks Dokploy to redeploy. It needs two repository
secrets: `DOKPLOY_TOKEN` and `DOKPLOY_APPLICATION_ID`.

To run the image locally:

```sh
docker build -t jrg-tools .
docker run -p 8080:80 jrg-tools   # http://localhost:8080
```

The project still carries the starter's Drizzle + SQLite setup (`src/lib/server/db`, `pnpm db:*`), but nothing
uses it yet, so the container needs no volume.
