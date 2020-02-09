
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stringifyReplacer = ( _, value: any ): any =>
	typeof value === "object" && value instanceof RegExp ?
		{ type: "regexp", pattern: value.source, flags: value.flags } :
		value;
