
import Joi from "joi";

export const children = schema => schema._inner.children;
export const childrenKeys = schema => children( schema ).map( child => child.key );
export const assert = ( value, schema ) => {

	const result = Joi.validate( value, schema );
	if ( result.err ) throw result.err;
	return result.value;

};

export const mixin = ( obj, props, schema ) => {

	Joi.assert( props, schema );

};
