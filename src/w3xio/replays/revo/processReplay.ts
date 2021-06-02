import { wc3stats } from "../../../shared/fetch.js";
import { ReplayGame, ReplaySummary } from "../../../shared/fetchTypes.js";
import { logLine } from "../../../shared/log.js";
import { deduceRounds } from "./deduceRounds.js";
import { processRound } from "./processRound.js";
import { endReplay, endRound, startReplay, startRound } from "./sql.js";

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
	"Sheep Tag ReVoLuTiOn 8.6.0.w3x",
	"Sheep Tag ReVoLuTiOn 8.6.1.w3x",
	"Sheep Tag ReVoLuTiOn 8.6.2.w3x",
	"Sheep Tag ReVoLuTiOn 8.6.3.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.0.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.1.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.2.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.2~1.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.3.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.4.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.5.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.6.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.7.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.8.w3x",
	"Sheep Tag ReVoLuTiOn 9.0.9.w3x",
	"Sheep Tag ReVoLuTiOn Cagematch 8.6.3.w3x",
	"Sheep Tag ReVoLuTiOn Xmas 9.0.5.w3x",
	"Sheep Tag ReVoLuTiOn Xmas 9.0.6.w3x",
];
const getSkipReplayReason = (game: ReplayGame) => {
	if (!trackedMaps.includes(game.map)) return "not whitelisted: " + game.map;
};

export const processReplay = async (
	replaySummary: ReplaySummary,
	pageNumber: number,
	save = true,
): Promise<string | undefined> => {
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
		return;
	}

	const replay = await wc3stats.replays.get(replaySummary.id);
	const skipReplayReason = getSkipReplayReason(replay.data.game);
	if (skipReplayReason) {
		if (LOG)
			logLine(
				"revo",
				"Skipping",
				replaySummary.id,
				"from",
				new Date(replaySummary.playedOn * 1000),
				skipReplayReason,
			);
		return;
	}

	const rounds = deduceRounds(replay);

	startReplay(replay);

	let roundId = 0;
	for (const round of rounds) {
		startRound(round, roundId);
		if (await processRound(round, replay.playedOn)) roundId++;
		endRound();
	}

	return await endReplay(pageNumber, save);
};
