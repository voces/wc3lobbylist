import { Message } from "discord.js";

import { wc3stats } from "../shared/fetch.js";
import { processReplay } from "../w3xio/replays/revo/processReplay.js";

export const runReplay = async (
	message: Message,
	args: string[],
): Promise<void> => {
	const replayId = parseInt(args[0]);
	const replay = await wc3stats.replays.get(replayId);

	const result = await processReplay(
		{
			...replay,
			players: replay.data.game.players.map((p) => ({
				colour: p.colour,
				name: p.name,
			})),
		},
		0,
		false,
	);

	if (!result) message.reply("no result");
	else
		for (let i = 0; i < result.length; i += 1990)
			message.reply(result.slice(i, i + 1990));
};
