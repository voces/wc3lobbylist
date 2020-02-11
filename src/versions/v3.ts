
import discord from "../discord.js";
import { TEN_MINUTES, onUpdateLobby, onKillLobby, onDeleteLobby, format } from "./v2.js";
import { LobbyEmbed } from "../LobbyEmbed.js";
import { config } from "../config.js";
import { Lobby } from "../fetchLobbies.js";
import { ruleToFilter } from "../commands/ruleToFilter.js";

let oldLobbies = {};

const getChannelIds = ( lobby: Lobby ): string[] => Object.entries( config )
	.filter( ( [ , config ] ) => {

		if ( ! config.filterFunc ) config.filterFunc = ruleToFilter( config.filter );

		return config.filterFunc( lobby );

	} )
	.map( ( [ channelId ] ) => channelId );

const onNewLobby = async ( lobby: Lobby ): Promise<void> => {

	const channelIds = getChannelIds( lobby );
	if ( ! channelIds.length ) return;

	lobby.messages = ( await Promise.all( channelIds.map( async channelId => {

		const embed = new LobbyEmbed();
		embed
			.set( "title", lobby.map?.replace( /_/g, " " ) ?? "?" )
			.set( "gameName", lobby.name ?? "?" )
			.set( "host", lobby.host ?? "?" )
			.set( "realm", lobby.server ?? "?" )
			.set( "players", `${lobby.slots.occupied}/${lobby.slots.max}` );

		const newMessage = await discord.send(
			channelId,
			...config[ channelId ].message ? [ config[ channelId ].message, embed.toEmbed() ] : [ embed.toEmbed() ],
		).catch( console.error );

		console.log( new Date(), "v3 n", format( lobby ) );

		return newMessage;

	} ) ) ).flat();

};

export const newLobbies = async ( newLobbies: Lobby[] ): Promise<void> => {

	for ( const newLobby of newLobbies ) {

		const oldLobby = oldLobbies[ newLobby.id ?? "" ];
		if ( oldLobby ) {

			newLobby.messages = oldLobby.messages;

			if ( oldLobby.slots.occupied !== newLobby.slots.occupied )
				try {

					await onUpdateLobby( newLobby );

				} catch ( err ) {

					console.error( err );

				}

		} else
			try {

				await onNewLobby( newLobby );

			} catch ( err ) {

				console.error( err );

			}

	}

	const lobbyMap = Object.fromEntries( newLobbies.map( l => [ l.id, l ] ) );

	for ( const id in oldLobbies )
		if ( ! lobbyMap[ id ] ) {

			if ( ! oldLobbies[ id ].deleted ) {

				try {

					await onKillLobby( oldLobbies[ id ] );

				} catch ( err ) {

					console.error( err );

				}

				oldLobbies[ id ].deleted = Date.now();

			}

			if ( oldLobbies[ id ].deleted > Date.now() - TEN_MINUTES )
				lobbyMap[ id ] = oldLobbies[ id ];

			else
				try {

					await onDeleteLobby( oldLobbies[ id ] );

				} catch ( err ) {

					console.error( err );

				}

		}

	oldLobbies = lobbyMap;

};

export const onExit = async (): Promise<void> => {

	for ( const lobbyId in oldLobbies )
		try {

			await onDeleteLobby( oldLobbies[ lobbyId ] );

		} catch ( err ) {

			console.error( err );

		}

};
