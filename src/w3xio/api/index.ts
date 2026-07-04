import cors from "cors";
import express from "express";
import morgan from "morgan";

import { config } from "../../../config.js";
import { logLine } from "../../shared/log.js";
import { sqlProxy } from "./sqlProxy.js";

const app = express();
app.use(morgan("dev"));
app.use(cors());

// define a route handler for the default home page
app.get("/preferences", async (req, res) => {
	const { map, players: rawPlayers } = req.query;

	if (typeof map !== "string" || typeof rawPlayers !== "string")
		return res.status(400).send();

	// Fixus bias is stubbed out: the latest Fixus map dropped the team
	// `preference` variable that populated the `fixusbias` table, so we no
	// longer track it. We keep the endpoint and its param validation so
	// existing map/client callers don't break, but always return an empty
	// preference map (player -> bias) since there is no longer any data.
	res.json({});
});

app.post("/sql", sqlProxy);

app.use(express.static("src/w3xio/public"));

// start the express server
const port = config.api.port;
app.listen(port, () => {
	// tslint:disable-next-line:no-console
	logLine("w3xio", `server started at http://localhost:${port}`);
});
