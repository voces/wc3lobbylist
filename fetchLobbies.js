
import fetch from "node-fetch";

export default () =>fetch(
	"http://wc3maps.com/api/v1/listgames",
	{ headers: {
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36",
		Referer: "http://wc3maps.com/live"
	} } )
	.then( response => response.json() )
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
