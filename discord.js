
import Discord from "discord.js";

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
	const channel = await client.channels.get( "457570641638326274" );
	queue.forEach( send => channel.send( ...send ).then( send.resolve ).catch( send.resolve ) );
	obj.send = ( ...args ) => channel.send( ...args );

} );

export default obj;
