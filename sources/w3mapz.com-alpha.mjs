
import fetch from "node-fetch";

export const list = () => fetch( "https://www.w3mapz.com/getAlpha.php" )
	.then( response => response.json() )
	.then( data => data.data.map( ( [
		realm,
		name,
		occupied,
		max,
		path,
		author
	] ) => ( {
		realm,
		name,
		slots: {
			occupied,
			max
		},
		map: {
			path,
			author
		}
	} ) ) );

( async() => {

	console.log( await list() );

} )();
