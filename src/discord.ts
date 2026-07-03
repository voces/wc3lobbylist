import { Client, GatewayIntentBits, Partials } from "discord.js";

import { logLine } from "./shared/log.js";

if (!process.env.DISCORD_TOKEN) {
	console.error(new Error("Environmental variable DISCORD_TOKEN not set"));
	process.exit(1);
}

const client = new Client({
	// We deliberately omit GuildMessages so the bot does not see message
	// create/update/delete events from server channels — only DMs.
	intents: [GatewayIntentBits.DirectMessages],
	// DM channels arrive uncached at startup; without these the bot would
	// silently drop the first messages of any DM it didn't initiate.
	partials: [Partials.Channel, Partials.Message],
});

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
	logLine("discord", "discord ready");
});
client.on("error", err => {
	logLine("discord", err);
});
client.on("warn", msg => {
	logLine("discord", msg);
});
client.rest.on("rateLimited", data => {
	logLine("discord", "[ratelimited]", data);
});

export default client;

export const messageAdmin = async (message: string): Promise<void> => {
	const verit = await client.users.fetch("287706612456751104");
	await verit.send(message);
};
