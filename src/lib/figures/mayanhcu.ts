// Máy Anh Cũ: the pocket camera, opened from the rear shell up to the front.
// Every position comes from the case script (3d/cad/params.py): body 88 × 52 × 24.8 with an 8 mm
// rear shell and a 16.8 mm front shell joined by four screwed posts. Its Z runs from the front face
// back; here z runs from the rear face up, so z = 24.8 − Z and the lens looks up.
import * as k from '$lib/iso/iso-kit';
import {
	frame,
	harness,
	parts,
	scene,
	type Anchor,
	type Figure,
	type Link,
	type Point3
} from './parts';

const W = 88;
const D = 52;
const TOP = 24.8;
const SEAM = 8;
const WALL = 1.8;
const LIFTS = [0, 12, 26, 44, 82];
const BODY = { x: 0, y: 0, w: W, d: D, r: 8 };
const LENS = [18, 26] as const;
const FLASH = [26, 44] as const;
const SCREWS = [
	[8, 4.8],
	[8, 47.2],
	[83.7, 20],
	[80, 47]
];
const TACTS = [
	[64.5, 31],
	[64.5, 21]
];
const TFT = { x: 4, y: 9, w: 56, d: 34, r: 1 };
const TFT_TOP = 5.8;
const CELL = { x: 29, y: 3, w: 50, d: 34, r: 2.5 };
const CELL_Z = TOP - 8.4;
const GAUGE = { x: 45, y: 10, w: 22, d: 18, r: 1 };
const GAUGE_TOP = TOP - 8.8;
const XIAO = { x: 3.4, y: 17.25, w: 21, d: 17.5, r: 1.2 };
const XIAO_Z = 16.6;
const SENSE_Z = 18.6;
const SENSE_TOP = SENSE_Z + 1;
const PERF = { x: 31, y: 40, w: 11, d: 7, r: 0.4 };
const PERF_TOP = 15.2;
const SHUTTER_X = 71;

export function mayanhcu(azimuth = -56, elevation = 30): Figure {
	const { P, width, height } = frame(BODY, TOP + LIFTS[4], azimuth, elevation);
	const p = parts(P, 'mayanhcu');
	const S = k.solidSvg;
	const L = k.lineSvg;
	const at = p.at;
	const mid = (plan: typeof BODY, z: number): Point3 => p.centre(plan, z);

	// Layer 0: the rear shell, open toward the front: screen window, display pocket, button pockets, screw bosses.
	function rear() {
		const floor = WALL;
		const s = scene(P);
		const window = { x: 10.5, y: 11, w: 36, d: 30, r: 1 };
		s.add(
			mid(window, floor),
			`<path class="iso-shade" data-shade="0" d="${k.onTop(k.ringOf(window, 3), floor, P, true)}"/>` +
				L(k.planOutline(window, floor, P, 3), { tone: 'mid' }),
			-1
		);
		// The display pocket's frame, with a retaining nub at each corner.
		const frameWalls = [
			{ x: 2.9, y: 7.9, w: 58.2, d: 1, r: 0.2 },
			{ x: 2.9, y: 43.1, w: 58.2, d: 1, r: 0.2 },
			{ x: 2.9, y: 8.9, w: 1, d: 34.2, r: 0.2 },
			{ x: 60.1, y: 8.9, w: 1, d: 34.2, r: 0.2 }
		];
		for (const wall of frameWalls)
			s.add(mid(wall, floor), S(k.slabOf(wall, floor, 6, P, 2, 0.2), { tone: 'mid' }));
		for (const [x, y] of [
			[6, 8.9],
			[56, 8.9],
			[6, 42.5],
			[56, 42.5]
		]) {
			const nub = { x: x - 1, y, w: 2, d: 0.6, r: 0.1 };
			s.add(mid(nub, 6.3), S(k.slabOf(nub, 6.3, 1.5, P, 1), { tone: 'mid', crease: 'none' }), 1);
		}
		// Button pockets: a wall either side, the key's flange in its hole.
		for (const [x, y] of TACTS) {
			for (const dy of [3.25, -4.65]) {
				const wall = { x: x - 3.25, y: y + dy, w: 6.5, d: 1.4, r: 0.2 };
				s.add(mid(wall, floor), S(k.slabOf(wall, floor, 4, P, 2, 0.2), { tone: 'mid' }));
			}
			s.add(
				[x, y, floor],
				L(k.ring(x, y, 2.1, floor, P, 20), { tone: 'mid' }) +
					S(k.cylinder(x, y, 3, floor, 0.8, P, 28), { tone: 'hi' }),
				-1
			);
		}
		for (const [x, y] of SCREWS)
			s.add(
				[x, y, floor],
				S(k.cylinder(x, y, 2.5, floor, 1.6, P, 28, 0.2), { tone: 'mid' }) +
					L(k.ring(x, y, 1.2, floor + 1.6, P, 16), { tone: 'lo' }) +
					k.dotsSvg([at([x, y, floor + 1.6])], { size: 0.4, tone: 'lo' })
			);
		// The back itself: the screen window, the two button caps standing 1.2 mm out, four screw heads.
		const counterbores = SCREWS.map(([x, y]) => {
			const ring = (r: number) => k.circleRing(x, y, r, 24);
			const head = p.beneath(ring(2.1), 0, true);
			return (
				(head ? `<path class="iso-shade" data-shade="0" d="${head}"/>` : '') +
				L(head, { tone: 'mid' }) +
				L(p.beneath(ring(1.6), 0, true), { tone: 'lo' }) +
				L(
					p.beneath(
						[
							[x - 0.9, y],
							[x + 0.9, y]
						],
						0
					) +
						p.beneath(
							[
								[x, y - 0.9],
								[x, y + 0.9]
							],
							0
						),
					{
						tone: 'lo'
					}
				)
			);
		}).join('');
		const caps = [...TACTS]
			.sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))
			.map(([x, y]) => S(k.cylinder(x, y, 2, -1.2, 1.2, P, 28, 0.3), { tone: 'hi', lit: true }))
			.join('');
		return p.tray(BODY, SEAM, WALL, floor, s.svg(), '', {
			holes: [window],
			marks: counterbores,
			parts: caps
		});
	}

	// Layer 1: the TFT from its back, and the two rear buttons upside down with their legs soldered.
	function screen() {
		const s = scene(P);
		const tft = mid(TFT, 4.6);
		// The panel faces the back: seen from below, its screen shows a viewfinder.
		const face = (pts: [number, number][]) => p.beneath(pts, WALL, true);
		const active = k.ringOf({ x: 10, y: 10.5, w: 37, d: 31, r: 0.3 }, 1);
		const grid =
			[22.3, 34.7]
				.map((x) =>
					p.beneath(
						[
							[x, 10.5],
							[x, 41.5]
						],
						WALL
					)
				)
				.join('') +
			[20.8, 31.2]
				.map((y) =>
					p.beneath(
						[
							[10, y],
							[47, y]
						],
						WALL
					)
				)
				.join('');
		const bracket = [
			[
				[26, 23],
				[26, 22],
				[27, 22]
			],
			[
				[31, 22],
				[32, 22],
				[32, 23]
			],
			[
				[26, 29],
				[26, 30],
				[27, 30]
			],
			[
				[31, 30],
				[32, 30],
				[32, 29]
			]
		]
			.map((pts) => p.beneath(pts as [number, number][], WALL))
			.join('');
		const viewfinder = p.beneath(active, WALL, true)
			? `<path class="iso-shade" data-shade="0" d="${face(active)}"/>` +
				L(grid, { tone: 'lo' }) +
				L(bracket, { tone: 'lit' })
			: '';
		s.add(
			tft,
			S(k.slabOf({ x: 7, y: 10, w: 44, d: 32, r: 0.6 }, WALL, 4.6 - WALL, P, 2), {
				tone: 'lo',
				inner: viewfinder
			}),
			-1,
			tft
		);
		s.add(tft, p.pcb(TFT, 4.6), 0, tft);
		s.add(tft, p.header(58, 17.1, TFT_TOP, 8, 'y', [0, 1, 2, 3, 4, 5, 6, 7]), 1, tft);
		const slot = { x: 6, y: 19, w: 14, d: 14, r: 0.5 };
		s.add(
			mid(slot, TFT_TOP),
			S(k.slabOf(slot, TFT_TOP, 1.8, P, 2, 0.3), {
				tone: 'mid',
				inner: L(k.lineOnTop([8, 26], [18, 26], TFT_TOP + 1.8, P), { tone: 'faint' })
			}),
			2,
			tft
		);
		const reg = { x: 42, y: 30, w: 6.5, d: 3.5, r: 0.2 };
		s.add(mid(reg, TFT_TOP), p.chip(reg, TFT_TOP, 1.4, 0), 1, tft);
		s.add(
			tft,
			[26, 30, 34].map((x) => p.smd(x, 24, TFT_TOP)).join('') + p.smd(52, 14, TFT_TOP, 'y'),
			1,
			tft
		);
		s.add(
			tft,
			p.text(24, 13.7, TFT_TOP, '1.8 TFT · ST7735 · 128×160', { size: 1.8, tone: 'lo' }),
			1,
			tft
		);
		for (const [x, y] of TACTS) {
			const body = { x: x - 3, y: y - 3, w: 6, d: 6, r: 0.4 };
			const legs = k.corners(body, 0.6);
			s.add(
				[x, y, 2.6],
				S(k.slabOf(body, 2.6, 4, P, 2, 0.2), { tone: 'lo' }) +
					legs.map(([lx, ly]) => p.joint(lx, ly, 6.6)).join('')
			);
		}
		return s.svg();
	}

	// Layer 2: XIAO with the Sense board on its front, the fuel gauge under the cell, the flash driver.
	function core() {
		const s = scene(P);
		const xiao = mid(XIAO, XIAO_Z);
		// The XIAO faces the rear: USB-C and shield hang below its board.
		s.add(xiao, p.usbc(1.6, 26, XIAO_Z - 3.2, '-x'), -1, xiao);
		s.add(
			xiao,
			S(k.slabOf({ x: 11, y: 20, w: 12, d: 12, r: 0.4 }, XIAO_Z - 2.4, 2.4, P, 2), { tone: 'mid' }),
			-1,
			xiao
		);
		s.add(xiao, p.pcb(XIAO, XIAO_Z, 1, false), 0, xiao);
		s.add(xiao, p.pcb(XIAO, SENSE_Z, 1, false), 1, xiao);
		const pads = [17.9, 34.1].flatMap((y) =>
			Array.from({ length: 7 }, (_, i) => p.joint(5.6 + i * 2.54, y, SENSE_TOP))
		);
		s.add(xiao, pads.join(''), 2, xiao);
		const card = { x: 3.4, y: 20, w: 11.6, d: 12, r: 0.4 };
		s.add(
			mid(card, SENSE_TOP),
			S(k.slabOf(card, SENSE_TOP, 1.6, P, 2, 0.3), {
				tone: 'mid',
				inner: L(k.lineOnTop([5, 26], [14, 26], SENSE_TOP + 1.6, P), { tone: 'faint' })
			}),
			2,
			xiao
		);
		// J1 and J2, cut so D11 and D12 are free for the flash and the backlight.
		s.add(
			xiao,
			[19, 22]
				.map(
					(x) =>
						L(k.planOutline({ x: x - 1, y: 31.6, w: 2, d: 1.2, r: 0.2 }, SENSE_TOP, P, 2), {
							tone: 'lo'
						}) + L(k.lineOnTop([x - 0.8, 32.8], [x + 0.8, 31.6], SENSE_TOP, P), { tone: 'red' })
				)
				.join(''),
			2,
			xiao
		);
		s.add(
			[20.4, 22.6, SENSE_TOP],
			S(k.slabOf({ x: 17.4, y: 20.2, w: 6, d: 4.8, r: 0.3 }, SENSE_TOP, 1.2, P, 2), { tone: 'lo' }),
			2,
			xiao
		);

		// MAX17048 gauge: parts hang under its board, the joints face the cell.
		const gauge = mid(GAUGE, GAUGE_TOP - 1.2);
		for (const y of [11.5, 20.5])
			s.add(
				gauge,
				S(k.slabOf({ x: 45.6, y, w: 6, d: 7, r: 0.4 }, GAUGE_TOP - 1.2 - 4.4, 4.4, P, 2, 0.3), {
					tone: 'hi'
				}),
				-1,
				gauge
			);
		s.add(gauge, p.pcb(GAUGE, GAUGE_TOP - 1.2), 0, gauge);
		s.add(
			gauge,
			[14, 16, 23, 25].map((y) => p.joint(47, y, GAUGE_TOP)).join('') +
				p.header(63.6, 13.2, GAUGE_TOP, 4, 'y', [0, 1, 2, 3]) +
				p.text(56, 25.3, GAUGE_TOP, 'MAX17048', { size: 1.8, tone: 'lo', anchor: 'middle' }),
			1,
			gauge
		);

		// The flash driver: a transistor and its two resistors on a scrap of perfboard.
		const perf = mid(PERF, PERF_TOP - 1.2);
		s.add(perf, p.pcb(PERF, PERF_TOP - 1.2, 1.2, false), 0, perf);
		const halfDisc: [number, number][] = Array.from({ length: 13 }, (_, i) => {
			const a = (i / 12) * Math.PI;
			return [39 + Math.cos(a) * 2.3, 42.6 + Math.sin(a) * 2.3];
		});
		s.add(
			[39, 43.6, PERF_TOP],
			S(k.extrude(halfDisc, PERF_TOP, 4.4, P, { bevel: 0.2 }), { tone: 'lo' }),
			2,
			perf
		);
		for (const y of [41.6, 44.6]) {
			const band = [32.8, 33.6, 34.4]
				.map((x) => k.lineOnTop([x, y - 0.7], [x, y + 0.7], PERF_TOP + 1.4, P))
				.join('');
			s.add(
				[34, y, PERF_TOP],
				S(k.slabOf({ x: 32, y: y - 0.7, w: 4.4, d: 1.4, r: 0.6 }, PERF_TOP, 1.4, P, 4), {
					tone: 'mid',
					crease: 'none',
					inner: L(band, { tone: 'hi' })
				}),
				1,
				perf
			);
		}
		return s.svg();
	}

	// Layer 3: what sits right behind the front wall: cell, camera, flash LED, shutter.
	function front() {
		const s = scene(P);
		const cellTop = CELL_Z + 6.3;
		s.add(
			mid(CELL, CELL_Z),
			S(k.slabOf(CELL, CELL_Z, 6.3, P, 4, 0.5), {
				tone: 'mid',
				inner:
					L(k.planOutline(k.insetPlan(CELL, 3), cellTop, P, 3), { tone: 'lo' }) +
					p.text(36, 28.1, cellTop, 'EEMB 603449', { size: 2.6, tone: 'mid' }) +
					p.text(36, 23.4, cellTop, '3.7 V · 1100 mAh', { size: 2.2, tone: 'lo' }) +
					L([12, 15].map((y) => k.lineOnTop([36, y], [62, y], cellTop, P)).join(''), {
						tone: 'faint',
						free: true
					})
			})
		);
		// OV2640: square base behind the lens hole, barrel reaching into it.
		const [lx, ly] = LENS;
		s.add(
			[lx, ly, 21],
			S(k.slabOf({ x: lx - 4.5, y: ly - 4.5, w: 9, d: 9, r: 0.6 }, 21, 2, P, 2, 0.3), {
				tone: 'lo'
			}) +
				S(k.cylinder(lx, ly, 3.6, 23, 1.8, P, 36, 0.3), { tone: 'mid' }) +
				L(k.ring(lx, ly, 2.2, 24.8, P, 28), { tone: 'hi' }) +
				S(k.cylinder(lx, ly, 1.5, 24.8, 0.1, P, 24), { tone: 'hi', lit: true })
		);
		// The 5 mm flash LED, flange down, dome up into its hole.
		const [fx, fy] = FLASH;
		s.add(
			[fx, fy, 17.5],
			S(k.cylinder(fx, fy, 3, 17.5, 1, P, 28), { tone: 'mid' }) +
				S(k.cylinder(fx, fy, 2.5, 18.5, 6, P, 28, 0.2), { tone: 'hi', lit: true }) +
				L(k.ring(fx, fy, 1.2, 24.5, P, 18), { tone: 'mid' })
		);
		// The shutter: a tact switch on its side under the top wall, plunger out through it.
		const body = { x: SHUTTER_X - 3, y: D - WALL - 4, w: 6, d: 4, r: 0.3 };
		s.add(
			[SHUTTER_X, D - 4, 16.8],
			S(k.slabOf(body, 16.8, 6, P, 2, 0.2), { tone: 'lo' }) +
				S(k.slabOf({ x: SHUTTER_X - 1.75, y: D - WALL, w: 3.5, d: 1.2, r: 0.6 }, 18, 3.6, P, 4), {
					tone: 'hi'
				}) +
				p.joint(SHUTTER_X - 2, D - WALL - 2, 22.8) +
				p.joint(SHUTTER_X + 2, D - WALL - 2, 22.8)
		);
		return s.svg();
	}

	// Layer 4: the front shell: lens hole, flash hole, ANH Ø debossed, grip lobe, strap hole, side ports.
	function shell() {
		const [lx, ly] = LENS;
		const [fx, fy] = FLASH;
		const lens = { x: lx - 4, y: ly - 4, w: 8, d: 8, r: 4 };
		const flash = { x: fx - 2.5, y: fy - 2.5, w: 5, d: 5, r: 2.5 };
		const port = (y0: number, y1: number, z0: number, z1: number) => {
			const d = p.face([
				[0, y0, z0],
				[0, y1, z0],
				[0, y1, z1],
				[0, y0, z1]
			]);
			return `<path class="iso-shade" data-shade="0" d="${d}"/>` + L(d, { tone: 'mid' });
		};
		// USB-C (9.5 × 4) and the micro SD slot (12 × 2) on the left edge.
		const left = p.visible(-1, 0) ? port(21.25, 30.75, 13, 17) + port(20, 32, 19, 21) : '';
		const inner = [
			L(k.sideSeam(BODY, TOP - 1.5, P, 8), { tone: 'faint' }),
			p.text(62, 38.2, TOP, 'ANH Ø', { size: 5, tone: 'lo', anchor: 'middle' }),
			`<path class="iso-shade" data-shade="0" d="${k.onTop(k.circleRing(82.4, 5.6, 1.75, 18), TOP, P, true)}"/>`,
			L(k.ring(82.4, 5.6, 1.75, TOP, P, 18), { tone: 'mid' }),
			left
		].join('');
		const body = p.holed(BODY, SEAM, TOP, [lens, flash], WALL, { tone: 'hi', inner });
		under = p.hollow(BODY, SEAM, TOP, WALL, left);
		// Parts standing out of the outer walls: hidden by the body when their wall faces away.
		const grip = S(
			k.slabOf(
				{ x: W - 1, y: 11.4, w: 2.3, d: 31.2, r: 1.1 },
				SEAM + 0.6,
				TOP - SEAM - 1.6,
				P,
				4,
				0.4
			),
			{ tone: 'hi' }
		);
		const key = S(
			k.slabOf({ x: SHUTTER_X - 2, y: D - 0.4, w: 4, d: 2.4, r: 1.2 }, 17.8, 4, P, 6, 0.3),
			{ tone: 'hi', lit: true }
		);
		const extras = [
			{ svg: grip, front: p.visible(1, 0) },
			{ svg: key, front: p.visible(0, 1) }
		];
		return (
			extras
				.filter((e) => !e.front)
				.map((e) => p.behind(body.fill, e.svg))
				.join('') +
			body.svg +
			extras
				.filter((e) => e.front)
				.map((e) => e.svg)
				.join('')
		);
	}

	const A = (q: Point3, layer: number): Anchor => ({ p: q, layer });
	const pad = (i: number, far = false): Point3 => [
		5.6 + i * 2.54,
		far ? 34.1 : 17.9,
		SENSE_TOP + 0.5
	];
	const tft = (i: number) => p.pin(58, 17.1, TFT_TOP, i, 'y');
	const gauge = (i: number) => p.pin(63.6, 13.2, GAUGE_TOP, i, 'y');
	const jumper = (a: Point3, b: Point3, lift: number, tone: Link['tone'] = 'lit'): Link => {
		const z = Math.max(a[2], b[2]) + lift;
		return {
			slot: 2,
			from: A(a, 2),
			to: A(b, 2),
			via: [A([a[0], a[1], z], 2), A([b[0], b[1], z], 2)],
			tone
		};
	};
	let under = '';
	const tray = rear();
	const outer = shell();
	const links: Link[] = [
		// The display's eight lines, from its header across to the XIAO's pads.
		...[0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
			harness(A(tft(i), 1), A(pad(i % 4, i >= 4), 2), 26.4 + i * 0.3, 2)
		),
		// Rear buttons.
		harness(A([62, 34, 7.1], 1), A(pad(5), 2), 25.6, 2),
		harness(A([62, 24, 7.1], 1), A(pad(6), 2), 25.2, 2),
		// Gauge on I2C and power.
		...[0, 1, 2, 3].map((i) => jumper(gauge(i), pad(4 + (i % 3), true), 4 + i * 0.5)),
		// Flash: D11 to the driver, driver to the LED's legs.
		jumper(pad(6, true), [39, 41, PERF_TOP + 0.6], 6),
		{
			slot: 3,
			from: A([37, 44, PERF_TOP + 0.6], 2),
			via: [A([37, 44, 17.2], 3), A([FLASH[0] + 1.2, FLASH[1], 17.2], 3)],
			to: A([FLASH[0] + 1.2, FLASH[1], 17.5], 3)
		},
		// The shutter, up to its legs under the top wall.
		{
			slot: 3,
			from: A(pad(1, true), 2),
			via: [A([pad(1, true)[0], 47.4, SENSE_TOP + 1.4], 2), A([SHUTTER_X - 2, 47.4, 23.4], 3)],
			to: A([SHUTTER_X - 2, D - WALL - 2, 23.3], 3)
		},
		// The cell into the gauge, and the pass-through pigtail on to the XIAO's BAT pads.
		{
			slot: 3,
			from: A([CELL.x + 1, 23, CELL_Z + 1], 3),
			via: [A([27.6, 23, CELL_Z + 1], 3), A([27.6, 23, GAUGE_TOP + 1], 2)],
			to: A([47, 23, GAUGE_TOP + 0.5], 2),
			tone: 'red'
		},
		jumper([47, 14, GAUGE_TOP + 0.5], [22.4, 33, SENSE_TOP + 0.3], 2.6, 'red'),
		jumper([47, 16, GAUGE_TOP + 0.5], [22.4, 31, SENSE_TOP + 0.3], 2.2, 'lo'),
		// The camera's flex, from the Sense connector up to the module.
		{
			slot: 3,
			from: A([20.4, 22.6, SENSE_TOP + 1.2], 2),
			via: [A([20.4, 21.5, 21], 3)],
			to: A([LENS[0] + 2, LENS[1] - 4.5, 21.5], 3),
			tone: 'mid'
		}
	];

	return {
		id: 'mayanhcu',
		fig: 'Fig 2',
		title: 'Máy Anh Cũ · inside',
		label:
			'The Máy Anh Cũ camera opened into five layers: the 8 mm rear shell with its screen window, display pocket and button pockets, the 1.8 inch TFT from behind with the rear buttons soldered upside down, the XIAO ESP32-S3 Sense with the fuel gauge and flash driver, the cell with the OV2640, flash LED and shutter switch behind the front wall, and the 16.8 mm front shell with its lens hole, flash hole and ANH Ø.',
		caption:
			'88 × 52 × 24.8 mm, two printed shells held by four screwed posts. Amber lines are hand-soldered: eight to the screen, three to the buttons, four to the gauge, the flash through its driver. Red is the cell and its pass-through to the XIAO.',
		width,
		height,
		lifts: LIFTS,
		P,
		below: k.fromBelow(P),
		layers: [
			{
				name: 'Rear shell',
				role: 'screen window, display pocket with nubs, two button pockets, screw bosses',
				svg: tray.svg,
				over: { svg: tray.over, after: 1 }
			},
			{
				name: 'Screen and buttons',
				role: '1.8" ST7735 TFT from behind, two tact buttons',
				svg: screen()
			},
			{ name: 'Core', role: 'XIAO ESP32-S3 Sense, MAX17048 gauge, flash driver', svg: core() },
			{
				name: 'Behind the front',
				role: '1100 mAh LiPo, OV2640, 5 mm flash LED, shutter switch',
				svg: front()
			},
			{
				name: 'Front shell',
				role: '8 mm lens hole, flash, ANH Ø, grip lobe, strap hole, USB-C + SD',
				svg: outer,
				under: { svg: under, after: 2 }
			}
		],
		links
	};
}
