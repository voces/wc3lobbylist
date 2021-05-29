import { Message } from "discord.js";

import { query } from "../shared/sql.js";

export const summary = async (
	message: Message,
	args: string[],
): Promise<void> => {
	const [replayid, mode = "2v4"] = args;

	if (!replayid) {
		message.reply("incorrect syntax. Example: summary 93556");
		return;
	}

	const data = await query<
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

	const maxNameLength = data.reduce(
		(max, r) => (max > r.player.length ? max : r.player.length),
		6,
	);

	message.reply(
		"changes in " +
			mode +
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
