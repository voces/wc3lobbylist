
const memory = new WeakMap();

export default ( fn, { maxAge = 1000, once = false } = {} ) => {

	if ( once && memory.has( fn ) ) return memory.get( fn );

	let lastInvoked = - Infinity;
	let lastContent = undefined;

	const wrapped = () => {

		if ( lastInvoked + maxAge > Date.now() ) return lastContent;
		lastInvoked = Date.now();

		return lastContent = fn();

	};

	if ( once ) memory.set( fn, wrapped );

	return wrapped;

};
