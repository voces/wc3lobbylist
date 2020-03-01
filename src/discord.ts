
import Discord, { StringResolvable, MessageOptions, RichEmbed, Attachment } from "discord.js";
import { isChannelGuildChannel, isTextChannel } from "./util.js";

if ( ! process.env.DISCORD_TOKEN ) {

	console.error( new Error( "Environmental variable DISCORD_TOKEN not set" ) );
	process.exit( 1 );

}

// load Discord
const client = new Discord.Client();
client.login( process.env.DISCORD_TOKEN );

class Deferred<T> extends Promise<T> { resolve?: ( value?: T ) => void }

// a simple promise to make sure discord is ready
const ready: Deferred<void> = new Promise( resolve =>
	setTimeout( () => ready.resolve = resolve ) );
client.on( "ready", async () => {

	console.log( new Date(), "discord ready" );

	ready.resolve && ready.resolve();

} );

type SendProps =
	| [StringResolvable]
	| [StringResolvable, MessageOptions | RichEmbed | Attachment]
	| [MessageOptions | RichEmbed | Attachment]

// method for sending messages
const send = async (
	channelId: string,
	...args: SendProps
): Promise<Discord.Message | Discord.Message[]> => {

	await ready;
	const channel = client.channels.get( channelId );
	if ( ! channel || ! isChannelGuildChannel( channel ) || ! isTextChannel( channel ) )
		throw new Error( `Trying to send to invalid channel: ${channel} (${channelId})` );

	return channel.send( ...args );

};

export default Object.assign( client, { send } );
