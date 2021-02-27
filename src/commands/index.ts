import { Message } from "discord.js";

import { onProcessClose } from "../close.js";
import { config, saveConfig } from "../config.js";
import discord from "../discord.js";
import { info, logLine } from "../shared/log.js";
import { elo } from "./elo.js";
import { last } from "./last.js";
import { matchup } from "./matchup.js";
import { parser } from "./parser.js";
import { rounds } from "./rounds.js";
import { stringifyReplacer } from "./stringify.js";
import { top } from "./top.js";

const checkAlert = (message: Message): void => {
	if (!config[message.channel.id]) {
		try {
			message.reply("there is no alert configured.");
		} catch (err) {
			console.error(new Date(), err);
		}

		return;
	}

	try {
		message.reply(
			`\`${JSON.stringify(
				config[message.channel.id],
				stringifyReplacer,
			).replace(/`/g, "\\`")}\``,
		);
	} catch (err) {
		console.error(new Date(), err);
	}
};

const processCommand = async (
	message: Message,
	command: string,
	rest: string[],
) => {
	switch (command) {
		case "alert": {
			if (rest.length === 0) return checkAlert(message);

			try {
				const { filter, options } = parser(
					rest.join(" ").replace(/^`/, "").replace(/`$/, ""),
				);
				const alreadyAdded = !!config[message.channel.id];
				config[message.channel.id] = { filter };
				if (options && options.message)
					config[message.channel.id].message = options.message;
				saveConfig();
				message.reply(alreadyAdded ? "modified!" : "added!");
			} catch (err) {
				logLine("discord", "message", message.content);
				console.error(new Date(), err);
				try {
					message.reply(
						'invalid syntax. Example: `alert (map:/sheep.*tag/i or map:/tree.*tag/i) server:"us" message:"@notify"`',
					);
				} catch (err) {
					console.error(new Date(), err);
				}
			}
			break;
		}
		case "stop": {
			delete config[message.channel.id];
			saveConfig();

			try {
				message.reply("stopped!");
			} catch (err) {
				console.error(new Date(), err);
			}
			break;
		}
		case "restart": {
			if (
				message.author.id !== "287706612456751104" // verit
			)
				return;

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
					message.author.id !== "287706612456751104"))) // verit
	)
		return;

	const [command, ...rest] = message.content
		.replace(`<@!${discord.user?.id}>`, "")
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
