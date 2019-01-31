
import Discord from "discord.js";

import { query } from "./data/mysql.mjs";
import generateFilters from "./util/filters.mjs";

const MEMORY_LENGTH = 15 * 60 * 1000; // 15 minutes

const clean = str => str.replace( /[^0-9a-z ]/gi, "" ).replace( /\s{2,}/g, " " );

export const lobbyKey = lobby => `${lobby.server}-${lobby.name}`;

export const alerts = [];
const lastMessageToAlertMap = {};

export default class Alert {

	static async stopFromMessage( message ) {

		const prevMessages = ( await message.channel.fetchMessages( {
			limit: 10,
			before: message.id
		} ) ).array();

		for ( let i = 0; i < prevMessages.length; i ++ ) {

			const alert = lastMessageToAlertMap[ prevMessages[ i ].id ];
			if ( alert && alert.author === message.author ) {

				alert.remove( message );
				prevMessages[ i ].react( "🛑" );
				prevMessages[ i ].react( "🆗" );
				return;

			}

		}

	}

	static async stopFromReaction( messageReaction, user ) {

		const alert = lastMessageToAlertMap[ messageReaction.message.id ];
		if ( ! alert || alert.author !== user ) return;

		alert.remove( messageReaction );

	}

	constructor( props, source ) {

		if ( props.names ) props.names = props.names.map( clean );
		if ( props.servers ) props.servers = props.servers.map( clean );

		this.knownLobbies = {};

		Object.assign( this, props );

		this.filters = generateFilters( {
			names: this.names,
			servers: this.servers
		} );

		if ( ! this.id ) this.save( source );
		else alerts.push( this );

	}

	async save( source ) {

		const author = this.author.id;
		const channelType = this.channel.type;
		const channel = this.channel.id;
		const names = this.names ? this.names.join( "," ) : undefined;
		const servers = this.servers ? this.servers.join( "," ) : undefined;

		if ( this.id )
			throw new Error( "Attempting to save already saved alert" );

		const results = await query( "INSERT INTO alerts ( author, channel_type, channel, names, servers ) VALUES ( ?, ?, ?, ?, ? );", [ author, channelType, channel, names, servers ] );

		this.id = results.insertId;

		alerts.push( this );

		this.reactOK( source );

	}

	cleanKnownLobbies() {

		const now = Date.now();

		for ( const key in this.knownLobbies )
			if ( this.knownLobbies[ key ] + MEMORY_LENGTH < now )
				delete this.knownLobbies[ key ];

	}

	async update( newLobbies, oldLobbies ) {

		// Mark old lobbies with current timestamp
		const now = Date.now();
		oldLobbies.forEach( lobby => this.knownLobbies[ lobbyKey( lobby ) ] = now );

		// Remove lobbies that have been dead for some time
		this.cleanKnownLobbies();

		// Filter new lobbies (skipping those that are in memory)
		// Pick first 3 (we'll get the rest next time)
		const filteredLobbies = newLobbies.filter( lobby =>
			this.filters.every( filter => filter( lobby ) ) &&
			! ( lobbyKey( lobby ) in this.knownLobbies )
		).slice( 0, 3 );

		// Don't do anything if we found none
		if ( filteredLobbies.length === 0 ) return;

		// Mark new lobbies as still alive
		filteredLobbies.forEach( lobby => this.knownLobbies[ lobbyKey( lobby ) ] = Infinity );

		try {

			const messages = await Promise.all( filteredLobbies.map( lobby => {

				const embed = new Discord.RichEmbed( {
					title: `[${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
					description: lobby.map,
					thumbnail: { url: lobby.preview }
				} );

				return this.channelType === "dm" && ! this.channel ?
					this.author.send( embed ) :
					this.channel.send( embed );

			} ) ).catch( err => {

				console.error( err );
				return err;

			} );
			if ( messages instanceof Error )
				throw messages;

			this.logSend( filteredLobbies );

			const message = messages.pop();

			if ( ! this.channel ) this.channel = message.channel;

			if ( this.lastMessageId )
				delete lastMessageToAlertMap[ this.lastMessageId ];

			lastMessageToAlertMap[ this.lastMessageId = message.id ] = this;

		} catch ( err ) {

			console.error( err );
			this.remove();

		}

	}

	logSend( lobbies ) {

		const who = this.channelType === "dm" && ! this.channel ?
			this.author.username :
			this.channel.name;

		lobbies.forEach( lobby => {

			console.log( `[${new Date().toLocaleTimeString()}] <${who}> ${lobby.name}` );

		} );

	}

	reactOK( source ) {

		if ( source instanceof Discord.Message )
			source.react( "🆗" );
		else if ( source instanceof Discord.MessageReaction )
			source.message.react( "🆗" );

	}

	remove( source ) {

		if ( ! this.id )
			throw new Error( "Attempting to delete alert without an id" );

		query( "UPDATE alerts SET deleted = NOW() WHERE id = ?;", this.id );

		const index = alerts.indexOf( this );
		if ( index >= 0 ) alerts.splice( index, 1 );

		if ( source ) this.reactOK( source );

	}

}
