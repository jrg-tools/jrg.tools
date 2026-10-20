<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { tick } from 'svelte';
	import Sortable from '$lib/components/Sortable.svelte';
	import { ARTS, KINDS, STEPS, label, parseProject } from '$lib/projects';

	let { data, form } = $props();
	// Keyed by the project being edited, so the fields reset when another one is picked.
	const p = $derived(data.editing);
	const tab = $derived(page.url.searchParams.get('tab') === 'header' ? 'header' : 'projects');
	const invalid = (field: string) => form?.errors?.includes(field) || undefined;
	// What is typed in the form; every load (another project picked, or a save) starts it over.
	let typed = $derived<FormData | null>(data && null);
	const preview = $derived(typed ? parseProject(typed).project : p);

	// A dragged order shows at once; the next load (after the save) replaces it.
	let projects = $derived(data.projects);
	/** One drag list per kind and year (newest first), the order the page shows them in. */
	const groups = $derived(
		KINDS.flatMap((kind) =>
			[...new Set(projects.map((p) => p.year))].map((year) => ({
				key: `${kind}-${year}`,
				kind,
				year,
				items: projects.filter((p) => p.kind === kind && p.year === year)
			}))
		).filter((g) => g.items.length)
	);
	let orderForm: HTMLFormElement | undefined = $state();
	async function sort(key: string, next: typeof projects) {
		projects = groups.flatMap((g) => (g.key === key ? next : g.items));
		await tick();
		orderForm?.requestSubmit();
	}
</script>

<svelte:head><title>Admin · {data.brand}</title></svelte:head>

<nav class="mx-auto flex max-w-7xl gap-1 px-4 pt-4 sm:px-6" aria-label="Admin">
	{#each [['projects', 'Projects'], ['header', 'Page header']] as [key, label] (key)}
		<a
			href="{resolve('/admin')}{key === 'projects' ? '' : `?tab=${key}`}"
			aria-current={tab === key ? 'page' : undefined}
			class="rounded-md px-3 py-1 text-sm font-semibold text-zinc-500 transition-colors duration-300 hover:text-black aria-[current=page]:bg-yellow-500/15 aria-[current=page]:text-yellow-600 dark:hover:text-white dark:aria-[current=page]:text-yellow-500"
			>{label}</a
		>
	{/each}
</nav>

{#if tab === 'header'}
	<section class="mx-auto max-w-3xl px-4 pt-6 pb-20 sm:px-6">
		<form method="POST" action="?/header" use:enhance class="space-y-3">
			<h1 class="sr-only">Page header</h1>
			<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
				<label class="space-y-1.5">
					<span class="text-sm font-semibold">Eyebrow</span>
					<input name="eyebrow" value={data.header.eyebrow} class="field" />
				</label>
				<label class="space-y-1.5">
					<span class="text-sm font-semibold">Title</span>
					<input name="title" value={data.header.title} class="field" />
				</label>
			</div>
			<label class="block space-y-1.5">
				<span class="text-sm font-semibold">Intro</span>
				<textarea name="intro" rows="2" class="field resize-y">{data.header.intro}</textarea>
			</label>
			<button
				class="rounded-full bg-yellow-400 px-6 py-2.5 font-semibold text-zinc-950 transition hover:bg-yellow-300"
				>Save header</button
			>
			{#if form?.headerSaved}
				<span class="ml-3 text-sm font-semibold text-emerald-600" role="status">Saved.</span>
			{/if}
		</form>
	</section>
{:else}
	<div
		class="mx-auto grid max-w-7xl gap-10 px-4 pt-6 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
	>
		<section>
			<h1 class="sr-only">{p ? `Edit ${p.name}` : 'New project'}</h1>
			{@render compact(preview)}
			{#if page.url.searchParams.has('saved')}
				<p class="mt-3 text-sm font-semibold text-emerald-600" role="status">Saved.</p>
			{/if}
			{#if form?.errors}
				<p class="mt-3 text-sm font-semibold text-red-600" role="alert">
					Check the highlighted fields.
				</p>
			{/if}

			{#key p?.id}
				<form
					method="POST"
					action="?/save"
					use:enhance
					oninput={(e) => (typed = new FormData(e.currentTarget))}
					onchange={(e) => (typed = new FormData(e.currentTarget))}
					class="mt-6 space-y-3"
				>
					{#if p}<input type="hidden" name="original" value={p.id} />{/if}
					<label class="block space-y-1.5">
						<span class="text-sm font-semibold">Name</span>
						<input
							name="name"
							value={p?.name}
							required
							class="field"
							aria-invalid={invalid('name')}
						/>
					</label>
					<label class="block space-y-1.5">
						<span class="text-sm font-semibold">Tagline</span>
						<input name="tagline" value={p?.tagline} class="field" />
					</label>
					<div class="grid grid-cols-2 gap-3">
						<label class="space-y-1.5">
							<span class="text-sm font-semibold">Kind</span>
							<select
								name="kind"
								value={p?.kind ?? 'web'}
								class="field"
								aria-invalid={invalid('kind')}
							>
								{#each KINDS as k (k)}<option value={k}>{k}</option>{/each}
							</select>
						</label>
						<label class="space-y-1.5">
							<span class="text-sm font-semibold">Year</span>
							<input
								name="year"
								type="number"
								value={p?.year ?? new Date().getFullYear()}
								required
								class="field"
								aria-invalid={invalid('year')}
							/>
						</label>
					</div>
					<label class="block space-y-1.5">
						<span class="text-sm font-semibold">Summary</span>
						<textarea name="summary" rows="4" class="field resize-y">{p?.summary ?? ''}</textarea>
					</label>
					<label class="block space-y-1.5">
						<span class="text-sm font-semibold">Features</span>
						<textarea name="features" rows="5" class="field resize-y"
							>{p?.features.join('\n') ?? ''}</textarea
						>
						<span class="text-xs text-zinc-500">One per line.</span>
					</label>
					<label class="block space-y-1.5">
						<span class="text-sm font-semibold">Stack</span>
						<input name="stack" value={p?.stack.join(', ')} class="field" />
						<span class="text-xs text-zinc-500">Comma-separated.</span>
					</label>
					<label class="block space-y-1.5">
						<span class="text-sm font-semibold">Self-hosted AI</span>
						<textarea name="ai" rows="2" class="field resize-y">{p?.ai ?? ''}</textarea>
						<span class="text-xs text-zinc-500">What runs and where. Empty: no AI badge.</span>
					</label>
					<div class="grid gap-3 sm:grid-cols-2">
						<label class="space-y-1.5">
							<span class="text-sm font-semibold">Drawing</span>
							<select name="art" value={p?.art ?? ''} class="field" aria-invalid={invalid('art')}>
								<option value="">None</option>
								{#each ARTS as a (a)}<option value={a}>{a}</option>{/each}
							</select>
						</label>
						<label class="space-y-1.5">
							<span class="text-sm font-semibold">Image URL</span>
							<input
								name="image"
								value={p?.image}
								placeholder="https://… or /file.webp"
								class="field"
								aria-invalid={invalid('image')}
							/>
						</label>
					</div>
					<p class="text-xs text-zinc-500">
						Without a drawing, the image is shown instead; with neither, the card has no picture.
					</p>

					<!-- Always in the form (hidden for web), so the preview counts them as soon as kind is hardware. -->
					<fieldset class="space-y-2" hidden={preview?.kind !== 'hardware'}>
						<legend class="text-sm font-semibold">How it was made</legend>
						<div class="flex flex-wrap gap-x-5 gap-y-2">
							{#each Object.entries(STEPS) as [step, name] (step)}
								<label class="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										name="steps"
										value={step}
										checked={p?.kind === 'hardware'
											? p.steps?.includes(step as keyof typeof STEPS)
											: true}
										class="size-5 accent-yellow-500 sm:size-4"
									/>
									{name}
								</label>
							{/each}
						</div>
					</fieldset>
					<label class="flex items-center gap-3 text-sm font-semibold">
						<input
							type="checkbox"
							name="featured"
							checked={p?.featured}
							class="size-5 accent-yellow-500 sm:size-4"
						/>
						Favorite: shown on top of the page
					</label>

					<div class="flex gap-3 pt-2">
						<button
							class="flex-1 rounded-full bg-yellow-400 px-6 py-2.5 font-semibold text-zinc-950 transition hover:bg-yellow-300 sm:flex-none"
							>Save</button
						>
						{#if p}
							<a
								href={resolve('/admin')}
								class="rounded-full px-5 py-2.5 font-semibold text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
								>Cancel</a
							>
						{/if}
					</div>
				</form>
			{/key}
		</section>

		<aside class="space-y-6">
			<h2 class="text-sm font-semibold text-zinc-500 uppercase">
				Projects · {data.projects.length}
			</h2>
			<form method="POST" action="?/order" use:enhance bind:this={orderForm}>
				<input type="hidden" name="ids" value={projects.map((p) => p.id).join(',')} />
			</form>
			<p class="text-xs text-zinc-500">Drag ⠿ (or focus it and press ↑/↓) to reorder.</p>
			{#each KINDS as kind (kind)}
				{@const years = groups.filter((g) => g.kind === kind)}
				{#if years.length}
					<div>
						<h3 class="mb-4 text-lg font-bold capitalize">
							{kind} · {years.reduce((n, g) => n + g.items.length, 0)}
						</h3>
						<div class="space-y-5 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
							{#each years as group (group.key)}
								<div>
									<h4 class="mb-2 text-sm font-semibold tracking-widest text-yellow-500">
										{group.year} · {group.items.length}
									</h4>
									<Sortable
										items={group.items}
										key={(p) => p.id}
										row={projectRow}
										onsort={(next) => sort(group.key, next)}
									/>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</aside>
	</div>
{/if}

{#snippet projectRow(project: (typeof projects)[number])}
	<div
		id={project.id}
		class="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 pr-4 {p?.id === project.id
			? 'bg-yellow-400/10'
			: ''}"
	>
		<div class="min-w-0 flex-1">
			<p class="truncate font-semibold">
				{project.name}{#if project.featured}<span class="ml-1 text-yellow-500">★</span
					>{/if}{#if project.ai}<span
						class="ml-2 rounded-full bg-yellow-500/15 px-1.5 py-px text-[10px] font-bold tracking-wider text-yellow-600 dark:text-yellow-500"
						>AI</span
					>{/if}
			</p>
			<p class="truncate text-xs text-zinc-500">{project.year} · {project.tagline}</p>
		</div>
		<div class="flex">
			<a
				href="{resolve('/')}#{project.id}"
				class="rounded-full px-3 py-1 text-sm font-semibold hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
				>View</a
			>
			<a
				href="{resolve('/admin')}?edit={project.id}"
				class="rounded-full px-3 py-1 text-sm font-semibold hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
				>Edit</a
			>
			<form
				method="POST"
				action="?/delete"
				use:enhance={({ cancel }) => {
					if (!confirm(`Delete ${project.name}?`)) cancel();
				}}
			>
				<input type="hidden" name="id" value={project.id} />
				<button
					class="rounded-full px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-500/10"
					>Delete</button
				>
			</form>
		</div>
	</div>
{/snippet}

<!-- A small version of the web card on the page, updated while typing. -->
{#snippet compact(project: typeof preview)}
	<article
		class="flex gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
		aria-label="Preview"
	>
		{#if project?.image && !project.art}
			<img src={project.image} alt="" class="h-20 w-20 shrink-0 rounded-xl object-cover" />
		{/if}
		<div class="min-w-0 flex-1">
			<p class="text-xs font-semibold tracking-widest text-yellow-500 uppercase">
				{label({ kind: 'web', ...project, year: project?.year || new Date().getFullYear() })}
				{#if project?.art}<span class="text-zinc-400 normal-case">· {project.art} drawing</span
					>{/if}
			</p>
			<p class="mt-1 truncate text-lg font-bold">
				{project?.name || 'New project'}{#if project?.featured}<span class="ml-1 text-yellow-500"
						>★</span
					>{/if}
			</p>
			{#if project?.tagline}<p class="truncate text-sm font-medium text-zinc-500">
					{project.tagline}
				</p>{/if}
			{#if project?.summary}<p class="mt-1.5 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
					{project.summary}
				</p>{/if}
			{#if project?.stack.length || project?.features.length}
				<div class="mt-2 flex flex-wrap items-center gap-1.5">
					{#each project.stack as item (item)}
						<span
							class="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
							>{item}</span
						>
					{/each}
					{#if project.features.length}
						<span class="text-[11px] text-zinc-500">{project.features.length} features</span>
					{/if}
				</div>
			{/if}
		</div>
	</article>
{/snippet}
