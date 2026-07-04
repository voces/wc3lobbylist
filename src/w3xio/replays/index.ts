import "./exceptions.js";
import "./todo.js";

import { periodic } from "../../shared/periodic.js";
import { query } from "../../shared/sql.js";
import { fetchReplayList } from "./revo/fetchReplayList.js";

const ONE_MINUTE = 60 * 1000;

periodic("wc3stats replays", ONE_MINUTE, async () => {
	const lastReplayId =
		(
			await query<{ replayId: number }[]>(
				"SELECT replayId FROM elo.replay ORDER BY replayId DESC LIMIT 1;",
			)
		)[0]?.replayId ?? 1;

	fetchReplayList(lastReplayId);
});
