
// https://stackoverflow.com/a/34749873

export function isObject( item ) {

	return ( item && typeof item === "object" && ! Array.isArray( item ) );

}

export function mergeDeep( target, ...sources ) {

	if ( ! sources.length ) return target;
	const source = sources.shift();

	if ( isObject( target ) && isObject( source ) )
		for ( const key in source )
			if ( isObject( source[ key ] ) ) {

				if ( ! target[ key ] ) target[ key ] = {};
				mergeDeep( target[ key ], source[ key ] );

			} else target[ key ] = source[ key ];

	return mergeDeep( target, ...sources );

}

export function mergeDiff( target, ...sources ) {

	let changed = false;

	if ( ! sources.length ) return changed;
	const source = sources.shift();

	if ( isObject( target ) && isObject( source ) )
		for ( const key in source )
			if ( isObject( source[ key ] ) ) {

				if ( ! target[ key ] ) target[ key ] = {};
				changed = changed || mergeDeep( target[ key ], source[ key ] );

			} else if ( target[ key ] !== source[ key ] ) {

				target[ key ] = source[ key ];
				changed = true;

			}

	return changed;

}
