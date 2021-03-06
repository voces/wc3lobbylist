import { logLine } from "./shared/log.js";

export const onExitHandlers: (() => Promise<void> | void)[] = [];
let exiting = false;
export const isExiting = (): boolean => exiting;

let killing = false;
export const onProcessClose = async (): Promise<void> => {
	if (killing) return;
	killing = true;

	logLine("", "received kill signal");

	exiting = true;

	for (const onExitHandler of onExitHandlers) await onExitHandler();

	process.exit();
};

process.on("SIGINT", onProcessClose);
process.on("SIGTERM", onProcessClose);
