
import https from "https";
import express from "express";
import morgan from "morgan";
import { config } from "../../../config.js";
import { query } from "../../shared/sql.js";

const app = express();
app.use( morgan( "dev" ) );

// define a route handler for the default home page
app.get( "/preferences", async ( req, res ) => {

	const { map, players: rawPlayers } = req.query;

	if ( typeof map !== "string" || typeof rawPlayers !== "string" )
		return res.status( 400 ).send();

	const players = rawPlayers.split( "," );

	const result = await query(
		"SELECT player, bias FROM fixusbias WHERE player IN (:players);",
		{ players },
	) as {player: string; bias: number}[];

	res.json( Object.fromEntries(
		result.map( ( { player, bias } ) => [ player, bias ] ),
	) );

} );

// start the express server
const port = config.api.port;
app.listen( port, () => {

	// tslint:disable-next-line:no-console
	console.log( new Date(), `server started at http://localhost:${ port }` );

} );

const ssl = config.api.ssl;
if ( ssl ) {

	const httpsServer = https.createServer( ssl.credentials, app );
	httpsServer.listen( ssl.port, () => {

		// tslint:disable-next-line:no-console
		console.log( new Date(), `server started at https://localhost:${ ssl.port }` );

	} );

}