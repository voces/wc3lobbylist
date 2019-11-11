
import discord from "./discord.js";
import fetchLobbies from "./fetchLobbies.js";
import { escapeMarkdown, promiseTimeout } from "./util.js";

let oldLobbies = {};
let lastWork = 0;

const isRelevantLobby = lobby =>
	process.env.NODE_ENV === "production" ?
		lobby.name.match( /^.*(sh(e{2,})p.*tag|\b(st)+\b|\bst[^a-z]|stbd|bdst|\bbd\b).*$/i ) &&
		! lobby.name.match( /soldier/i) &&
		! lobby.name.match( /civilization/i) :
		true;

const format = lobby =>
	escapeMarkdown( `[${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})` );

const onNewLobby = async lobby => {

	if ( ! isRelevantLobby( lobby ) ) return;

	try {

		lastWork = Date.now();
		lobby.message = await promiseTimeout( discord.send( `**${format( lobby )}**` ) );
		console.log( new Date(), "n", format( lobby ), !! lobby.message );

	} catch ( err ) {

		console.error( err );

	}

};

const onUpdateLobby = async lobby => {

	if ( ! isRelevantLobby( lobby ) ) return;

	lastWork = Date.now();

	try {

		if ( lobby.message )
			await promiseTimeout( lobby.message.edit( `**${format( lobby )}**` ) );
		console.log( new Date(), "u", format( lobby ), !! lobby.message );

	} catch ( err ) {

		console.error( err );

	}

};

const onDeleteLobby = async lobby => {

	if ( ! isRelevantLobby( lobby ) ) return;

	lastWork = Date.now();

	try {

		if ( lobby.message )
			await promiseTimeout( lobby.message.edit( `~~${format( lobby )}~~` ) );
		console.log( new Date(), "d", format( lobby ), !! lobby.message );

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
		setTimeout( update, 5000 );

	}

	console.log( new Date(), "l", newLobbies.length );
	const keys = newLobbies.map( l =>
		`${l.server}-${l.name.toLowerCase()}-${l.slots.max}-${l.map}` );

	for ( let i = 0; i < newLobbies.length; i ++ ) {

		const newLobby = newLobbies[ i ];
		const oldLobby = oldLobbies[ keys[ i ] ];
		if ( oldLobby ) {

			newLobby.message = oldLobby.message;
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

	setTimeout( update, start + 5000 - Date.now() );

};

update();

setInterval( () => {

	if ( Date.now() - lastWork < 60_000 ) return;

	console.log( Date.now(), "looks dead, killing..." );
	process.exit( 1 );

}, 30_000 );

console.log( Date.now(), "ready!" );
