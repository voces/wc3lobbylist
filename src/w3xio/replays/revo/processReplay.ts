import { wc3stats } from "../../../shared/fetch.js";
import { ReplayGame, ReplaySummary } from "../../../shared/fetchTypes.js";
import { logLine } from "../../../shared/log.js";
import { deduceTeams } from "./deduceTeams.js";
import { processRound } from "./processRound.js";
import { endReplay, endRound, startReplay, startRound } from "./sql.js";
import { Round } from "./types.js";

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

	const players = replay.data.game.players;
	const recordKeeper = players.find((p) => p.variables?.setup);
	if (!recordKeeper) {
		if (LOG)
			logLine(
				"revo",
				"Skipping replay with no data",
				replay.id,
				"from",
				new Date(replaySummary.playedOn * 1000),
			);
		return;
	}

	const playerTimes: {
		times: number[];
		cursor: number;
		slot: number;
		name: string;
	}[] = [];
	players.forEach((p) => {
		playerTimes[p.slot] = {
			times: (p.variables?.roundTimes?.toString() ?? "")
				.split("|")
				.map((round: string) => round.trim())
				.filter(Boolean)
				.map((round: string) => parseFloat(round)),
			slot: p.slot,
			cursor: 0,
			name: p.name,
		};
	});

	const rawSetup = recordKeeper.variables!.setup!.toString();
	let max = false;
	if (rawSetup.length === 218 && LOG) {
		max = true;
		logLine(
			"revo",
			"Max w3mmd value setup encountered; skipping last rounds",
		);
	}
	const setup =
		rawSetup.length === 218
			? rawSetup.slice(0, rawSetup.lastIndexOf(" "))
			: rawSetup;

	const playerIds = players.map((p) => p.slot);

	const teams = setup
		.split(" ")
		.map((round: string) => deduceTeams(playerIds, round.toLowerCase()))
		.filter((v): v is [number[], number[]] => !!v);

	const rounds = teams
		.map(([sheep, wolves], matchId) => {
			let time: number | undefined;
			let inconsistentTime = false;
			sheep.forEach((s: number, index: number) => {
				const playerTime =
					playerTimes[s].times[playerTimes[s].cursor++];
				if (index === 0) time = playerTime;
				else if (playerTime !== time) {
					inconsistentTime = true;
					if (LOG)
						logLine("revo", "inconsistent time found", {
							time,
							playerTime,
							index,
							sheep,
							wolves,
							matchId,
						});
				}
			});

			if (inconsistentTime) {
				if (LOG)
					console.warn("Skipping match with multiple times", matchId);
				return;
			}

			if (time === undefined) {
				if (LOG)
					console.warn(
						"Skipping match that is missing a time",
						matchId,
					);
				return;
			}

			return {
				sheep: sheep.map((slot) => playerTimes[slot].name),
				wolves: wolves.map((slot) => playerTimes[slot].name),
				time,
			};
		})
		.filter((v): v is Round => !!v);

	startReplay(replay, max);

	let roundId = 0;
	for (const round of rounds) {
		startRound(round, roundId);
		if (await processRound(round, replay.playedOn)) roundId++;
		endRound();
	}

	await endReplay(pageNumber);
};
