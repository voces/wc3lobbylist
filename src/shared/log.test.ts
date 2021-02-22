import { info } from "./log";

describe("info", () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const setAllLeafsToTrue = (obj: any) => {
		for (const prop in obj)
			if (typeof obj[prop] === "object" && obj[prop] !== null)
				setAllLeafsToTrue(obj[prop]);
			else obj[prop] = true;
		return obj;
	};

	it("works", () => {
		expect(
			setAllLeafsToTrue(
				info({
					keep: { keep: true },
					drop: {},
					keepButDropProps: { keep: true, drop: undefined },
				}),
			),
		).toEqual({ keep: { keep: true }, keepButDropProps: { keep: true } });
	});
});
