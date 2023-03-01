<script lang="ts">
	let canvas: HTMLCanvasElement;
	import { API } from '../data';
	import { nanoid } from 'nanoid';
	import type { Params } from '../types';

	import {
		selectedParams,
		generateHuman,
		currentCanvas,
		resultImage,
		saveResult
	} from '$lib/store';

	$: (async () => {
		if ($generateHuman) {
			const results = await predict($currentCanvas.toDataURL(), $selectedParams);
			if (results) {
				$resultImage = results.data[0];
			}
			$generateHuman = false;
		}
	})();

	$: (async () => {
		if ($saveResult) {
			const results = await saveImage($resultImage);
			$saveResult = false;
		}
	})();

	let predictStatus: string = '';
	async function saveImage(base64Image: string) {
		return new Promise((resolve, reject) => {
			try {
				const a = document.createElement('a');
				a.download = `sucess-${Date.now()}.png`;
				a.target = '_self';
				a.onclick = async (e) => {
					if (a.href) {
						URL.revokeObjectURL(a.href);
					}
					a.href = base64Image;
				};
				requestAnimationFrame(() => {
					console.log('Downloading image.');
					a.click();
					resolve(null);
				});
			} catch (err) {
				reject();
			}
		});
	}
	async function predict(base64Image: string, { texture, steps, seed }: Params) {
		const session = nanoid(11);
		let hash, queue_position;
		let b = 0;
		predictStatus = 'Generating';
		const controller = new AbortController();
		// invalidation.then(() => {
		// 	controller.abort();
		// });
		await fetch(API + '/api/queue/push/', {
			signal: controller.signal,
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
			body: JSON.stringify({
				fn_index: 2,
				data: [base64Image, texture, steps, Number(seed)],
				action: 'predict',
				session_hash: session
			})
		})
			.then(async (res) => {
				const data = await res.json();
				({ hash, queue_position } = data);
			})
			.catch((err) => {
				console.log(err);
			});

		let timeout = 0;
		let status, data;
		while (status !== 'QUEUED' || status !== 'PENDING') {
			try {
				const resp = await fetch(API + '/api/queue/status/', {
					signal: controller.signal,
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
					body: JSON.stringify({ hash: hash })
				});
				if (resp.status != 200) {
					break;
				}
				({ status, data } = await resp.json());
				if (status === 'QUEUED') {
					predictStatus = `Queue ${data}/${queue_position}`;
				} else if (status === 'PENDING') {
					predictStatus = 'Pending';
				} else if (status === 'FAILED') {
					predictStatus = 'Failed';
					break;
				} else if (status === 'COMPLETE') {
					predictStatus = 'Complete';
					break;
				}
				await new Promise((resolve) => setTimeout(resolve, 1000));
			} catch (error) {
				console.log(error);
				break;
			}
		}
		return data;
	}
</script>

<div class="relative overflow-clip flex flex-col justify-center items-center w-full h-full">
	{#if $resultImage}
		<img
			class="image {$generateHuman ? 'opacity-30' : ''}"
			alt="Generative Human Result"
			src={$resultImage}
			width="256"
			height="512"
		/>
	{/if}
	{#if $generateHuman}
		<div class="loading">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="animate-spin max-w-[3rem]"
			>
				<path
					fill="currentColor"
					d="M20 12a8 8 0 0 1-8 8v4a12 12 0 0 0 12-12h-4Zm-2-5.3a8 8 0 0 1 2 5.3h4c0-3-1.1-5.8-3-8l-3 2.7Z"
				/>
			</svg>
			<span class="text-xs">{predictStatus}</span>
		</div>
	{/if}
</div>

<!-- {/if} -->
<style lang="postcss" scoped>
	.image {
		@apply box-border z-0 border dark:border-gray-300 border-gray-500 aspect-[256/512];
	}
	.loading {
		@apply absolute top-0 left-0 right-0 bottom-0 flex flex-col justify-center items-center;
	}
</style>
