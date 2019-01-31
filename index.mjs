
import Discord from "discord.js";

import Alert from "./Alert.mjs";
import commands from "./commands.mjs";
import { untrackFromMessage } from "./lobbies.mjs";
import { query } from "./data/mysql.mjs";

const client = new Discord.Client();

client.on( "message", message => {

	// Only listen to messages sent directly to the bot or mentions the bot
	// Always ignore messages sent by other bots
	if ( ( message.channel.type !== "dm" && ! message.mentions.users.some( user => user.id === client.user.id ) ) || message.author.bot ) return;

	// Clean the message, removing possible mentions of the bot
	let command = message.content;
	if ( message.content.includes( `<@${client.user.id}> ` ) ) command = command.replace( `<@${client.user.id}> `, "" );
	if ( message.content.includes( ` <@${client.user.id}>` ) ) command = command.replace( ` <@${client.user.id}>`, "" );
	if ( message.content.includes( `<@${client.user.id}>` ) ) command = command.replace( `<@${client.user.id}>`, "" );

	try {

		commands.parse( command, { message } );

	} catch ( err ) {

		console.error( err );

	}

} );

client.on( "messageReactionAdd", ( messageReaction, user ) =>
	messageReaction.emoji.name === "🛑" &&
	messageReaction.message.author === client.user &&
	user !== client.user &&
	Alert.stopFromReaction( messageReaction, user ) );

client.on( "messageDelete", message =>
	client.user.id === message.author.id && untrackFromMessage( message ) );

client.login( "******" );

client.on( "ready", async () => {

	const alerts = await query( "SELECT * FROM alerts WHERE deleted IS NULL;" );

	alerts.forEach( async alert => {

		try {

			const author = await client.fetchUser( alert.author.toString() );

			new Alert( {
				id: alert.id,
				author,
				channel: client.channels.get( alert.channel ),
				channelType: alert.channel_type,
				names: alert.names ? alert.names.split( "," ) : undefined,
				servers: alert.servers ? alert.servers.split( "," ) : undefined
			} );

		} catch ( err ) {

			console.error( err );

		}

	} );

} );

export default client;
