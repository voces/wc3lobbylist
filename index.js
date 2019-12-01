
import discord from "./discord.js";
import fetchLobbies from "./fetchLobbies.js";
import { escapeMarkdown, promiseTimeout } from "./util.js";
import config from "./config.js";

const TEN_SECONDS = 10 * 1000;
const THIRTY_SECONDS = 30 * 1000;
const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;

let oldLobbies = {};
let lastWork = 0;

const configEntries = Object.entries( config );
const getChannelIds = lobby => configEntries
	.filter( ( [ , { filter } ] ) => filter( lobby ) )
	.map( ( [ channelId ] ) => channelId );

const format = lobby =>
	escapeMarkdown( `[${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})` );

const onNewLobby = async lobby => {

	const channelIds = getChannelIds( lobby );
	if ( ! channelIds.length ) return;

	try {

		lastWork = Date.now();
		lobby.messages = await Promise.all(
			channelIds.map( channelId => {

				try {

					return promiseTimeout( discord.send( channelId, `**${( config[ channelId ].format || format )( lobby )}**` ) );

				} catch ( err ) {

					console.error( err );

				}

			} ),

		);
		console.log( new Date(), "n", format( lobby ), !! ( lobby.messages && lobby.messages.length ) );

	} catch ( err ) {

		console.error( err );

	}

};

const onUpdateLobby = async lobby => {

	if ( ! getChannelIds( lobby ).length ) return;

	lastWork = Date.now();

	try {

		if ( lobby.messages && lobby.messages.length )
			await Promise.all( lobby.messages.map( message => {

				try {

					return promiseTimeout( message.edit( `**${( config[ message.channel.id ].format || format )( lobby )}**` ) );

				} catch ( err ) {

					console.error( err );

				}

			} ) );

		console.log( new Date(), "u", format( lobby ), !! ( lobby.messages && lobby.messages.length ) );

	} catch ( err ) {

		console.error( err );

	}

};

const onDeleteLobby = async lobby => {

	if ( ! getChannelIds( lobby ).length ) return;

	lastWork = Date.now();

	try {

		if ( lobby.messages && lobby.messages.length )
			await Promise.all( lobby.messages.map( message => {

				try {

					return promiseTimeout( message.edit( `~~${( config[ message.channel.id ].format || format )( lobby )}~~` ) );

				} catch ( err ) {

					console.error( err );

				}

			} ) );

		console.log( new Date(), "d", format( lobby ), !! ( lobby.messages && lobby.messages.length ) );

	} catch ( err ) {

		console.error( err );

	}

};

const update = async () => {

	const start = Date.now();
	lastWork = Date.now();
	let newLobbies;

	try {

		newLobbies = await promiseTimeout( fetchLobbies() );

	} catch ( err ) {

		console.error( err );
		setTimeout( update, TEN_SECONDS );

	}

	console.log( new Date(), "l", newLobbies.length );
	const keys = newLobbies.map( l =>
		`${l.server}-${l.name.toLowerCase()}-${l.slots.max}-${l.map}` );

	for ( let i = 0; i < newLobbies.length; i ++ ) {

		const newLobby = newLobbies[ i ];
		const oldLobby = oldLobbies[ keys[ i ] ];
		if ( oldLobby ) {

			newLobby.messages = oldLobby.messages;
			if ( oldLobby.slots.occupied !== newLobby.slots.occupied || oldLobby.deleted )
				await onUpdateLobby( newLobby );

		} else
			await onNewLobby( newLobby );

	}

	const lobbyMap = Object.fromEntries( keys.map( ( key, i ) =>
		[ key, newLobbies[ i ] ] ) );

	for ( const prop in oldLobbies )
		if ( ! lobbyMap[ prop ] ) {

			if ( ! oldLobbies[ prop ].deleted ) {

				await onDeleteLobby( oldLobbies[ prop ] );
				oldLobbies[ prop ].deleted = Date.now();

			}

			if ( oldLobbies[ prop ].deleted > Date.now() - FIVE_MINUTES )
				lobbyMap[ prop ] = oldLobbies[ prop ];

		}

	oldLobbies = lobbyMap;

	setTimeout( update, start + TEN_SECONDS - Date.now() );

};

update();

setInterval( () => {

	if ( Date.now() - lastWork < ONE_MINUTE ) return;

	console.log( new Date(), "looks dead, killing..." );
	process.exit( 1 );

}, THIRTY_SECONDS );

console.log( new Date(), "ready!", process.env.NODE_ENV );
