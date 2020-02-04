
export default process.env.NODE_ENV === "production" ? {
	blacklist: [ "457570641638326274" ],
	// sheep tag
	"232301665666072577": {
		version: 3,
		filter: lobby => process.env.NODE_ENV === "production" &&
			// name match
			( lobby.name.match( /^.*(sh(e{2,})p.*tag|\b(st)+\b|\bst[^a-z]|stbd|bdst).*$/i ) &&
			! lobby.name.match( /soldier/i ) &&
			! lobby.name.match( /civilization/i ) ||
			// map match
			lobby.map && lobby.map.match( /sheep.*tag/i ) ),
	},
	// vamp zero
	"650285615140569115": {
		filter: lobby => lobby.name.match( /vamp.*zero/i ),
		format: lobby => `<@&650378544479731712> [${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
	},
	// tree tag
	"650062967903354901": {
		filter: lobby => lobby.name.match( /tree.*tag/i ),
		format: lobby => `<@&650493683166216203> [${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
	},
} : {
	whitelistOnly: true,
	"457570641638326274": {
		version: 3,
		message: "<@&650382637369786381>",
		filter: lobby => lobby.name.match( /^[a-c]/ ),
	},
};
