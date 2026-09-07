<script lang="ts">
	import type { Snippet } from 'svelte';
	import { nextDomId } from '$lib/utils/domIds';

	type InputType = 'text' | 'email' | 'url' | 'number' | 'tel' | 'password' | 'search' | 'date' | 'time';
	type FieldKind = 'input' | 'textarea' | 'select' | 'slot';

	interface Props {
		id?: string;
		label?: string;
		hint?: string;
		error?: string;
		kind?: FieldKind;
		type?: InputType;
		value?: string;
		placeholder?: string;
		rows?: number;
		disabled?: boolean;
		required?: boolean;
		class?: string;
		children?: Snippet;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
	}

	let {
		id,
		label,
		hint,
		error,
		kind = 'input',
		type = 'text',
		value = $bindable(''),
		placeholder,
		rows = 3,
		disabled = false,
		required = false,
		class: className = '',
		children,
		oninput,
		onchange
	}: Props = $props();

	const inputBase =
		'w-full px-3 py-2 bg-[var(--dash-field)] border rounded-md text-dash-text placeholder:text-dash-text-secondary focus:ring-2 focus:ring-dash-accent focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm';
	const inputBorder = $derived(error ? 'border-dash-danger' : 'border-dash-border');
	const fallbackFieldId = nextDomId('field');
	const fieldId = $derived(id ?? fallbackFieldId);
</script>

<div class="space-y-1 {className}">
	{#if label}
		<label for={fieldId} class="block text-sm font-medium text-dash-text">
			{label}
			{#if required}<span class="text-dash-accent ml-0.5" aria-hidden="true">*</span>{/if}
		</label>
	{/if}

	{#if kind === 'textarea'}
		<textarea
			id={fieldId}
			{placeholder}
			{disabled}
			{required}
			{rows}
			class="{inputBase} {inputBorder} resize-none"
			{oninput}
			{onchange}
			bind:value
		></textarea>
	{:else if kind === 'select'}
		<div class="relative">
			<select
				id={fieldId}
				{disabled}
				{required}
				class="{inputBase} {inputBorder} appearance-none pr-8"
				{onchange}
				bind:value
			>
				{#if children}
					{@render children()}
				{/if}
			</select>
			<div class="pointer-events-none absolute inset-y-0 right-2 flex items-center">
				<svg class="w-4 h-4 text-dash-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</div>
	{:else if kind === 'slot'}
		{#if children}
			{@render children()}
		{/if}
	{:else}
		<input
			id={fieldId}
			{type}
			{placeholder}
			{disabled}
			{required}
			class="{inputBase} {inputBorder}"
			{oninput}
			{onchange}
			bind:value
		/>
	{/if}

	{#if error}
		<p class="text-xs text-dash-danger" role="alert">{error}</p>
	{:else if hint}
		<p class="text-xs text-dash-text-secondary">{hint}</p>
	{/if}
</div>
