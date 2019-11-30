
import discord from "./discord.js";
import fetchLobbies from "./fetchLobbies.js";
import { escapeMarkdown, promiseTimeout } from "./util.js";
import config from "./config.js";

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

	debugger;

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
		setTimeout( update, 10_000 );

	}

	console.log( new Date(), "l", newLobbies.length );
	const keys = newLobbies.map( l =>
		`${l.server}-${l.name.toLowerCase()}-${l.slots.max}-${l.map}` );

	for ( let i = 0; i < newLobbies.length; i ++ ) {

		const newLobby = newLobbies[ i ];
		const oldLobby = oldLobbies[ keys[ i ] ];
		if ( oldLobby ) {

			newLobby.messages = oldLobby.messages;
			if ( oldLobby.slots.occupied !== newLobby.slots.occupied )
				await onUpdateLobby( newLobby );

		} else
			await onNewLobby( newLobby );

	}

	const lobbyMap = Object.fromEntries( keys.map( ( key, i ) =>
		[ key, newLobbies[ i ] ] ) );

	for ( const prop in oldLobbies )
		if ( ! lobbyMap[ prop ] )
			await onDeleteLobby( oldLobbies[ prop ] );

	oldLobbies = lobbyMap;

	setTimeout( update, start + 10_000 - Date.now() );

};

update();

setInterval( () => {

	if ( Date.now() - lastWork < 60_000 ) return;

	console.log( Date.now(), "looks dead, killing..." );
	process.exit( 1 );

}, 30_000 );

console.log( Date.now(), "ready!", process.env.NODE_ENV );
