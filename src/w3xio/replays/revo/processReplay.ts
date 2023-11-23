import { wc3stats } from "../../../shared/fetch.js";
import type { ReplayGame, ReplaySummary } from "../../../shared/fetchTypes.js";
import { logLine } from "../../../shared/log.js";
import { deduceRounds } from "./deduceRounds.js";
import { fetchData, processRound } from "./processRound.js";
import {
	endReplay,
	endRound,
	skipReplay,
	startReplay,
	startRound,
} from "./sql.js";

export const LOG = false;

const getSkipListReplayReason = (replay: ReplaySummary) => {
	if (!replay.processed) return "not processed";
	if (replay.isVoid) return "voided";
	if (replay.players.length <= 1) return "not enough players";

	const map = (replay.map ?? "").replace(/ /g, "").toLowerCase();
	const variant = (replay.variant ?? "").replace(/ /g, "").toLowerCase();
	const isRevo = map.includes("revolution") || variant.includes("revolution");

	if (!isRevo) return "not revo";
};

const trackedMaps = [
	"Sheep Tag ReVoLuTiOn 8.",
	"Sheep Tag ReVoLuTiOn 9.",
	"Sheep Tag ReVoLuTiOn Cagematch 8.6.3.w3x",
	"Sheep Tag ReVoLuTiOn Xmas 9.",
];
const getSkipReplayReason = (game: ReplayGame) => {
	if (!trackedMaps.some((map) => game.map.startsWith(map)))
		return "not whitelisted: " + game.map;
};

export const processReplay = async (
	replaySummary: ReplaySummary,
	save = true,
): Promise<void> => {
	logLine("revo", "processing replay", replaySummary.id);

	const skipListReplayReason = getSkipListReplayReason(replaySummary);
	if (skipListReplayReason) {
		if (LOG)
			logLine(
				"revo",
				"Skipping",
				replaySummary.id,
				"from",
				new Date(replaySummary.playedOn * 1000),
				skipListReplayReason,
			);
		await skipReplay({
			replayId: replaySummary.id,
			gameName: replaySummary.name,
			playedOn: new Date(replaySummary.playedOn * 1000),
		});
		return;
	}

	const replay = await wc3stats.replays.get(replaySummary.id);
	const skipReplayReason = getSkipReplayReason(replay.data.game);
	if (skipReplayReason) {
		logLine(
			"revo",
			"Skipping",
			replaySummary.id,
			"from",
			new Date(replaySummary.playedOn * 1000),
			skipReplayReason,
		);
		await skipReplay({
			replayId: replay.id,
			gameName: replay.name,
			playedOn: new Date(replay.playedOn * 1000),
		});
		return;
	}

	await fetchData();
	const rounds = deduceRounds(replay);

	startReplay(replay);

	let roundId = 0;
	for (const round of rounds) {
		startRound(round, roundId);
		if (await processRound(round, replay.playedOn)) roundId++;
		endRound();
	}

	await endReplay(save);

	logLine("revo", "done processing");
};
