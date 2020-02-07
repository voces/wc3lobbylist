
import fetch from "node-fetch";

// const fetchWc3Maps = () => fetch(
// 	"http://wc3maps.com/api/v1/listgames",
// 	{ headers: {
// 		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36",
// 		Referer: "http://wc3maps.com/live",
// 	} } )
// 	.then( r => r.json() )
// 	.then( r => r.results );

const fetchWc3Stats = () => fetch( "https://api.wc3stats.com/gamelist" )
	.then( r => r.json() )
	.then( r => r.body );

export default () => fetchWc3Stats()
	.then( wc3stats => [
		// ...wc3maps.map( ( {
		// 	name,
		// 	slots_taken: occupied,
		// 	slots_total: max,
		// 	server,
		// } ) => ( {
		// 	server,
		// 	name,
		// 	slots: { occupied, max },
		// } ) ),
		...wc3stats.map( ( {
			checksum,
			host,
			id,
			map,
			name,
			server,
			slotsTaken,
			slotsTotal,
		} ) => ( {
			checksum,
			host,
			id,
			map: map.slice( 0, - 4 ),
			name,
			server: server && server.replace( "usw", "us" ),
			slots: { occupied: slotsTaken, max: slotsTotal },
		} ) ),
	] );
