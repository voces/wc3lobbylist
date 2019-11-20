import fetch from "node-fetch";

export default () => fetch(
	"http://wc3maps.com/api/v1/listgames", {
		headers: { Referer: "http://wc3maps.com/live" }
	} )
	.then( async response => response.json() )
	.then( data =>
		data.results.map( ( {
			name,
			slots_taken: occupied,
			slots_total: max,
			server
		} ) => ( {
			server,
			name,
			slots: { occupied, max }
		} ) )
	);
