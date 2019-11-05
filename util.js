
// https://stackoverflow.com/a/39543625/1567335
export const escapeMarkdown = text => {

	const unescaped = text.replace( /\\(\*|_|`|~|\\)/g, "$1" ); // unescape any "backslashed" character
	const escaped = unescaped.replace( /(\*|_|`|~|\\)/g, "\\$1" ); // escape *, _, `, ~, \
	return escaped;

};

// taken from https://italonascimento.github.io/applying-a-timeout-to-your-promises/
export const promiseTimeout = function ( promise ) {

	const ms = 10_000;
	// Create a promise that rejects in <ms> milliseconds
	const timeout = new Promise( ( _, reject ) => {

		const id = setTimeout( () => {

			clearTimeout( id );
			reject( new Error( "Timed out in " + ms + "ms." ) );

		}, ms );

	} );

	// Returns a race between our timeout and the passed in promise
	return Promise.race( [ promise, timeout ] );

};
