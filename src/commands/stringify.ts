// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export const stringifyReplacer = (_: any, value: any): any =>
	typeof value === "object" && value instanceof RegExp
		? { type: "regexp", pattern: value.source, flags: value.flags }
		: value;
