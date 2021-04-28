import discord from "../../../discord.js";
import { Replay } from "../../../shared/fetchTypes.js";
import { query } from "../../../shared/sql.js";
import { formatList } from "../../../shared/util.js";
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

const summarize = async (replay: ReplayData) => {
	const players = Array.from(
		new Set(
			replay.rounds
				.flatMap((r) => r.outcomes)
				.sort((a, b) => b.rating - a.rating)
				.map((p) => p.player),
		),
	);

	const grouped = Object.values(
		replay.rounds.reduce((data, round) => {
			round.outcomes.forEach((o) => {
				const setup = o.mode;
				const setupData =
					data[setup] ?? (data[setup] = { setup, players: {} });
				setupData.players[o.player] = {
					change:
						(setupData.players[o.player]?.change ?? 0) + o.change,
					rating: o.rating,
				};
			});
			return data;
		}, {} as Record<string, { setup: string; players: Record<string, { rating: number; change: number }> }>),
	);

	const r = await query<{ discordid: string; battlenettag: string }[]>(
		`
		SELECT discordid, battlenettag
		FROM elo.discordBattleNetMap
		WHERE battlenettag IN (?) AND alert = 1;
		`,
		[players],
	);

	for (const { discordid, battlenettag } of r) {
		const modeData = grouped
			.map(({ setup, players }) => ({
				setup,
				score: players[battlenettag],
			}))
			.filter((m) => m.score !== undefined);

		if (modeData.length === 0) continue;

		const user = await discord.users.fetch(discordid);
		user.send(
			`Replay processed! You went ${formatList(
				modeData
					.sort((a, b) => a.setup.localeCompare(b.setup))
					.map(
						({ score, setup }) =>
							`${score.change > 0 ? "up" : "down"} ${Math.abs(
								score.change,
							).toPrecision(2)} to ${Math.round(
								score.rating,
							)} in ${setup} ${
								score.change > 0
									? ":chart_with_upwards_trend:"
									: ":chart_with_downwards_trend:"
							}`,
					),
			)}.\nhttps://wc3stats.com/games/${replay.replayId}`,
		);
	}
};

export const endReplay = async (pageNumber: number): Promise<void> => {
	if (!currentReplay) throw new Error("Expected a current replay");

	if (currentReplay.rounds.length === 0) {
		currentReplay = undefined;
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { rounds, maxRankedRounds: _, ...replay } = currentReplay;

	await query(
		`
		INSERT elo.replay SET ?;
		INSERT elo.round VALUES ?;
		INSERT elo.outcome VALUES ?;
		`,
		[
			{ ...replay, pageNumber },
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

	try {
		await summarize(currentReplay);
	} catch (err) {
		console.error(err);
	}

	currentReplay = undefined;
};
