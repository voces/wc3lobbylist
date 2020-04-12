
export type Player = {
	colour: number;
	name: string;
}

export type ReplayPartial = {
	name: string;
	map: string;
	flags: number;
	length: number;
	playedOn: number;
	processed: boolean;
	isVoid: boolean;
	id: number;
}

export type ReplaySummary = ReplayPartial & {
	players: Player[];
}

export type Key = {
	name: string;
	key: {
		map: string;
		ladder: string;
		season: string;
		round: string;
		mode: string;
	};
}

export type Upload = {
	saver: string;
	file: string;
	size: number;
	timestamp: number;
}

export type ReplayHeader = {
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

export type ReplayPlayer = {
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

export type ReplayEventData = {
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
}

export type ReplayGame = {
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

export type ReplayChat = {
	playerId: number;
	length: number;
	flags: number;
	mode: number;
	message: string;
	time: number;
}

export type ReplayData = {
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

export type Wc3StatsLobby = {
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
