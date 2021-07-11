import { Message } from "discord.js";

import { query } from "../shared/sql.js";
import { cleanUsername, formatList, formatTime } from "../shared/util.js";
import { expectedScore } from "../w3xio/replays/revo/processRound.js";

const fromEntriesGroup = <V extends string, K>(
	entries: [key: V, value: K][],
) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const obj: Record<V, K[]> = {} as any;
	for (const [key, value] of entries) {
		if (!obj[key]) obj[key] = [];
		obj[key].push(value);
	}
	return obj;
};

const queryFullPlayerNames = (players: string[]) =>
	query<{ input: string; player: string }[][]>(
		players
			.map(
				() =>
					"SELECT DISTINCT ? input, player FROM elo.outcome WHERE player LIKE ?;",
			)
			.join("\n"),
		players.flatMap((r) => [r, r + "%"]),
	).then((r) => fromEntriesGroup(r.flat().map((r) => [r.input, r.player])));

export const matchup = async (
	message: Message,
	rest: string[],
): Promise<void> => {
	const words = rest
		.flatMap((w) => w.split(","))
		.map((w) => w.replace(/[, ]/g, ""))
		.filter((v) => v.length);
	const pivot = words.findIndex((w) => w === "vs" || w === "v");
	if (pivot === -1) {
		message.reply(
			"invalid syntax. Example: nmcdo raffish vs eenz verit skiddo ferfykins",
		);
		return;
	}

	const rawSheep = words.slice(0, pivot);
	const rawWolves = words.slice(pivot + 1);

	const setup = `${rawSheep.length}v${rawWolves.length}`;
	if (!["2v4", "3v5", "4v6", "5v5"].includes(setup)) {
		message.reply("unsupported matchup. Use 2v4, 3v5, 4v6, or 5v5");
		return;
	}
	const [sheepResults, wolfResults] = await Promise.all([
		queryFullPlayerNames(rawSheep),
		queryFullPlayerNames(rawWolves),
	]);

	const duplicates = [
		...Object.entries(sheepResults),
		...Object.entries(wolfResults),
	].filter(([, matches]) => matches.length > 1);

	if (duplicates.length) {
		message.reply(
			`I was unable to resolve some accounts: ${duplicates
				.map(
					([name, matches]) =>
						`${name} matches ${formatList(
							matches.length > 4
								? [
										...matches.slice(0, 4),
										`${matches.length - 4} more`,
								  ]
								: matches,
						)}`,
				)
				.join("; ")}`,
		);
		return;
	}

	const sheep = Object.values(sheepResults).map((v) => v[0]);
	const wolves = Object.values(wolfResults).map((v) => v[0]);

	const ret = await expectedScore(
		setup,
		setup,
		sheep,
		wolves,
		Date.now() / 1000,
	);
	if (!ret) {
		message.reply("unable to calculate matchup.");
		return;
	}

	message.reply(
		`I'd expect ${formatList(
			sheep.map(cleanUsername),
		)} to last ${formatTime(Math.round(ret.expectedTime))} (P${Math.round(
			ret.expectedWolfScore * 100,
		)}) against ${formatList(wolves.map(cleanUsername))}.`,
	);
};
