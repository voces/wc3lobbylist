import { Message } from "discord.js";

import { query } from "../shared/sql.js";
import { cleanUsername } from "../shared/util.js";
import { getSeason } from "../w3xio/replays/revo/processRound.js";

export const top = async (message: Message, args: string[]): Promise<void> => {
	const [mode = "2v4", season = getSeason(Date.now() / 1000)] = args;
	const results = [
		{ rounds: "Rounds", rating: "Rating", player: "" },
		...((await query(
			"SELECT player, rating, rounds FROM elo.elos WHERE season = ? AND `mode` = ? ORDER BY rating DESC LIMIT 10;",
			[season, mode],
		)) as { player: string; rating: number; rounds: number }[]).map(
			(r) => ({
				rounds: r.rounds,
				rating: Math.round(r.rating),
				player: cleanUsername(r.player),
			}),
		),
	];

	if (results.length === 1) {
		message.reply("there are no results.");
		return;
	}

	const maxUsername = results.reduce(
		(max, r) => Math.max(max, r.player.length),
		0,
	);

	message.reply(
		`top 10 in ${mode} in ${season}:
\`\`\`${results
			.map(
				(r) =>
					`${r.player.padEnd(
						maxUsername,
						" ",
					)} ${r.rating
						.toString()
						.padStart(6, " ")} ${r.rounds
						.toString()
						.padStart(6, " ")}`,
			)
			.join("\n")}\`\`\``,
	);
};
