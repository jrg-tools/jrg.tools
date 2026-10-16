// Screenshots the latest project's picture into static/og.png, the link-preview image.
// Usage: pnpm build && pnpm preview, then `pnpm og [url]` (default http://localhost:4173).
import { chromium } from 'playwright-core';
import { PROJECTS } from '../src/lib/projects.ts';

const latest = PROJECTS[0];
// Hardware shows its isometric drawing, web apps the picture on top of their card.
const selector = latest.figure ? `#${latest.id} .iso-plate` : `#${latest.id} > div:first-child`;

const browser = await chromium.launch({ channel: 'chrome' });
// 1200×630 is the size link previews crop to.
const page = await browser.newPage({
	viewport: { width: 1200, height: 630 },
	colorScheme: 'light'
});
await page.goto(process.argv[2] ?? 'http://localhost:4173', { waitUntil: 'networkidle' });
// Lift the picture out of the page to fill the frame on its own, without the drawing's hints.
await page.addStyleTag({
	content: `${selector} { position: fixed !important; inset: 0; z-index: 9999; margin: 0; border: 0;
		display: grid; place-items: center; background: #fff; }
		${selector} .iso-plate-corners { display: none; }
		${latest.figure ? `${selector} .iso-svg { height: 600px; width: auto; }` : `${selector} > * { zoom: 1.6; }`}`
});
await page.waitForTimeout(1500); // let the drawing settle its opening animation
await page.screenshot({ path: 'static/og.png' });
await browser.close();
console.log(`static/og.png ← ${latest.name}`);
