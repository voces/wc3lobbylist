import { Message } from "discord.js";

import { query } from "../shared/sql.js";

export const summary = async (
	message: Message,
	args: string[],
): Promise<void> => {
	let replayid = args[0];
	const mode = args[1] ?? "2v4";

	if (!replayid)
		replayid = await query<{ replayid: number }[]>(
			"SELECT replayid FROM elo.replay ORDER BY replayid DESC LIMIT 1;",
		).then((d) => d[0].replayid.toString());

	let data = await query<
		{
			player: string;
			change: number;
			best: number;
			worst: number;
			rounds: number;
		}[]
	>(
		"SELECT player, SUM(`change`) `change`, MAX(`change`) best, MIN(`change`) worst, COUNT(1) rounds FROM elo.outcome WHERE replayid = ? AND `mode` = ? GROUP BY player ORDER BY 2 DESC;",
		[replayid, mode],
	);

	if (!data.length) {
		message.reply("no rounds found.");
		return;
	}

	data = data.map((r) => ({ ...r, player: r.player.split("#")[0] }));

	const maxNameLength = data.reduce(
		(max, r) => (max > r.player.length ? max : r.player.length),
		6,
	);

	message.reply(
		"changes in " +
			mode +
			" for " +
			replayid +
			":\n```\n" +
			"Player".padStart(maxNameLength) +
			" Change  Best Worst Rounds\n" +
			data
				.map((r) =>
					[
						r.player.padStart(maxNameLength),
						r.change.toFixed(1).padStart(6),
						r.best.toFixed(1).padStart(5),
						r.worst.toFixed(1).padStart(5),
						r.rounds.toString().padStart(6),
					].join(" "),
				)
				.join("\n") +
			"```",
	);
};
