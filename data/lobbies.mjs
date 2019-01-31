
import fetch from "node-fetch";

// export const list = () => fetch( "https://www.w3mapz.com/getAlpha.php" )
// export const list = () => fetch( "https://www.w3mapz.com/getTable.php" )
// 	.then( response => response.json() )
// 	.then( response => response.data
// 		.map( ( [ server, name, occupied, max/* , map, host*/ ] ) => ( {
// 			server,
// 			name,
// 			slots: {
// 				occupied: parseInt( occupied ),
// 				max: parseInt( max )
// 			}
// 			// map,
// 			// host
// 		} ) )
// 		.filter( ( lobby, index, lobbies ) => index === lobbies.findIndex( lobby2 => lobby2.name === lobby.name ) )
// 	);

export const list = () => fetch( "https://www.wc3maps.com/vue/gamelist.php" )
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
		slots: {
			occupied,
			max
		},
		map,
		preview: `http://wc3maps.com${preview}`
	} ) ) );
