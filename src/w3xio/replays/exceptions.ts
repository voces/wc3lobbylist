import { github } from "../../shared/fetch.js";
import { Replay } from "../../shared/fetchTypes.js";
import { logLine } from "../../shared/log.js";
import { query } from "../../shared/sql.js";
import {
	getRepoAndVersionInfo,
	Metadata,
	onNewReplay,
	toEvent,
	trim,
} from "./common.js";
import { CleanEvent } from "./types.js";

const newException = async ({
	event,
	replay,
	metadata: { repo, versionId, token, version },
}: {
	event: CleanEvent;
	replay: Replay;
	metadata: Metadata;
}): Promise<void> => {
	const replayId = replay.id;
	const replayUploadedAt = new Date(replay.playedOn * 1000);
	if (!event.message) {
		event.message = event.message || event.key;
		event.key = "none";
	}
	const { key, message: eventMessage } = event;
	const [filename, line, ...rest] = eventMessage.split(":");
	const message = rest.join(":").slice(1);

	// get the issue
	const { id: issueId, githubIssueId } = (
		await query<[unknown, { id: number; githubIssueId: number }[]]>(
			`
				INSERT IGNORE INTO issues (\`key\`, filename, line, message, versionId) VALUES (:key, :filename, :line, :message, :version);
				SELECT id, githubIssueId FROM issues WHERE \`key\` = :key AND filename = :filename AND line = :line AND versionId = :version;
			`,
			{ key, filename, line, message, version: versionId },
		)
	)[1][0];

	// add an exception
	await query(
		`
			INSERT INTO exceptions (issueId, replayId, replayUploadedAt, eventTime) VALUES (:issue, :replay, :time, :eventTime);
		`,
		{
			issue: issueId,
			replay: replayId,
			time: replayUploadedAt,
			eventTime: event.time,
		},
	);

	if (!githubIssueId) {
		const {
			number: newGithubIssueId,
			url,
		} = await github.repos.issues.post({
			repo,
			token,
			body: {
				title: `Exception: ${eventMessage}`,
				body: trim(`
					An exception was detected in a replay.

					- Replay: https://wc3stats.com/games/${replayId}
					- Key: \`${key}\`
					- Line: \`${line}\`
					- Error message: \`${message}\`
					- Internal tracker id: \`${issueId}\`
				`),
				labels: ["bug", version],
			},
		});

		await query(
			`
				UPDATE issues SET githubIssueId = :githubIssueId WHERE id = :id;
			`,
			{ id: issueId, githubIssueId: newGithubIssueId },
		);

		logLine("fixus", "new issue:", newGithubIssueId, url);
	} else logLine("fixus", "new exception:", githubIssueId);
};

onNewReplay(
	async (replay: Replay): Promise<void> => {
		logLine("fixus", "processing", replay.id);

		const events = replay.data.game.events.map(toEvent);
		let metadata: Metadata | undefined;

		try {
			for (const event of events) {
				if (event.name !== "log") continue;

				if (!metadata) metadata = await getRepoAndVersionInfo(replay);

				try {
					await newException({ event, replay, metadata });
				} catch (err) {
					console.error(new Date(), err);
				}
			}
		} catch (err) {
			console.error(new Date(), err);
		}
	},
);
