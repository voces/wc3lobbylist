import MySQL from "mysql2/promise.js";

import { config } from "../../config.js";

const pool = MySQL.createPool({
	host: "localhost",
	multipleStatements: true,
	namedPlaceholders: true,
	user: "w3xio",
	database: "w3xio",
	port: config.mysql.port,
});

export const query = async (
	sql: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
	values?: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => pool.query(sql, values).then((r) => r[0] as any);
