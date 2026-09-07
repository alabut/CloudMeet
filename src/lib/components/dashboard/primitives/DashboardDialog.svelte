<script lang="ts">
	import type { Snippet } from 'svelte';
	import { nextDomId } from '$lib/utils/domIds';

	interface Props {
		open?: boolean;
		title: string;
		titleId?: string;
		class?: string;
		children: Snippet;
		onclose?: () => void;
	}

	let { open = $bindable(false), title, titleId, class: className = '', children, onclose }: Props =
		$props();

	const fallbackTitleId = nextDomId('dialog-title');
	const dialogTitleId = $derived(titleId ?? fallbackTitleId);
	let dialogEl: HTMLDivElement | undefined = $state();
	let panelEl: HTMLDivElement | undefined = $state();
	let closeBtn: HTMLButtonElement | undefined = $state();
	let previousActiveElement: HTMLElement | null = null;

	function close() {
		open = false;
		onclose?.();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (panelEl && !panelEl.contains(e.target as Node)) {
			close();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			return;
		}
		if (e.key === 'Tab' && dialogEl) {
			const focusable = dialogEl.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last?.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first?.focus();
			}
		}
	}

	$effect(() => {
		if (open) {
			previousActiveElement = document.activeElement as HTMLElement | null;
			document.body.style.overflow = 'hidden';
			queueMicrotask(() => closeBtn?.focus());
		} else {
			document.body.style.overflow = '';
			if (previousActiveElement) {
				previousActiveElement.focus();
				previousActiveElement = null;
			}
		}

		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		bind:this={dialogEl}
		role="dialog"
		aria-modal="true"
		aria-labelledby={dialogTitleId}
		tabindex="-1"
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBackdropClick(e as unknown as MouseEvent); }}
	>
		<div
			bind:this={panelEl}
			class="w-full max-w-lg max-h-[min(90vh,100dvh-2rem)] flex flex-col bg-dash-surface border border-dash-border rounded-lg shadow-xl {className}"
		>
			<div class="flex items-center justify-between px-5 py-4 border-b border-dash-border flex-shrink-0">
				<h2 id={dialogTitleId} class="font-display font-medium text-base text-dash-text">
					{title}
				</h2>
				<button
					bind:this={closeBtn}
					type="button"
					onclick={close}
					aria-label="Close dialog"
					class="inline-flex items-center justify-center w-7 h-7 rounded-md text-dash-text-secondary hover:text-dash-text hover:bg-dash-surface-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="px-5 py-4 overflow-y-auto flex-1 min-h-0">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
