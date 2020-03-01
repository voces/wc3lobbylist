
import fetchLobbies from "./fetchLobbies.js";
import { promiseTimeout } from "./util.js";
import { newLobbies as v1NewLobbies, onExit as v1OnExit } from "./versions/v1.js";
import { newLobbies as v3NewLobbies, onExit as v3OnExit } from "./versions/v3.js";
import "./commands/index.js";

const TEN_SECONDS = 10 * 1000;
const THIRTY_SECONDS = 30 * 1000;
const ONE_MINUTE = 60 * 1000;

let lastWork = 0;

const newLobbiesHandlers = [ v3NewLobbies, v1NewLobbies ];
const onExitHandlers = [ v3OnExit, v1OnExit ];

let exiting = false;
let updateTimeout;

const update = async (): Promise<void> => {

	const start = Date.now();
	lastWork = Date.now();
	let newLobbies;

	try {

		newLobbies = await promiseTimeout( fetchLobbies() );

	} catch ( err ) {

		console.error( err );
		if ( ! exiting )
			updateTimeout = setTimeout( update, TEN_SECONDS );
		return;

	}

	console.log( new Date(), "l", newLobbies.length );

	for ( const newLobbiesHandler of newLobbiesHandlers )
		try {

			await newLobbiesHandler( newLobbies.map( l => ( { ...l } ) ) );

		} catch ( err ) {

			console.error( err );

		}

	if ( ! exiting )
		updateTimeout = setTimeout( update, start + TEN_SECONDS - Date.now() );

};

update();

const healthCheck = setInterval( () => {

	if ( Date.now() - lastWork < ONE_MINUTE ) return;

	console.log( new Date(), "looks dead, killing..." );
	process.exit( 1 );

}, THIRTY_SECONDS );

console.log( new Date(), "ready!", process.env.NODE_ENV );

let killing = false;
export const onProcessClose = async (): Promise<void> => {

	if ( killing ) return;
	killing = true;

	console.log( new Date(), "received kill signal" );

	exiting = true;
	clearTimeout( updateTimeout );
	clearInterval( healthCheck );

	for ( const onExitHandler of onExitHandlers )
		await onExitHandler();

	process.exit();

};

process.on( "SIGINT", onProcessClose );
process.on( "SIGTERM", onProcessClose );
