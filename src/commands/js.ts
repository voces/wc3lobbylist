import type { Message } from "discord.js";

import { jsStringify } from "../shared/jsStringify.js";
import { isError } from "../typeguards.js";

export const js = async (message: Message, args: string[]): Promise<void> => {
	let result;
	try {
		result = eval(args.join(" "));
	} catch (err) {
		if (isError(err)) result = { message: err.message };
	}

	message.reply("```js\n" + jsStringify(result).slice(0, 1900) + "\n```");
};
