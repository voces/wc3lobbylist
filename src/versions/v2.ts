
import Discord, { MessageEmbed } from "discord.js";
import discord from "../discord.js";
import { LobbyEmbed } from "../LobbyEmbed.js";
import { config } from "../../config.js";
import { isChannelGuildChannel } from "../util.js";
import { Lobby } from "../fetchLobbies.js";

const ONE_MINUTE = 60 * 1000;
export const TEN_MINUTES = 10 * ONE_MINUTE;

const TRIGGS_ID = "538039264261308417";

let oldLobbies = {};

const getLobbyKey = ( lobby: Lobby ): string => `${lobby.server}-${lobby.name?.toLowerCase()}`;

export const format = ( lobby: Lobby ): string =>
	Discord.Util.escapeMarkdown(
		`[${lobby.server}] ${lobby.name} (${lobby.slots ? `${lobby.slots.occupied}/${lobby.slots.max}` : "?/?"})`,
	);

export const updateEmbeds = async (
	lobby: Lobby,
	fn: ( embed?: MessageEmbed ) => LobbyEmbed,
	fnDo?: ( lobby: Lobby ) => void,
): Promise<void> => {

	if ( ! lobby.messages || ! lobby.messages.length ) return;

	if ( fnDo ) fnDo( lobby );

	await Promise.all( lobby.messages.map( message => {

		try {

			return message.edit( message.content, fn( message.embeds[ 0 ] ).toEmbed() );

		} catch ( err ) {

			console.error( err );

		}

	} ) );

};

export const onUpdateLobby = async ( lobby: Lobby ): Promise<void> =>
	updateEmbeds(
		lobby,
		embed => new LobbyEmbed( embed )
			.set( "color", "" )
			.set(
				"players",
				lobby.slots ? `${lobby.slots.occupied}/${lobby.slots.max}` : "?/?",
			),
		lobby => console.log( new Date(), "v2/3 u", format( lobby ) ),
	);

export const onKillLobby = async ( lobby: Lobby ): Promise<void> =>
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

export const onDeleteLobby = async ( lobby: Lobby ): Promise<void> =>
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

const hasPermission = ( message: Discord.Message, permission: Discord.PermissionResolvable ): boolean => {

	const channel = message.channel;
	if ( ! isChannelGuildChannel( channel ) )
		return false;

	const permissions = channel.memberPermissions( message.guild.me );
	if ( ! permissions ) return false;

	return permissions.hasPermission( permission );

};

discord.on( "message", async message => {

	try {

		const channel = message.channel;

		if (
			message.author.id !== TRIGGS_ID ||
			! message.embeds.length ||
			! message.embeds[ 0 ].footer ||
			! hasPermission( message, "SEND_MESSAGES" ) ||
			! hasPermission( message, "MANAGE_MESSAGES" ) ||
			config.whitelistOnly && ! config.channels[ channel.id ] ||
			config.blacklist && config.blacklist[ channel.id ]
		)
			return;

		// Delete Trigg's message
		message.delete();

		// Extract and clone the embed
		const sourceEmbed = message.embeds[ 0 ];
		const embed = new LobbyEmbed( sourceEmbed );

		// Generate some lobby data (we store this)
		const lobbyData: Lobby = {
			map: embed.title,
			wc3maps: parseInt( embed.url.split( "/" ).pop() ?? "" ),
			name: embed.gameName,
			host: embed.host,
			server: embed.realm === "eu" ? "eu" : "us",
			created: parseInt( embed.created ),
			checksum: undefined,
			id: undefined,
			slots: { occupied: undefined, max: undefined },
			messages: [],
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
		const channelConfig = config.channels[ message.channel.id ];
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

export const newLobbies = async ( newLobbies: Lobby[] ): Promise<void> => {

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

export const onExit = async (): Promise<void> => {

	for ( const lobbyId in oldLobbies )
		await onDeleteLobby( oldLobbies[ lobbyId ] );

};
