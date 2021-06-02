import { Replay } from "../../../shared/fetchTypes.js";
import { logLine } from "../../../shared/log.js";
import { deduceTeams } from "./deduceTeams.js";
import { Round } from "./types.js";

const LOG = false;

const oldDeduceRounds = (replay: Replay): Round[] => {
	const players = replay.data.game.players;

	const recordKeeper = players.find((p) => p.variables?.setup);
	if (!recordKeeper) {
		if (LOG)
			logLine(
				"revo",
				"Skipping replay with no data",
				replay.id,
				"from",
				new Date(replay.playedOn * 1000),
			);

		return [];
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

	if (rawSetup.length === 218 && LOG)
		logLine(
			"revo",
			"Max w3mmd value setup encountered; skipping last rounds",
		);

	const setup =
		rawSetup.length === 218
			? rawSetup.slice(0, rawSetup.lastIndexOf(" "))
			: rawSetup;

	const playerIds = players.map((p) => p.slot);

	const teams = setup
		.split(" ")
		.map((round: string) => deduceTeams(playerIds, round.toLowerCase()))
		.filter((v): v is [number[], number[]] => !!v);

	return teams
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
};

const someFromEnd = <T>(arr: Array<T>, fn: (value: T) => boolean) => {
	for (let i = arr.length - 1; i >= 0; i--) if (fn(arr[i])) return true;
	return false;
};

export const deduceRounds = (replay: Replay): Round[] => {
	if (!someFromEnd(replay.data.game.events, (e) => e.eventName === "end"))
		return oldDeduceRounds(replay);

	const players = replay.data.game.players;
	const playerMap = Object.fromEntries(players.map((p) => [p.slot, p.name]));

	return replay.data.game.events
		.filter((e) => e.eventName === "round")
		.map((r) => ({
			sheep: r.args[0].split(" ").map((slot) => playerMap[slot]),
			wolves: r.args[1].split(" ").map((slot) => playerMap[slot]),
			time: parseFloat(r.args[2]),
		}));
};
