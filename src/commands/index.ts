import type { Message } from "discord.js";

import { config as appConfig } from "../../config.js";
import { onProcessClose } from "../close.js";
import discord from "../discord.js";
import { info, logLine } from "../shared/log.js";
import { elo } from "./elo.js";
import { js } from "./js.js";
import { last } from "./last.js";
import { matchup } from "./matchup.js";
import { rounds } from "./rounds.js";
import { sql } from "./sql.js";
import { summary } from "./summary.js";
import { top } from "./top.js";

const processCommand = async (
	message: Message,
	command: string,
	rest: string[],
) => {
	switch (command) {
		case "restart": {
			if (message.author.id !== appConfig.admin) return;

			try {
				await message.reply("restarting...");
				logLine("discord", "restarting by command...");
				await onProcessClose();
			} catch (err) {
				console.error(new Date(), err);
			}

			process.exit(0);
			break;
		}
		case "matchup": {
			await matchup(message, rest);
			break;
		}
		case "top": {
			await top(message, rest);
			break;
		}
		case "elo": {
			await elo(message, rest);
			break;
		}
		case "rounds": {
			await rounds(message, rest);
			break;
		}
		case "last": {
			await last(message);
			break;
		}
		case "summary": {
			await summary(message, rest);
			break;
		}
		case "sql": {
			if (message.author.id !== appConfig.admin) return;

			await sql(message, rest);
			break;
		}
		case "js": {
			if (message.author.id !== appConfig.admin) return;

			await js(message, rest);
			break;
		}
		default: {
			message.reply(`unknown command: ${command}.`);
		}
	}
};

discord.on("messageCreate", async message => {
	// Only DMs reach us — the GuildMessages intent is intentionally not
	// requested. This guard is defensive in case Discord ever forwards one.
	if (!message.channel.isDMBased()) return;
	if (message.author.bot) return;

	const [command, ...rest] = message.content
		.replace(new RegExp(`<@!?${discord.user?.id}>`), "")
		.trim()
		.split(" ");

	logLine(
		"discord",
		info({
			author: {
				id: message.author.id,
				username: message.author.username,
			},
			channel: { id: message.channel.id, name: "dm" },
			message: [command, ...rest],
		}),
	);

	try {
		await processCommand(message, command.toLocaleLowerCase(), rest);
	} catch (err) {
		logLine("discord", err);
	}
});
