import fetch from "node-fetch";

import type { List, Replay, ReplaySummary, Wc3StatsLobby } from "./fetchTypes";
import { logLine } from "./log.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isStringified = (body: any): boolean => {
	if (typeof body !== "string") return false;
	try {
		JSON.parse(body);
		return true;
	} catch (err) {
		return false;
	}
};

export const wc3stats = {
	replays: {
		list: (
			qs: Record<string, string | number>,
		): Promise<List<ReplaySummary>> => {
			const url = `https://api.wc3stats.com/replays&${Object.entries({
				limit: 1,
				chat: 0,
				...qs,
			})
				.filter(([, value]) => value !== undefined)
				.map(
					([key, value]) =>
						`${encodeURIComponent(key)}=${encodeURIComponent(
							value,
						)}`,
				)
				.join("&")}`;
			logLine("revo", url);
			return fetch(url)
				.then((r) => r.json())
				.then((r) => (typeof r.body === "string" ? { body: [] } : r));
		},
		get: (replay: number): Promise<Replay> =>
			fetch(`https://api.wc3stats.com/replays/${replay}`)
				.then((r) => r.json())
				.then(({ body }: { body: Replay }) => {
					body.data.game.events = body.data.game.events.map((e) => ({
						...e,
						args: e.args.map((v) => v.replace(/\\ /g, " ")),
					}));
					return body;
				}),
	},
	gamelist: (): Promise<Array<Wc3StatsLobby>> =>
		fetch("https://api.wc3stats.com/gamelist")
			.then((r) => r.json())
			.then((r) => (typeof r.body === "string" ? [] : r.body)),
};

export const github = {
	repos: {
		issues: {
			post: ({
				repo,
				token,
				body,
			}: {
				repo: string;
				token: string;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				body: any;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			}): any => {
				body = isStringified(body) ? body : JSON.stringify(body);

				return fetch(`https://api.github.com/repos/${repo}/issues`, {
					method: "POST",
					headers: { Authorization: `token ${token}` },
					body,
				}).then((r) => r.json());
			},
		},
	},
};
