
import MySQL, { RowDataPacket, OkPacket } from "mysql2/promise.js";

const pool = MySQL.createPool( {
	host: "localhost",
	multipleStatements: true,
	namedPlaceholders: true,
	user: "w3xio",
	database: "w3xio",
} );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const query = async (
	sql: string,
	values?: any,
): Promise<RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[]> =>
	pool.query( sql, values ).then( r => r[ 0 ] );

