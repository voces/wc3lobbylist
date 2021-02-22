import { github } from "../../shared/fetch.js";
import { Replay } from "../../shared/fetchTypes";
import { logLine } from "../../shared/log.js";
import {
	getRepoAndVersionInfo,
	Metadata,
	onNewReplay,
	trim,
} from "./common.js";

const triggers = "-todo -log -report".split(" ");

const newTodo = async ({
	replay,
	message,
	player,
	metadata: { repo, token, version },
}: {
	replay: number;
	message: string;
	player: string;
	metadata: Metadata;
}): Promise<void> => {
	const response = await github.repos.issues.post({
		repo,
		token,
		body: {
			title: message[0].toUpperCase() + message.slice(1),
			body: trim(`
				A todo was detected in a replay.

				- Replay: https://wc3stats.com/games/${replay}
				- Player: \`${player}\`
				- Message: \`${message}\`
			`),
			labels: [version],
		},
	});

	logLine("fixus", "new todo", `${player}: ${message}`, response?.url);
};

onNewReplay(
	async (replay: Replay): Promise<void> => {
		const chatlog = replay.data.chatlog;
		const players = replay.data.game.players;
		const memory: Record<string, string[]> = {};

		let metadata: Metadata | undefined;

		try {
			for (const { playerId, message } of chatlog)
				if (message.startsWith("-")) {
					const [command, ...parts] = message.split(" ");
					if (!triggers.includes(command)) return;

					const body = parts.join(" ");
					const player =
						players.find((p) => p.id === playerId)?.name || "";

					if (!memory[player]) memory[player] = [];
					if (
						memory[player].includes(body) ||
						memory[player].length > 2
					)
						return;
					memory[player].push(body);

					if (!metadata)
						metadata = await getRepoAndVersionInfo(replay);

					try {
						await newTodo({
							replay: replay.id,
							message: body,
							player,
							metadata,
						});
					} catch (err) {
						console.error(new Date(), err);
					}
				}
		} catch (err) {
			console.error(new Date(), err);
		}
	},
);
