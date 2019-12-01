
import Discord from "discord.js";

if ( ! process.env.DISCORD_TOKEN ) {

	console.error( new Error( "Environmental variable DISCORD_TOKEN not set" ) );
	process.exit( 1 );

}

// load Discord
const client = new Discord.Client();
client.login( process.env.DISCORD_TOKEN );

// a simple promise to make sure discord is ready
const ready = new Promise( resolve =>
	setTimeout( () => ready.resolve = resolve ) );
client.on( "ready", async () => {

	console.log( new Date(), "discord ready" );

	ready.resolve();

} );

// method for sending messages
const send = async ( channelId, ...args ) => {

	await ready;
	return client.channels.get( channelId ).send( ...args );

};

export default { send };
