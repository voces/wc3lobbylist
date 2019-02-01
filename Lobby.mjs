
import Discord from "discord.js";

import { mergeDeep } from "./util/merge.mjs";

const lobbies = [];

const invokeOnUpdate = ( obj, prop, callback ) => {

	const valueProp = `_${prop}`;

	Object.defineProperties( obj, {
		[ valueProp ]: { writable: true },
		[ prop ]: {
			enumerable: true,
			get: () => obj[ valueProp ],
			set: value => {

				// Don't do anything if unchanged
				if ( value === obj[ valueProp ] ) return value;

				const oldValue = obj[ valueProp ];
				obj[ valueProp ] = value;
				callback( value, prop, oldValue, obj );

				return value;

			}
		}
	} );

};
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

		[ "realm", "name", "slots", "map", "available" ].forEach( prop =>
			invokeOnUpdate( this, prop, () => this.onUpdate() ) );

		this.realm = props.realm;
		this.name = props.name;
		this.slots = props.slots;
		this.available = true;

		[ "occupied", "max" ].forEach( prop =>
			invokeOnUpdate( this.slots, prop, () => this.onUpdate() ) );

		this.map = props.map || {};
		[ "file", "author", "name", "preview" ].forEach( prop =>
			invokeOnUpdate( this.map, prop, () => this.onUpdate() ) );

		this.messages = [];

		this.releaseUpdate();

		lobbies.push( this );

	}

	update( ...patches ) {

		this.debounceUpdate();
		mergeDeep( this, ...patches );
		this.releaseUpdate();

	}

	debounceUpdate() {

		this._debouncingUpdate = true;

	}

	releaseUpdate() {

		this._debouncingUpdate = false;
		if ( this._debouncedUpdate ) this.onUpdate();
		this._debouncedUpdate = false;

	}

	onUpdate() {

		this.lastTouch = Date.now();
		if ( this.timeout ) clearTimeout( this.timeout );
		this.timeout = setTimeout( () => this.available = false, 1000 * 60 );

		if ( this._debouncingUpdate ) {

			this._debouncedUpdate = true;
			return;

		}

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

