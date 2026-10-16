<script lang="ts">
	import Anatomy from '$lib/components/Anatomy.svelte';
	import { ab98 } from '$lib/figures/ab98';
	import { inkbridge } from '$lib/figures/inkbridge';
	import { mayanhcu } from '$lib/figures/mayanhcu';
	import { PROJECTS } from '$lib/projects';

	const figures = { ab98, mayanhcu, inkbridge };
	const years = [...new Set(PROJECTS.map((p) => p.year))].sort((a, b) => b - a);
	let year = $state<number | null>(null);
	const shown = $derived(year === null ? PROJECTS : PROJECTS.filter((p) => p.year === year));
	const hardware = $derived(shown.filter((p) => p.kind === 'hardware'));
	const web = $derived(shown.filter((p) => p.kind === 'web'));

	// Tree illustration: three generations around one selected person.
	const people = [
		{ x: 60, y: 24 },
		{ x: 140, y: 24 },
		{ x: 220, y: 24 },
		{ x: 300, y: 24 },
		{ x: 100, y: 90, me: false },
		{ x: 260, y: 90 },
		{ x: 180, y: 156, me: true },
		{ x: 100, y: 156 },
		{ x: 140, y: 222 },
		{ x: 220, y: 222 }
	];
	// A made-up 21 × 21 QR-like grid for the e-ink card: three finder squares and fixed noise.
	const QR = 21;
	const finder = (x: number, y: number) =>
		[
			[0, 0],
			[QR - 7, 0],
			[0, QR - 7]
		].some(([fx, fy]) => {
			const dx = x - fx;
			const dy = y - fy;
			if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
			return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx > 1 && dx < 5 && dy > 1 && dy < 5);
		});
	const inFinderZone = (x: number, y: number) =>
		(x < 8 && y < 8) || (x > QR - 9 && y < 8) || (x < 8 && y > QR - 9);
	const qr = Array.from({ length: QR * QR }, (_, i) => [i % QR, Math.floor(i / QR)]).filter(
		([x, y]) => (inFinderZone(x, y) ? finder(x, y) : (x * 7 + y * 13 + x * y) % 5 < 2)
	);

	const bonds = [
		[0, 4],
		[1, 4],
		[2, 5],
		[3, 5],
		[4, 6],
		[5, 6],
		[4, 7],
		[6, 8],
		[6, 9]
	];
</script>

<svelte:head>
	<title>JRG Tools · Projects</title>
	<meta
		name="description"
		content="Things Jorge has been building: pocket devices, printed and soldered by hand, and web apps."
	/>
</svelte:head>

<section class="mx-auto max-w-5xl px-4 pt-8 pb-16 sm:px-6">
	<p class="text-sm font-semibold tracking-widest text-yellow-500 uppercase">Projects</p>
	<h1 class="mt-3 text-4xl font-bold sm:text-5xl">What I've been building</h1>
	<p class="mt-5 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
		Small devices, printed and soldered on my desk, and web apps for the people around me.
	</p>
	<div class="mt-8 flex flex-wrap items-center gap-1" role="group" aria-label="Filter by year">
		{#each [null, ...years] as y (y)}
			<button
				type="button"
				aria-pressed={year === y}
				onclick={() => (year = y)}
				class="rounded-md px-3 py-1 text-sm font-semibold text-zinc-500 transition-colors duration-300 hover:text-black aria-pressed:bg-yellow-500/15 aria-pressed:text-yellow-600 dark:hover:text-white dark:aria-pressed:text-yellow-500"
			>
				{y ?? 'All'}
			</button>
		{/each}
	</div>
	<nav class="mt-4 flex flex-wrap gap-2" aria-label="Projects">
		{#each shown as project (project.id)}
			<a
				href="#{project.id}"
				class="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-semibold transition-colors duration-300 hover:border-yellow-500 dark:border-zinc-800"
			>
				{#if project.kind === 'hardware'}
					<!-- Lucide "cpu" -->
					<svg
						class="h-4 w-4 text-yellow-600 dark:text-yellow-500"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						role="img"
						aria-label="Hardware"
						><title>Hardware</title><rect x="4" y="4" width="16" height="16" rx="2" /><rect
							x="9"
							y="9"
							width="6"
							height="6"
							rx="1"
						/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" /></svg
					>
				{/if}
				{project.name}
				{#if project.ai}
					<span
						class="rounded-full bg-yellow-500/15 px-1.5 py-px text-[10px] font-bold tracking-wider text-yellow-600 dark:text-yellow-500"
						title="Self-hosted AI">AI</span
					>
				{/if}
			</a>
		{/each}
	</nav>
</section>

{#snippet details(project: (typeof PROJECTS)[number])}
	<p class="text-sm font-semibold tracking-widest text-yellow-500 uppercase">
		{project.year} · {project.kind === 'hardware'
			? 'Printed · soldered · flashed'
			: project.ai
				? 'Web app · self-hosted AI'
				: 'Web app'}
	</p>
	<h2 class="mt-2 text-3xl font-bold">{project.name}</h2>
	<p class="mt-1 text-lg font-medium text-zinc-500">{project.tagline}</p>
	<p class="mt-4 text-zinc-700 dark:text-zinc-300">{project.summary}</p>
	{#if project.ai}
		<p
			class="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300"
		>
			<span class="font-semibold text-yellow-600 dark:text-yellow-500">Self-hosted AI.</span>
			{project.ai}
		</p>
	{/if}
	<ul class="mt-5 space-y-2 text-zinc-600 dark:text-zinc-400">
		{#each project.features as feature (feature)}
			<li class="flex gap-3">
				<span class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500"></span>{feature}
			</li>
		{/each}
	</ul>
	<div class="mt-5 flex flex-wrap gap-2">
		{#each project.stack as item (item)}
			<span
				class="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
			>
				{item}
			</span>
		{/each}
	</div>
{/snippet}

{#each hardware as project (project.id)}
	<section id={project.id} class="mx-auto max-w-5xl scroll-mt-24 px-4 py-12 sm:px-6">
		<div class="grid gap-x-12 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center">
			<div>{@render details(project)}</div>
			<div class="iso">
				{#if project.figure}<Anatomy
						build={figures[project.figure]}
						azimuth={project.figure === 'inkbridge' ? -50 : -56}
					/>{/if}
			</div>
		</div>
	</section>
{/each}

<section class="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
	{#each web as project (project.id)}
		<article
			id={project.id}
			class="scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40"
		>
			<div
				class="border-b border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950/60"
				aria-hidden="true"
			>
				{#if project.id === 'trip'}
					<div class="space-y-3 text-sm">
						{#each [['Day 1 · Kyoto', ['Fushimi Inari', 'Nishiki market']], ['Day 2 · Nara', ['Deer park', 'Tōdai-ji']]] as [day, events] (day)}
							<div>
								<p class="font-bold text-yellow-500">{day}</p>
								<div class="mt-1.5 flex flex-wrap gap-2">
									{#each events as event (event)}
										<span
											class="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 dark:border-zinc-800 dark:bg-zinc-900"
											>{event}</span
										>
									{/each}
								</div>
							</div>
						{/each}
						<div class="flex items-center gap-3 pt-1">
							<div class="flex -space-x-2">
								{#each ['A', 'J', 'M'] as who (who)}
									<span
										class="grid h-7 w-7 place-items-center rounded-full bg-zinc-200 text-xs font-bold ring-2 ring-zinc-50 dark:bg-zinc-800 dark:ring-zinc-950"
										>{who}</span
									>
								{/each}
							</div>
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
								<div class="h-full w-3/5 rounded-full bg-yellow-500"></div>
							</div>
							<span class="text-xs text-zinc-500">¥ 84,200 / 140,000</span>
						</div>
					</div>
				{:else if project.id === 'revelado'}
					<div class="mx-auto max-w-sm">
						<!-- Before / after: the same scene, flat on the left, developed on the right. -->
						<svg viewBox="0 0 360 200" class="block w-full overflow-hidden rounded-xl">
							<defs>
								<linearGradient id="rv-sky-raw" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0" stop-color="#a1a1aa" /><stop offset="1" stop-color="#d4d4d8" />
								</linearGradient>
								<linearGradient id="rv-sky-film" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0" stop-color="#f59e0b" /><stop offset="1" stop-color="#fde68a" />
								</linearGradient>
								<clipPath id="rv-left"><rect width="180" height="200" /></clipPath>
								<clipPath id="rv-right"><rect x="180" width="180" height="200" /></clipPath>
							</defs>
							{#each [['rv-left', 'url(#rv-sky-raw)', '#71717a', '#52525b', '#e4e4e7'], ['rv-right', 'url(#rv-sky-film)', '#b45309', '#78350f', '#fff7ed']] as [clip, sky, hill, near, sun] (clip)}
								<g clip-path="url(#{clip})">
									<rect width="360" height="200" fill={sky} />
									<circle cx="250" cy="70" r="26" fill={sun} opacity="0.9" />
									<path d="M0 140 L70 95 L130 130 L200 80 L280 125 L360 100 V200 H0Z" fill={hill} />
									<path d="M0 170 Q90 140 180 165 T360 155 V200 H0Z" fill={near} />
								</g>
							{/each}
							<line x1="180" y1="0" x2="180" y2="200" stroke="white" stroke-width="2" />
							<circle cx="180" cy="100" r="13" fill="white" />
							<path
								d="M175 95 L170 100 L175 105 M185 95 L190 100 L185 105"
								fill="none"
								stroke="#18181b"
								stroke-width="2"
							/>
						</svg>
						<div class="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
							{#each ['Portra 400', 'Tri-X 400', 'CineStill 800T', 'Velvia 50'] as film, i (film)}
								<span
									class="rounded-full border px-2.5 py-1 {i === 0
										? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
										: 'border-zinc-200 text-zinc-500 dark:border-zinc-800'}">{film}</span
								>
							{/each}
						</div>
					</div>
				{:else if project.id === 'eink-card'}
					<div class="mx-auto flex max-w-sm items-center justify-center gap-5">
						<!-- An Xteink reader showing the card as its sleep screen. -->
						<svg viewBox="0 0 150 230" class="block w-36 shrink-0">
							<rect
								x="1"
								y="1"
								width="148"
								height="228"
								rx="14"
								class="fill-zinc-800 stroke-zinc-700 dark:fill-zinc-900"
								stroke-width="2"
							/>
							<rect x="12" y="14" width="126" height="190" rx="3" fill="#ecebe4" />
							<rect x="24" y="30" width="62" height="8" rx="2" fill="#1f1f1f" />
							<rect x="24" y="44" width="44" height="4" rx="2" fill="#6b6b66" />
							<rect x="24" y="52" width="54" height="4" rx="2" fill="#6b6b66" />
							<line x1="24" y1="68" x2="126" y2="68" stroke="#1f1f1f" stroke-width="1" />
							{#each [0, 1, 2] as row (row)}
								<rect
									x="24"
									y={78 + row * 9}
									width={70 - row * 12}
									height="3.5"
									rx="1.5"
									fill="#3f3f3c"
								/>
							{/each}
							<g transform="translate(57 118)">
								<rect x="-3" y="-3" width="69" height="69" fill="#ecebe4" />
								{#each qr as [x, y] (`${x}-${y}`)}
									<rect x={x * 3} y={y * 3} width="3" height="3" fill="#1f1f1f" />
								{/each}
							</g>
							<rect x="60" y="212" width="30" height="6" rx="3" class="fill-zinc-600" />
						</svg>
						<div class="space-y-2 text-xs font-semibold">
							<span
								class="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 dark:border-zinc-800"
							>
								<span class="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>X4 CONNECTED
							</span>
							<p class="text-zinc-500">480 × 800 · 24-bit BMP</p>
							<span class="inline-block rounded-md bg-yellow-500 px-2.5 py-1.5 text-zinc-950"
								>SEND TO DEVICE</span
							>
						</div>
					</div>
				{:else}
					<svg viewBox="0 0 360 246" class="mx-auto block w-full max-w-sm">
						{#each bonds as [a, b] (`${a}-${b}`)}
							<path
								d="M{people[a].x} {people[a].y + 14}V{(people[a].y + people[b].y) / 2}H{people[b]
									.x}V{people[b].y - 14}"
								class="fill-none stroke-zinc-300 dark:stroke-zinc-700"
								stroke-width="1.5"
							/>
						{/each}
						{#each people as person, i (i)}
							<rect
								x={person.x - 30}
								y={person.y - 14}
								width="60"
								height="28"
								rx="8"
								class={person.me
									? 'fill-yellow-400 stroke-yellow-500'
									: 'fill-white stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700'}
							/>
							<rect
								x={person.x - 18}
								y={person.y - 4}
								width="36"
								height="3"
								rx="1.5"
								class={person.me ? 'fill-yellow-700' : 'fill-zinc-300 dark:fill-zinc-700'}
							/>
							<rect
								x={person.x - 12}
								y={person.y + 3}
								width="24"
								height="2.5"
								rx="1.25"
								class={person.me ? 'fill-yellow-600' : 'fill-zinc-200 dark:fill-zinc-800'}
							/>
						{/each}
					</svg>
				{/if}
			</div>
			<div class="p-6">{@render details(project)}</div>
		</article>
	{/each}
</section>
