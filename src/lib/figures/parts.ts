// Shared parts for the hardware anatomy figures. World units are millimetres, z up.
import * as k from '$lib/iso/iso-kit';
import type { Plan, Point3, Projection } from '$lib/iso/iso-kit';

export type { Plan, Point3, Projection };

/** A point that rides with one exploded layer. */
export interface Anchor {
	p: Point3;
	layer: number;
}

/** A soldered wire. It is drawn just after layer `slot`, so it sits over everything below it. */
export interface Link {
	slot: number;
	from: Anchor;
	to: Anchor;
	via?: Anchor[];
	tone?: 'lit' | 'red' | 'lo' | 'mid';
}

export interface Layer {
	name: string;
	role: string;
	svg: string;
	/** Drawn after the layers above it are, for walls that hide what sits inside them (a tray's near walls). */
	over?: { svg: string; after: number };
	/** The same seen from below, drawn after layer `after` is: a shell's walls around what it encloses. */
	under?: { svg: string; after: number };
}

export interface Figure {
	id: string;
	fig: string;
	title: string;
	label: string;
	caption: string;
	width: number;
	height: number;
	/** How far each layer rises when the figure is fully open. */
	lifts: number[];
	P: Projection;
	/** Seen from below: layers paint top to bottom. */
	below: boolean;
	layers: Layer[];
	links: Link[];
}

/** A figure drawn from any azimuth and elevation, in degrees (elevation in −90…90; below 0 looks up). */
export type Build = (azimuth: number, elevation: number) => Figure;

/**
 * A square camera that fits the sphere around the open figure, so the drawing keeps its size and
 * place however it is turned or tilted.
 */
export function frame(
	plan: Plan,
	top: number,
	azimuth: number,
	elevation: number,
	width = 640,
	pad = 16
) {
	const centre: Point3 = [plan.x + plan.w / 2, plan.y + plan.d / 2, top / 2];
	const radius = Math.hypot(plan.w / 2, plan.d / 2, top / 2) + 2;
	const unit = { origin: [0, 0] as [number, number], scale: 1, azimuth, elevation };
	const [ux, uy] = k.iso(centre, unit);
	// iso() scales by scale × √1.6; undo that so the sphere's diameter fills the card.
	const scale = (width - 2 * pad) / (2 * radius * Math.sqrt(1.6));
	const half = width / 2;
	const P = {
		origin: [half - ux * scale, half - uy * scale] as [number, number],
		scale,
		azimuth,
		elevation
	};
	return { P, width, height: width };
}

/**
 * Collects one layer's parts and paints them back to front. Parts that share a `group` (a board and
 * what is mounted on it) are painted together, at the group's depth, lower tiers first.
 */
export function scene(P: Projection) {
	const below = k.fromBelow(P);
	const items: { g: number; tier: number; d: number; svg: string }[] = [];
	return {
		add(at: Point3, svg: string, tier = 0, group?: Point3) {
			items.push({ g: k.depthOf(group ?? at, P), tier, d: k.depthOf(at, P), svg });
		},
		svg: () =>
			items
				// Seen from below, what is mounted on a board is behind it: tiers run the other way.
				.sort((a, b) => a.g - b.g || (a.tier - b.tier) * (below ? -1 : 1) || a.d - b.d)
				.map((item) => item.svg)
				.join('')
	};
}

/** Convex hull of screen points (monotone chain). */
function hull(points: [number, number][]) {
	const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const cross = (o: number[], a: number[], b: number[]) =>
		(a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const half = (list: [number, number][]) => {
		const out: [number, number][] = [];
		for (const p of list) {
			while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
			out.push(p);
		}
		return out.slice(0, -1);
	};
	return [...half(pts), ...half([...pts].reverse())];
}

const pathOf = (points: [number, number][]) =>
	`M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
const EVERYWHERE = 'M-9999 -9999H9999V9999H-9999Z';

export function parts(P: Projection, id: string) {
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	let clips = 0;
	const clipId = () => `${id}-c${clips++}`;
	const toward = k.towardViewer(P);
	const below = k.fromBelow(P);
	/** Whether a vertical face with this outward normal faces the viewer. */
	const visible = (nx: number, ny: number) => toward[0] * nx + toward[1] * ny > 0.02;
	/** A polygon on any face, from world points. */
	const face = (pts: Point3[]) => pathOf(pts.map(at));
	/** A path on a horizontal face seen from below (a board's or shell's underside); empty from above. */
	const beneath = (points: [number, number][], z: number, closed = false) =>
		below ? pathOf(points.map(([x, y]) => at([x, y, z]))).replace(/Z$/, closed ? 'Z' : '') : '';
	/** Draws `svg` only outside a body's silhouette: for parts behind the body, which it hides. */
	function behind(bodyFill: string, svg: string) {
		const c = clipId();
		return `<clipPath id="${c}"><path clip-rule="evenodd" d="${EVERYWHERE}${bodyFill}"/></clipPath><g clip-path="url(#${c})">${svg}</g>`;
	}

	const centre = (plan: Plan, z: number): Point3 => [plan.x + plan.w / 2, plan.y + plan.d / 2, z];

	/** A circuit board with corner mounting holes and an edge silkscreen rule. */
	function pcb(plan: Plan, z: number, t = 1.2, holes = true) {
		const out = [S(k.slabOf(plan, z, t, P, 3, 0.3), { tone: 'mid' })];
		const top = z + t;
		out.push(L(k.planOutline(k.insetPlan(plan, 1), top, P, 3), { tone: 'faint' }));
		if (holes && plan.w > 14 && plan.d > 14) {
			const spots = k.corners(plan, 2.2);
			out.push(L(spots.map(([x, y]) => k.ring(x, y, 1, top, P, 14)).join(''), { tone: 'lo' }));
			out.push(
				k.dotsSvg(
					spots.map(([x, y]) => at([x, y, top])),
					{ size: 0.45, tone: 'lo' }
				)
			);
		}
		return out.join('');
	}

	/** A packaged chip with pin dots down its two long sides and a pin-1 mark. */
	function chip(plan: Plan, z: number, h = 1, pins = 0, axis: 'x' | 'y' = 'x') {
		const out = [S(k.slabOf(plan, z, h, P, 2, 0.2), { tone: 'lo', crease: 'faint' })];
		const top = z + h;
		out.push(k.dotsSvg([at([plan.x + 1.2, plan.y + 1.2, top])], { size: 0.5, tone: 'mid' }));
		if (pins) {
			const pts: [number, number][] = [];
			for (let i = 0; i < pins; i++) {
				const s = (i + 0.5) / pins;
				if (axis === 'x') {
					const x = plan.x + s * plan.w;
					pts.push(at([x, plan.y - 0.4, z]), at([x, plan.y + plan.d + 0.4, z]));
				} else {
					const y = plan.y + s * plan.d;
					pts.push(at([plan.x - 0.4, y, z]), at([plan.x + plan.w + 0.4, y, z]));
				}
			}
			out.push(k.dotsSvg(pts, { size: 0.35, tone: 'mid' }));
		}
		return out.join('');
	}

	/** A small SMD resistor or capacitor: a body with two end caps. */
	function smd(x: number, y: number, z: number, axis: 'x' | 'y' = 'x', len = 2, wide = 1.2) {
		const plan =
			axis === 'x'
				? { x: x - len / 2, y: y - wide / 2, w: len, d: wide, r: 0.2 }
				: { x: x - wide / 2, y: y - len / 2, w: wide, d: len, r: 0.2 };
		const cap = len * 0.22;
		const caps =
			axis === 'x'
				? [
						k.lineOnTop([plan.x + cap, plan.y], [plan.x + cap, plan.y + wide], z + 0.6, P),
						k.lineOnTop(
							[plan.x + len - cap, plan.y],
							[plan.x + len - cap, plan.y + wide],
							z + 0.6,
							P
						)
					]
				: [
						k.lineOnTop([plan.x, plan.y + cap], [plan.x + wide, plan.y + cap], z + 0.6, P),
						k.lineOnTop(
							[plan.x, plan.y + len - cap],
							[plan.x + wide, plan.y + len - cap],
							z + 0.6,
							P
						)
					];
		return S(k.slabOf(plan, z, 0.6, P, 2), {
			tone: 'lo',
			crease: 'none',
			inner: L(caps.join(''), { tone: 'mid' })
		});
	}

	/** A domed solder joint around a through-hole pin: the soldering, so it carries the accent. */
	function joint(x: number, y: number, z: number) {
		return (
			L(k.ring(x, y, 0.95, z, P, 14), { tone: 'lo' }) +
			S(k.cylinder(x, y, 0.6, z, 0.5, P, 12), { tone: 'hi', crease: 'none', lit: true }) +
			k.dotsSvg([at([x, y, z + 0.5])], { size: 0.3, tone: 'hi' })
		);
	}

	/** A solder joint on a board's underside (the board's bottom face at z): seen only from below. */
	function jointUnder(x: number, y: number, z: number) {
		const ring = below
			? L(
					`M${k
						.circleRing(x, y, 0.95, 14)
						.map(([px, py]) => at([px, py, z]).join(' '))
						.join('L')}Z`,
					{ tone: 'lo' }
				)
			: '';
		return (
			ring +
			S(k.cylinder(x, y, 0.6, z - 0.5, 0.5, P, 12), { tone: 'hi', crease: 'none', lit: true })
		);
	}

	/** A row of through-hole pads at 2.54 mm pitch. Soldered ones get a joint, the rest a bare ring. */
	function header(
		x: number,
		y: number,
		z: number,
		n: number,
		axis: 'x' | 'y',
		soldered: number[] = []
	) {
		const out: string[] = [];
		const order = Array.from({ length: n }, (_, i) => i);
		for (const i of order) {
			const px = axis === 'x' ? x + i * 2.54 : x;
			const py = axis === 'y' ? y + i * 2.54 : y;
			out.push(
				soldered.includes(i)
					? joint(px, py, z)
					: L(k.ring(px, py, 0.8, z, P, 12), { tone: 'lo' }) +
							k.dotsSvg([at([px, py, z])], { size: 0.35, tone: 'lo' })
			);
		}
		return out.join('');
	}

	/** Where pin i of a header sits, for wires. */
	const pin = (x: number, y: number, z: number, i: number, axis: 'x' | 'y'): Point3 =>
		axis === 'x' ? [x + i * 2.54, y, z + 0.5] : [x, y + i * 2.54, z + 0.5];

	/** A USB-C receptacle: a rounded steel shell whose mouth faces along +x, −x, +y or −y. */
	function usbc(cx: number, cy: number, z: number, facing: 'x' | '-x' | 'y' | '-y', reach = 7.4) {
		const sign = facing.startsWith('-') ? -1 : 1;
		const along = facing.endsWith('x') ? 'x' : 'y';
		const lo = sign > 0 ? -reach : 0;
		const plan =
			along === 'x'
				? { x: cx + lo, y: cy - 4.5, w: reach, d: 9, r: 1.4 }
				: { x: cx - 4.5, y: cy + lo, w: 9, d: reach, r: 1.4 };
		const seam = sign > 0 ? -reach + 1.5 : reach - 1.5;
		const top = z + 3.2;
		return (
			S(k.slabOf(plan, z, 3.2, P, 4, 0.3), { tone: 'mid' }) +
			L(
				along === 'x'
					? k.lineOnTop([cx + seam, cy - 3], [cx + seam, cy + 3], top, P)
					: k.lineOnTop([cx - 3, cy + seam], [cx + 3, cy + seam], top, P),
				{ tone: 'lo' }
			)
		);
	}

	/** A 6 × 6 tact switch standing on its legs: base, steel cover with four tabs, round plunger. */
	function tact(x: number, y: number, z: number, base = 3.5) {
		const plan = { x: x - 3, y: y - 3, w: 6, d: 6, r: 0.4 };
		const out = [S(k.slabOf(plan, z, base, P, 2, 0.2), { tone: 'lo' })];
		const cover = k.insetPlan(plan, 0.3);
		out.push(S(k.slabOf(cover, z + base, 0.3, P, 2), { tone: 'mid', crease: 'none' }));
		out.push(
			k.dotsSvg(
				k.corners(plan, 1).map(([px, py]) => at([px, py, z + base + 0.3])),
				{ size: 0.35, tone: 'lo' }
			)
		);
		out.push(S(k.cylinder(x, y, 1.75, z + base + 0.3, 1.2, P, 20), { tone: 'hi' }));
		return out.join('');
	}

	/** A countersunk screw head seen on a face. */
	function screw(x: number, y: number, z: number, r = 1.8) {
		return (
			L(k.ring(x, y, r, z, P, 18), { tone: 'mid' }) +
			L(k.lineOnTop([x - r * 0.6, y], [x + r * 0.6, y], z, P), { tone: 'lo' }) +
			L(k.lineOnTop([x, y - r * 0.6], [x, y + r * 0.6], z, P), { tone: 'lo' })
		);
	}

	/**
	 * Text lying on a top face along x. The kit's floor is left-handed, so the figure is shown mirrored
	 * (see Anatomy.svelte) and the text is mirrored here to match. `anchor` is in world terms: "start"
	 * runs the text from (x, y) toward +x, and the glyphs stand on the +y side of y. It is turned half
	 * a turn whenever that would read right to left.
	 */
	function text(
		x: number,
		y: number,
		z: number,
		value: string,
		{
			anchor = 'start',
			slant = 0,
			heavy = false,
			...style
		}: NonNullable<Parameters<typeof k.faceTextSvg>[2]> & { slant?: number; heavy?: boolean } = {}
	) {
		if (below) return '';
		// Italic is a skew in the glyphs' own space, applied before anything else.
		const skew = slant ? ` skewX(${-slant})` : '';
		const dx = at([x + 1, y, z])[0] - at([x, y, z])[0];
		const cap = (style.size ?? 3) * 0.72;
		const swap = anchor === 'start' ? 'end' : anchor === 'end' ? 'start' : anchor;
		const svg =
			dx <= 0
				? k.faceTextSvg(`${k.topMatrix([x, y], z, P, 'x')} scale(1 -1)${skew}`, value, {
						anchor,
						...style
					})
				: k.faceTextSvg(`${k.topMatrix([x, y + cap], z, P, 'x')} scale(-1 1)${skew}`, value, {
						anchor: swap,
						...style
					});
		return heavy
			? svg.replace(
					'<text ',
					'<text font-weight="900" font-style="normal" style="font-family:Figtree,sans-serif" '
				)
			: svg;
	}

	/**
	 * An open printed tray: walls to `h`, a floor at `floor`, whatever sits on the floor clipped by the
	 * rim. `over` is its outside again, minus the opening and everything above it on screen, drawn after
	 * the parts that sit inside so the near walls hide them. `sides` holds details on its outer walls.
	 */
	function tray(
		plan: Plan,
		h: number,
		wall: number,
		floor: number,
		onFloor = '',
		sides = '',
		back: { holes?: Plan[]; marks?: string; parts?: string } = {}
	) {
		// From below it is a closed box, its floor hiding whatever is inside except through the
		// openings in its back. `marks` are lines on the back face, `parts` stand out of it.
		if (below) {
			const paths = k.slabOf(plan, 0, h, P, 8, 0.6);
			const holes = back.holes ?? [];
			const rings = holes.map((o) => beneath(k.ringOf(o, 4), 0, true)).join('');
			const body = S(
				{ ...paths, fill: paths.fill + rings, top: paths.top + rings },
				{ tone: 'mid', inner: sides + (back.marks ?? '') }
			).replace(/class="iso-(fill|top)"/g, '$& fill-rule="evenodd"');
			const walls = holes
				.map((o) => {
					const rim = beneath(k.ringOf(o, 4), 0, true);
					const c = clipId();
					return (
						`<clipPath id="${c}"><path d="${rim}"/></clipPath>` +
						`<path class="iso-shade" data-shade="1" fill-rule="evenodd" clip-path="url(#${c})" d="${rim}${beneath(k.ringOf(o, 4), floor, true)}"/>` +
						L(rim, { tone: 'mid' })
					);
				})
				.join('');
			return { svg: body + walls + (back.parts ?? ''), over: '' };
		}
		const inner = k.insetPlan(plan, wall);
		const ring = k.ringOf(inner, 8);
		const rim = k.onTop(ring, h, P, true);
		const c = clipId();
		const svg = [
			`<path class="iso-halo" d="${k.haloOf(plan, 0, h, P)}"/>`,
			S(k.slabOf(plan, 0, h, P, 8, 0.6), { tone: 'mid' }),
			`<clipPath id="${c}"><path d="${rim}"/></clipPath>`,
			`<g clip-path="url(#${c})">`,
			`<path class="iso-shade" data-shade="1" d="${rim}"/>`,
			`<path class="iso-top" d="${k.onTop(ring, floor, P, true)}"/>`,
			onFloor,
			'</g>',
			L(rim, { tone: 'mid' })
		].join('');
		// The opening swept up the screen: nothing in it, or above it, belongs to the near walls.
		const mouth = ring.map(([x, y]) => at([x, y, h]));
		const swept = hull([...mouth, ...mouth.map(([x, y]): [number, number] => [x, y - 9999])]);
		const o = clipId();
		const over = [
			`<clipPath id="${o}"><path clip-rule="evenodd" d="${EVERYWHERE}${pathOf(swept)}"/></clipPath>`,
			`<g clip-path="url(#${o})">`,
			S(k.slabOf(plan, 0, h, P, 8, 0.6), { tone: 'mid' }),
			sides,
			'</g>',
			L(rim, { tone: 'mid' })
		].join('');
		return { svg, over };
	}

	/**
	 * A slab from z to top with openings cut through its top face, so whatever lies below shows through.
	 * Each opening is `depth` deep; its far walls are shaded and clipped by its rim.
	 */
	function holed(
		plan: Plan,
		z: number,
		top: number,
		holes: Plan[],
		depth: number,
		style: k.SolidStyle = {}
	) {
		const paths = k.slabOf(plan, z, top - z, P, 8, 0.8);
		if (below) return { svg: S(paths, style), fill: paths.fill };
		const rings = holes.map((h) => k.onTop(k.ringOf(h, 4), top, P, true)).join('');
		const body = S({ ...paths, fill: paths.fill + rings, top: paths.top + rings }, style).replace(
			/class="iso-(fill|top)"/g,
			'$& fill-rule="evenodd"'
		);
		const walls = holes
			.map((h) => {
				const rim = k.onTop(k.ringOf(h, 4), top, P, true);
				const floor = k.onTop(k.ringOf(h, 4), top - depth, P, true);
				const c = clipId();
				return (
					`<clipPath id="${c}"><path d="${rim}"/></clipPath>` +
					`<path class="iso-shade" data-shade="1" fill-rule="evenodd" clip-path="url(#${c})" d="${rim}${floor}"/>` +
					L(rim, { tone: 'mid' })
				);
			})
			.join('');
		return { svg: body + walls, fill: paths.fill };
	}

	/**
	 * A shell open toward the bottom, seen from below: its outside minus the opening (and everything
	 * below it on screen), to draw after the parts it encloses. Empty when seen from above.
	 */
	function hollow(plan: Plan, z0: number, z1: number, wall: number, sides = '') {
		if (!below) return '';
		const mouth = k.ringOf(k.insetPlan(plan, wall), 8).map(([x, y]) => at([x, y, z0]));
		const swept = hull([...mouth, ...mouth.map(([x, y]): [number, number] => [x, y + 9999])]);
		const c = clipId();
		return [
			`<clipPath id="${c}"><path clip-rule="evenodd" d="${EVERYWHERE}${pathOf(swept)}"/></clipPath>`,
			`<g clip-path="url(#${c})">`,
			S(k.slabOf(plan, z0, z1 - z0, P, 8, 0.8), { tone: 'hi', inner: sides }),
			'</g>'
		].join('');
	}

	return {
		at,
		centre,
		hollow,
		beneath,
		visible,
		face,
		behind,
		pcb,
		chip,
		smd,
		joint,
		jointUnder,
		header,
		pin,
		usbc,
		tact,
		screw,
		text,
		tray,
		holed
	};
}

/** A wire that leaves one layer's pad, runs out to a lane at x = `lane`, drops straight down, and runs back in to another layer's pad. */
export function harness(
	from: Anchor,
	to: Anchor,
	lane: number,
	slot: number,
	tone: Link['tone'] = 'lit'
): Link {
	const up = (a: Anchor, x = a.p[0]): Anchor => ({ p: [x, a.p[1], a.p[2] + 1.2], layer: a.layer });
	const drop: Anchor = { p: [lane, from.p[1], to.p[2] + 1.2], layer: to.layer };
	return { slot, from, to, via: [up(from), up(from, lane), drop, up(to, lane), up(to)], tone };
}

/** Screen points of a link with each anchor lifted by its layer's offset. */
export function linkSvg(link: Link, P: Projection, lift: (layer: number) => number) {
	const pt = (a: Anchor) => k.iso([a.p[0], a.p[1], a.p[2] + lift(a.layer)], P);
	return k.wireSvg(pt(link.from), pt(link.to), {
		via: (link.via ?? []).map(pt),
		tone: link.tone ?? 'lit',
		size: 0.7
	});
}
