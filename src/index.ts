import "./commands/index.js";
import "./close.js";
import "./w3xio/index.js";

import { messageAdmin } from "./discord.js";

process.on("uncaughtException", async err => {
	console.error(err);
	try {
		await messageAdmin(
			`Uncaught exception:\n\`\`\`\n${err.stack ?? err}\n\`\`\``,
		);
	} finally {
		process.exit(1);
	}
});

// The bot fires off a lot of unawaited replies/DMs; surface rejections rather
// than letting them go unhandled (and crash the process on newer Node
// versions). Unlike uncaughtException we don't exit — a stray rejection isn't
// necessarily fatal. messageAdmin is awaited inside try/catch so that its own
// failure can't spawn another unhandledRejection and loop.
process.on("unhandledRejection", async reason => {
	console.error("Unhandled rejection:", reason);
	try {
		const detail =
			reason instanceof Error ? (reason.stack ?? reason) : reason;
		await messageAdmin(`Unhandled rejection:\n\`\`\`\n${detail}\n\`\`\``);
	} catch (err) {
		console.error("Failed to report unhandled rejection:", err);
	}
});
