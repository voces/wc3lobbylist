export const formatList = (items: string[]): string =>
	items.length === 1
		? items[0]
		: items.length === 2
		? `${items[0]} and ${items[1]}`
		: `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;

export const cleanUsername = (player: string): string => player.split("#")[0];

export const formatTime = (seconds: number): string => {
	const parts: string[] = [];
	if (seconds > 3600) {
		const hours = Math.floor(seconds / 3600);
		seconds -= hours * 3600;
		parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
	}
	if (seconds > 60) {
		const minutes = Math.floor(seconds / 60);
		seconds -= minutes * 60;
		parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
	}
	if (seconds > 0) parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
	return formatList(parts);
};
