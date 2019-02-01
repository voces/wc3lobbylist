
import fetch from "node-fetch";

export const list = () => fetch( "https://www.w3mapz.com/getTable.php" )
	.then( response => response.json() )
	.then( data => data.data.map( ( [
		realm,
		name,
		occupied,
		max
	] ) => ( {
		realm,
		name,
		slots: {
			occupied,
			max
		}
	} ) ) );
