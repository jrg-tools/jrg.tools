<script lang="ts">
	import { untrack } from 'svelte';
	import { translateAlong } from '$lib/iso/iso-kit';
	import { linkSvg, type Build, type Figure } from '$lib/figures/parts';

	let { build, azimuth: start = -56 }: { build: Build; azimuth?: number } = $props();

	const TOUR_STEP = 2.4;
	const IDLE = 5000;
	const STEP = 2;
	const KEEP = 24;

	const wrap = (deg: number) => (((deg % 360) + 540) % 360) - 180;

	/**
	 * Turn and tilt both go all the way round. Past straight overhead (or straight underneath) the same
	 * picture is the view from the opposite azimuth turned upside down, so a tilt maps to an elevation in
	 * −90…90 plus a half-turn of the picture. Views are snapped to STEP degrees; recent ones are kept.
	 */
	const camera = (az: number, tilt: number) => {
		let e = wrap(tilt);
		let a = az;
		let upside = false;
		if (Math.abs(e) > 90) {
			e = Math.sign(e) * 180 - e;
			a += 180;
			upside = true;
		}
		// Edge-on views have no top or bottom to show: keep a sliver of either.
		if (Math.abs(e) < 4) e = e < 0 ? -4 : 4;
		const snap = (v: number) => Math.round(v / STEP) * STEP;
		return {
			azimuth: ((snap(a) % 360) + 360) % 360,
			elevation: Math.max(-88, Math.min(88, snap(e))),
			upside
		};
	};
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a plain cache, nothing reads it reactively
	const cache = new Map<string, Figure>();
	const view = (az: number, el: number) => {
		const key = `${az}/${el}`;
		let hit = cache.get(key);
		if (!hit) {
			hit = build(az, el);
			cache.set(key, hit);
			if (cache.size > KEEP) cache.delete(cache.keys().next().value!);
		}
		return hit;
	};

	let azimuth = $state(untrack(() => start));
	let tilt = $state(30);
	const cam = $derived(camera(azimuth, tilt));
	const figure = $derived(view(cam.azimuth, cam.elevation));
	// Bottom to top from above; from below, the top layer is the farthest.
	const order = $derived(
		figure.layers.map((_, i) => i).sort((a, b) => (figure.below ? b - a : a - b))
	);
	let t = $state(0.85);
	let target = $state(0.85);
	let focus = $state(-1);
	let touring = true;
	let stage: HTMLDivElement;

	const lift = (layer: number) => figure.lifts[layer] * t;
	const layerTransform = (i: number) => translateAlong(figure.P, [0, 0, lift(i)]);
	const linksAt = (slot: number) =>
		figure.links
			.filter((link) => link.slot === slot)
			.map((link) => linkSvg(link, figure.P, lift))
			.join('');

	const readout = $derived(
		focus >= 0
			? figure.layers[focus].name
			: t > 0.5
				? `open · ${figure.layers.length} layers`
				: 'closed'
	);

	$effect(() => {
		const still = matchMedia('(prefers-reduced-motion: reduce)');
		let frame = 0;
		let last = 0;
		let clock = 0;
		let visible = false;
		let idle: ReturnType<typeof setTimeout> | undefined;
		const n = untrack(() => figure.layers.length);

		const tick = (now: number) => {
			const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
			last = now;
			if (touring) {
				// Open, visit each layer, close, rest.
				clock = (clock + dt) % ((n + 2) * TOUR_STEP);
				const step = Math.floor(clock / TOUR_STEP);
				target = step <= n ? 1 : 0;
				focus = step >= 1 && step <= n ? n - step : -1;
			}
			t = still.matches ? target : t + (target - t) * (1 - Math.exp(-dt / 0.35));
			if (Math.abs(target - t) < 0.001) t = target;
			frame = visible && (touring || t !== target) ? requestAnimationFrame(tick) : 0;
		};
		const run = () => {
			if (!frame && visible) {
				last = 0;
				frame = requestAnimationFrame(tick);
			}
		};
		const hold = () => {
			touring = false;
			clearTimeout(idle);
			idle = setTimeout(() => {
				touring = !still.matches;
				run();
			}, IDLE);
			run();
		};
		if (still.matches) {
			touring = false;
			t = target = 1;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				visible = entries[entries.length - 1].isIntersecting;
				if (visible) run();
			},
			{ rootMargin: '120px 0px' }
		);
		observer.observe(stage);

		const layerOf = (event: Event) => {
			const el = (event.target as Element).closest?.('[data-layer]');
			return el ? Number(el.getAttribute('data-layer')) : -1;
		};
		const onOver = (event: PointerEvent) => {
			if (press) return;
			hold();
			focus = layerOf(event);
		};
		const onLeave = () => {
			if (!press) focus = -1;
		};
		const onClick = () => {
			hold();
			target = target > 0.5 ? 0 : 1;
		};
		// Drag to turn (sideways) and tilt (up and down); a press that doesn't move opens or closes it.
		let press: { x: number; y: number; az: number; tilt: number; moved: boolean } | null = null;
		const onDown = (event: PointerEvent) => {
			if (event.button !== 0) return;
			press = { x: event.clientX, y: event.clientY, az: azimuth, tilt, moved: false };
			stage.setPointerCapture(event.pointerId);
			hold();
		};
		const onMove = (event: PointerEvent) => {
			if (!press) return;
			const dx = event.clientX - press.x;
			const dy = event.clientY - press.y;
			if (Math.hypot(dx, dy) > 4) press.moved = true;
			if (press.moved) {
				// Upside down, a sideways drag would turn it the wrong way.
				azimuth = press.az + dx * 0.6 * (cam.upside ? -1 : 1);
				// Touch keeps vertical swipes for scrolling the page (touch-action: pan-y).
				if (event.pointerType !== 'touch') tilt = press.tilt + dy * 0.6;
				hold();
			}
		};
		const onUp = () => {
			if (press && !press.moved) onClick();
			press = null;
		};
		const onCancel = () => {
			press = null;
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				onClick();
			} else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
				event.preventDefault();
				hold();
				azimuth += event.key === 'ArrowLeft' ? -15 : 15;
			} else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				event.preventDefault();
				hold();
				tilt += event.key === 'ArrowUp' ? -15 : 15;
			}
		};
		// The legend's buttons steer the same state.
		const onLegend = (event: Event) => {
			const i = Number((event.currentTarget as HTMLElement).dataset.pick);
			hold();
			target = 1;
			focus = i;
		};
		const legend = stage.closest('figure')?.querySelectorAll<HTMLElement>('[data-pick]') ?? [];
		stage.addEventListener('pointerover', onOver);
		stage.addEventListener('pointerleave', onLeave);
		stage.addEventListener('pointerdown', onDown);
		stage.addEventListener('pointermove', onMove);
		stage.addEventListener('pointerup', onUp);
		stage.addEventListener('pointercancel', onCancel);
		stage.addEventListener('keydown', onKey);
		legend.forEach((el) => {
			el.addEventListener('pointerenter', onLegend);
			el.addEventListener('focus', onLegend);
		});
		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(idle);
			observer.disconnect();
			stage.removeEventListener('pointerover', onOver);
			stage.removeEventListener('pointerleave', onLeave);
			stage.removeEventListener('pointerdown', onDown);
			stage.removeEventListener('pointermove', onMove);
			stage.removeEventListener('pointerup', onUp);
			stage.removeEventListener('pointercancel', onCancel);
			stage.removeEventListener('keydown', onKey);
			legend.forEach((el) => {
				el.removeEventListener('pointerenter', onLegend);
				el.removeEventListener('focus', onLegend);
			});
		};
	});
</script>

<figure class="iso-figure">
	<div class="iso-plate">
		<div class="iso-plate-corners" aria-hidden="true">
			<span class="iso-plate-corner" data-corner="fig">{figure.fig}</span>
			<span class="iso-plate-corner" data-corner="title">{figure.title}</span>
			<span class="iso-plate-corner" data-corner="hint">Drag to turn and tilt · click to open</span>
			<span class="iso-plate-corner" data-corner="readout" data-readout>{readout}</span>
		</div>
		<div
			bind:this={stage}
			class="iso-stage"
			tabindex="0"
			role="button"
			aria-pressed={target > 0.5}
			aria-label="{figure.title}: Enter opens or closes it, left and right arrows turn it, up and down tilt it; the layer buttons below pick a layer. {readout}"
		>
			<svg
				class="iso-svg"
				viewBox="0 0 {figure.width} {figure.height}"
				role="img"
				aria-label={figure.label}
			>
				<!-- The kit's floor is left-handed: mirrored once here, every figure reads as the real object. -->
				<g
					transform="{cam.upside
						? `rotate(180 ${figure.width / 2} ${figure.height / 2}) `
						: ''}matrix(-1 0 0 1 {figure.width} 0)"
				>
					{#each order as i (i)}
						{@const layer = figure.layers[i]}
						<g
							class="iso-layer"
							data-layer={i}
							data-focus={focus === i ? '' : undefined}
							transform={layerTransform(i)}
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG built by our own figure code, no user input -->
							{@html layer.svg}
						</g>
						<!-- Wires live inside the closed body: fade them in as it opens. -->
						<g aria-hidden="true" opacity={Math.min(1, t * 5)}>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- same: generated wire paths -->
							{@html linksAt(i)}
						</g>
						<!-- Walls that hide what sits inside them, drawn once their contents are. -->
						{#each figure.layers as wall, j (wall.name)}
							{@const cover = figure.below ? wall.under : wall.over}
							{#if cover && cover.after === i}
								<g transform={layerTransform(j)}>
									<!-- eslint-disable-next-line svelte/no-at-html-tags -- generated SVG -->
									{@html cover.svg}
								</g>
							{/if}
						{/each}
					{/each}
				</g>
			</svg>
		</div>
	</div>
	<figcaption class="iso-legend">
		<span class="iso-keys">
			{#each figure.layers as layer, i (layer.name)}
				<button
					type="button"
					class="iso-key layer-key"
					data-pick={i}
					data-on={focus === i ? '' : undefined}
				>
					<span class="dot"></span>{layer.name}
				</button>
			{/each}
		</span>
		<span class="role" aria-live="polite">
			{focus >= 0 ? `${figure.layers[focus].name}: ${figure.layers[focus].role}` : ' '}
		</span>
		<span class="iso-caption">{figure.caption}</span>
	</figcaption>
</figure>

<style>
	.iso-stage {
		cursor: grab;
		touch-action: pan-y;
		user-select: none;
	}
	.iso-stage:active {
		cursor: grabbing;
	}
	.layer-key {
		cursor: pointer;
		border-radius: 999px;
		padding: 2px 10px 2px 8px;
		box-shadow: 0 0 0 1px var(--anatomy-faint);
		transition: box-shadow 0.2s;
	}
	.layer-key[data-on] {
		color: var(--anatomy-strong);
		box-shadow: 0 0 0 1px var(--anatomy-lit);
	}
	.role {
		color: var(--anatomy-strong);
		min-height: 1.55em;
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--anatomy-mid);
	}
	.layer-key[data-on] .dot {
		background: var(--anatomy-lit);
	}
</style>
