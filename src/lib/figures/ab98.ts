// AB98: the Walkman-shaped music player, opened into its four layers.
// Every position comes from the case script (3d/ab98_case.py). Its inner cavity runs X 0..63 (left to
// right), Y 0..44 (bottom to top edge), Z 0..16 (lid to front); here every coordinate is shifted by the
// 1.6 mm wall, so the case is x 0..66.2, y 0..47.2, z 0..19 with the lid at the bottom and the front on top.
import * as k from '$lib/iso/iso-kit';
import { frame, parts, scene, type Figure, type Link, type Point3 } from './parts';

const W = 66.2;
const D = 47.2;
const H = 19;
const WALL = 1.6;
const FRONT = 1.4;
const INNER_TOP = H - FRONT; // the front wall's inside face (script Z = 16)
const LIFTS = [0, 16, 34, 66];
const CASE = { x: 0, y: 0, w: W, d: D, r: 2.5 };
// T-Display-S3: PCB back 6 mm behind the glass, glass against the front wall, USB-C at the right wall.
const BOARD = { x: 3.6, y: 19.6, w: 58.4, d: 26, r: 1 };
const PCB_BACK = INNER_TOP - 6; // 11.6
const PCB_FRONT = PCB_BACK + 1.2;
const GLASS = { x: 7.6, y: 20.1, w: 45, d: 25, r: 0.8 };
const WINDOW = { x: 8, y: 20.1, w: 45, d: 25, r: 1.5 };
const ROW_LO = 20.6;
const ROW_HI = 44.6;
const ROW_X = 5.4;
// DAC and SD module: PCBs flat on the front wall, their parts behind them.
const MOD_BACK = INNER_TOP - 1.5; // 16.1
const DAC = { x: 1.6, y: 1.6, w: 32, d: 17, r: 0.8 };
const JACK = [6.8, 13.6] as const; // x, and z of the hole in the bottom wall
const SD = { x: 40.2, y: 1.6, w: 18, d: 18, r: 0.6 };
const PERF = { x: 34.6, y: 3, w: 4.8, d: 12.6, r: 0.4 };
const BATTERY = { x: 23.1, y: 3.05, w: 35, d: 29.2, r: 2 };
const KEYS = [17.35, 27.85, 38.35, 48.85];
const SW_Y = 39.7; // switch bases lie from here to the actuators at the top wall
const SW_Z = 1.0;
const SCREW_YS = [6.6, 40.6];
const SCREW_Z = 4.35;

export function ab98(azimuth = -56, elevation = 30): Figure {
	const { P, width, height } = frame(CASE, H + LIFTS[3], azimuth, elevation);
	const p = parts(P, 'ab98');
	const S = k.solidSvg;
	const L = k.lineSvg;
	const at = p.at;
	const mid = (plan: typeof CASE, z: number): Point3 => p.centre(plan, z);
	const dark = (d: string) =>
		d ? `<path class="iso-shade" data-shade="0" d="${d}"/>` + L(d, { tone: 'mid' }) : '';

	// Layer 0: the back lid: screw tabs with heat-set inserts, battery frame, switch shelf and pockets.
	function lid() {
		const out = [`<path class="iso-halo" d="${k.haloOf(CASE, 0, WALL, P)}"/>`];
		const pockets = KEYS.map((x) =>
			dark(k.planOutline({ x: x - 3.1, y: SW_Y, w: 6.2, d: 4.1, r: 0.3 }, WALL, P, 2))
		).join('');
		const s = scene(P);
		// Everything below stands on the plate: from below, the plate is painted over it.
		const plate = mid(CASE, 0);
		s.add(plate, S(k.slabOf(CASE, 0, WALL, P, 8, 0.6), { tone: 'mid', inner: pockets }), 0, plate);
		// Battery frame: full-height walls with open corners for the leads, a lip on two of them.
		const B = BATTERY;
		const walls = [
			{ x: B.x + 3, y: B.y - 1.1, w: B.w - 6, d: 1, r: 0.3 },
			{ x: B.x - 1.1, y: B.y + 3, w: 1, d: B.d - 6, r: 0.3 },
			{ x: B.x + 3, y: B.y + B.d + 0.1, w: B.w - 6, d: 1, r: 0.3 },
			{ x: B.x + B.w + 0.1, y: B.y + 3, w: 1, d: B.d - 6, r: 0.3 }
		];
		walls.forEach((wall, i) => {
			const lip =
				i === 1 || i === 2
					? S(
							k.slabOf(
								i === 1
									? { x: wall.x, y: wall.y + 4, w: 1.8, d: wall.d - 8, r: 0.2 }
									: { x: wall.x + 4, y: wall.y - 0.8, w: wall.w - 8, d: 1.8, r: 0.2 },
								WALL + 5,
								0.6,
								P,
								1
							),
							{ tone: 'mid', crease: 'none' }
						)
					: '';
			s.add(
				mid(wall, WALL),
				S(k.slabOf(wall, WALL, 5, P, 2, 0.2), { tone: 'mid' }) + lip,
				1,
				plate
			);
		});
		// The shelf the switches lie against, with a slot for each pair of legs.
		const shelf = { x: 11.6, y: 38.1, w: 43, d: 1.6, r: 0.3 };
		const slots = KEYS.flatMap((x) =>
			[-3.25, 3.25].map((dx) =>
				dark(k.planOutline({ x: x + dx - 0.5, y: 38.4, w: 1, d: 1, r: 0.1 }, 7, P, 1))
			)
		).join('');
		s.add(
			mid(shelf, WALL),
			S(k.slabOf(shelf, WALL, 7 - WALL, P, 2, 0.2), { tone: 'mid', inner: slots }),
			1,
			plate
		);
		// Screw tabs: an M2 heat-set insert in each, facing the side wall the screw comes through.
		for (const side of [-1, 1])
			for (const y of SCREW_YS) {
				const tab = { x: side < 0 ? WALL : W - WALL - 5.3, y: y - 3, w: 5.3, d: 6, r: 0.5 };
				const fx = side < 0 ? tab.x : tab.x + tab.w;
				const insert = p.visible(side, 0)
					? dark(k.sideRing([fx, y, SCREW_Z], 1.6, 'x', P)) +
						k.dotsSvg([at([fx, y, SCREW_Z])], { size: 0.45, tone: 'mid' })
					: '';
				s.add(
					mid(tab, WALL),
					S(k.slabOf(tab, WALL, 5.5, P, 2, 0.3), { tone: 'mid', inner: insert }),
					1,
					plate
				);
			}
		out.push(s.svg());
		return out.join('');
	}

	// Layer 1: the cell in its frame and the four keys' switches lying against the shelf.
	function power() {
		const s = scene(P);
		const B = BATTERY;
		const top = WALL + 5;
		const label =
			L(k.planOutline(k.insetPlan(B, 3), top, P, 3), { tone: 'lo' }) +
			p.text(B.x + 6, B.y + 20, top, 'LiPo 503035 · 530 mAh', { size: 2.2, tone: 'mid' }) +
			p.text(B.x + 6, B.y + 5, top, '3.7 V', { size: 2.2, tone: 'lo' });
		s.add(mid(B, WALL), S(k.slabOf(B, WALL, 5, P, 4, 0.5), { tone: 'mid', inner: label }));
		for (const x of KEYS) {
			const body = { x: x - 3, y: SW_Y, w: 6, d: 4, r: 0.3 };
			const legs = [-3.25, 3.25]
				.map(
					(dx) =>
						S(k.slabOf({ x: x + dx - 0.35, y: 37.6, w: 0.7, d: 2.2, r: 0 }, 6, 0.5, P, 1), {
							tone: 'mid',
							crease: 'none'
						}) + p.joint(x + dx, 37.9, 6.5)
				)
				.join('');
			const svg =
				legs +
				S(k.slabOf(body, SW_Z, 6, P, 2, 0.2), { tone: 'lo' }) +
				S(k.slabOf({ x: x - 3, y: SW_Y + 3.7, w: 6, d: 0.3, r: 0 }, SW_Z, 6, P, 1), {
					tone: 'mid',
					crease: 'none'
				}) +
				S(k.slabOf({ x: x - 1.75, y: SW_Y + 4, w: 3.5, d: 1, r: 0.8 }, SW_Z + 1.25, 3.5, P, 4), {
					tone: 'hi'
				});
			s.add([x, 41.7, SW_Z], svg);
		}
		return s.svg();
	}

	// Layer 2: the board, the DAC with its jack, the SD module and the supply switch, all wired together.
	function electronics() {
		const s = scene(P);
		// DAC: PCB against the front wall; chip, capacitors and the jack behind it, the jack's nose
		// reaching out through the bottom wall.
		const dac = mid(DAC, MOD_BACK);
		s.add(dac, p.pcb(DAC, MOD_BACK, 1.5), 0, dac);
		const chipPlan = { x: 10, y: 7, w: 6.5, d: 4.4, r: 0.2 };
		s.add(mid(chipPlan, MOD_BACK), p.chip(chipPlan, MOD_BACK - 0.9, 0.9, 10, 'x'), -1, dac);
		for (const [x, y] of [
			[20, 6],
			[20, 13],
			[26, 6],
			[26, 13.6],
			[14, 14]
		])
			s.add([x, y, MOD_BACK], p.smd(x, y, MOD_BACK - 0.6, 'y'), -1, dac);
		const [jx, jz] = JACK;
		const jack = { x: jx - 3, y: DAC.y, w: 6, d: 12, r: 0.8 };
		const nose = { x: jx - 2.5, y: -0.4, w: 5, d: 2, r: 1.2 };
		const plug = p.visible(0, -1)
			? dark(k.sideRing([jx, -0.4, jz], 1.75, 'y', P)) +
				L(k.sideRing([jx, -0.4, jz], 2.3, 'y', P), { tone: 'lo' })
			: '';
		s.add(
			[jx, 7, jz],
			S(k.slabOf(jack, jz - 2.5, 5, P, 4, 0.4), { tone: 'mid' }) +
				S(k.slabOf(nose, jz - 2.5, 5, P, 6, 0.3), { tone: 'mid', inner: plug }),
			-2,
			dac
		);
		// On the face toward the front: the six header joints and the FLT/DEMP/XSMT/FMT pads bridged with solder.
		s.add(
			dac,
			p.header(8.4, 17.6, INNER_TOP, 6, 'x', [0, 1, 2, 3, 4, 5]) +
				[0, 1, 2, 3]
					.map(
						(i) =>
							L(k.planOutline({ x: 20 + i * 3, y: 9, w: 2, d: 1.2, r: 0.2 }, INNER_TOP, P, 2), {
								tone: 'lo'
							}) + p.joint(21 + i * 3, 9.6, INNER_TOP)
					)
					.join('') +
				p.text(6, 4.4, INNER_TOP, 'PCM5102A', { size: 1.8, tone: 'lo' }),
			1,
			dac
		);

		// SD module: PCB on the front wall, the socket behind it, the card out through the right wall.
		const sd = mid(SD, MOD_BACK);
		s.add(sd, p.pcb(SD, MOD_BACK, 1.5), 0, sd);
		s.add(
			sd,
			S(k.slabOf({ x: 46.2, y: 3.6, w: 14, d: 14, r: 0.5 }, MOD_BACK - 2, 2, P, 2, 0.3), {
				tone: 'mid'
			}),
			-1,
			sd
		);
		s.add(
			[63.7, 10.6, 14],
			S(k.slabOf({ x: 60.2, y: 5.1, w: 7, d: 11, r: 0.8 }, 14, 0.8, P, 3), {
				tone: 'hi',
				inner: L(
					[0, 1, 2, 3]
						.map((i) => k.lineOnTop([64.6 + i * 0.6, 6.6], [64.6 + i * 0.6, 14.6], 14.8, P))
						.join(''),
					{ tone: 'lo' }
				)
			}),
			-2,
			sd
		);
		s.add(
			sd,
			p.header(42.2, 18.6, INNER_TOP, 6, 'x', [0, 1, 2, 3, 4, 5]) +
				p.smd(44, 6, INNER_TOP, 'y') +
				p.smd(44, 10, INNER_TOP, 'y'),
			1,
			sd
		);

		// Perfboard with the PNP that powers the DAC and the card down in sleep.
		const perf = mid(PERF, MOD_BACK + 0.3);
		s.add(perf, p.pcb(PERF, MOD_BACK + 0.3, 1.2, false), 0, perf);
		const halfDisc: [number, number][] = Array.from({ length: 13 }, (_, i) => {
			const a = Math.PI + (i / 12) * Math.PI;
			return [37 + Math.cos(a) * 2.2, 15.4 + Math.sin(a) * 2.2];
		});
		s.add(
			[37, 13.4, 12],
			S(k.extrude(halfDisc, 12, 4.4, P, { bevel: 0.2 }), { tone: 'lo' }),
			-1,
			perf
		);
		s.add(
			perf,
			[5, 7.6, 10.2].map((y) => p.joint(35.8, y, INNER_TOP) + p.joint(38.2, y, INNER_TOP)).join(''),
			1,
			perf
		);

		// The T-Display-S3: ESP32-S3 module and battery socket behind its PCB, the screen in front.
		const board = mid(BOARD, PCB_BACK);
		s.add(
			board,
			S(k.slabOf({ x: 10, y: 22, w: 18, d: 20, r: 0.6 }, PCB_BACK - 2.4, 2.4, P, 2, 0.3), {
				tone: 'mid'
			}) +
				S(k.slabOf({ x: 54, y: 21, w: 6, d: 4.5, r: 0.3 }, PCB_BACK - 2.2, 2.2, P, 2, 0.2), {
					tone: 'hi'
				}),
			-1,
			board
		);
		const under: string[] = [];
		for (let i = 0; i < 22; i++)
			under.push(
				p.jointUnder(ROW_X + i * 2.54, ROW_LO, PCB_BACK),
				p.jointUnder(ROW_X + i * 2.54, ROW_HI, PCB_BACK)
			);
		s.add(board, under.join(''), -1, board);
		s.add(board, p.pcb(BOARD, PCB_BACK, 1.2, false), 0, board);
		const reel = (x: number) =>
			L(k.ring(x, 32.6, 4, INNER_TOP, P, 32) + k.ring(x, 32.6, 1.6, INNER_TOP, P, 16), {
				tone: 'mid'
			});
		s.add(
			mid(GLASS, PCB_FRONT),
			S(k.slabOf(GLASS, PCB_FRONT, INNER_TOP - PCB_FRONT, P, 3, 0.4), {
				tone: 'lo',
				inner:
					reel(23.4) +
					reel(37.8) +
					L(k.planOutline({ x: 19.4, y: 27, w: 22.6, d: 11.2, r: 2 }, INNER_TOP, P, 4), {
						tone: 'faint'
					}) +
					L(k.lineOnTop([12, 41], [49, 41], INNER_TOP, P), { tone: 'lit', free: true })
			}),
			1,
			board
		);
		s.add([61, 32.6, PCB_FRONT], p.usbc(64.6, 32.6, 12.5, 'x'), 1, board);
		s.add(
			[57, 32, PCB_FRONT],
			p.tact(57, 41.2, PCB_FRONT, 1.4) + p.tact(57, 24, PCB_FRONT, 1.4),
			1,
			board
		);
		return s.svg();
	}

	// Layer 3: the printed front shell: window, label groove, AB98 logo, and the openings in its walls.
	function shell() {
		const label = { x: 4.6, y: 4.6, w: 57, d: 13.4, r: 1.5 };
		const onX = (x: number, y0: number, y1: number, z0: number, z1: number) =>
			p.face([
				[x, y0, z0],
				[x, y1, z0],
				[x, y1, z1],
				[x, y0, z1]
			]);
		const countersinks = (x: number) =>
			SCREW_YS.map(
				(y) =>
					L(k.sideRing([x, y, SCREW_Z], 2, 'x', P), { tone: 'mid' }) +
					dark(k.sideRing([x, y, SCREW_Z], 1.2, 'x', P)) +
					L(k.segment([x, y - 0.8, SCREW_Z], [x, y + 0.8, SCREW_Z], P), { tone: 'lo' })
			).join('');
		const sides = [
			// Right wall: USB-C, the card slot under it, two countersunk M2 screws. Left wall: two more.
			p.visible(1, 0)
				? dark(onX(W, 27.85, 37.35, 12.1, 16.1)) +
					dark(onX(W, 4.8, 16.4, 13.7, 15.1)) +
					countersinks(W)
				: '',
			p.visible(-1, 0) ? countersinks(0) : '',
			// Bottom wall: the hole for the jack's nose.
			p.visible(0, -1) ? dark(k.sideRing([JACK[0], 0, JACK[1]], 2.8, 'y', P)) : ''
		].join('');
		const inner = [
			L(k.planOutline(label, H, P, 4), { tone: 'lo' }),
			L(k.planOutline(k.insetPlan(label, 0.6), H, P, 4), { tone: 'faint' }),
			p.text(8.1, 12.6, H, 'JRG', { size: 3.1, tone: 'mid', slant: 12, heavy: true }),
			p.text(8.1, 6.4, H, 'AB98', { size: 6.25, tone: 'hi', slant: 12, heavy: true }),
			L(k.sideSeam(CASE, H - 0.8, P, 8), { tone: 'faint' }),
			sides
		].join('');
		const body = p.holed(CASE, WALL, H, [WINDOW], FRONT, { tone: 'hi', inner }, WALL);
		// The four key caps stand 2 mm out of the top edge, low down near the lid; hidden by the shell when that wall faces away.
		const keys = KEYS.map((x, i) => {
			const glyph = ['‹‹', '›‖', '››', '≡'][i];
			return (
				S(k.slabOf({ x: x - 4, y: D, w: 8, d: 2, r: 0.8 }, 1.7, 5, P, 3, 0.3), {
					tone: 'hi',
					lit: i === 1
				}) + p.text(x, D + 0.3, 6.7, glyph, { size: 2, tone: 'mid', anchor: 'middle' })
			);
		});
		const ordered =
			k.depthOf([KEYS[0], D, 0], P) < k.depthOf([KEYS[3], D, 0], P) ? keys : keys.reverse();
		return {
			svg: p.visible(0, 1)
				? body.svg + ordered.join('')
				: p.behind(body.fill, ordered.join('')) + body.svg,
			under: p.hollow(CASE, WALL, H, WALL, sides)
		};
	}

	const A = (q: Point3, layer: number) => ({ p: q, layer });
	const lo = (i: number): Point3 => [ROW_X + i * 2.54, ROW_LO, PCB_BACK - 0.5];
	const hi = (i: number): Point3 => [ROW_X + i * 2.54, ROW_HI, PCB_BACK - 0.5];
	const dacPin = (i: number) => p.pin(8.4, 17.6, INNER_TOP, i, 'x');
	const sdPin = (i: number) => p.pin(42.2, 18.6, INNER_TOP, i, 'x');
	const raise = (q: Point3, z: number): Point3 => [q[0], q[1], z];
	// From a pad on the board's back, out past its lower edge, up and over to a pad facing the front.
	const wire = (pin: Point3, pad: Point3, lift: number, tone: Link['tone'] = 'lit'): Link => {
		const zt = INNER_TOP + 0.6 + lift;
		const lane = 19.1;
		return {
			slot: 2,
			from: A(pin, 2),
			to: A(pad, 2),
			via: [
				A(raise(pin, pin[2] - 0.8), 2),
				A([pin[0], lane, pin[2] - 0.8], 2),
				A([pin[0], lane, zt], 2),
				A(raise(pad, zt), 2)
			],
			tone
		};
	};
	// A short jumper between two pads facing the front.
	const hop = (a: Point3, b: Point3, z: number): Link => ({
		slot: 2,
		from: A(a, 2),
		via: [A(raise(a, z), 2), A(raise(b, z), 2)],
		to: A(b, 2)
	});
	const links: Link[] = [
		// I2S and soft mute to the DAC.
		...[0, 1, 2, 3, 4].map((i) => wire(lo(i), dacPin(i), i * 0.35)),
		// SPI to the SD module.
		...[10, 11, 12, 13].map((i, j) => wire(lo(i), sdPin(j), j * 0.35)),
		// 3V3 and GPIO43 into the PNP; its switched rail out to both modules.
		wire(lo(14), [35.8, 10.2, INNER_TOP + 0.5], 1.6),
		wire(lo(15), [38.2, 10.2, INNER_TOP + 0.5], 1.9),
		hop([35.8, 5, INNER_TOP + 0.5], dacPin(5), INNER_TOP + 2.4),
		hop([38.2, 5, INNER_TOP + 0.5], sdPin(4), INNER_TOP + 2.6),
		wire(lo(8), sdPin(5), 2.4),
		// The four keys: from the board's far row down to each switch's leg behind the shelf.
		...KEYS.map((x, i): Link => ({
			slot: 1,
			from: A(hi(5 + i), 2),
			via: [A(raise(hi(5 + i), 9.6), 2), A([x + 3.25, 37.9, 8.4], 1)],
			to: A([x + 3.25, 37.9, 7], 1)
		})),
		// Battery leads into the board's JST socket, behind the board.
		...[0, 1].map((i): Link => ({
			slot: 1,
			from: A([BATTERY.x + BATTERY.w, 28.4 + i * 1.4, 4.2], 1),
			via: [A([60.4, 28.4 + i * 1.4, 4.2], 1), A([60.4, 22 + i * 1.6, PCB_BACK - 2.2], 2)],
			to: A([58, 22 + i * 1.6, PCB_BACK - 2.2], 2),
			tone: i ? 'lo' : 'red'
		}))
	];

	const front = shell();

	return {
		id: 'ab98',
		fig: 'Fig 1',
		title: 'AB98 · inside',
		label:
			'The AB98 pocket player opened into four layers: the printed back lid with its screw tabs, battery frame and switch shelf, the LiPo cell and the four key switches lying on their sides, the T-Display-S3 wired by hand to the PCM5102A DAC with its headphone jack, the micro SD module and a PNP supply switch, and the front shell with its window, AB98 logo, jack hole, USB-C and card slots and countersunk side screws.',
		caption:
			'66.2 × 47.2 × 19 mm closed. The lid screws on from the sides: four M2 countersunk screws through the left and right walls into heat-set inserts. Amber lines are hand-soldered: I2S to the DAC, SPI to the card, the supply switch, and the four keys.',
		width,
		height,
		lifts: LIFTS,
		P,
		below: k.fromBelow(P),
		layers: [
			{
				name: 'Back lid',
				role: 'screw tabs with M2 heat-set inserts, battery frame with lips, switch shelf',
				svg: lid()
			},
			{
				name: 'Cell and keys',
				role: '530 mAh LiPo and four 6 × 6 tact switches lying against the shelf',
				svg: power()
			},
			{
				name: 'Electronics',
				role: 'ESP32-S3 + 1.9" screen, PCM5102A DAC and jack, micro SD, PNP power switch',
				svg: electronics()
			},
			{
				name: 'Front shell',
				role: 'window, AB98 logo, jack hole, USB-C and card slots, four key caps, side screws',
				svg: front.svg,
				under: { svg: front.under, after: 0 }
			}
		],
		links
	};
}
