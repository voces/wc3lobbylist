import type { Replay, ReplayEvent } from "../../shared/fetchTypes.js";
import { logLine } from "../../shared/log.js";
import { query } from "../../shared/sql.js";
import type { CleanEvent } from "./types.js";

export const VARIANT_REPO_MAP: Record<string, string> = {
	"Ultimate Sheep Tag Fixus": "voces/fixus",
};

export const toEvent = (replayEvent: ReplayEvent): CleanEvent => {
	const event = {
		name: replayEvent.eventName,
		id: replayEvent.id,
		time: replayEvent.time,
	} as CleanEvent;

	for (let i = 0; i < replayEvent.event.params.length; i++)
		event[replayEvent.event.params[i]] =
			typeof replayEvent.args[i] === "string"
				? replayEvent.args[i]
						// we use to color strings, which looks like `|cff012345"abc"|r`
						.replace(/\|cff[0-9a-fA-F]{6}"/g, "")
						.replace(/"\|r/g, "")
				: "";

	return event;
};

const onNewReplayCallbacks: ((replay: Replay) => void)[] = [];
export const onNewReplay = (fn: (replay: Replay) => void): void => {
	onNewReplayCallbacks.push(fn);
};
export const executeCallbacks = (replay: Replay): void => {
	logLine(
		"fixus",
		"executeCallbacks",
		replay.id,
		onNewReplayCallbacks.length,
	);
	onNewReplayCallbacks.forEach((fn) => fn(replay));
};

export type Metadata = {
	repo: string;
	repoId: number;
	version: string;
	versionId: number;
	token: string;
};

export const getRepoAndVersionInfo = async (
	replay: Replay,
): Promise<Metadata> => {
	const repo = VARIANT_REPO_MAP[replay.variant];
	if (!repo) throw new Error("Unknown repo for event");

	const version = replay.data.game.map;

	// get the repo id
	const row = (
		await query<{ id: number; token: string }[]>(
			`
		SELECT repos.id, token
		FROM repos
		LEFT JOIN tokens ON tokenId = tokens.id
		WHERE path = :repo;
	`,
			{ repo },
		)
	)[0];
	if (!row) throw new Error("Unknown repo");
	const { id: repoId, token } = row;

	// get the version id
	const versionId = (
		await query<[unknown, { id: number }[]]>(
			`
		INSERT IGNORE INTO versions (\`version\`, repo) VALUES (:version, :repo);
		SELECT id, repo FROM versions WHERE \`version\` = :version AND repo = :repo;
	`,
			{ version, repo: repoId },
		)
	)[1][0].id;

	return {
		repo,
		repoId,
		version,
		versionId,
		token,
	};
};

export const trim = (str: string): string => {
	const lines = str.split("\n");
	const start = lines.findIndex((line) => !line.match(/^\s*$/));
	let end = lines.length;
	while (lines[end - 1].match(/^\s*$/)) end--;

	const body = lines.slice(start, end);

	const min = body.reduce((min, line) => {
		const match = line.match(/^\s+/);
		return match && match[0].length < min ? match[0].length : min;
	}, Infinity);

	const trimmed =
		min === Infinity ? body : body.map((line) => line.slice(min));

	return trimmed.join("\n");
};
