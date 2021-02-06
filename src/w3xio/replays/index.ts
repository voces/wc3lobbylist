import "./exceptions.js";
import "./todo.js";
import "./fixusBias.js";

import { wc3stats } from "../../shared/fetch.js";
import { periodic } from "../../shared/periodic.js";
import { query } from "../../shared/sql.js";
import { executeCallbacks } from "./common.js";

const ONE_MINUTE = 60 * 1000;

const fetchConfig = async (): Promise<{ key: string; value: string }[]> =>
	(await query("SELECT * from config;")) as { key: string; value: string }[];

const updatePage = async (page: number): Promise<void> => {
	try {
		await query("UPDATE config SET value = :page WHERE `key` = 'page';", {
			page,
		});
	} catch (err) {
		console.error(new Date(), err);
	}
};

(async (): Promise<void> => {
	try {
		const config: Record<string, string> = {};

		const rawConfig = await fetchConfig();
		for (const { key, value } of rawConfig) config[key] = value;

		let pageNumber = parseInt(config.page);

		periodic("wc3stats replays", ONE_MINUTE, async () => {
			let looping = true;
			while (looping) {
				looping = false;

				const page = await wc3stats.replays.list({ page: pageNumber });
				const replay = page.body[0];
				if (replay && replay.processed) {
					if (!replay.isVoid) {
						console.log(new Date(), "new replay", replay.id);
						try {
							executeCallbacks(
								await wc3stats.replays.get(replay.id),
							);
						} catch (err) {
							console.error(new Date(), err);
						}

						looping = true;
					} else
						console.log(
							new Date(),
							"skipping voided replay",
							replay.id,
						);

					await updatePage(++pageNumber);
				}
			}
		});
	} catch (err) {
		console.log(new Date(), err);
	}
})();
