import { wc3stats } from "../../../shared/fetch.js";
import { logLine } from "../../../shared/log.js";
import { kvSet } from "../../../shared/sql.js";
import { processReplay } from "./processReplay.js";

export const fetchReplayList = async (pageNumber: number): Promise<void> => {
	logLine("revo", "Fetching", pageNumber);

	const page = await wc3stats.replays.list({
		search: "sheep tag",
		page: pageNumber,
	});

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
			await processReplay(replay);
	}

	await kvSet("pageNumber", pageNumber + 1);

	if (page.pagination.next > page.pagination.current)
		await fetchReplayList(pageNumber + 1);
};
