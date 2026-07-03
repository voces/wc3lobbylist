module.exports = {
	root: true,
	env: { node: true, es2022: true },
	parser: "@typescript-eslint/parser",
	parserOptions: { ecmaVersion: 2022, sourceType: "module" },
	plugins: ["@typescript-eslint", "simple-import-sort"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:prettier/recommended",
	],
	rules: {
		"@typescript-eslint/consistent-type-imports": [
			"error",
			{ prefer: "type-imports" },
		],
		"@typescript-eslint/no-unused-vars": [
			"error",
			{ argsIgnorePattern: "^_", ignoreRestSiblings: true },
		],
		"no-var": "error",
		"prefer-const": "error",
		"simple-import-sort/imports": "error",
		"simple-import-sort/exports": "error",
		eqeqeq: "error",
	},
};
