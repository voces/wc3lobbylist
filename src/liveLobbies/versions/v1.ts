
import Discord from "discord.js";
import discord from "../../discord.js";
import { promiseTimeout } from "../util.js";
import { config } from "../../config.js";
import { Lobby } from "../fetchLobbies.js";

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;

let oldLobbies = {};

const configEntries = Object.entries( config );
const getChannelIds = ( lobby: Lobby ): string[] => configEntries
	.filter( ( [ , { version, filterFunc } ] ) => version === 1 && filterFunc && filterFunc( lobby ) )
	.map( ( [ channelId ] ) => channelId );

const format = ( lobby: Lobby ): string =>
	Discord.Util.escapeMarkdown( `[${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})` );

const onNewLobby = async ( lobby: Lobby ): Promise<void> => {

	const channelIds = getChannelIds( lobby );
	if ( ! channelIds.length ) return;

	try {

		lobby.messages = ( await Promise.all(
			channelIds.map( channelId => {

				try {

					return promiseTimeout( discord.send( channelId, `**${( config[ channelId ].format || format )( lobby )}**` ) );

				} catch ( err ) {

					console.error( err );

				}

			} ),

		) ).flat();
		console.log( new Date(), "v1 n", format( lobby ), !! ( lobby.messages && lobby.messages.length ) );

	} catch ( err ) {

		console.error( err );

	}

};

const onUpdateLobby = async ( lobby: Lobby ): Promise<void> => {

	if ( ! getChannelIds( lobby ).length ) return;

	try {

		if ( lobby.messages && lobby.messages.length )
			await Promise.all( lobby.messages.map( message => {

				try {

					return promiseTimeout( message.edit( `**${( config[ message.channel.id ].format || format )( lobby )}**` ) );

				} catch ( err ) {

					console.error( err );

				}

			} ) );

		console.log( new Date(), "v1 u", format( lobby ), !! ( lobby.messages && lobby.messages.length ) );

	} catch ( err ) {

		console.error( err );

	}

};

const onDeleteLobby = async ( lobby: Lobby ): Promise<void> => {

	if ( ! getChannelIds( lobby ).length ) return;

	try {

		if ( lobby.messages && lobby.messages.length )
			await Promise.all( lobby.messages.map( message => {

				try {

					return promiseTimeout( message.edit( `~~${( config[ message.channel.id ].format || format )( lobby )}~~` ) );

				} catch ( err ) {

					console.error( err );

				}

			} ) );

		console.log( new Date(), "v1 d", format( lobby ), !! ( lobby.messages && lobby.messages.length ) );

	} catch ( err ) {

		console.error( err );

	}

};

export const newLobbies = async ( newLobbies: Lobby[] ): Promise<void> => {

	const keys = newLobbies.map( l =>
		`${l.server}-${l.name ? l.name.toLowerCase() : ""}-${l.slots.max}-${l.map}` );

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

};

export const onExit = async (): Promise<void> => {

	for ( const lobbyId in oldLobbies )
		await onDeleteLobby( oldLobbies[ lobbyId ] );

};