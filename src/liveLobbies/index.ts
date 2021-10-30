import { onExitHandlers } from "../close.js";
import { logLine } from "../shared/log.js";
import { periodic } from "../shared/periodic.js";
import type { Lobby } from "./fetchLobbies.js";
import fetchLobbies from "./fetchLobbies.js";
import { promiseTimeout } from "./util.js";
import {
	newLobbies as v3NewLobbies,
	onExit as v3OnExit,
} from "./versions/v3.js";

const TEN_SECONDS = 10 * 1000;

const newLobbiesHandlers = [v3NewLobbies];

periodic("liveLobbies", TEN_SECONDS, async () => {
	let newLobbies: Lobby[] = [];

	try {
		newLobbies = await promiseTimeout(fetchLobbies());
	} catch (err) {
		console.error(new Date(), err);
		return;
	}

	logLine("live-lobbies", "l", newLobbies.length);

	for (const newLobbiesHandler of newLobbiesHandlers)
		try {
			await newLobbiesHandler(newLobbies.map((l) => ({ ...l })));
		} catch (err) {
			console.error(new Date(), err);
		}
});

onExitHandlers.push(v3OnExit);

logLine("live-lobbies", "ready!", process.env.NODE_ENV);
