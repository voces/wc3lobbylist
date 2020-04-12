
import fetch from "node-fetch";
import { ReplaySummary, Replay, Wc3StatsLobby } from "./fetchTypes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isStringified = ( body: any ): boolean => {

	if ( typeof body !== "string" ) return false;
	try {

		JSON.parse( body );
		return true;

	} catch ( err ) {

		return false;

	}

};

export const wc3stats = {
	replays: {
		list: ( { page }: {page: number} ): ( Promise<{body: [ReplaySummary] | []}> ) =>
			fetch( `https://api.wc3stats.com/replays&map=Ultimate%20Sheep%20Tag%20Fixus&page=${page}&limit=1&sort=playedOn&order=asc` )
				.then( r => r.json() ),
		get: ( replay: number ): Promise<Replay> =>
			fetch( `https://api.wc3stats.com/replays/${replay}` )
				.then( r => r.json() )
				.then( r => r.body ),
	},
	gamelist: (): Promise<Array<Wc3StatsLobby>> => fetch( "https://api.wc3stats.com/gamelist" )
		.then( r => r.json() )
		.then( r => typeof r.body === "string" ? [] : r.body ),
};

export const github = {
	repos: {
		issues: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			post: ( { repo, token, body }: {repo: string; token: string; body: any} ): any => {

				body = isStringified( body ) ? body : JSON.stringify( body );

				return fetch( `https://api.github.com/repos/${repo}/issues`, {
					method: "POST",
					headers: { Authorization: `token ${token}` },
					body,
				} ).then( r => r.json() );

			},
		},
	},
};

