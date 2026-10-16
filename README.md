# jrg.tools

Source for [jrg.tools](https://jrg.tools), the page where I list the stuff I build. Same look as
[jorgechato.com](https://jorgechato.com).

There are two kinds of projects on it. The hardware ones (AB98, Máy Anh Cũ and inkbridge) I printed and
soldered myself, so each gets an exploded isometric drawing you can open, spin around and hover to see
the parts. The drawings use the real measurements from each project's CAD files. The web apps (Trip,
Generations, Revelado and E-ink Card) just get a small illustration. Trip, Generations and Revelado use AI, and all of it
runs self-hosted on my own hardware (Ollama and ComfyUI), not on a cloud API.

Project text lives in `src/lib/projects.ts`, the drawings in `src/lib/figures/`.

## Dev

```sh
pnpm install
pnpm dev
```

`pnpm check` and `pnpm lint` before pushing.

## Deploy

Pushing to `main` builds the Docker image, pushes it to `ghcr.io/jrg-tools/jrg.tools` and triggers a
redeploy on Dokploy. The workflow needs the `DOKPLOY_TOKEN` and `DOKPLOY_APPLICATION_ID` secrets.

To run it locally:

```sh
docker build -t jrg-tools .
docker run -p 8080:80 jrg-tools
```
