import MySQL from "mysql2/promise";

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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	values?: any[] | Record<string, any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => pool.query(sql, values).then((r) => r[0] as any);

export const kvGet = async <
	T extends "number" | "string" | "boolean" = "string"
>(
	key: string,
	type?: T,
): Promise<
	| (T extends "number" ? number : T extends "boolean" ? boolean : string)
	| undefined
> => {
	const res = await query("SELECT v FROM elo.kv WHERE k = ?;", [key]);
	if (res.length === 0) return;
	const v = res[0].v;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if (type === "number") return parseFloat(v) as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if (type === "boolean") return Boolean(v) as any;
	return v;
};

export const kvSet = async (
	key: string,
	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
	value: any,
): Promise<void> => {
	await query(
		"INSERT INTO elo.kv VALUES ? ON DUPLICATE KEY UPDATE v = VALUES(v);",
		[[[key, value]]],
	);
};
