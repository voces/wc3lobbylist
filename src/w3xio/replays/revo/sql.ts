// import { config } from "../../../../config.js";
// import discord from "../../../discord.js";
import { Replay } from "../../../shared/fetchTypes.js";
import { logLine } from "../../../shared/log.js";
import { query } from "../../../shared/sql.js";
import { cleanUsername, formatList } from "../../../shared/util.js";
import { Round } from "./types.js";

interface RoundData {
	round: number;
	setup: string;
	duration: number;
	outcomes: {
		mode: string;
		player: string;
		change: number;
		rating: number;
	}[];
}

let currentRound: RoundData | undefined;

interface ReplayData {
	replayId: number;
	playedOn: Date;
	gameName: string;
	rounds: RoundData[];
	maxRankedRounds: boolean;
}

let currentReplay: ReplayData | undefined;

export const startReplay = (replay: Replay, maxRankedRounds: boolean): void => {
	currentReplay = {
		replayId: replay.id,
		playedOn: new Date(replay.playedOn * 1000),
		gameName: replay.name,
		maxRankedRounds,
		rounds: [],
	};
};

export const startRound = (round: Round, index: number): void => {
	if (!currentReplay) throw new Error("Expected a current replay");

	const setup = `${round.sheep.length}v${round.wolves.length}`;
	currentRound = { round: index, duration: round.time, setup, outcomes: [] };
	currentReplay.rounds.push(currentRound);
};

export const addOutcome = (
	mode: string,
	player: string,
	change: number,
	rating: number,
): void => {
	if (!currentRound) throw new Error("Expected a current round");

	currentRound.outcomes.push({ mode, player, change, rating });
};

export const endRound = (): void => {
	if (!currentRound) throw new Error("Expected a current round");

	if (currentRound.outcomes.length === 0) currentReplay!.rounds.pop();

	currentRound = undefined;
};

const summarize = (replay: ReplayData) => {
	const players = Array.from(
		new Set(
			replay.rounds
				.flatMap((r) => r.outcomes)
				.sort((a, b) => b.rating - a.rating)
				.map((p) => p.player),
		),
	).map(cleanUsername);

	const modes =
		formatList(
			Object.values(
				replay.rounds.reduce((data, round) => {
					const setupData =
						data[round.setup] ??
						(data[round.setup] = {
							setup: round.setup,
							rounds: 0,
							players: {},
						});
					setupData.rounds++;
					round.outcomes.forEach(
						(o) =>
							(setupData.players[o.player] =
								(setupData.players[o.player] ?? 0) + o.change),
					);
					return data;
				}, {} as Record<string, { setup: string; rounds: number; players: Record<string, number> }>),
			).map((mode) => {
				const trendingUpPlayers = Object.entries(mode.players)
					.filter(([, c]) => c > 0)
					.sort((a, b) => b[1] - a[1])
					.map((o) => cleanUsername(o[0]));

				return `${mode.rounds}${
					replay.maxRankedRounds ? "+" : ""
				} rounds of ${mode.setup}${
					trendingUpPlayers.length
						? ` (${formatList(
								trendingUpPlayers,
						  )} :chart_with_upwards_trend:)`
						: ""
				}`;
			}),
		) + `\nhttps://wc3stats.com/games/${replay.replayId}`;

	logLine("revo", `${formatList(players)} just finished ${modes}`);
	// discord.send(
	// 	config.revo.channel,
	// 	`${formatList(players)} just finished ${modes}`,
	// );
};

export const endReplay = async (): Promise<void> => {
	if (!currentReplay) throw new Error("Expected a current replay");

	if (currentReplay.rounds.length === 0) {
		currentReplay = undefined;
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { rounds, maxRankedRounds: _, ...replay } = currentReplay;

	summarize(currentReplay);

	await query(
		`
		INSERT elo.replay SET ?;
		INSERT elo.round VALUES ?;
		INSERT elo.outcome VALUES ?;
		`,
		[
			replay,
			rounds.map((r) => [replay.replayId, r.round, r.setup, r.duration]),
			rounds.flatMap((r) =>
				r.outcomes.map((o) => [
					replay.replayId,
					r.round,
					o.mode,
					o.player,
					o.change,
					o.rating,
				]),
			),
		],
	);

	currentReplay = undefined;
};
