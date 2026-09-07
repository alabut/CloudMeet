let counter = 0;

/** Deterministic per-session DOM id for components without a provided id. */
export function nextDomId(prefix: string): string {
	counter += 1;
	return `${prefix}-${counter}`;
}
