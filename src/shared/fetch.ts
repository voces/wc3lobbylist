import fetch from "node-fetch";

import { List, Replay, ReplaySummary, Wc3StatsLobby } from "./fetchTypes";

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
		): Promise<List<ReplaySummary>> =>
			fetch(
				`https://api.wc3stats.com/replays&${Object.entries({
					limit: 1,
					order: "asc",
					sort: "playedOn",
					...qs,
				})
					.filter(([, value]) => value !== undefined)
					.map(
						([key, value]) =>
							`${encodeURIComponent(key)}=${encodeURIComponent(
								value,
							)}`,
					)
					.join("&")}`,
			)
				.then((r) => r.json())
				.then((r) => (typeof r.body === "string" ? { body: [] } : r)),
		get: (replay: number): Promise<Replay> =>
			fetch(`https://api.wc3stats.com/replays/${replay}`)
				.then((r) => r.json())
				.then((r) => r.body),
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
