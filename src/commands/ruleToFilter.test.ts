
import { process, ruleToFilter } from "./ruleToFilter";
import { Rule, Key } from "./parser.js";
import { Lobby } from "../fetchLobbies.js";

const buildTermRule = ( key: Key, value: string | RegExp ): Rule => ( { type: "term", key, value } );
const buildOrRule = ( rules: Rule[] ): Rule => ( { type: "or", rules } );
// const buildAndRule = ( rules: Rule[] ): Rule => ( { type: "and", rules } );

const buildLobby = ( name: string, map: string, host = "verit", server: Lobby["server"] = "us" ): Lobby =>
	( { name, map, host, server, checksum: Math.random(), id: Math.random(), slots: { occupied: 0, max: 1 }, messages: [], created: Date.now() } );

const stRule = buildOrRule( [ buildTermRule( "map", /sheep.*tag/i ), buildTermRule( "name", /sheep.*tag/i ) ] );

const lobbies = [
	buildLobby( "Sheep Tag Fixus!!!", "reFixus.w3x" ),
	buildLobby( "TTW -apfs", "Tropical Tower Wars v5.50.w3x" ),
	buildLobby( "tbr the black road", "TheBlackRoadv1.38d2.w3x" ),
	buildLobby( "st", "Sheep Tag Revolution 8.4.1.w3x" ),
	buildLobby( "THIS IS SPARTA", "300 - Three Hundred v8.0.w3x" ),
];

describe( "process", () => {

	const testLobbies = ( rule: Rule, expected: boolean[] ): ( () => void ) => (): void =>
		expect( lobbies.map( lobby => process( rule, lobby ) ) ).toEqual( expected );

	it( "sheep tag", testLobbies( stRule, [ true, false, false, true, false ] ) );

} );

describe( "ruleToFilter", () => {

	const testLobbies = ( filter: ( lobby: Lobby ) => boolean, expected: boolean[] ): ( () => void ) => (): void =>
		expect( lobbies.map( lobby => filter( lobby ) ) ).toEqual( expected );

	it( "sheep tag", testLobbies( ruleToFilter( stRule ), [ true, false, false, true, false ] ) );

} );
