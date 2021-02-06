import { Lobby } from "../liveLobbies/fetchLobbies.js";
import { Rule } from "./parser.js";

export const process = (rule: Rule, lobby: Lobby): boolean => {
	switch (rule.type) {
		case "term": {
			const value = lobby[rule.key];
			return value
				? typeof rule.value === "string"
					? value.includes(rule.value)
					: !!value.match(rule.value)
				: false;
		}
		case "or":
			return rule.rules.some((rule) => process(rule, lobby));
		case "and":
			return rule.rules.every((rule) => process(rule, lobby));
		case "option":
			throw new Error("term in rule AST");
	}
};

export const ruleToFilter = (rule: Rule): ((lobby: Lobby) => boolean) => (
	lobby: Lobby,
): boolean => process(rule, lobby);
