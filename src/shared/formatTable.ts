export const formatTable = <T extends { toString: () => string }[][]>(
	table: T,
): string => {
	const stringRows: string[][] = [];
	const columnWidths = table[0].map(() => 0);
	const columnTypes = Object.values(table[1] ?? table[0]).map(
		(v) => typeof v,
	);

	for (const row of table) {
		const stringRow: string[] = [];
		stringRows.push(stringRow);
		for (let i = 0; i < row.length; i++) {
			const cell = row[i];
			const str = cell.toString();
			stringRow.push(str);
			if (columnWidths[i] < str.length) columnWidths[i] = str.length;
		}
	}

	return stringRows
		.map((row) =>
			row
				.map((v, i) =>
					columnTypes[i] === "number"
						? v.padStart(columnWidths[i], " ")
						: v.padEnd(columnWidths[i], " "),
				)
				.join(" "),
		)
		.join("\n");
};
