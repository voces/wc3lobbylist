export const logLine = (
	context: "revo" | "fixus" | "discord" | "live-lobbies" | "w3xio" | "",
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...values: any[]
): void => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const args: any[] = [new Date()];
	if (context) args.push(`[${context}]`);
	// eslint-disable-next-line no-console
	console.log(...args, ...values);
};

const hasData = (obj: unknown): boolean => {
	if (typeof obj !== "object" && obj !== undefined) return true;
	if (obj === null || obj === undefined) return false;
	if (Array.isArray(obj)) return obj.some(hasData);

	return Object.values(obj).some(hasData);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const info = (obj: unknown): any => {
	if (!hasData(obj)) return;

	// We can't actually return null here, since hasData would have returned false above
	if (typeof obj !== "object" || obj === null) return obj;

	if (Array.isArray(obj)) return obj.filter(hasData);

	return Object.fromEntries(
		Object.entries(obj)
			.filter(([, v]) => hasData(v))
			.map(([k, v]) => [k, info(v)]),
	);
};
