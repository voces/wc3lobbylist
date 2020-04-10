
import fetch from "node-fetch";
import { periodic } from "../../shared/periodic.js";
import { query } from "../../shared/sql.js";
import { check as exceptionCheck } from "./exceptions.js";

import { Replay, ReplayEvent, ReplaySummary, Event } from "./types.js";

const ONE_MINUTE = 60 * 1000;

const fetchConfig = async (): Promise<{key: string; value: string}[]> =>
	( await query( "SELECT * from config;" ) ) as{key: string; value: string}[];

const updatePage = async ( page: number ): Promise<void> => {

	try {

		await query( "UPDATE config SET value = :page WHERE `key` = 'page';", { page } );

	} catch ( err ) { console.error( err ) }

};

const fetchPage = ( page: number ): Promise<{body: [ReplaySummary] | []}> =>
	fetch( `https://api.wc3stats.com/replays&map=Ultimate%20Sheep%20Tag%20Fixus&page=${page}&limit=1&sort=playedOn&order=asc` )
		.then( r => r.json() );

const fetchReplay = ( replay: number ): Promise<Replay> =>
	fetch( `https://api.wc3stats.com/replays/${replay}` )
		.then( r => r.json() )
		.then( r => r.body );

const toEvent = ( replayEvent: ReplayEvent ): Event => {

	const event = {
		name: replayEvent.eventName,
		id: replayEvent.id,
		time: replayEvent.time,
	} as Event;

	for ( let i = 0; i < replayEvent.event.params.length; i ++ )
		event[ replayEvent.event.params[ i ] ] = typeof replayEvent.args[ i ] === "string" ?
			replayEvent.args[ i ]
				// w3mmd uses "\ " for spaces in values instead of just " "
				.replace( /\\ /g, " " )
				// we use to color strings, which looks like `|cff012345"abc"|r`
				.replace( /\|cff[0-9a-fA-F]{6}"/g, "" )
				.replace( /"\|r/g, "" ) :
			"";

	return event;

};

const newReplay = async ( replayPartial: ReplaySummary ): Promise<void> => {

	const replay = await fetchReplay( replayPartial.id );
	const events = replay.data.game.events.map( toEvent );

	exceptionCheck( replay, events );

};
console.log( "hello!" );
( async (): Promise<void> => {

	try {

		console.log( "a" );
		const config: Record<string, string> = {};

		const rawConfig = await fetchConfig();
		for ( const { key, value } of rawConfig )
			config[ key ] = value;

		let pageNumber = parseInt( config.page );
		console.log( "b" );
		periodic( "wc3stats replays", ONE_MINUTE, async () => {

			console.log( "cd" );
			let looping = true;
			while ( looping ) {

				looping = false;

				const page = await fetchPage( pageNumber );
				const replay = page.body[ 0 ];
				if ( replay && replay.processed ) {

					if ( ! replay.isVoid ) {

						console.log( new Date(), "new replay", replay.id );
						try {

							await newReplay( replay );

						} catch ( err ) {

							console.error( new Date(), err );

						}

						looping = true;

					} else
						console.log( new Date(), "skipping voided replay", replay.id );

					await updatePage( ++ pageNumber );

				}

			}

		} );

	} catch ( err ) {

		console.log( err );

	}

} )();
