<script lang="ts">
	import { SignIn } from 'svelte-clerk';
</script>

<div class="flex justify-center px-4 py-8 sm:px-6">
	<SignIn path="/sign-in" fallbackRedirectUrl="/admin" />
</div>
