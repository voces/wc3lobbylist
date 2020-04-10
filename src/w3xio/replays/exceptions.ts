
import { Event, Replay } from "./types.js";
import { query } from "../../shared/sql.js";
import { VARIANT_REPO_MAP } from "./common.js";

const trim = ( str: string ): string => {

	const lines = str.split( "\n" );
	const start = lines.findIndex( line => ! line.match( /^\s*$/ ) );
	let end = lines.length;
	while ( lines[ end - 1 ].match( /^\s*$/ ) ) end --;

	const body = lines.slice( start, end );

	const min = body.reduce( ( min, line ) => {

		const match = line.match( /^\s+/ );
		return match && match[ 0 ].length < min ? match[ 0 ].length : min;

	}, Infinity );

	const trimmed = min === Infinity ? body : body.map( line => line.slice( min ) );

	return trimmed.join( "\n" );

};

const newException = async ( {
	version,
	repo,
	event,
	replay,
}: {
	version: string;
	repo: string;
	event: Event;
	replay: Replay;
} ): Promise<void> => {

	const replayId = replay.id;
	const replayUploadedAt = new Date( replay.playedOn * 1000 );
	if ( ! event.message ) {

		event.message = event.message || event.key;
		event.key = "none";

	}
	const { key, message: eventMessage } = event;
	const [ filename, line, ...rest ] = eventMessage.split( ":" );
	const message = rest.join( ":" ).slice( 1 );

	// get the repo id
	const row: {id: number; tokenId: number} = ( await query( "SELECT id, tokenId FROM repos WHERE path = :repo;", { repo } ) )[ 0 ];
	if ( ! row ) return console.error( "unknown repo", repo );
	const { id: repoId, tokenId } = row;

	// get the version id
	const versionId = ( await query( `
		INSERT IGNORE INTO versions (\`version\`, repo) VALUES (:version, :repo);
		SELECT * FROM versions WHERE \`version\` = :version AND repo = :repo;
	`, { version, repo: repoId } ) )[ 1 ][ 0 ].id;

	// get the issue
	const { id: issueId, githubIssueId } = ( await query( `
		INSERT IGNORE INTO issues (\`key\`, filename, line, message, versionId) VALUES (:key, :filename, :line, :message, :version);
		SELECT * FROM issues WHERE \`key\` = :key AND filename = :filename AND line = :line AND versionId = :version;
	`, { key, filename, line, message, version: versionId } ) )[ 1 ][ 0 ];

	// add an exception
	await query( `
		INSERT INTO exceptions (issueId, replayId, replayUploadedAt, eventTime) VALUES (:issue, :replay, :time, :eventTime);
	`, { issue: issueId, replay: replayId, time: replayUploadedAt, eventTime: event.time } );

	if ( ! githubIssueId ) {

		const { token } = ( await query( "SELECT token FROM tokens WHERE id = :id;", { id: tokenId } ) )[ 0 ];

		const { number: newGithubIssueId } = await fetch( `https://api.github.com/repos/${repo}/issues`, {
			method: "POST",
			headers: {
				Authorization: `token ${token}`,
			},
			body: JSON.stringify( {
				title: `Exception: ${eventMessage}`,
				body: trim( `
					An exception was detected in a replay.

					- Replay: https://wc3stats.com/games/${replayId}
					- Key: \`${key}\`
					- Line: \`${line}\`
					- Error message: \`${message}\`
					- Internal tracker id: \`${issueId}\`
				` ),
				labels: [ "bug", version ],
			} ),
		} ).then( r => r.json() );

		await query( `
			UPDATE issues SET githubIssueId = :githubIssueId WHERE id = :id;
		`, { id: issueId, githubIssueId: newGithubIssueId } );

		console.log( new Date(), "new issue:", newGithubIssueId );

	} else
		console.log( new Date(), "new exception:", githubIssueId );

};

export const check = async ( replay: Replay, events: Event[] ): Promise<void> => {

	for ( const event of events ) {

		if ( event.name !== "log" ) continue;

		const version = event.version || replay.data.game.map;
		const repo = event.repo || VARIANT_REPO_MAP[ replay.variant ];
		if ( ! repo ) {

			console.log( "Unknown repo for event", { replay: replay.id } );
			return;

		}

		try {

			await newException( { version, repo, event, replay } );

		} catch ( err ) {

			console.error( new Date(), err );

		}

	}

};
