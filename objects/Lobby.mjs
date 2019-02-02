
import Discord from "discord.js";

import { mergeDiff } from "../util/merge.mjs";

export const lobbies = [];
const lobbyMap = {};

const getKey = lobby => `${lobby.realm} ${lobby.name.toLowerCase()}`;
export default class Lobby {

	static find( rawLobby ) {

		return lobbyMap[ getKey( rawLobby ) ];

	}

	constructor( props ) {

		Object.defineProperties( this, {
			timeout: { writable: true },

			// We should load these from the DB
			messages: { value: [] }
		} );

		this.realm = props.realm;
		this.name = props.name;
		this.slots = props.slots;
		this.available = true;
		this.map = props.map || {};

		lobbies.push( this );
		lobbyMap[ getKey( this ) ] = this;

		this.onUpdate();

		console.log( "constructor", JSON.stringify( this ) );

	}

	update( ...patches ) {

		if ( mergeDiff( this, ...patches ) ) {

			// If the lobby has changed, it's probably available
			this.available = true;

			this.onUpdate();

		}

	}

	send() {

		const embed = this.toEmbed();

		for ( let i = 0; i < this.messages.length; i ++ )
			this.messages[ i ].edit( embed );

	}

	onUpdate() {

		if ( this.timeout ) clearTimeout( this.timeout );
		if ( this.available ) this.timeout = setTimeout( () =>
			( this.available = false, this.onUpdate() ), 1000 * 60 );

		// We should persist this

		this.send();

		console.log( "onUpdate", JSON.stringify( this ) );

	}

	toEmbed() {

		return new Discord.RichEmbed( {
			title: `[${this.realm.toUpperCase()}] ${this.name} (${this.slots.occupied}/${this.slots.max})`,
			description: this.map.file,
			thumbnail: { url: this.map.preview }
		} );

	}

}
