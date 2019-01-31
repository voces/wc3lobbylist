
export const lobbyKey = lobby => `${lobby.server}-${lobby.name}`;

export const friendlyFile = file => file
	.replace( ".w3x", "" )
	.replace( ".w3m", "" )
	.replace( /[_-]/g, " " )
	.replace( /~[0-9]/g, "" )
	.replace( / {2}/g, " " )
	.replace( /([a-uw-z])([A-Z0-9])/g, "$1 $2" )
	.trim();

export const friendlyServer = server => server.toLowerCase();

export const formatLongLobby = ( { server, name, slots: { occupied, max }, map } ) =>
	`\`\`\`𝗡𝗮𝗺𝗲: [${friendlyServer( server )}] ${name} (${occupied}/${max})
	 𝗠𝗮𝗽: ${map}\`\`\``.replace( /\t/g, "" );
// export const formatLongLobby = ( { server, name, slots: { occupied, max } } ) =>
// 	`\`\`\` 𝗦𝗲𝗿𝘃𝗲𝗿: ${friendlyServer( server )}
// 	  𝗡𝗮𝗺𝗲: ${name} (${occupied}/${max})\`\`\``.replace( /\t/g, "" );
// export const formatLongLobby = ( { server, name, slots: { occupied, max }, map, host } ) =>
// 	`\`\`\` 𝗛𝗼𝘀𝘁: ${host}@${friendlyServer( server )}
// 	𝗡𝗮𝗺𝗲: ${name} (${occupied}/${max})
// 	 𝗠𝗮𝗽: ${map}\`\`\``.replace( /\t/g, "" );

export const formatShortLobby = ( { server, name, slots: { occupied, max }, map } ) =>
	`[${friendlyServer( server )}] ${name} (${occupied}/${max}) <${friendlyFile( map )}>`;
// export const formatShortLobby = ( { server, name, slots: { occupied, max }, map, host } ) =>
// 	`[${host}@${friendlyServer( server )}] ${name} (${occupied}/${max}) <${friendlyFile( map )}>`;
// export const formatShortLobby = ( { server, name, slots: { occupied, max } } ) =>
// 	`[${friendlyServer( server )}] ${name} (${occupied}/${max})`;

export const formatLobbies = ( lobbies, long = false ) => {

	let str = long ? "" : "```";

	for ( let i = 0; i < lobbies.length; i ++ ) {

		const newLobby = ( long ? formatLongLobby : formatShortLobby )( lobbies[ i ] );
		const nextStr = str + ( long ? "" : "\n" ) + newLobby;

		if ( nextStr.length + 3 >= 2000 ) break;

		str = nextStr;

	}

	if ( str.length === 3 ) str += "Nothing to show!";

	if ( long ) return str;
	return str + "```";

};
