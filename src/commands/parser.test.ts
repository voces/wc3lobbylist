import { parser, Rule } from "./parser";

const expectParse = (
	string: string,
	result: { filter: Rule },
): (() => void) => (): void => expect(parser(string)).toEqual(result);

it(
	"simple",
	expectParse('map:"bar"', {
		filter: { type: "term", key: "map", value: "bar" },
	}),
);

it(
	"white space",
	expectParse(' map  :  "bar" ', {
		filter: { type: "term", key: "map", value: "bar" },
	}),
);

it(
	"regex",
	expectParse("map:/bar/", {
		filter: { type: "term", key: "map", value: /bar/ },
	}),
);

it(
	"regex with option",
	expectParse("map:  /bar/i", {
		filter: { type: "term", key: "map", value: /bar/i },
	}),
);

it(
	"two terms",
	expectParse('map:/bar/ name:"b"', {
		filter: {
			type: "and",
			rules: [
				{ type: "term", key: "map", value: /bar/ },
				{ type: "term", key: "name", value: "b" },
			],
		},
	}),
);

it(
	"three terms",
	expectParse('map:/bar/ name:"b" host:/d/i', {
		filter: {
			type: "and",
			rules: [
				{ type: "term", key: "map", value: /bar/ },
				{ type: "term", key: "name", value: "b" },
				{ type: "term", key: "host", value: /d/i },
			],
		},
	}),
);

it(
	"or",
	expectParse('name:"b" or name:"d"', {
		filter: {
			type: "or",
			rules: [
				{ type: "term", key: "name", value: "b" },
				{ type: "term", key: "name", value: "d" },
			],
		},
	}),
);

it(
	"two ors",
	expectParse('name:"b" or name:"d" or host:"f"', {
		filter: {
			type: "or",
			rules: [
				{ type: "term", key: "name", value: "b" },
				{ type: "term", key: "name", value: "d" },
				{ type: "term", key: "host", value: "f" },
			],
		},
	}),
);

it(
	"a mix",
	expectParse('name:"b" or name:"d" host:"f" or server:"h" map:"j"', {
		filter: {
			type: "and",
			rules: [
				{
					type: "or",
					rules: [
						{ type: "term", key: "name", value: "b" },
						{ type: "term", key: "name", value: "d" },
					],
				},
				{
					type: "or",
					rules: [
						{ type: "term", key: "host", value: "f" },
						{ type: "term", key: "server", value: "h" },
					],
				},
				{ type: "term", key: "map", value: "j" },
			],
		},
	}),
);

describe("actual examples", () => {
	it(
		"sheep tag",
		expectParse(
			"name:/sh(e{2,})p.*tag/i or map:/(sheep.*tag|bulldog.*excursion)/i",
			{
				filter: {
					type: "or",
					rules: [
						{
							type: "term",
							key: "name",
							value: /sh(e{2,})p.*tag/i,
						},
						{
							type: "term",
							key: "map",
							value: /(sheep.*tag|bulldog.*excursion)/i,
						},
					],
				},
			},
		),
	);

	it(
		"world war iii",
		expectParse("map:/(ww3|world.*war[^\\d]*(3|iii))/i", {
			filter: {
				type: "term",
				key: "map",
				value: /(ww3|world.*war[^\d]*(3|iii))/i,
			},
		}),
	);
});
