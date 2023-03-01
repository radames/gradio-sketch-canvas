<script lang="ts">
	import { SECTIONS, TEXTURES } from '../data';
	import { selectedParams, generateHuman } from '$lib/store';
	import type { FormElements } from '../types';
	import { randomSeed } from '$lib/utils';
	function submit() {
		const elements: FormElements = form.elements as FormElements;
		$selectedParams = {
			texture: `${elements.texture0.value},${elements.texture1.value},${elements.texture2.value}`,
			seed: BigInt(elements.seed.value),
			steps: parseInt(elements.steps.value)
		};
	}

	let form: HTMLFormElement;
	let seed: bigint = $selectedParams.seed;
	let sampleSteps: number = $selectedParams.steps;
</script>

<form bind:this={form} on:input={submit}>
	<h4 class="font-bold mt-6 mb-2 my-6 leading-6">Texture Description</h4>
	<div class="sections">
		{#each SECTIONS as section, i}
			<select name="texture{i}" disabled={$generateHuman === true}>
				<option disabled selected>{section}</option>
				{#each TEXTURES as texture}
					<option value={texture}>{texture}</option>`
				{/each}
			</select>
		{/each}
	</div>
	<h4 class="font-bold mt-6 mb-2 my-6 leading-6">Random Seed</h4>
	<input
		bind:value={seed}
		type="Number"
		name="seed"
		placeholder="Integer Seed"
		disabled={$generateHuman === true}
	/>
	<button
		on:click|preventDefault={() => {
			seed = randomSeed();
			submit();
		}}
		disabled={$generateHuman === true}
	>
		Random
	</button>
	<h4 class="font-bold mt-6 mb-2 my-6 leading-6">Sample Steps</h4>
	<div class="flex">
		<input
			bind:value={sampleSteps}
			type="range"
			name="steps"
			min="10"
			max="300"
			step="1"
			disabled={$generateHuman === true}
		/>
		<label class="pl-2" for="steps">{sampleSteps}</label>
	</div>
</form>

<style lang="postcss" scoped>
	.sections {
		@apply flex sm:flex-row flex-col gap-1 sm:gap-3;
	}
	select,
	button,
	input {
		@apply p-1 disabled:opacity-50 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500;
	}
	input:disabled + label {
		@apply opacity-50;
	}
	input {
		@apply pl-3;
	}
</style>
