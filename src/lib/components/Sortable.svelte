<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	let {
		items,
		key,
		onsort,
		row
	}: {
		items: T[];
		key: (item: T) => string;
		/** Called with the new order after a drop (or ↑/↓ on the handle). */
		onsort: (items: T[]) => void;
		row: Snippet<[T]>;
	} = $props();

	let from = $state<number | null>(null);
	let over = $state<number | null>(null);

	function move(a: number, b: number) {
		if (b < 0 || b >= items.length || a === b) return;
		const next = [...items];
		next.splice(b, 0, ...next.splice(a, 1));
		onsort(next);
	}
</script>

<ul
	class="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:rounded-3xl dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60"
>
	{#each items as item, i (key(item))}
		<li
			draggable="true"
			ondragstart={(e) => {
				from = i;
				e.dataTransfer?.setData('text/plain', key(item));
			}}
			ondragover={(e) => {
				e.preventDefault();
				over = i;
			}}
			ondrop={(e) => {
				e.preventDefault();
				if (from !== null) move(from, i);
			}}
			ondragend={() => (from = over = null)}
			class="flex items-center {from === i ? 'opacity-40' : ''} {over === i && from !== i
				? 'bg-yellow-400/10'
				: ''}"
		>
			<!-- The handle is a button so the order can also change from the keyboard. -->
			<button
				type="button"
				class="cursor-grab self-stretch px-3 text-zinc-400 hover:text-zinc-700 active:cursor-grabbing dark:hover:text-zinc-200"
				aria-label="Move"
				onkeydown={(e) => {
					if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
					e.preventDefault();
					move(i, e.key === 'ArrowUp' ? i - 1 : i + 1);
				}}>⠿</button
			>
			<div class="min-w-0 flex-1">{@render row(item)}</div>
		</li>
	{/each}
</ul>
