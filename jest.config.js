export default {
	moduleFileExtensions: ["ts", "js"],
	transformIgnorePatterns: [],
	transform: {
		"^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }],
	},
	testRegex: "(/src/.*\\.test)\\.[tj]s$",
	testEnvironment: "node",
};
