
import fetch from "node-fetch";

export default () => fetch( "https://www.wc3maps.com/vue/gamelist.php" )
	.then( response => response.json() )
	.then( data => data.map( ( {
		name,
		path: map,
		playersa: occupied,
		playersb: max,
		realm: server,
		img: preview
	} ) => ( {
		server,
		name,
		slots: { occupied, max },
		map,
		preview: `http://wc3maps.com${preview}`
	} ) ) );
