import crypto from "crypto";
import type { RequestHandler } from "express";
import MySQL from "mysql2/promise";

import { logLine } from "../../shared/log.js";
import { hasNumber, hasString, isError, isRecord } from "../../typeguards.js";

const pools: Record<string, { pool: MySQL.Pool; lastUsed: number }> = {};

// Random salt each run
const salt = crypto.randomBytes(16).toString("hex");

type Config = {
	user: string;
	host: string;
	port: number;
	database?: string;
	password?: string;
};

const getKey = ({ user, host, port, database, password }: Config) =>
	crypto
		.pbkdf2Sync(
			`-u ${user} -h ${host} --port ${port} --database ${database} --p${password}`,
			salt,
			1000,
			64,
			"sha512",
		)
		.toString("hex");

const trimKey = (key: string) => `${key.slice(0, 8)}...${key.slice(-8)}`;

const initializePool = (
	{ database, host, password, port, user }: Config,
	key: string,
) => {
	const poolObj = {
		pool: MySQL.createPool({
			connectionLimit: 10,
			multipleStatements: true,
			queueLimit: 0,
			waitForConnections: true,
			database,
			host,
			password,
			port,
			user,
		}),
		lastUsed: 0,
	};
	logLine(
		"w3xio",
		`${new Date().toISOString()} creating pool ${trimKey(
			key,
		)} for ${user}@${host}`,
	);
	return poolObj;
};

const getPool = ({ database, host, password, port, user }: Config) => {
	const key = getKey({ database, host, password, port, user });
	const poolObj =
		pools[key] ??
		(pools[key] = initializePool(
			{ database, host, password, port, user },
			key,
		));
	poolObj.lastUsed = Date.now();
	return poolObj.pool;
};

export const sqlProxy: RequestHandler = async (req, res) => {
	try {
		const database = req.headers["x-dbproxy-database"]?.toString();
		const host = "w3x.io";
		const password = req.headers["x-dbproxy-password"]?.toString();
		const port =
			parseInt(req.headers["x-dbproxy-port"]?.toString() ?? "3306") ??
			3306;
		const user = req.headers["x-dbproxy-user"]?.toString() ?? "public";

		const pool = getPool({ database, host, password, port, user });

		const body: string = await new Promise((resolve) => {
			let body = "";
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", () => {
				resolve(body);
			});
		});

		const resp = await pool.query(body);

		res.json(resp[0]);
	} catch (err) {
		res.statusCode = 400;
		const code = isRecord(err) && hasNumber(err, "code") ? err.code : -1;
		const message =
			isRecord(err) && hasString(err, "message")
				? err.message
				: "Unknown error";
		if (isError(err)) res.json({ code, message });
	}
};

setInterval(() => {
	try {
		const threshold = Date.now() - 180_000;
		for (const key in pools)
			if (pools[key].lastUsed < threshold) {
				try {
					pools[key].pool.end();
				} catch {
					/* do nothing */
				}
				delete pools[key];
				logLine("w3xio", `removing ${trimKey(key)}`);
			}
	} catch {
		/* do nothing */
	}
}, 5_000);
