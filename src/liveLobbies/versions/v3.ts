import type { MessageEmbed } from "discord.js";
import Discord from "discord.js";

import { ruleToFilter } from "../../commands/ruleToFilter.js";
import { config, saveConfig } from "../../config.js";
import discord, { ChannelError } from "../../discord.js";
import { logLine } from "../../shared/log.js";
import type { Lobby as APILobby } from "../fetchLobbies.js";
import { LobbyEmbed } from "../LobbyEmbed.js";

const ONE_MINUTE = 60 * 1000;
const TEN_MINUTES = 10 * ONE_MINUTE;

type Lobby = APILobby & { deleted?: number };

let oldLobbies: Record<string, Lobby> = {};

const getChannelIds = (lobby: Lobby): string[] =>
	Object.entries(config)
		.filter(([, config]) => {
			if (!config.filterFunc)
				config.filterFunc = ruleToFilter(config.filter);

			return config.filterFunc(lobby);
		})
		.map(([channelId]) => channelId);

const format = (lobby: Lobby): string =>
	Discord.Util.escapeMarkdown(
		`[${lobby.server}] ${lobby.name} (${
			lobby.slots ? `${lobby.slots.occupied}/${lobby.slots.max}` : "?/?"
		})`,
	);

const onNewLobby = async (lobby: Lobby): Promise<void> => {
	const channelIds = getChannelIds(lobby);
	if (!channelIds.length) return;

	lobby.messages = (
		await Promise.all(
			channelIds.map(async (channelId) => {
				const embed = new LobbyEmbed();
				embed
					.set("color", 0x6edb6f)
					.set("title", lobby.map?.replace(/_/g, " ") ?? "?")
					.set("gameName", lobby.name ?? "?")
					.set("host", lobby.host ?? "?")
					.set("realm", lobby.server ?? "?")
					.set(
						"players",
						`${lobby.slots.occupied}/${lobby.slots.max}`,
					);

				const newMessage = await discord
					.send(
						channelId,
						...(config[channelId].message
							? [config[channelId].message, embed.toEmbed()]
							: [embed.toEmbed()]),
					)
					.catch((err) => err);

				if (newMessage instanceof Error) {
					if (newMessage instanceof ChannelError) {
						logLine(
							"live-lobbies",
							"v3",
							"deleting invalid channel",
							channelId,
						);
						delete config[channelId];
						saveConfig();
						return;
					}

					return console.error(new Date(), newMessage);
				} else {
					logLine("live-lobbies", "v3 n", format(lobby));
					if (config[channelId].errors) {
						delete config[channelId].errors;
						saveConfig();
					}
				}

				return newMessage;
			}),
		)
	)
		.filter((v) => v)
		.flat();
};

const updateEmbeds = async (
	lobby: Lobby,
	fn: (embed?: MessageEmbed) => LobbyEmbed,
	fnDo?: (lobby: Lobby) => void,
): Promise<void> => {
	if (!lobby.messages || !lobby.messages.length) return;

	if (fnDo) fnDo(lobby);

	await Promise.all(
		lobby.messages.map((message) => {
			try {
				return message.edit(
					message.content,
					fn(message.embeds[0]).toEmbed(),
				);
			} catch (err) {
				console.error(new Date(), err);
			}
		}),
	);
};

const onUpdateLobby = async (lobby: Lobby): Promise<void> =>
	updateEmbeds(
		lobby,
		(embed) =>
			new LobbyEmbed(embed)
				.set("color", 0x6edb6f)
				.set(
					"players",
					lobby.slots
						? `${lobby.slots.occupied}/${lobby.slots.max}`
						: "?/?",
				),
		(lobby) => logLine("live-lobbies", "v2/3 u", format(lobby)),
	);

const onKillLobby = async (lobby: Lobby): Promise<void> =>
	updateEmbeds(
		lobby,
		(embed) =>
			new LobbyEmbed(embed)
				.set("color", 0xe69500)
				.set(
					"players",
					lobby.slots
						? `${lobby.slots.occupied}/${lobby.slots.max}`
						: "?/?",
				),
		(lobby) => logLine("live-lobbies", "v2/3 k", format(lobby)),
	);

const onDeleteLobby = async (lobby: Lobby): Promise<void> =>
	updateEmbeds(
		lobby,
		(embed) =>
			new LobbyEmbed(embed)
				.set("color", 0xff7d9c)
				.set(
					"players",
					lobby.slots
						? `${lobby.slots.occupied}/${lobby.slots.max}`
						: "?/?",
				),
		(lobby) => logLine("live-lobbies", "v2/3 d", format(lobby)),
	);

export const newLobbies = async (newLobbies: Lobby[]): Promise<void> => {
	for (const newLobby of newLobbies) {
		const oldLobby = oldLobbies[newLobby.id ?? ""];
		if (oldLobby) {
			newLobby.messages = oldLobby.messages;

			if (oldLobby.slots.occupied !== newLobby.slots.occupied)
				try {
					await onUpdateLobby(newLobby);
				} catch (err) {
					console.error(new Date(), err);
				}
		} else
			try {
				await onNewLobby(newLobby);
			} catch (err) {
				console.error(new Date(), err);
			}
	}

	const lobbyMap = Object.fromEntries(newLobbies.map((l) => [l.id, l]));

	for (const id in oldLobbies)
		if (!lobbyMap[id]) {
			let deleted = oldLobbies[id].deleted;
			if (typeof deleted !== "number") {
				try {
					await onKillLobby(oldLobbies[id]);
				} catch (err) {
					console.error(new Date(), err);
				}

				deleted = oldLobbies[id].deleted = Date.now();
			}

			if (deleted > Date.now() - TEN_MINUTES)
				lobbyMap[id] = oldLobbies[id];
			else
				try {
					await onDeleteLobby(oldLobbies[id]);
				} catch (err) {
					console.error(new Date(), err);
				}
		}

	oldLobbies = lobbyMap;
};

export const onExit = async (): Promise<void> => {
	for (const lobbyId in oldLobbies)
		try {
			await onDeleteLobby(oldLobbies[lobbyId]);
		} catch (err) {
			console.error(new Date(), err);
		}
};
