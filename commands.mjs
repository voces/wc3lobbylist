
import Discord from "discord.js";
import yargs from "yargs";

import Alert from "./Alert.mjs";
import lobbies, { track, lobbyKey } from "./lobbies.mjs";
import log, { formatArgs } from "./log.mjs";
import { formatLobbies } from "./util/strings.mjs";

const generateNameFilter = names => {

	const regexSets = names.map( name => name.replace( /[^0-9a-z ]/gi, "" ).replace( /\s{2,}/g, " " ).split( " " ).map( word => RegExp( word, "i" ) ) );

	return lobby => regexSets.some( set => set.every( regex => lobby.name.match( regex ) ) );

};

const generateServerfilter = servers => lobby => servers.some( server => lobby.server === `[${server}]` );

const generateFilters = ( { name: names, server: servers } ) => {

	const namefilter = names && generateNameFilter( names );
	const serverFilter = servers && generateServerfilter( servers );

	return [ namefilter, serverFilter ].filter( Boolean );

};

const sendMessage = async ( commandMessage, args ) => {

	const filters = generateFilters( args );

	const fetchedLobbies = await lobbies();

	const filteredLobbies = fetchedLobbies.filter( lobby =>
		filters.every( filter => filter( lobby ) ) );

	const formattedLobbies = formatLobbies( filteredLobbies, args.long );

	if ( args.rich ) {

		const messages = Promise.all( filteredLobbies.map( lobby => commandMessage.channel.send( new Discord.RichEmbed( {
			title: `[${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
			description: lobby.map,
			thumbnail: { url: lobby.preview }
		} ) ) ) );

		return {
			channel: commandMessage,
			message: messages.pop(),
			filters,
			formattedLobbies,
			knownLobbies: filteredLobbies.map( lobbyKey ),
			author: commandMessage.author.id
		};

	}

	const message = await commandMessage.channel.send( formattedLobbies );

	return {
		channel: commandMessage,
		message,
		filters,
		formattedLobbies,
		knownLobbies: filteredLobbies.map( lobbyKey ),
		author: commandMessage.author.id
	};

};

export default yargs
	.exitProcess( false )
	.command( "list", "List the game list",
		yargs => yargs
			.option( "name", {
				alias: "n",
				describe: "Filter for the lobby name. Only considers [0-9a-z] and ignores casing and word order.",
				type: "array"
			} )
			.option( "server", {
				alias: "s",
				describe: "Filter for the lobby server.",
				type: "array"
			} )
			.option( "long", {
				alias: "l",
				describe: "Prints long versions",
				type: "boolean"
			} )
			.option( "rich", {
				alias: "r",
				describe: "Prints rich versions",
				type: "boolean"
			} ),
		async ( { message, ...args } ) => {

			log( message, `list ${formatArgs( args )}` );
			sendMessage( message, args );

		} )

	.command( "track", "Track the game list, updating the message as the game list updates",
		yargs => yargs
			.option( "name", {
				alias: "n",
				describe: "Filter for the lobby name. Only considers [0-9a-z] and ignores casing and word order.",
				type: "array"
			} )
			.option( "server", {
				alias: "s",
				describe: "Filter for the lobby server.",
				type: "array"
			} ),
		async ( { message, ...args } ) => {

			log( message, `track ${formatArgs( args )}` );
			track( await sendMessage( message, args ) );

		} )

	.command( "alert", "Posts a message anytime a new lobby appears.",
		yargs => yargs
			.option( "name", {
				alias: "n",
				describe: "Filter for the lobby name. Only considers [0-9a-z] and ignores casing and word order.",
				type: "array"
			} )
			.option( "server", {
				alias: "s",
				describe: "Filter for the lobby server.",
				type: "array"
			} ),
		async ( { message, ...args } ) => new Alert( {
			author: message.author,
			channel: message.channel,
			names: args.name,
			servers: args.server
		}, message ) )

	.command( "stop", "Stops the last alert.",
		yargs => yargs,
		async ( { message } ) => Alert.stopFromMessage( message ) );

// .command( "help", "Prints help text.",
// 	yargs => yargs,
// 	async ( { message } ) => {

// 		message.author.send( yargs.usage() );

// 	} );
