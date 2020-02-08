
import fetch from "node-fetch";
import { Message } from "discord.js";

type Wc3StatsLobby = {
	checksum: undefined | string | number;
	host: undefined | string;
	id: undefined | string | number;
	map: undefined | string;
	name: undefined | string;
	server: "us" | "eu" | string;
	slotsTaken: undefined | number;
	slotsTotal: undefined | number;
	created: undefined | number;
}

const fetchWc3Stats = (): Promise<Array<Wc3StatsLobby>> =>
	fetch( "https://api.wc3stats.com/gamelist" )
		.then( r => r.json() )
		.then( r => r.body );

export type Lobby = {
	checksum: string | number | undefined;
	host: string;
	id: string | number | undefined;
	map: string | undefined;
	server: "us" | "eu" | undefined;
	slots: {occupied: number | undefined; max: number | undefined};
	name: string | undefined;
	messages: Message[];
	wc3maps?: number;
	created: number | undefined;
}

const cleanServer = ( server: string | undefined ): "us" | "eu" | undefined => {

	if ( ! server ) return;

	const cleaned = server.replace( "usw", "us" );
	if ( cleaned === "us" || cleaned === "eu" ) return cleaned;

};

export default (): Promise<Array<Lobby>> => fetchWc3Stats()
	.then( wc3stats => wc3stats.map( ( {
		checksum,
		host,
		id,
		map,
		name,
		server,
		slotsTaken,
		slotsTotal,
		created,
	} ) => ( {
		checksum,
		host: host || "Unknown",
		id,
		map: map ? map.slice( 0, - 4 ) : undefined,
		name,
		server: cleanServer( server ),
		slots: { occupied: slotsTaken, max: slotsTotal },
		messages: [],
		created,
	} ) ) );
