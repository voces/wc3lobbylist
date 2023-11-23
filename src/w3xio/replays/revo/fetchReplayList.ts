import { wc3stats } from "../../../shared/fetch.js";
import { logLine } from "../../../shared/log.js";
import { query } from "../../../shared/sql.js";
import { processReplay } from "./processReplay.js";

export const fetchReplayList = async (lastReplayId: number): Promise<void> => {
	logLine("revo", "Fetching since", lastReplayId);

	const page = await wc3stats.replays
		.list({
			search: "Sheep Tag",
			since: lastReplayId,
		})
		.catch((err: Error) => err);

	if (page instanceof Error) {
		console.error(page);
		return;
	}

	// Wait until the replay is processed
	if (page.body.length === 0 || !page.body[0].processed) {
		logLine("revo", "nothing to process");
		return;
	}

	for (const replay of page.body) {
		const map = (replay.map ?? "").replace(/ /g, "").toLowerCase();
		const variant = (replay.variant ?? "").replace(/ /g, "").toLowerCase();
		const isRevo =
			map.includes("revolution") || variant.includes("revolution");

		if (!replay.processed) {
			logLine("revo", "still processing");
			break;
		}

		if (isRevo && !replay.isVoid)
			try {
				await processReplay(replay);
			} catch (err) {
				console.error(err);
				return;
			}
		else {
			logLine("revo", "not revo, inserting...");
			await query("INSERT elo.replay SET ?;", [
				{
					replayId: replay.id,
					playedOn: new Date(replay.playedOn * 1000),
					gamename: replay.name,
					pagenumber: 0,
					voided: "Y",
				},
			]);
		}
	}
};
