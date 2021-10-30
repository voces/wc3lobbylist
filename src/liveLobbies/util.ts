import type { Channel, GuildChannel, TextChannel } from "discord.js";

// taken from https://italonascimento.github.io/applying-a-timeout-to-your-promises/
export const promiseTimeout = <T>(promise: Promise<T>): Promise<T> => {
	const ms = 10_000;
	// Create a promise that rejects in <ms> milliseconds
	const timeout = new Promise<T>((_, reject) => {
		const id = setTimeout(() => {
			clearTimeout(id);
			reject(new Error("Timed out in " + ms + "ms."));
		}, ms);
	});

	// Returns a race between our timeout and the passed in promise
	return Promise.race([promise, timeout]);
};

export const isChannelGuildChannel = (
	channel: Channel,
): channel is GuildChannel => (channel as GuildChannel).guild !== undefined;

export const isTextChannel = (channel: Channel): channel is TextChannel =>
	(channel as TextChannel).send !== undefined;
