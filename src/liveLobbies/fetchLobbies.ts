import { Message } from "discord.js";

import { wc3stats } from "../shared/fetch.js";

export type Lobby = {
	checksum: string | number | undefined;
	host: string;
	id: string | number | undefined;
	map: string | undefined;
	server: "us" | "eu" | undefined;
	slots: { occupied: number | undefined; max: number | undefined };
	name: string | undefined;
	messages: Message[];
	wc3maps?: number;
	created: number | undefined;
};

const cleanServer = (server: string | undefined): "us" | "eu" | undefined => {
	if (!server) return;

	const cleaned = server.replace("usw", "us");
	if (cleaned === "us" || cleaned === "eu") return cleaned;
};

export default (): Promise<Array<Lobby>> =>
	wc3stats.gamelist().then((games) =>
		games.map(
			({
				checksum,
				host,
				id,
				map,
				name,
				server,
				slotsTaken,
				slotsTotal,
				created,
			}) => ({
				checksum,
				host: host || "Unknown",
				id,
				map: map ? map.slice(0, -4) : undefined,
				name,
				server: cleanServer(server),
				slots: { occupied: slotsTaken, max: slotsTotal },
				messages: [],
				created,
			}),
		),
	);
