
import Discord from "discord.js";

import { mergeDiff } from "./util/merge.mjs";

const lobbies = [];

export default class Lobby {

	static find( rawLobby ) {

		return lobbies.filter( lobby =>
			lobby.name.toLowerCase() === rawLobby.name.toLowerCase() &&
			lobby.realm.toLowerCase() === rawLobby.realm.toLowerCase() );

	}

	static fineOne( rawLobby ) {

		return this.find( rawLobby )[ 0 ];

	}

	constructor( props ) {

		this.debounceUpdate();

		this.realm = props.realm;
		this.name = props.name;
		this.slots = props.slots;
		this.available = true;
		this.map = props.map || {};

		this.messages = [];

		lobbies.push( this );

	}

	update( ...patches ) {

		if ( mergeDiff( this, ...patches ) )
			this.onUpdate();

	}

	onUpdate() {

		if ( this.timeout ) clearTimeout( this.timeout );
		if ( this.available ) this.timeout = setTimeout( () => this.available = false, 1000 * 60 );

		const embed = this.toEmbed();

		for ( let i = 0; i < this.messages.length; i ++ )
			this.messages[ i ].edit( embed );

	}

	toEmbed() {

		return new Discord.RichEmbed( {
			title: `[${this.realm.toUpperCase()}] ${this.name} (${this.slots.occupied}/${this.slots.max})`,
			description: this.map.file,
			thumbnail: { url: this.map.preview }
		} );

	}

}

