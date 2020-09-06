import { onNewReplay } from "./common.js";
import { Replay } from "../../shared/fetchTypes";
import { query } from "../../shared/sql.js";

onNewReplay(
	async (replay: Replay): Promise<void> => {
		const biasChanges = replay.data.game.players
			.filter(
				(p) =>
					p.variables?.preference &&
					p.variables?.preference !== "none",
			)
			.map((p) => {
				const biasChange =
					p.variables?.team === p.variables?.preference ? 0.25 : 1;

				return [
					p.name,
					biasChange * (p.variables?.team === "sheep" ? 1 : -1),
				];
			});

		query(
			"INSERT INTO fixusbias ( player, bias ) VALUES ? ON DUPLICATE KEY UPDATE bias = bias + VALUES( bias );",
			[biasChanges],
		);
	},
);
