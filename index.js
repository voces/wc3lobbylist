
import fetchLobbies from "./fetchLobbies.js";
import { promiseTimeout } from "./util.js";
import v1 from "./v1.js";
import v2 from "./v2.js";

const TEN_SECONDS = 10 * 1000;
const THIRTY_SECONDS = 30 * 1000;
const ONE_MINUTE = 60 * 1000;

let lastWork = 0;

const update = async () => {

	const start = Date.now();
	lastWork = Date.now();
	let newLobbies;

	try {

		newLobbies = await promiseTimeout( fetchLobbies() );

	} catch ( err ) {

		console.error( err );
		setTimeout( update, TEN_SECONDS );
		return;

	}

	console.log( new Date(), "l", newLobbies.length );

	try {

		await v2( newLobbies );

	} catch ( err ) {

		console.error( err );

	}

	try {

		await v1( newLobbies );

	} catch ( err ) {

		console.error( err );

	}

	setTimeout( update, start + TEN_SECONDS - Date.now() );

};

update();

setInterval( () => {

	if ( Date.now() - lastWork < ONE_MINUTE ) return;

	console.log( new Date(), "looks dead, killing..." );
	process.exit( 1 );

}, THIRTY_SECONDS );

console.log( new Date(), "ready!", process.env.NODE_ENV );
