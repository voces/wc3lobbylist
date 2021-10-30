export const isError = (value: unknown): value is Error =>
	!!value && typeof value === "object" && value instanceof Error;

export const isRecord = (v: unknown): v is Record<string, unknown> =>
	!!v && typeof v === "object";

export const hasNumber = <T extends Record<string, unknown>, K extends string>(
	v: T,
	k: K,
): v is T & { [k in K]: number } => k in v && typeof v[k] === "number";

export const hasString = <T extends Record<string, unknown>, K extends string>(
	v: T,
	k: K,
): v is T & { [k in K]: string } => k in v && typeof v[k] === "string";
