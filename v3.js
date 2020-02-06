
import discord from "./discord.js";
import { TEN_MINUTES, onUpdateLobby, onKillLobby, onDeleteLobby, format } from "./v2.js";
import LobbyEmbed from "./LobbyEmbed.js";
import config from "./config.js";

let oldLobbies = {};

const configEntries = Object.entries( config );
const getChannelIds = lobby => configEntries
	.filter( ( [ , value ] ) => typeof value === "object" && ! Array.isArray( value ) )
	.filter( ( [ , { version, filter } = {} ] ) => version === 3 && filter && filter( lobby ) )
	.map( ( [ channelId ] ) => channelId );

const onNewLobby = async lobby => {

	const channelIds = getChannelIds( lobby );
	if ( ! channelIds.length ) return;

	lobby.messages = await Promise.all( channelIds.map( async channelId => {

		const embed = new LobbyEmbed();
		embed
			.set( "title", lobby.map.replace( /_/g, " " ) )
			.set( "gameName", lobby.name )
			.set( "author", lobby.host )
			.set( "realm", lobby.server )
			.set( "players", `${lobby.slots.occupied}/${lobby.slots.max}` );

		const newMessage = await discord.send(
			channelId,
			...config[ channelId ].message ? [ config[ channelId ].message, embed.toEmbed() ] : [ embed.toEmbed() ],
		).catch( console.error );

		console.log( new Date(), "v3 n", format( lobby ) );

		return newMessage;

	} ) );

};

export const newLobbies = async newLobbies => {

	for ( const newLobby of newLobbies ) {

		const oldLobby = oldLobbies[ newLobby.id ];
		if ( oldLobby ) {

			newLobby.messages = oldLobby.messages;

			if ( oldLobby.slots.occupied !== newLobby.slots.occupied )
				await onUpdateLobby( newLobby );

		} else await onNewLobby( newLobby );

	}

	const lobbyMap = Object.fromEntries( newLobbies.map( l => [ l.id, l ] ) );

	for ( const id in oldLobbies )
		if ( ! lobbyMap[ id ] ) {

			if ( ! oldLobbies[ id ].deleted ) {

				await onKillLobby( oldLobbies[ id ] );
				oldLobbies[ id ].deleted = Date.now();

			}

			if ( oldLobbies[ id ].deleted > Date.now() - TEN_MINUTES )
				lobbyMap[ id ] = oldLobbies[ id ];

			else await onDeleteLobby( oldLobbies[ id ] );

		}

	oldLobbies = lobbyMap;

};

export const onExit = async () => {

	for ( const lobbyId in oldLobbies )
		await onDeleteLobby( oldLobbies[ lobbyId ] );

};
