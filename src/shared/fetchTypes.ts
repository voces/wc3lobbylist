export interface List<T> {
	body: T[];
	code: number;
	pagination: {
		before: number;
		current: number;
		first: number;
		last: number;
		next: number;
		perPage: number;
		totalItems: number;
		totalPages: number;
	};
	queryTime: number;
	status: string;
}

export interface Player {
	colour: number;
	name: string;
}

export interface ReplayPartial {
	flags: number;
	id: number;
	isVoid: boolean;
	length: number;
	map: string;
	name: string;
	playedOn: number;
	processed: boolean;
	variant?: string;
}

export type ReplaySummary = ReplayPartial & {
	players: Player[];
	[propName: string]: unknown;
};

export interface Key {
	name: string;
	key: {
		map: string;
		ladder: string;
		season: string;
		round: string;
		mode: string;
	};
}

export interface Upload {
	saver: string;
	file: string;
	size: number;
	timestamp: number;
}

export interface ReplayHeader {
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

export interface ReplayPlayer {
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
	variables: Record<string, string | number | null> | null;
}

export interface ReplayEventData {
	id: number;
	intro: string;
	header: string;
	message: string;
	type: string;
	eventName: string;
}

export type ReplayEvent = ReplayEventData & {
	event: ReplayEventData & {
		numParams: string;
		params: string[];
		format: boolean;
	};
	time: number;
	args: string[];
};

export interface ReplayGame {
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface ReplayChat {
	playerId: number;
	length: number;
	flags: number;
	mode: number;
	message: string;
	time: number;
}

export interface ReplayData {
	header: ReplayHeader;
	game: ReplayGame;
	chatlog: ReplayChat[];
}

export type Replay = ReplayPartial & {
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

export interface Wc3StatsLobby {
	checksum: undefined | string | number;
	host: undefined | string;
	id: undefined | string | number;
	map: undefined | string;
	name: undefined | string;
	server: "us" | "eu" | string;
	slotsTaken: undefined | number;
	slotsTotal: undefined | number;
	created: undefined | number;
}
