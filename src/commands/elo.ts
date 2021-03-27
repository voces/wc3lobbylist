import { Message } from "discord.js";

import { query } from "../shared/sql.js";
import { getSeason } from "../w3xio/replays/revo/processRound.js";

export const elo = async (message: Message, args: string[]): Promise<void> => {
	const name = await query<{ battlenettag: string }[]>(
		"SELECT battlenettag FROM elo.discordBattleNetMap WHERE discordid = ?;",
		[message.author.id],
	).then((r) => r[0]?.battlenettag);

	if (!name) {
		message.reply(
			"I do not know your Battle.net tag. Please talk to verit about sorting that out.",
		);
		return;
	}

	const [mode = "2v4", season = getSeason(Date.now() / 1000)] = args;

	const [rating, history] = await Promise.all([
		query<{ rating: number; rounds: number }[]>(
			"SELECT rating, rounds FROM elo.elos WHERE player = ? AND `mode` = ? AND season = ?;",
			[name, mode, season],
		).then((r) => r[0]),
		query<{ playedon: Date; change: number; replayid: string }[]>(
			`SELECT playedon, SUM(\`change\`) \`change\`, replay.replayid
			FROM elo.outcome
				INNER JOIN elo.replay ON outcome.replayid = replay.replayid
				INNER JOIN elo.round ON replay.replayid = round.replayid
					AND outcome.round = round.round
			WHERE MODE = ?
				AND player = ?
			GROUP BY replay.replayId
			ORDER BY playedon DESC
			LIMIT 10;`,
			[mode, name],
		),
	]);

	message.reply(
		`your rating in ${mode} in ${season} is ${rating.rating} with ${
			rating.rounds
		} rounds. Here are your last ten games:
\`\`\`
Date                          Change  Replay
${history
	.map(
		(r) =>
			`${r.playedon.toUTCString()} ${r.change
				.toFixed(1)
				.padStart(6, " ")}  https://wc3stats.com/games/${r.replayid}`,
	)
	.join("\n")}\`\`\``,
	);
};
