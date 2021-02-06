import { isExiting, onExitHandlers } from "../close.js";

export const periodic = (
	name: string,
	interval: number,
	fn: () => Promise<void>,
): void => {
	let lastWork = 0;
	let updateTimeout: NodeJS.Timeout;

	const healthCheck = setInterval(() => {
		if (Date.now() - lastWork < interval * 6) return;

		console.log(new Date(), name, "looks dead, killing...");
		process.exit(1);
	}, interval * 3);

	const wrappedFn = async (): Promise<void> => {
		const start = (lastWork = Date.now());

		await fn();

		if (!isExiting())
			updateTimeout = setTimeout(
				wrappedFn,
				start + interval - Date.now(),
			);
	};

	onExitHandlers.push(() => {
		clearTimeout(updateTimeout);
		clearInterval(healthCheck);
	});

	wrappedFn();
};
