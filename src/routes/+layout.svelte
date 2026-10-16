<script lang="ts">
	import { resolve } from '$app/paths';
	import './layout.css';

	let { children, data } = $props();
	const year = new Date().getFullYear();
	// Scroll-driven CSS animations don't run in Safari or Firefox, so the header follows scrollY instead.
	let scrollY = $state(0);
</script>

<svelte:head>
	<link rel="icon" type="image/x-icon" href="/favicon.ico" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&display=swap"
	/>
</svelte:head>

<svelte:window bind:scrollY />

<div class="flex min-h-screen flex-col">
	<header
		class="fixed top-0 z-50 w-full px-6 py-4 transition-[background-color,backdrop-filter] duration-300 select-none {scrollY >
		8
			? 'bg-zinc-50/70 backdrop-blur-md dark:bg-zinc-950/70'
			: ''}"
	>
		<div class="mx-auto flex max-w-7xl items-center">
			<a href={resolve('/')} class="flex flex-row items-center gap-2">
				<img src="/logo.webp" class="w-9" alt="" />
				<span class="text-xl font-bold whitespace-nowrap">{data.brand}</span>
			</a>
		</div>
	</header>

	<main class="mt-24 flex-grow">
		{@render children()}
	</main>

	<footer class="bg-zinc-100/20 select-none dark:bg-zinc-900/30">
		<div class="mx-auto w-full max-w-screen-xl px-6 py-6 lg:py-8">
			<hr class="mb-6 border-zinc-200/60 lg:mb-8 dark:border-zinc-800/60" />
			<span class="text-sm text-zinc-300 dark:text-zinc-700">
				&copy; JRG Tools - Jorge 2013 - {year}
			</span>
		</div>
	</footer>
</div>
