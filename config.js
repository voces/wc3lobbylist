
export default process.env.NODE_ENV === "production" ? {
	blacklist: [ "457570641638326274" ],
	// sheep tag
	"232301665666072577": {
		version: 3,
		filter: lobby => process.env.NODE_ENV === "production" &&
			(
				// name match
				lobby.name.match( /sh(e{2,})p.*tag/i ) ||
				// map match
				lobby.map && lobby.map.match( /(sheep.*tag|bulldog.*excursion)/i )
			),
	},
	// vamp zero
	"650285615140569115": {
		filter: lobby => lobby.name.match( /vamp.*zero/i ),
		format: lobby => `<@&650378544479731712> [${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
	},
	// tree tag
	"650062967903354901": {
		version: 3,
		filter: lobby => lobby.name.match( /tree.*tag/i ),
		message: "<@&650493683166216203>",
		format: lobby => `<@&650493683166216203> [${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
	},
	// helm's deep
	"674688464721149993": {
		version: 3,
		filter: lobby => lobby.map && lobby.map.match( /^Helm.*Deep.*6/i ),
	},
	// broken alliances
	"674781657697353751": {
		version: 3,
		filter: lobby => lobby.map && lobby.map.match( /Broken.*Alliances/i ),
	},
	// world war iii
	"675030847774261258": {
		version: 3,
		filter: lobby => lobby.map && lobby.map.match( /(ww3|world.*war[^\d]*(3|iii))/i ),
	},
	// bolty
	"661040840512241705": {
		version: 3,
		filter: lobby => lobby.map && lobby.map.match( /monolith/i ),
	},
} : {
	whitelistOnly: true,
	"457570641638326274": {
		version: 3,
		message: "<@&650382637369786381>",
		filter: lobby => lobby.name.match( /^[a]/ ),
	},
};
