import "./commands/index.js";
import "./close.js";
import "./liveLobbies/index.js";
import "./w3xio/index.js";
import { messageAdmin } from "./discord.js";

process.on("uncaughtException", async (err) => {
	console.error(err);
	try {
		await messageAdmin(
			`Uncaught exception:\n\`\`\`\n${err.stack ?? err}\n\`\`\``,
		);
	} finally {
		process.exit(1);
	}
});
