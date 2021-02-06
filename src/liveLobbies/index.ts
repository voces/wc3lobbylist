import "../commands/index.js";

import { onExitHandlers } from "../close.js";
import { periodic } from "../shared/periodic.js";
import fetchLobbies, { Lobby } from "./fetchLobbies.js";
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

	console.log(new Date(), "l", newLobbies.length);

	for (const newLobbiesHandler of newLobbiesHandlers)
		try {
			await newLobbiesHandler(newLobbies.map((l) => ({ ...l })));
		} catch (err) {
			console.error(new Date(), err);
		}
});

onExitHandlers.push(v3OnExit);

console.log(new Date(), "ready!", process.env.NODE_ENV);
