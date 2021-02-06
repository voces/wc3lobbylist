module.exports = {
	extends: ["verit"],
	parserOptions: { project: "tsconfig.json" },
	settings: { react: { version: "17" } },
	rules: {
		"no-console": "off",
	},
};
