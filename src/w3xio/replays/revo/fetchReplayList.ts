import { wc3stats } from "../../../shared/fetch.js";
import { logLine } from "../../../shared/log.js";
import { query } from "../../../shared/sql.js";
import { executeCallbacks } from "../common.js";
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
		logLine("revo", page);
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
		const isFixus = map.includes("fixus") || variant.includes("fixus");

		if (!replay.processed) {
			logLine("revo", "still processing");
			break;
		}

		if (isRevo && !replay.isVoid)
			try {
				await processReplay(replay);
			} catch (err) {
				logLine("revo", err);
				return;
			}
		else {
			// Fixus replays don't feed the ELO pipeline, but they carry the
			// chatlog/events that the exceptions & todo hooks parse into GitHub
			// issues. Run those hooks off the full replay before recording it as
			// void so the shared elo.replay cursor still advances past it.
			if (isFixus && !replay.isVoid)
				try {
					logLine("fixus", "new fixus replay", replay.id);
					executeCallbacks(await wc3stats.replays.get(replay.id));
				} catch (err) {
					logLine("fixus", err);
				}
			else logLine("revo", "not revo or void, inserting...");

			await query("INSERT elo.replay SET ?;", [
				{
					replayId: replay.id,
					playedOn: new Date(replay.playedOn * 1000),
					gamename: replay.name,
					voided: "Y",
				},
			]);
		}
	}
};
