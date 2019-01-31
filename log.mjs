
const dmWho = message => message.channel.recipient.username;
const textWho = message => `${message.guild.name}/${message.channel.name}`;
const who = message =>
	message.channel.type === "dm" && dmWho( message ) ||
	[ "group", "text" ].includes( message.channel.type ) && textWho( message ) ||
	`${message.channel.type}_${message.channel.id}`;

export default ( message, ...info ) => {

	console.log( `[${new Date().toLocaleTimeString()}] <${who( message )}> ${info.join( " " )}` );

};

export const formatArgs = args =>
	Object.entries( args )
		.filter( ( [ key ] ) => key.length > 1 && key.match( /^\w+$/ ) )
		.map( ( [ key, value ] ) => `${key}=${value}` ).join( " " );
