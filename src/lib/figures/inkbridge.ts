// inkbridge: the e-ink Home Assistant launcher, opened from the tray up to the keycaps.
// Layout from the case script: battery (48 × 34 × 6.3), XIAO ESP32-S3 (21 × 17.5) and a column of
// two Cherry MX switches side by side on the floor, the 65 × 30 e-paper module stacked above.
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

const W = 94.5;
const D = 45;
const SEAM = 10;
const H = 17;
const LIFTS = [0, 14, 30, 52, 76];
const BODY = { x: 0, y: 0, w: W, d: D, r: 8 };
const CELL = { x: 4, y: 5.5, w: 48, d: 34, r: 2.5 };
const MCU = { x: 53, y: 4, w: 17.5, d: 21, r: 1.2 };
const MCU_Z = 4;
const MCU_TOP = MCU_Z + 1;
const SWPCB = { x: 72.5, y: 4, w: 18, d: 37, r: 1 };
const SW_Z = 2;
const SW_TOP = SW_Z + 1.6;
const KEYS = [
	[81.5, 13],
	[81.5, 32.05]
] as const;
const PANEL = { x: 4, y: 7.5, w: 65, d: 30, r: 1 };
const PANEL_Z = 9;
const PANEL_TOP = PANEL_Z + 1.2;
const GLASS_TOP = PANEL_TOP + 1.2;

export function inkbridge(azimuth = -50, elevation = 30): Figure {
	const { P, width, height } = frame(BODY, 22 + LIFTS[4], azimuth, elevation);
	const p = parts(P, 'inkbridge');
	const S = k.solidSvg;
	const L = k.lineSvg;
	const at = p.at;
	const mid = (plan: typeof BODY, z: number): Point3 => p.centre(plan, z);

	// Layer 0: the printed tray: floor, the MCU's shelf and backstop, a rib by the switch column.
	function tray() {
		const floor = [
			L(k.planOutline({ x: 53, y: 4, w: 17.5, d: 21, r: 1.2 }, 2, P, 3), { tone: 'lo' }),
			L(k.planOutline(k.insetPlan(CELL, -0.4), 2, P, 3), { tone: 'faint' }),
			L(k.planOutline(k.insetPlan(SWPCB, -0.4), 2, P, 3), { tone: 'faint' })
		].join('');
		const s = scene(P);
		const ribs = [
			{ x: 53.4, y: 4.4, w: 2, d: 20.2, r: 0.3, h: 2 },
			{ x: 68.1, y: 4.4, w: 2, d: 20.2, r: 0.3, h: 2 },
			{ x: 54, y: 25.4, w: 16, d: 2, r: 0.3, h: 6 },
			{ x: 71, y: 30, w: 1.2, d: 12, r: 0.3, h: 5 }
		];
		for (const { h, ...plan } of ribs)
			s.add(mid(plan, 2), S(k.slabOf(plan, 2, h, P, 2, 0.3), { tone: 'mid' }));
		// USB-C opening in the near wall.
		const mouth = p.face([
			[57.2, 0, 4.4],
			[66.2, 0, 4.4],
			[66.2, 0, 7.4],
			[57.2, 0, 7.4]
		]);
		const sides = p.visible(0, -1)
			? `<path class="iso-shade" data-shade="0" d="${mouth}"/>` + L(mouth, { tone: 'mid' })
			: '';
		return p.tray(BODY, SEAM, 2, 2, floor + s.svg(), sides);
	}

	// Layer 1: the cell, the XIAO on its shelf, and the switch board with two MX switches.
	function floor() {
		const s = scene(P);
		const cellTop = 2 + 6.3;
		s.add(
			mid(CELL, 2),
			S(k.slabOf(CELL, 2, 6.3, P, 4, 0.5), {
				tone: 'mid',
				inner:
					L(k.planOutline(k.insetPlan(CELL, 3), cellTop, P, 3), { tone: 'lo' }) +
					p.text(44, 30, cellTop, 'EEMB 603449', { size: 2.6, tone: 'mid', anchor: 'end' }) +
					p.text(44, 24, cellTop, '3.7 V · 1100 mAh', { size: 2.2, tone: 'lo', anchor: 'end' }) +
					L([12, 15].map((y) => k.lineOnTop([18, y], [44, y], cellTop, P)).join(''), {
						tone: 'faint',
						free: true
					})
			})
		);
		const mcu = mid(MCU, MCU_Z);
		s.add(mcu, p.pcb(MCU, MCU_Z, 1, false), 0, mcu);
		s.add(
			mcu,
			S(k.slabOf({ x: 56, y: 9, w: 11.6, d: 12, r: 0.4 }, MCU_TOP, 2.4, P, 2, 0.3), {
				tone: 'mid',
				inner: L(k.planOutline({ x: 57, y: 10, w: 9.6, d: 10, r: 0.3 }, MCU_TOP + 2.4, P, 2), {
					tone: 'faint'
				})
			}),
			2,
			mcu
		);
		s.add([61.7, 5.8, MCU_TOP], p.usbc(61.7, 3, MCU_TOP, '-y', 5.6), 2, mcu);
		const pads: string[] = [];
		for (let i = 0; i < 7; i++)
			pads.push(p.joint(54, 8.4 + i * 2.54, MCU_TOP), p.joint(69.5, 8.4 + i * 2.54, MCU_TOP));
		s.add(mcu, pads.join(''), 1, mcu);
		s.add(
			[61, 23, MCU_TOP],
			p.smd(56, 23.6, MCU_TOP) + p.smd(66, 23.6, MCU_TOP) + p.tact(60.6, 22.6, MCU_TOP, 0.8),
			1,
			mcu
		);
		const board = mid(SWPCB, SW_Z);
		s.add(board, p.pcb(SWPCB, SW_Z, 1.6), 0, board);
		s.add(
			board,
			p.header(74.4, 18, SW_TOP, 3, 'y', [0, 1, 2]) +
				p.text(88.6, 22, SW_TOP, 'A  B', { size: 2.2, tone: 'lo', anchor: 'end' }),
			1,
			board
		);
		for (const [x, y] of KEYS) {
			const lower = { x: x - 7, y: y - 7, w: 14, d: 14, r: 0.6 };
			const upper = { x: x - 7.6, y: y - 7.6, w: 15.2, d: 15.2, r: 1 };
			const crown = { x: x - 5.6, y: y - 5.6, w: 11.2, d: 11.2, r: 1.2 };
			const svg =
				S(k.slabOf(lower, SW_TOP, 5, P, 2, 0.3), { tone: 'lo' }) +
				S(k.slabOf(upper, SW_TOP + 5, 1.6, P, 3, 0.3), { tone: 'mid' }) +
				S(k.slabOf(crown, SW_TOP + 6.6, 4.4, P, 3, 0.4), {
					tone: 'mid',
					inner: L(k.lineOnTop([x - 4, y + 3.4], [x - 1.6, y + 3.4], SW_TOP + 11, P), {
						tone: 'faint'
					})
				}) +
				S(k.cylinder(x, y, 2.8, SW_TOP + 11, 0.6, P, 24), { tone: 'mid', crease: 'none' }) +
				S(k.slabOf({ x: x - 2, y: y - 0.6, w: 4, d: 1.2, r: 0.2 }, SW_TOP + 11.6, 3.6, P, 1), {
					tone: 'hi',
					lit: true
				}) +
				S(k.slabOf({ x: x - 0.6, y: y - 2, w: 1.2, d: 4, r: 0.2 }, SW_TOP + 11.6, 3.6, P, 1), {
					tone: 'hi',
					lit: true
				});
			s.add([x, y, SW_TOP], svg, 2, board);
		}
		return s.svg();
	}

	// Layer 2: the e-paper module, showing its script grid.
	function panel() {
		const s = scene(P);
		const g = GLASS_TOP;
		const panel = mid(PANEL, PANEL_Z);
		s.add(panel, p.pcb(PANEL, PANEL_Z), 0, panel);
		s.add(panel, p.header(66.6, 13.8, PANEL_TOP, 8, 'y', [0, 1, 2, 3, 4, 5, 6, 7]), 1, panel);
		s.add(
			[61, 22, PANEL_TOP],
			p.smd(62, 12, PANEL_TOP, 'y') +
				p.smd(62, 32, PANEL_TOP, 'y') +
				p.chip({ x: 59.4, y: 18.4, w: 4, d: 8, r: 0.2 }, PANEL_TOP, 0.8, 4, 'y'),
			0
		);
		const tile = (x: number, y: number) =>
			L(k.planOutline({ x, y, w: 12, d: 12, r: 1.6 }, g, P, 4), { tone: 'hi' });
		const screen = [
			L(k.planOutline({ x: 9.4, y: 10.2, w: 48.55, d: 23.71, r: 0.4 }, g, P, 2), { tone: 'lo' }),
			tile(34, 15.6),
			tile(16, 15.6),
			// bulb and wifi glyphs inside the two tiles
			L(
				k.ring(40, 23, 2.4, g, P, 20) +
					k.lineOnTop([39, 19.4], [41, 19.4], g, P) +
					k.lineOnTop([39.2, 18.4], [40.8, 18.4], g, P),
				{ tone: 'hi' }
			),
			L(
				[1, 2.4, 3.8]
					.map((r) =>
						k.onTop(
							Array.from({ length: 9 }, (_, i) => {
								const a = Math.PI * (0.25 + (i / 8) * 0.5);
								return [22 + Math.cos(a) * r, 19 + Math.sin(a) * r] as [number, number];
							}),
							g,
							P
						)
					)
					.join(''),
				{ tone: 'hi' }
			),
			k.dotsSvg([at([22, 19, g])], { size: 0.6, tone: 'hi' }),
			L(k.lineOnTop([10.4, 13.4], [56.9, 13.4], g, P), { tone: 'mid' }),
			p.text(54.4, 11.2, g, 'A', { size: 2, tone: 'hi', anchor: 'end' }),
			p.text(26, 11.2, g, 'Sleep', { size: 1.8, tone: 'mid', anchor: 'middle' }),
			L(
				k.onTop(
					[
						[13, 11],
						[12.2, 12.2],
						[11.4, 11]
					],
					g,
					P
				) +
					k.onTop(
						[
							[16, 12.2],
							[15.2, 11],
							[14.4, 12.2]
						],
						g,
						P
					),
				{ tone: 'hi' }
			),
			L(k.lineOnTop([10.4, 31.4], [56.9, 31.4], g, P), { tone: 'faint' }),
			L(k.ring(14, 32.6, 0.7, g, P, 12), { tone: 'mid' })
		].join('');
		s.add(
			[33.8, 22.5, PANEL_TOP],
			S(k.slabOf({ x: 7.6, y: 9, w: 52.4, d: 27, r: 0.5 }, PANEL_TOP, 1.2, P, 2, 0.3), {
				tone: 'hi',
				inner: screen
			}),
			2,
			panel
		);
		// The panel's flex tail folded onto the board.
		s.add(
			[62, 33, PANEL_TOP],
			S(k.slabOf({ x: 60, y: 30, w: 4, d: 6, r: 0.2 }, PANEL_TOP, 0.3, P, 1), {
				tone: 'mid',
				crease: 'none'
			}),
			1,
			panel
		);
		return s.svg();
	}

	// Layer 3: the lid, with the screen window and two 19 mm switch openings.
	function lid() {
		const hole = (x: number, y: number) => ({ x: x - 9.5, y: y - 9.5, w: 19, d: 19, r: 2 });
		const window = { x: 9, y: 9.5, w: 52, d: 26, r: 2.5 };
		const inner =
			L(k.sideSeam(BODY, SEAM + 1.4, P, 8), { tone: 'lo' }) +
			L(k.planOutline(k.insetPlan(BODY, 1.4), H, P, 8), { tone: 'faint' }) +
			p.text(58, 4.6, H, 'inkbridge', { size: 2.6, tone: 'lo', anchor: 'end' }) +
			k.dotsSvg([at([62.6, 3.8, H])], { size: 0.7, tone: 'mid' });
		return p.holed(BODY, SEAM, H, [window, ...KEYS.map(([x, y]) => hole(x, y))], 2, {
			tone: 'hi',
			inner
		}).svg;
	}

	// Layer 4: two keycaps, A and B.
	function caps() {
		const s = scene(P);
		for (const [i, [x, y]] of KEYS.entries()) {
			const z = 15;
			s.add(
				[x, y, 15],
				S(k.slabOf({ x: x - 9, y: y - 9, w: 18, d: 18, r: 2 }, z, 4, P, 4, 0.5), { tone: 'mid' }) +
					S(k.slabOf({ x: x - 7, y: y - 7, w: 14, d: 14, r: 2.6 }, z + 4, 3, P, 4, 0.5), {
						tone: 'hi',
						lit: i === 0,
						inner:
							L(k.ring(x, y, 5, z + 7, P, 32), { tone: 'faint' }) +
							p.text(x, y - 1.6, z + 7, i ? 'B' : 'A', {
								size: 4.4,
								tone: 'hi',
								anchor: 'middle'
							})
					}),
				0
			);
		}
		return s.svg();
	}

	const A = (p: Point3, layer: number): Anchor => ({ p, layer });
	const xiao = (i: number): Point3 => [69.5, 8.4 + i * 2.54, MCU_TOP + 0.5];
	const xiaoFar = (i: number): Point3 => [54, 8.4 + i * 2.54, MCU_TOP + 0.5];
	const panelPin = (i: number) => p.pin(66.6, 13.8, PANEL_TOP, i, 'y');
	const sw = (i: number) => p.pin(74.4, 18, SW_TOP, i, 'y');
	const jumper = (a: Point3, b: Point3, lift: number, tone: Link['tone'] = 'lit'): Link => {
		const z = Math.max(a[2], b[2]) + lift;
		return {
			slot: 1,
			from: A(a, 1),
			to: A(b, 1),
			via: [A([a[0], a[1], z], 1), A([b[0], b[1], z], 1)],
			tone
		};
	};
	const links: Link[] = [
		// The display's eight SPI and control lines down to the XIAO's near pads.
		...[0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
			harness(A(panelPin(i), 2), A(i < 7 ? xiao(i) : xiaoFar(0), 1), 71 + i * 0.18, 2)
		),
		// Keys A and B, and their ground.
		jumper(sw(0), xiaoFar(5), 2.4),
		jumper(sw(1), xiaoFar(6), 3),
		jumper(sw(2), xiaoFar(4), 3.6, 'lo'),
		// The cell's leads under to the BAT pads.
		jumper([52, 34, 6], [60, 26, MCU_Z], 1.2, 'red'),
		jumper([52, 36, 6], [62, 26, MCU_Z], 1.6, 'lo')
	];

	const base = tray();

	return {
		id: 'inkbridge',
		fig: 'Fig 3',
		title: 'inkbridge · inside',
		label:
			'The inkbridge launcher opened into five layers: the printed tray with the XIAO shelf, the battery, XIAO ESP32-S3 and two Cherry MX switches side by side on the floor, the 2.13 inch e-paper module showing two script tiles, the lid with its window and switch openings, and two keycaps marked A and B.',
		caption:
			'94 × 45 mm, one row on the floor (battery, XIAO, switches) with only the e-paper panel stacked above. Amber lines are hand-soldered: eight to the panel, three to the switches; the cell feeds the XIAO’s BAT pads.',
		width,
		height,
		lifts: LIFTS,
		P,
		below: k.fromBelow(P),
		layers: [
			{
				name: 'Tray',
				role: 'PLA, XIAO shelf with backstop, USB-C opening',
				svg: base.svg,
				over: { svg: base.over, after: 2 }
			},
			{
				name: 'Floor row',
				role: '1100 mAh LiPo, XIAO ESP32-S3, two Cherry MX on their board',
				svg: floor()
			},
			{
				name: 'E-paper',
				role: 'Waveshare 2.13" V4, 250 × 122, script tiles drawn in 1-bit',
				svg: panel()
			},
			{
				name: 'Lid',
				role: 'screen window and two 19 mm switch openings',
				svg: lid(),
				under: { svg: p.hollow(BODY, SEAM, H, 2), after: 1 }
			},
			{ name: 'Keycaps', role: 'A runs, B goes back; short and long presses', svg: caps() }
		],
		links
	};
}
