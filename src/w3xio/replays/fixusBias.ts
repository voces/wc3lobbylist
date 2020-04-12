
import { onNewReplay } from "./common.js";
import { Replay } from "../../shared/fetchTypes";
import { query } from "../../shared/sql.js";

onNewReplay( async ( replay: Replay ): Promise<void> => {

	const biasChanges = replay.data.game.players
		.filter( p => p.variables?.preference && p.variables?.preference !== "none" )
		.map( p => {

			const biasChange = p.variables?.team === p.variables?.preference ?
				0.25 :
				1;

			return {
				player: p.name,
				bias: biasChange * ( p.variables?.team === "sheep" ? 1 : - 1 ),
			};

		} )
		.map( p => [ p, p.bias ] );

	query(
		biasChanges
			.map( () =>
				"INSERT INTO fixusbias VALUES SET ? ON DUPLICATE KEY UPDATE bias = bias + ?;",
			)
			.join( "\n" ),
		biasChanges.flat(),
	);

} );

