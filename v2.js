
import Discord from "discord.js";
import discord from "./discord.js";
import LobbyEmbed from "./LobbyEmbed.js";
import config from "./config.js";

const ONE_MINUTE = 60 * 1000;
export const TEN_MINUTES = 10 * ONE_MINUTE;

const TRIGGS_ID = "538039264261308417";

let oldLobbies = {};

const getLobbyKey = lobby => `${lobby.server}-${lobby.name.toLowerCase()}`;

export const format = lobby =>
	Discord.escapeMarkdown( `[${lobby.server}] ${lobby.name} (${lobby.slots ? `${lobby.slots.occupied}/${lobby.slots.max}` : "?/?"})` );

export const updateEmbeds = async ( lobby, fn, fnDo ) => {

	if ( ! lobby.messages || ! lobby.messages.length ) return;

	if ( fnDo ) fnDo( lobby );

	return await Promise.all( lobby.messages.map( message => {

		try {

			return message.edit( message.content, fn( message.embeds[ 0 ] ).toEmbed() );

		} catch ( err ) {

			console.error( err );

		}

	} ) );

};

export const onUpdateLobby = async lobby =>
	updateEmbeds(
		lobby,
		embed => new LobbyEmbed( embed )
			.set( "color", undefined )
			.set(
				"players",
				lobby.slots ? `${lobby.slots.occupied}/${lobby.slots.max}` : "?/?",
			),
		lobby => console.log( new Date(), "v2/3 u", format( lobby ) ),
	);

export const onKillLobby = async lobby =>
	updateEmbeds(
		lobby,
		embed => new LobbyEmbed( embed )
			.set( "color", 0xe69500 )
			.set(
				"players",
				lobby.slots ? `${lobby.slots.occupied}/${lobby.slots.max}` : "?/?",
			),
		lobby => console.log( new Date(), "v2/3 k", format( lobby ) ),
	);

export const onDeleteLobby = async lobby =>
	updateEmbeds(
		lobby,
		embed => new LobbyEmbed( embed )
			.set( "color", 0xff7d9c )
			.set(
				"players",
				lobby.slots ? `${lobby.slots.occupied}/${lobby.slots.max}` : "?/?",
			),
		lobby => console.log( new Date(), "v2/3 d", format( lobby ) ),
	);

discord.on( "message", async message => {

	try {

		if (
			message.author.id !== TRIGGS_ID ||
			! message.embeds.length ||
			! message.embeds[ 0 ].footer ||
			! message.channel.memberPermissions( message.guild.me )
				.hasPermission( Discord.Permissions.FLAGS.SEND_MESSAGES ) ||
			! message.channel.memberPermissions( message.guild.me )
				.hasPermission( Discord.Permissions.FLAGS.MANAGE_MESSAGES ) ||
			config.whitelistOnly && ! config[ message.channel.id ] ||
			config.blacklist && config.blacklist[ message.channel.id ]
		)
			return;

		// Delete Trigg's message
		message.delete();

		// Extract and clone the embed
		const sourceEmbed = message.embeds[ 0 ];
		const embed = new LobbyEmbed( sourceEmbed );

		// Generate some lobby data (we store this)
		const lobbyData = {
			map: embed.title,
			wc3maps: embed.url.split( "/" ).pop(),
			name: embed.gameName,
			author: embed.author,
			server: embed.realm,
			created: embed.created,
		};

		// Merge with lobby live list
		const key = getLobbyKey( lobbyData );
		const oldLobby = oldLobbies[ key ];

		if ( oldLobby ) Object.assign( oldLobby, lobbyData );
		else oldLobbies[ key ] = lobbyData;

		const lobby = oldLobbies[ key ];

		// Update player count on embed
		embed.players = lobby.slots ?
			`${lobby.slots.occupied}/${lobby.slots.max}` :
			"?/?";

		// Post the new message
		const channelConfig = config[ message.channel.id ];
		const newMessage = await message.channel.send(
			channelConfig && channelConfig.message || "",
			embed.toEmbed(),
		).catch( console.error );

		// Store the new message
		if ( ! lobby.messages ) lobby.messages = [];
		lobby.messages.push( newMessage );

		console.log( new Date(), "v2 n", format( lobby ) );

	} catch ( err ) {

		console.error( err );

	}

} );

export default async newLobbies => {

	const keys = newLobbies.map( getLobbyKey );

	for ( let i = 0; i < newLobbies.length; i ++ ) {

		const newLobby = newLobbies[ i ];
		const oldLobby = oldLobbies[ keys[ i ] ];
		if ( oldLobby ) {

			newLobby.messages = oldLobby.messages;
			if (
				! oldLobby.slots ||
				oldLobby.slots.occupied !== newLobby.slots.occupied ||
				oldLobby.deleted
			)
				await onUpdateLobby( newLobby );

		}

	}

	const lobbyMap = Object.fromEntries( keys.map( ( key, i ) =>
		[ key, newLobbies[ i ] ] ) );

	for ( const prop in oldLobbies )
		if ( ! lobbyMap[ prop ] ) {

			if ( ! oldLobbies[ prop ].deleted ) {

				await onKillLobby( oldLobbies[ prop ] );
				oldLobbies[ prop ].deleted = Date.now();

			}

			if ( oldLobbies[ prop ].deleted > Date.now() - TEN_MINUTES )
				lobbyMap[ prop ] = oldLobbies[ prop ];

			else await onDeleteLobby( oldLobbies[ prop ] );

		}

	oldLobbies = lobbyMap;

};
