import type {
	APIMessage,
	MessageAdditions,
	MessageOptions,
	StringResolvable,
} from "discord.js";
import Discord from "discord.js";

import { isChannelGuildChannel, isTextChannel } from "./liveLobbies/util.js";
import { logLine } from "./shared/log.js";

if (!process.env.DISCORD_TOKEN) {
	console.error(new Error("Environmental variable DISCORD_TOKEN not set"));
	process.exit(1);
}

// load Discord
const client = new Discord.Client();
client.login(process.env.DISCORD_TOKEN);

class Deferred<T> extends Promise<T> {
	resolve?: (value?: T) => void;
}

// a simple promise to make sure discord is ready
const ready: Deferred<void> = new Promise((resolve) =>
	setTimeout(() => (ready.resolve = resolve)),
);
client.on("ready", async () => {
	logLine("discord", "discord ready");

	ready.resolve && ready.resolve();
});
client.on("error", (err) => {
	logLine("discord", err);
});
client.on("warn", (msg) => {
	logLine("discord", msg);
});
client.on("rateLimit", (data) => {
	logLine("discord", "[ratelimited]", data);
});

type SendProps =
	| [StringResolvable | APIMessage]
	| [StringResolvable | APIMessage, MessageOptions | MessageAdditions];

export class ChannelError extends Error {
	channel: string;

	constructor(channel: string) {
		super(`Trying to send to invalid channel: ${channel}`);
		this.channel = channel;
	}
}

// method for sending messages
const send = async (
	channelId: string,
	...args: SendProps
): Promise<Discord.Message | Discord.Message[]> => {
	await ready;
	const channel = await client.channels.fetch(channelId).catch((err) => err);
	if (
		channel instanceof Error ||
		!channel ||
		!isChannelGuildChannel(channel) ||
		!isTextChannel(channel)
	)
		throw new ChannelError(channelId);

	const arg1: StringResolvable | APIMessage = args[0];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return channel.send(arg1, ...(args.slice(1) as [any]));
};

export default Object.assign(client, { send });

export const messageAdmin = async (message: string) => {
	const verit = await client.users.fetch("287706612456751104");
	await verit.send(message);
};
