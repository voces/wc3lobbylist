import { logLine } from "../../../shared/log.js";

const ROUND_DEBUGGING = false;

const canBeOneChar = (
	oneCharSlot: number,
	playerIds: number[],
	usedSlots: number[],
	prev: number,
) =>
	oneCharSlot > prev &&
	!usedSlots.includes(oneCharSlot) &&
	playerIds.includes(oneCharSlot);

const canBeTwoChar = (
	twoCharSlot: number,
	playerIds: number[],
	usedSlots: number[],
	prev: number,
) =>
	twoCharSlot > prev &&
	!usedSlots.includes(twoCharSlot) &&
	playerIds.includes(twoCharSlot) &&
	twoCharSlot >= 10 &&
	twoCharSlot <= 23;

export const deduceTeams = (
	playerIds: number[],
	round: string,
): [number[], number[]] | undefined => {
	const possibilities: {
		team: "sheep" | "wolf";
		cursor: number;
		sheep: number[];
		wolves: number[];
		usedSlots: number[];
	}[] = [{ team: "sheep", cursor: 0, sheep: [], wolves: [], usedSlots: [] }];
	let possibilityIndex = possibilities.findIndex(
		(p) => p.cursor < round.length,
	);
	while (possibilityIndex >= 0) {
		const possibility = possibilities[possibilityIndex];
		possibilities.splice(possibilityIndex, 1);
		const oneCharSlot = parseInt(round[possibility.cursor]);
		const twoCharSlice = round.slice(
			possibility.cursor,
			possibility.cursor + 2,
		);
		const twoCharSlot = twoCharSlice.includes("v")
			? -1
			: parseInt(round.slice(possibility.cursor, possibility.cursor + 2));
		const nextCharIfTwoSlot = round[possibility.cursor + 2];

		if (
			canBeOneChar(
				oneCharSlot,
				playerIds,
				possibility.usedSlots,
				(possibility.team === "sheep"
					? possibility.sheep[possibility.sheep.length - 1]
					: possibility.wolves[possibility.wolves.length - 1]) ?? -1,
			)
		) {
			if (ROUND_DEBUGGING) logLine("revo", "one char", oneCharSlot);
			possibilities.push({
				team: twoCharSlice.includes("v") ? "wolf" : possibility.team,
				cursor: twoCharSlice.includes("v")
					? possibility.cursor + 2
					: possibility.cursor + 1,
				sheep:
					possibility.team === "sheep"
						? [...possibility.sheep, oneCharSlot]
						: possibility.sheep,
				wolves:
					possibility.team === "wolf"
						? [...possibility.wolves, oneCharSlot]
						: possibility.wolves,
				usedSlots: [...possibility.usedSlots, oneCharSlot],
			});
		}

		if (
			canBeTwoChar(
				twoCharSlot,
				playerIds,
				possibility.usedSlots,
				(possibility.team === "sheep"
					? possibility.sheep[possibility.sheep.length - 1]
					: possibility.wolves[possibility.wolves.length - 1]) ?? -1,
			)
		) {
			if (ROUND_DEBUGGING) logLine("revo", "two char", twoCharSlot);
			possibilities.push({
				team: nextCharIfTwoSlot === "v" ? "wolf" : possibility.team,
				cursor:
					nextCharIfTwoSlot === "v"
						? possibility.cursor + 3
						: possibility.cursor + 2,
				sheep:
					possibility.team === "sheep"
						? [...possibility.sheep, twoCharSlot]
						: possibility.sheep,
				wolves:
					possibility.team === "wolf"
						? [...possibility.wolves, twoCharSlot]
						: possibility.wolves,
				usedSlots: [...possibility.usedSlots, twoCharSlot],
			});
		}

		possibilityIndex = possibilities.findIndex(
			(p) => p.cursor < round.length,
		);
	}

	if (possibilities.length === 1)
		return [possibilities[0].sheep, possibilities[0].wolves];
};
