import { deduceTeams } from "./deduceTeams";

const test = (
	teams: string,
	playerIds: number[],
	expected: ReturnType<typeof deduceTeams>,
) => {
	it(teams, () => {
		expect(deduceTeams(playerIds, teams)).toEqual(expected);
	});
};

test("0v1", [0, 1], [[0], [1]]);

test(
	"012345v67891011",
	[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
	[
		[0, 1, 2, 3, 4, 5],
		[6, 7, 8, 9, 10, 11],
	],
);

test("12v12", [1, 2, 12], undefined);

test(
	"1213v512",
	[1, 2, 5, 12, 13],
	[
		[1, 2, 13],
		[5, 12],
	],
);

// it.only("many random tests", () => {
// 	const start = Date.now();
// 	let asserts = 1;
// 	while (Date.now() - 100000 < start) {
// 		let players = Math.floor(Math.random() * 23) + 2;
// 		// console.log({ players });
// 		const playerIds: number[] = [];
// 		players -=
// 			players > 2
// 				? Math.floor(Math.random() * Math.random() * Math.random() * 3)
// 				: 0;
// 		// console.log({ players });
// 		while (players--) {
// 			let playerId = Math.floor(Math.random() * 24);
// 			while (playerIds.includes(playerId))
// 				playerId = Math.floor(Math.random() * 24);
// 			playerIds.push(playerId);
// 		}
// 		// console.log({ playerIds });
// 		const pool = [...playerIds];
// 		const sheep = [];
// 		const wolves = [];

// 		while (pool.length) {
// 			const playerIdIndex = Math.floor(Math.random() * pool.length);
// 			const playerId = pool[playerIdIndex];
// 			pool.splice(playerIdIndex, 1);

// 			if (!pool.length) {
// 				if (!sheep.length) {
// 					sheep.push(playerId);
// 					continue;
// 				}
// 				if (!wolves.length) {
// 					wolves.push(playerId);
// 					continue;
// 				}
// 			}

// 			if (Math.random() < 0.5) sheep.push(playerId);
// 			else wolves.push(playerId);
// 		}

// 		playerIds.sort((a, b) => a - b);
// 		sheep.sort((a, b) => a - b);
// 		wolves.sort((a, b) => a - b);

// 		const round = sheep.join("") + "v" + wolves.join("");
// 		console.log(asserts++, round);
// 		// console.log({ round, playerIds });
// 		const deducedTeams = deduceTeams(playerIds, round);
// 		// console.log({ deducedTeams });
// 		expect(deducedTeams).toEqual([sheep, wolves]);
// 	}
// 	console.log("exiting");
// });
