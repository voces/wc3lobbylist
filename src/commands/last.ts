import { Message } from "discord.js";

import { query } from "../shared/sql.js";
import { cleanUsername, formatList } from "../shared/util.js";

export const last = async (message: Message): Promise<void> => {
	const res: {
		playedon: Date;
		replayid: number;
		mode: string;
		players: string;
		gamename: string;
	}[] = await query(
		`WITH q1 AS (
			SELECT distinct replayid, \`mode\`, player
			FROM elo.outcome
			WHERE NOT(\`mode\` LIKE '%-%') AND \`mode\` != 'overall'
			ORDER BY replayId DESC
		),
		q2 AS (
			SELECT replayid, \`mode\`, GROUP_CONCAT(player) players
			FROM q1
			GROUP BY replayid, \`mode\`
		)
		SELECT playedon, replay.replayid, \`mode\`, players, gamename
		FROM q2
		INNER JOIN elo.replay ON q2.replayid = replay.replayid
		ORDER BY playedon DESC
		LIMIT 10;`,
	);

	message.reply(
		`\n\`\`\`${res
			.map(
				(r) =>
					`${r.playedon.toUTCString()} [${r.mode}] ${r.gamename} (${
						r.replayid
					})\n${formatList(
						r.players
							.split(",")
							.sort((a, b) =>
								a
									.toLocaleLowerCase()
									.localeCompare(b.toLocaleLowerCase()),
							)
							.map(cleanUsername),
					)}`,
			)
			.join("\n\n")}\`\`\``,
	);
};
