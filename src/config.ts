
import fs from "fs";
import { Rule } from "./commands/parser.js";
import { Lobby } from "./liveLobbies/fetchLobbies.js";

if ( ! fs.existsSync( "./data/config.json" ) ) {

	if ( ! fs.existsSync( "./data" ) ) fs.mkdirSync( "./data" );
	fs.writeFileSync( "./data/config.json", "{}" );

}

export type ChannelConfig = {
	filter: Rule;
	filterFunc?: ( lobby: Lobby ) => boolean;
	message?: string;
	version?: number;
	format?: ( lobby: Lobby ) => string;
};

export const config = JSON.parse(
	fs.readFileSync(
		"./data/config.json", "utf-8" ),
	( _, value ) => typeof value === "object" && value.type === "regexp" ?
		new RegExp( value.pattern, value.flags ) :
		value,
) as Record<string, ChannelConfig>;
