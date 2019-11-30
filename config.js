
export default {
	"232301665666072577": {
		filter: lobby => process.env.NODE_ENV === "production" &&
			lobby.name.match( /^.*(sh(e{2,})p.*tag|\b(st)+\b|\bst[^a-z]|stbd|bdst).*$/i ) &&
			! lobby.name.match( /soldier/i ) &&
			! lobby.name.match( /civilization/i ),
	},
	"650285615140569115": {
		filter: lobby => process.env.NODE_ENV === "production" &&
			lobby.name.match( /vamp.*zero/i ),
		format: lobby => `<@&650378544479731712> [${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
	},
	"457570641638326274": {
		filter: lobby => process.env.NODE_ENV !== "production" &&
			lobby.name.match( /^[abcde]/ ),
		format: lobby => `<@&650382637369786381> [${lobby.server}] ${lobby.name} (${lobby.slots.occupied}/${lobby.slots.max})`,
	},
	"650369363811106820": {
		filter: lobby => process.env.NODE_ENV !== "production" &&
			lobby.name.match( /^[bcdef]/ ),
	},
};
