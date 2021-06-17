import cors from "cors";
import express from "express";
import morgan from "morgan";

import { config } from "../../../config.js";
import { logLine } from "../../shared/log.js";
import { query } from "../../shared/sql.js";
import { sqlProxy } from "./sqlProxy.js";

const app = express();
app.use(morgan("dev"));
app.use(cors());

// define a route handler for the default home page
app.get("/preferences", async (req, res) => {
	const { map, players: rawPlayers } = req.query;

	if (typeof map !== "string" || typeof rawPlayers !== "string")
		return res.status(400).send();

	const players = rawPlayers.split(",");

	const result = await query<{ player: string; bias: number }[]>(
		"SELECT player, bias FROM fixusbias WHERE player IN (:players);",
		{ players },
	);

	res.json(
		Object.fromEntries(result.map(({ player, bias }) => [player, bias])),
	);
});

app.post("/sql", sqlProxy);

app.use(express.static("src/w3xio/public"));

// start the express server
const port = config.api.port;
app.listen(port, () => {
	// tslint:disable-next-line:no-console
	logLine("w3xio", `server started at http://localhost:${port}`);
});
