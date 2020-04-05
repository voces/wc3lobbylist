
import fetch from "node-fetch";
import { periodic } from "../shared/periodic.js";
import { query } from "../shared/sql.js";

const ONE_MINUTE = 60 * 1000;

const fetchConfig = async (): Promise<{key: string; value: string}[]> =>
	( await query( "SELECT * from config;" ) ) as{key: string; value: string}[];

const updatePage = async ( page: number ): Promise<void> => {

	try {

		await query( "UPDATE config SET value = :page WHERE `key` = 'page';", { page } );

	} catch ( err ) { console.error( err ) }

};

const VARIANT_REPO_MAP = {
	"Ultimate Sheep Tag Fixus": "voces/fixus",
};

type Player = {
	colour: number;
	name: string;
}

type ReplayPartial = {
	name: string;
	map: string;
	flags: number;
	length: number;
	playedOn: number;
	processed: boolean;
	isVoid: boolean;
	id: number;
}

type ReplaySummary = ReplayPartial & {
	players: Player[];
}

type Key = {
	name: string;
	key: {
		map: string;
		ladder: string;
		season: string;
		round: string;
		mode: string;
	};
}

type Upload = {
	saver: string;
	file: string;
	size: number;
	timestamp: number;
}

type ReplayHeader = {
	intro: string;
	headerSize: number;
	compressedSize: number;
	headerVersion: number;
	uncompressedSize: number;
	numBlocks: number;
	identification: "PX3W" | string;
	majorVersion: number;
	buildVersion: number;
	flags: number;
	length: number;
	checksum: number;
}

type ReplayPlayer = {
	type: number;
	id: number;
	name: string;
	partial: string;
	race: number;
	isHost: true;
	isWinner: boolean;
	isObserver: boolean;
	slot: number;
	order: number;
	colour: number;
	handicap: number;
	leftAt: number;
	stayPercent: number;
	team: number;
	apm: number;
	activity: number[];
	flags: string[];
	variables: any;
}

type ReplayEventData = {
	id: number;
	intro: string;
	header: string;
	message: string;
	type: string;
	eventName: string;
}

type ReplayEvent = ReplayEventData & {
	event: ReplayEventData & {
		numParams: string;
		params: string[];
		format: boolean;
	};
	time: number;
	args: string[];
}

type ReplayGame = {
	name: string;
	speed: number;
	visibility: number;
	observers: number;
	teamsTogether: boolean;
	lockedTeams: boolean;
	fullShare: boolean;
	randomHero: boolean;
	randomRaces: boolean;
	checksum: number;
	map: string;
	host: string;
	numSlots: number;
	type: number;
	isLocal: any;
	private: number;
	recordId: number;
	recordLength: number;
	slotRecords: number;
	players: ReplayPlayer[];
	randomSeed: number;
	selectMode: number;
	startSpots: number;
	events: ReplayEvent[];
	saver: number;
	hasW3MMD: boolean;
}

type ReplayChat = {
	playerId: number;
	length: number;
	flags: number;
	mode: number;
	message: string;
	time: number;
}

type ReplayData = {
	header: ReplayHeader;
	game: ReplayGame;
	chatlog: ReplayChat[];
}

type Replay = ReplayPartial & {
	hash: string;
	variant: string;
	file: string;
	size: number;
	ladder: string;
	season: string;
	keys: Key[];
	uploads: Upload[];
	data: ReplayData;
	downloads: number;
	overrideable: boolean;
};

const fetchPage = ( page: number ): Promise<{body: [ReplaySummary] | []}> =>
	fetch( `https://api.wc3stats.com/replays&map=Ultimate%20Sheep%20Tag%20Fixus&page=${page}&limit=1&sort=playedOn&order=asc` )
		.then( r => r.json() );

const fetchReplay = ( replay: number ): Promise<Replay> =>
	fetch( `https://api.wc3stats.com/replays/${replay}` )
		.then( r => r.json() )
		.then( r => r.body );

type Event = {[key: string]: string} & {
	id: number;
	name: string;
	time: number;
}

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

const toEvent = ( replayEvent: ReplayEvent ): Event => {

	const event = {
		name: replayEvent.eventName,
		id: replayEvent.id,
		time: replayEvent.time,
	} as Event;

	for ( let i = 0; i < replayEvent.event.params.length; i ++ )
		event[ replayEvent.event.params[ i ] ] = typeof replayEvent.args[ i ] === "string" ?
			replayEvent.args[ i ]
				// w3mmd uses "\ " for spaces in values instead of just " "
				.replace( /\\ /g, " " )
				// we use to color strings, which looks like `|cff012345"abc"|r`
				.replace( /\|cff[0-9a-fA-F]{6}"/g, "" )
				.replace( /"\|r/g, "" ) :
			"";

	return event;

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

const newReplay = async ( replayPartial: ReplaySummary ): Promise<void> => {

	const replay = await fetchReplay( replayPartial.id );
	const events = replay.data.game.events.map( toEvent );

	for ( const event of events ) {

		if ( event.name !== "log" ) continue;

		const version = event.version || replay.data.game.map;
		const repo = event.repo || VARIANT_REPO_MAP[ replay.variant ];
		if ( ! repo ) {

			console.log( "Unknown repo for event", { replay: replayPartial.id } );
			return;

		}

		try {

			await newException( { version, repo, event, replay } );

		} catch ( err ) {

			console.error( new Date(), err );

		}

		process.exit( 1 );

	}

};

( async (): Promise<void> => {

	const config: Record<string, string> = {};
	const rawConfig = await fetchConfig();
	for ( const { key, value } of rawConfig )
		config[ key ] = value;

	let pageNumber = parseInt( config.page );

	periodic( "wc3stats replays", ONE_MINUTE, async () => {

		let looping = true;
		while ( looping ) {

			looping = false;

			const page = await fetchPage( pageNumber );
			const replay = page.body[ 0 ];
			if ( replay && replay.processed ) {

				if ( ! replay.isVoid ) {

					console.log( new Date(), "new replay", replay.id );
					try {

						await newReplay( replay );

					} catch ( err ) {

						console.error( new Date(), err );

					}

					looping = true;

				} else
					console.log( new Date(), "skipping voided replay", replay.id );

				await updatePage( ++ pageNumber );

			}

		}

	} );

} )();
