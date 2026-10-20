<script lang="ts">
	import { SignIn } from 'svelte-clerk';
</script>

<div class="flex justify-center px-6 py-8">
	<SignIn path="/sign-in" fallbackRedirectUrl="/admin" />
</div>
