
// import Discord from "discord.js";

import { list } from "./data/lobbies.mjs";
import cache from "./util/simpleCache.mjs";
import log from "./log.mjs";
import { alerts } from "./Alert.mjs";
import { formatLobbies } from "./util/strings.mjs";

export const lobbyKey = lobby => `${lobby.server}-${lobby.name}`;

const trackers = [];
// const alerters = [];

let prevLobbies = [];
const listLobbies = cache( async () => {

	const nextLobbies = await list();

	const oldLobbies = [];
	const newLobbies = [];
	const updatedLobbies = [];
	const unchangedLobbies = [];

	for ( let i = 0; i < nextLobbies.length; i ++ ) {

		// A more deterministic approach would be better...
		const prevLobby = prevLobbies.find( lobby =>
			lobby.server === nextLobbies[ i ].server &&
			lobby.name === nextLobbies[ i ].name );

		if ( ! prevLobby ) {

			newLobbies.push( nextLobbies[ i ] );
			continue;

		}

		if ( prevLobby.slots === nextLobbies[ i ].slots ) {

			unchangedLobbies.push( nextLobbies[ i ] );
			continue;

		}

		updatedLobbies.push( nextLobbies[ i ] );

	}

	for ( let i = 0; i < prevLobbies; i ++ )
		if ( ! nextLobbies.find( lobby =>
			lobby.server === prevLobbies[ i ].server &&
			lobby.name === prevLobbies[ i ].name ) )

			oldLobbies.push( prevLobbies[ i ] );

	prevLobbies = nextLobbies;

	if ( newLobbies.length )
		alerts.forEach( alert => alert.update( newLobbies, oldLobbies ).catch( console.error ) );

	trackers.forEach( async tracker => {

		const { message, filters, formattedLobbies } = tracker;

		if ( message.deleted ) return untrack( tracker );

		const newLobbies = nextLobbies.filter( lobby =>
			filters.every( filter => filter( lobby ) ) );

		const formattedNewLobbies = formatLobbies( newLobbies );

		if ( formattedNewLobbies !== formattedLobbies ) {

			log( message, `update id=${message.id}` );

			tracker.formattedLobbies = formattedNewLobbies;

			try {

				tracker.message = await message.edit( formattedNewLobbies );

			} catch ( err ) {

				console.error( err );
				return untrack( tracker );

			}

		}

	} );

	return nextLobbies;

}, { maxAge: 5001 } );

export default listLobbies;

export const track = tracker => trackers.push( tracker );

export const untrack = tracker => {

	const index = trackers.indexOf( tracker );

	if ( index === - 1 ) return;

	log( tracker.message, "untracked" );
	trackers.splice( index, 1 );

};

export const untrackFromMessage = message => {

	const index = trackers.findIndex( tracker => tracker.message.id === message.id );

	if ( index === - 1 ) return false;

	if ( trackers[ index ].author !== message.author.id ) return false;

	log( message, "untracked" );
	trackers.splice( index, 1 );
	message.react( "🆗" );

	return true;

};

setInterval( () => ( trackers.length || alerts.length ) && listLobbies(), 1000 );
