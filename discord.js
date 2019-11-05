
import Discord from "discord.js";

if ( ! process.env.DISCORD_TOKEN ) {

	console.error( new Error( "Environmental variable DISCORD_TOKEN not set" ) );
	process.exit( 1 );

}

const client = new Discord.Client();
client.login( process.env.DISCORD_TOKEN );

const queue = [];
const obj = { send: ( ...args ) => {

	const promise = new Promise( ( resolve, reject ) => {

		args.resolve = resolve;
		args.reject = reject;

	} );

	queue.push( args );
	return promise;

} };

client.on( "ready", async () => {

	console.log( "discord ready" );
	const channelId = process.env.NODE_ENV === "production" ?
		"232301665666072577" : // STC live-lobbies
		"457570641638326274"; // WebCraft general
	const channel = await client.channels.get( channelId );
	queue.forEach( send => channel.send( ...send ).then( send.resolve ).catch( send.resolve ) );
	obj.send = ( ...args ) => channel.send( ...args );

} );

export default obj;
