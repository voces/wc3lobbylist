
import discord from "./discord.js";
import fetchLobbies from "./fetchLobbies.js";

let oldLobbies = {};

const isSheepTag = lobby =>
	lobby.name.match( /^.*(sh(e{2,})p.*tag|\b(st)+\b|\bst[^a-z]|stbd|bdst|\bbd\b).*$/i );

const format = lobby =>
	`[${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`;

const onNewLobby = async lobby => {

	if ( ! isSheepTag( lobby ) ) return;

	try {

		lobby.message = await discord.send( `**${format( lobby )}**` );
		console.log( new Date(), "n", format( lobby ), !! lobby.message );

	} catch ( err ) {

		console.error( err );

	}

};

const onUpdateLobby = async lobby => {

	if ( ! isSheepTag( lobby ) ) return;

	if ( lobby.message ) await lobby.message.edit( `**${format( lobby )}**` );
	console.log( new Date(), "u", format( lobby ), !! lobby.message );

};

const onDeleteLobby = async lobby => {

	if ( ! isSheepTag( lobby ) ) return;

	if ( lobby.message ) await lobby.message.edit( `~~${format( lobby )}~~` );
	console.log( new Date(), "d", format( lobby ), !! lobby.message );

};

const update = async () => {

	const start = Date.now();
	const newLobbies = await fetchLobbies();
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

console.log( "ready!" );
