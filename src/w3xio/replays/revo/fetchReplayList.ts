import { wc3stats } from "../../../shared/fetch.js";
import { logLine } from "../../../shared/log.js";
import { processReplay } from "./processReplay.js";

export const fetchReplayList = async (lastReplayId: number): Promise<void> => {
	logLine("revo", "Fetching since", lastReplayId);

	const page = await wc3stats.replays
		.list({
			search: "sheep tag",
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

		if (isRevo && replay.processed && !replay.isVoid)
			try {
				await processReplay(replay);
			} catch (err) {
				console.error(err);
				return;
			}
	}
};
