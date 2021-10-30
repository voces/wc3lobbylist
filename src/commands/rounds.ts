import type { Message } from "discord.js";

import { query } from "../shared/sql.js";
import { cleanUsername, formatList, formatTime } from "../shared/util.js";

export const rounds = async (
	message: Message,
	args: string[],
): Promise<void> => {
	let [replay] = args;

	if (!replay)
		replay = await query<{ replayid: number }[]>(
			"SELECT replayid FROM elo.replay ORDER BY replayid DESC LIMIT 1;",
		).then((d) => d[0].replayid.toString());

	const data = await query<
		{
			round: number;
			mode: string;
			player: string;
			change: number;
			duration: number;
		}[]
	>(
		`SELECT round.round, \`mode\`, player, \`change\`, duration
		FROM elo.outcome
		INNER JOIN elo.round ON outcome.replayid = round.replayid
			AND outcome.round = round.round
		WHERE outcome.replayid = ?;`,
		[replay],
	);

	if (!data.length) {
		message.reply("no rounds found.");
		return;
	}

	const grouped = data.reduce((data, { round, mode, player, ...rest }) => {
		const roundData = data[round] ?? (data[round] = {});
		const modeData = roundData[mode] ?? (roundData[mode] = {});
		modeData[player] = rest;
		return data;
	}, {} as Record<string, Record<string, Record<string, { change: number; duration: number }>>>);

	const rounds = Object.entries(grouped)
		.sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
		.map(([_, data]) => {
			const setup = Object.keys(data).find(
				(k) => k !== "overall" && !k.includes("-"),
			)!;

			const sheep = Object.keys(data[`${setup}-sheep`]);
			const wolves = Object.keys(data[`${setup}-wolf`]);

			const generalOutcome = data[setup][sheep[0]];

			const outcomes = [
				[`in ${setup}`, generalOutcome],
				["in team", data[`${setup}-sheep`][sheep[0]]],
				["overall", data.overall[sheep[0]]],
			] as const;

			return `${formatList(sheep.map(cleanUsername))} vs ${formatList(
				wolves.map(cleanUsername),
			)}
Lasted ${formatTime(Math.round(generalOutcome.duration))}
${formatList(
	outcomes.map(
		([mode, o], i) =>
			`${
				o.change > 0
					? `${i === 0 ? "G" : "g"}ained`
					: `${i === 0 ? "L" : "l"}ost`
			} ${o.change.toPrecision(2)} ${mode}`,
	),
)}`;
		});

	for (let i = 0; i < rounds.length; i += 10)
		message.reply(rounds.slice(i, i + 10).join("\n\n"));
};
