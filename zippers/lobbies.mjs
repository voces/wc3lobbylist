
import { list as w3mapzList } from "../sources/w3mapz.com.mjs";
import { list as wc3mapsList } from "../sources/wc3maps.com.mjs";
import Lobby from "../objects/Lobby.mjs";

const updateLists = () => [ w3mapzList, wc3mapsList ].forEach( async list => {

	const rawLobbies = await list();

	rawLobbies.forEach( rawLobby => {

		const lobby = Lobby.find( rawLobby );
		if ( ! lobby ) new Lobby( rawLobby );
		else {

			// Delete name because wc3maps's isn't always correct
			// (uses same case as a previous lobby)
			if ( list === wc3mapsList ) delete rawLobby.name;

			lobby.update( rawLobby );

		}

	} );

} );

setInterval( updateLists, 5000 );

updateLists();
