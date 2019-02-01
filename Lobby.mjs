
import Joi from "joi";

import { assert, children } from "./util/joi.mjs";

const realmSchema = Joi.string().valid( "asia", "eu", "kr", "use", "usw" );
const nameSchema = Joi.string().min( 1 ).max( 31 );
const slotsSchema = Joi.object().keys( {
	occupied: Joi.number().min( 1 ).max( 24 ).integer().required(),
	max: Joi.number().min( Joi.ref( "occupied" ) ).max( 24 ).integer().required()
} );
const mapSchema = Joi.object().keys( {
	name: Joi.string().min( 1 ),
	path: Joi.string().min( 1 ).regex( /(.w3x|.w3m)$/ )
} ).or( "name", "path" );

const rawLobbySchema = Joi.object().keys( {
	realm: realmSchema.required(),
	name: nameSchema.required(),
	slots: slotsSchema.required(),
	map: mapSchema
} );

function defineJoiProperty( obj, property, schema ) {

	const dataProperty = "_" + property;
	Object.defineProperties( obj, {
		[ dataProperty ]: { writable: true },
		[ property ]: {
			enumerable: true,
			get: () => obj[ dataProperty ],
			set: value => ( Joi.assert( value, schema ), obj[ dataProperty ] = value )
		}
	} );

}

const lobbies = [];

export default class Lobby {

	static find( rawLobby ) {

		rawLobby = assert( rawLobby, rawLobbySchema.required() );

		return lobbies.filter( lobby =>
			lobby.name.toLowerCase() === rawLobby.name.toLowerCase() &&
            lobby.realm.toLowerCase() === rawLobby.realm.toLowerCase() );

	}

	static fineOne( rawLobby ) {

		rawLobby = assert( rawLobby, rawLobbySchema.required() );

		return this.find( rawLobby )[ 0 ];

	}

	constructor( rawLobby ) {

		rawLobby = assert( rawLobby, rawLobbySchema.required() );

		children( rawLobbySchema ).forEach( ( { key, schema } ) => defineJoiProperty( this, key, schema ) );

		this.realm = rawLobby.realm;
		this.name = rawLobby.name;
		this.slots = rawLobby.slots;
		if ( rawLobby.map ) this.map = rawLobby.map;

		lobbies.push( this );
		Object.seal( this );

	}

	get realm() {

		return this._data.realm;

	}

}

const lobby = new Lobby( {
	realm: "usw",
	name: "Testy test",
	slots: {
		occupied: 7,
		max: 12
	}
} );

console.log( JSON.stringify( lobby ) );
