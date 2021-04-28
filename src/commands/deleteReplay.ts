import { Message } from "discord.js";

import { query } from "../shared/sql.js";
import { fetchData } from "../w3xio/replays/revo/processRound.js";

export const deleteReplay = async (
	message: Message,
	args: string[],
): Promise<void> => {
	const replay = parseInt(args[0]);

	const pageNumber = (
		await query<{ pagenumber: number }[]>(
			"SELECT pagenumber FROM elo.replay WHERE replayid = ?;",
			[replay],
		)
	)[0]?.pagenumber;

	if (!pageNumber) {
		message.reply(`replay ${replay} hasn't been processed`);
		return;
	}

	await query("DELETE FROM elo.replay WHERE replayid >= ?;", [replay]);
	await query("UPDATE elo.kv SET v = ? WHERE k = 'pageNumber';", [
		pageNumber,
	]);

	await fetchData();

	message.reply("done!");
};
