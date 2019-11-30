
export default {
	"232301665666072577": lobby => process.env.NODE_ENV === "production" &&
		lobby.name.match( /^.*(sh(e{2,})p.*tag|\b(st)+\b|\bst[^a-z]|stbd|bdst).*$/i ) &&
		! lobby.name.match( /soldier/i ) &&
		! lobby.name.match( /civilization/i ),
	"457570641638326274": lobby => process.env.NODE_ENV !== "production" &&
		lobby.name.match( /^[abc]/ ),
	"650369363811106820": lobby => process.env.NODE_ENV !== "production" &&
		lobby.name.match( /^[bcd]/ ),
	"650285615140569115": lobby => process.env.NODE_ENV === "production" &&
		lobby.name.match( /vamp.*zero/i ),
};
