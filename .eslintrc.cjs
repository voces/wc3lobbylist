module.exports = {
	extends: ["verit"],
	parserOptions: { project: "tsconfig.json" },
	settings: { react: { version: "17" } },
	rules: {
		"@typescript-eslint/no-unused-vars": [
			"error",
			{ argsIgnorePattern: "^_" },
		],
	},
};
