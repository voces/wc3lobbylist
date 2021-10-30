import type { Message } from "discord.js";

import { formatTable } from "../shared/formatTable.js";
import { jsStringify } from "../shared/jsStringify.js";
import { query } from "../shared/sql.js";

export const sql = async (message: Message, args: string[]): Promise<void> => {
	const result = await query<Record<string, string | number | Date>[]>(
		args.join(" "),
	).catch((err) => jsStringify(err));

	const data =
		typeof result === "object"
			? formatTable([
					Object.keys(result[0]),
					...result.map((r) =>
						Object.values(r).map((v) => {
							if (v === null) return "(null)";
							if (typeof v === "object" && v instanceof Date)
								return v.toISOString();
							if (typeof v === "number") return v;
							return v.toString();
						}),
					),
			  ])
			: result;

	message.reply("```js\n" + data.slice(0, 1900) + "\n```");
};
