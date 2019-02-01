
import fetch from "node-fetch";

export const list = () => fetch( "https://www.wc3maps.com/vue/gamelist.php" )
	.then( response => response.json() )
	.then( data => data.map( ( {
		name,
		path,
		playersa: occupied,
		playersb: max,
		realm,
		img: preview
	} ) => ( {
		realm,
		name,
		slots: {
			occupied,
			max
		},
		map: {
			path,
			preview: `http://wc3maps.com${preview}`
		}
	} ) ) );
