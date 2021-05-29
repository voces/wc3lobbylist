import { Message } from "discord.js";

import { jsStringify } from "../shared/jsStringify.js";
import { query } from "../shared/sql.js";

export const sql = async (message: Message, args: string[]): Promise<void> => {
	const result = await query(args.join(" ")).catch((err) => err);

	message.reply("```js\n" + jsStringify(result).slice(0, 1900) + "\n```");
};
