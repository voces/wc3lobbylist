
import MySQL from "mysql2/promise";

export const raw = MySQL.createPool( {
	host: "localhost",
	user: "wc3lobbylist",
	database: "wc3lobbylist",
	password: "S;Mm}`%aII$,esE)n94CafxoPcX8B+LL",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	supportBigNumbers: true
} );

export const query = ( ...args ) => raw.query( ...args ).then( ( [ result ] ) => result ).catch( err => err );

export default new Proxy( raw, { get: ( obj, prop ) => {

	if ( prop !== "query" ) return obj[ prop ];

	return query;

} } );
