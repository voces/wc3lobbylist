
export const generateNameFilter = names => {

	const regexSets = names.map( name => name.replace( /[^0-9a-z ]/gi, "" ).replace( /\s{2,}/g, " " ).split( " " ).map( word => RegExp( word, "i" ) ) );

	return lobby => regexSets.some( set => set.every( regex => lobby.name.match( regex ) ) );

};

export const generateServerfilter = servers => lobby => servers.some( server => lobby.server === `[${server}]` );

export const generateFilters = ( { names, servers } ) => {

	const namefilter = names && generateNameFilter( names );
	const serverFilter = servers && generateServerfilter( servers );

	return [ namefilter, serverFilter ].filter( Boolean );

};

export default generateFilters;
