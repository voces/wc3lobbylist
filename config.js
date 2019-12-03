
export default {
	// sheep tag
	"232301665666072577": {},
	// vamp zero
	"650285615140569115": {
		filter: lobby => process.env.NODE_ENV === "production" &&
			lobby.name.match( /vamp.*zero/i ),
		format: lobby => `<@&650378544479731712> [${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
	},
	// tree tag
	"650062967903354901": {
		filter: lobby => process.env.NODE_ENV === "production" &&
			lobby.name.match( /tree.*tag/i ),
		format: lobby => `<@&650493683166216203> [${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
	},
	"457570641638326274": {
		message: "<@&650382637369786381>",
		format: lobby => `<@&650382637369786381> [${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
	},
};
