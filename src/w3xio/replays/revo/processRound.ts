import { logLine } from "../../../shared/log.js";
import { query } from "../../../shared/sql.js";
import { LOG } from "./processReplay.js";
import { addOutcome } from "./sql.js";
import { Round } from "./types.js";

export interface PlayerData {
	rating: number;
	rounds: number;
}

interface MutablePlayerData {
	readonly rating: number;
	readonly rounds: number;
	newRating: number;
}
type Season = Record<string, PlayerData | undefined>;

type Mode = Record<string, Season | undefined>;

type Data = {
	modes: Record<string, Mode | undefined>;
	setups: Record<string, number[] | undefined>;
};

export const getSeason = (unix: number): string => {
	const d = new Date(unix * 1000);
	const q = Math.floor(d.getUTCMonth() / 3) + 1;
	const y = d.getUTCFullYear();
	return `${y}Q${q}`;
};

export const data: Data = { modes: {}, setups: {} };
export const fetchData = async (): Promise<void> => {
	// Reset it
	data.modes = {};
	data.setups = {};

	const setups = await query<
		{
			setup: string;
		}[]
	>("SELECT DISTINCT setup FROM elo.round;");

	await Promise.all(
		setups.map(async ({ setup }) => {
			data.setups[setup] = (
				await query<{ duration: number }[]>(
					`SELECT duration
				FROM elo.round
				LEFT JOIN elo.replay ON round.replayId = replay.replayId
				WHERE setup = ?
				ORDER BY playedon DESC
				LIMIT 100;`,
					[setup],
				)
			).map((r) => r.duration);
		}),
	);

	const rawElos = await query<
		{
			player: string;
			season: string;
			mode: string;
			rating: number;
			rounds: number;
		}[]
	>("SELECT * FROM elo.elos;");

	for (const { mode, season, rating, rounds, player } of rawElos) {
		const modeData = data.modes[mode] ?? (data.modes[mode] = {});
		const seasonData = modeData[season] ?? (modeData[season] = {});
		seasonData[player] = { rating, rounds };
	}
};
fetchData();

const queryData = async (
	setup: string,
	mode: string,
	sheep: string[],
	wolves: string[],
	playedOn: number,
): Promise<{
	players: Record<string, MutablePlayerData>;
	readonly trailingMatchTimes: number[];
}> => {
	if (mode === "team") {
		const sheepModeData = await queryData(
			setup,
			`${setup}-sheep`,
			sheep,
			[],
			playedOn,
		);
		const wolfModeData = await queryData(
			setup,
			`${setup}-wolf`,
			[],
			wolves,
			playedOn,
		);
		const modeData = await queryData(setup, setup, [], [], playedOn);

		return {
			players: { ...sheepModeData.players, ...wolfModeData.players },
			trailingMatchTimes: [...modeData.trailingMatchTimes],
		};
	}

	const modeData = data.modes[mode] ?? (data.modes[mode] = {});
	const season = getSeason(playedOn);
	const seasonData = modeData[season] ?? (modeData[season] = {});
	return {
		players: Object.fromEntries(
			[...sheep, ...wolves].map((p) => [
				p,
				{
					rating: seasonData[p]?.rating ?? 1000,
					newRating: seasonData[p]?.rating ?? 1000,
					rounds: seasonData[p]?.rounds ?? 0,
				},
			]),
		),
		trailingMatchTimes: data.setups[setup] ?? [],
	};
};

const updateSeasonalModeData = async (
	mode: string,
	season: string,
	input: Record<
		string,
		{ readonly rating: number; readonly rounds: number; newRating: number }
	>,
	players: string[],
) => {
	const modeData = data.modes[mode] ?? (data.modes[mode] = {});
	const seasonData = modeData[season] ?? (modeData[season] = {});
	players.forEach((p) => {
		seasonData[p] = {
			rating: input[p].newRating,
			rounds: (seasonData[p]?.rounds ?? 0) + 1,
		};

		addOutcome(
			mode,
			p,
			input[p].newRating - input[p].rating,
			input[p].newRating,
		);
	});
};

const updateData = async (
	mode: string,
	sheep: string[],
	wolves: string[],
	players: Record<
		string,
		{ readonly rating: number; readonly rounds: number; newRating: number }
	>,
	matchTime: number,
	playedOn: number,
) => {
	const setup = `${sheep.length}v${wolves.length}`;
	const season = getSeason(playedOn);

	if (mode === "team") {
		await updateSeasonalModeData(`${setup}-sheep`, season, players, sheep);

		await updateSeasonalModeData(`${setup}-wolf`, season, players, wolves);

		// We don't care about matchTime since that should be handled by other runs

		return;
	}

	await updateSeasonalModeData(mode, season, players, [...sheep, ...wolves]);

	// Don't do for overall
	if (mode === setup) {
		const times = data.setups[setup] ?? (data.setups[setup] = []);
		times.push(matchTime);
		if (times.length === 101) times.shift();
	}
};
const K = 16;

export const avg = (a: number, b: number, _: number, arr: number[]): number =>
	a + b / arr.length;
const getMaxTime = (mode: string) => {
	if (mode === "2v4") return 360;
	if (mode === "3v5") return 600;
	if (mode === "5v5") return 1200;
	throw new Error(`Unknown max time for ${mode}`);
};

const reverseInterpolate = (left: number, right: number, value: number) =>
	(value - left) / (right - left);

const tween = (data: number[], percentile: number) => {
	percentile = percentile < 0 ? 0 : percentile > 1 ? 1 : percentile;
	const length = data.length - 1;
	const prevIndex = Math.floor(length * percentile);
	const prevPercentile = prevIndex / length;
	const nextPercentile = (prevIndex + 1) / length;
	const relativePercent =
		(percentile - prevPercentile) / (nextPercentile - prevPercentile);
	return (
		data[prevIndex] * (1 - relativePercent) +
		(data[prevIndex + 1] ?? data[prevIndex]) * relativePercent
	);
};

export const reverseTween = (data: number[], value: number): number => {
	if (value < data[0]) return 0;
	const length = data.length - 1;
	if (value > data[length]) return 1;

	let left = 0;
	let right = length;
	let middle = Math.floor((left + right) / 2);
	while (left <= right) {
		if (data[middle] < value) left = middle + 1;
		else if (data[middle] > value) right = middle - 1;
		else break;

		middle = Math.floor((left + right) / 2);
	}

	// Exact match, find center for duplicates
	if (value === data[middle]) {
		left = middle;
		while (data[left - 1] === value) left--;
		right = middle;
		while (data[right + 1] === value) right++;
		return (left + right) / 2 / length;
	}

	const leftvalue = data[middle];
	const rightValue = data[middle + 1];
	const relativePercent = reverseInterpolate(leftvalue, rightValue, value);

	return (
		(middle * (1 - relativePercent) + (middle + 1) * relativePercent) /
		length
	);
};

export const expectedScore = async (
	mode: string,
	setup: string,
	sheep: string[],
	wolves: string[],
	playedOn: number,
): Promise<
	| false
	| {
			expectedSheepScore: number;
			expectedWolfScore: number;
			factor: number;
			sortedMatches: number[];
			maxTime: number;
			players: Record<string, MutablePlayerData>;
			expectedTime: number;
	  }
> => {
	let maxTime: number;
	try {
		maxTime = getMaxTime(`${sheep.length}v${wolves.length}`);
	} catch (err) {
		return false;
	}

	const { players, trailingMatchTimes } = await queryData(
		setup,
		mode,
		sheep,
		wolves,
		playedOn,
	);
	const sheepElo = sheep.map((p) => players[p].rating).reduce(avg, 0);
	const wolfElo = wolves.map((p) => players[p].rating).reduce(avg, 0);
	const avgRounds = Object.values(players)
		.map((d) => d.rounds)
		.reduce(avg, 0);
	const factor = 2 / ((avgRounds + 1) / 8) ** (1 / 4);

	const sheepRating = Math.pow(10, sheepElo / 400);
	const wolfRating = Math.pow(10, wolfElo / 400);

	const expectedSheepScore = sheepRating / (sheepRating + wolfRating);
	const expectedWolfScore = 1 - expectedSheepScore;

	const sortedMatches = trailingMatchTimes
		.map((v) => Math.min(maxTime, v))
		.sort((a, b) => a - b);

	return {
		expectedSheepScore,
		expectedWolfScore,
		factor,
		sortedMatches,
		maxTime,
		players,
		expectedTime: tween(
			[0, ...sortedMatches.map((v) => Math.min(v, maxTime)), maxTime],
			expectedSheepScore,
		),
	};
};

const processRoundForMode = async (
	{
		mode,
		sheep,
		wolves,
		time,
		setup,
	}: Round & { mode: string; setup: string },
	playedOn: number,
): Promise<boolean> => {
	const ret = await expectedScore(mode, setup, sheep, wolves, playedOn);
	if (!ret) return false;
	const {
		expectedSheepScore,
		expectedWolfScore,
		factor,
		sortedMatches,
		maxTime,
		players,
	} = ret;

	const sheepScore = reverseTween(
		[0, ...sortedMatches.map((v) => Math.min(v, maxTime)), maxTime],
		time,
	);
	const wolfScore = 1 - sheepScore;

	const sheepChange = K * factor * (sheepScore - expectedSheepScore);
	sheep.forEach((p) => (players[p].newRating += sheepChange));
	const wolfChange =
		K *
		factor *
		(sheep.length / wolves.length) *
		(wolfScore - expectedWolfScore);
	wolves.forEach((p) => (players[p].newRating += wolfChange));

	if (LOG)
		logLine("revo", "round", {
			mode,
			sheep,
			wolves,
			expectedTime: tween(
				[0, ...sortedMatches.map((v) => Math.min(v, maxTime)), maxTime],
				expectedSheepScore,
			),
			sheepScore,
			expectedSheepScore,
			time,
			sheepChange,
			wolfChange,
		});

	await updateData(mode, sheep, wolves, players, time, playedOn);

	return true;
};

export const processRound = async (
	{ sheep, wolves, time }: Round,
	playedOn: number,
): Promise<boolean> => {
	const setup = `${sheep.length}v${wolves.length}`;
	const rets = [
		await processRoundForMode(
			{ mode: "team", setup, sheep, wolves, time },
			playedOn,
		),
		await processRoundForMode(
			{ mode: "overall", setup, sheep, wolves, time },
			playedOn,
		),
		await processRoundForMode(
			{ mode: setup, setup, sheep, wolves, time },
			playedOn,
		),
	];
	return rets.some(Boolean);
};
