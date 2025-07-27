import type { Message } from "discord.js";

import { config as appConfig } from "../../config.js";
import { onProcessClose } from "../close.js";
import { config, saveConfig } from "../config.js";
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
		case "alert": {
			message.reply("Deprecated! Use /alert");
			break;
		}
		case "stop": {
			delete config[message.channel.id];
			saveConfig();

			try {
				message.reply("stopped! To restart, use /alert");
			} catch (err) {
				console.error(new Date(), err);
			}
			break;
		}
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
		case "bulkdelete": {
			if (message.channel.type === "dm") {
				message.reply("cannot bulk delete in dm channels");
				return;
			}
			const amount = Math.min(parseInt(rest[0]) || 10, 99);
			logLine("discord", "bulk deleting", amount, "messages");
			try {
				await message.channel.bulkDelete(amount + 1);
			} catch (err) {
				console.error(new Date(), err);
			}

			break;
		}
		default: {
			message.reply(`unknown command: ${command}.`);
		}
	}
};

discord.on("message", async (message) => {
	// only consider messages that mention us
	if (
		!message.mentions.users.has(discord.user?.id || "") &&
		message.channel.type !== "dm"
	)
		return;

	const guildMember = message.guild?.member(message.author.id);

	if (
		// Ignore bots
		message.author.bot ||
		// Ignore if the user isn't admin and it's not a DM
		(message.channel.type !== "dm" &&
			(!guildMember ||
				(!guildMember.hasPermission("MANAGE_MESSAGES") &&
					message.author.id !== appConfig.admin)))
	)
		return;

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
				displayName: guildMember?.displayName,
			},
			guild: {
				id: message.guild?.id,
				name: message.guild?.name,
			},
			channel: {
				id: message.channel.id,
				name:
					message.channel.type === "dm" ? "dm" : message.channel.name,
			},
			message: [command, ...rest],
		}),
	);

	try {
		await processCommand(message, command.toLocaleLowerCase(), rest);
	} catch (err) {
		logLine("discord", err);
	}
});
