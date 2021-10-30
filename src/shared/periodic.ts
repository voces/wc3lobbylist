import { isExiting, onExitHandlers } from "../close.js";
import { logLine } from "./log.js";

export const periodic = (
	name: string,
	interval: number,
	fn: () => Promise<void>,
): void => {
	let lastWork = 0;
	let updateTimeout: NodeJS.Timeout;

	const healthCheck = setInterval(() => {
		if (Date.now() - lastWork < interval * 6) return;

		logLine("", name, "looks dead, killing...");
		process.exit(1);
	}, Math.max(interval * 3, Math.min(interval * 60, 1_000 * 60 * 10)));

	const wrappedFn = async (): Promise<void> => {
		const start = (lastWork = Date.now());

		try {
			await fn();
		} catch (err) {
			console.error(err);
		}

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
