
import discord from "../discord.js";
import { parser } from "./parser.js";
import { config, saveConfig } from "../config.js";
import { Message } from "discord.js";
import { stringifyReplacer } from "./stringify.js";
import { onProcessClose } from "../close.js";

const checkAlert = ( message: Message ): void => {

	if ( ! config[ message.channel.id ] ) {

		try {

			message.reply( "there is no alert configured." );

		} catch ( err ) {

			console.error( new Date(), err );

		}

		return;

	}

	try {

		message.reply( `\`${JSON.stringify( config[ message.channel.id ], stringifyReplacer ).replace( /`/g, "\\`" )}\`` );

	} catch ( err ) {

		console.error( new Date(), err );

	}

};

discord.on( "message", async message => {

	// only consider messages that mention us
	if ( ! message.mentions.users.has( discord.user?.id || "" ) ) return;

	const guildMember = message.guild?.member( message.author.id );

	if (
		! guildMember || ! guildMember.hasPermission( "MANAGE_MESSAGES" ) &&
		message.author.id !== "287706612456751104" // verit
	)
		return;

	const [ command, ...rest ] = message.content.replace( `<@!${discord.user?.id}>`, "" ).trim().split( " " );

	console.log( new Date(), message.guild?.id, message.channel.id, command, rest );

	switch ( command ) {

		case "alert": {

			if ( rest.length === 0 ) return checkAlert( message );

			try {

				const { filter, options } = parser( rest.join( " " ).replace( /^`/, "" ).replace( /`$/, "" ) );
				const alreadyAdded = !! config[ message.channel.id ];
				config[ message.channel.id ] = { filter };
				if ( options && options.message )
					config[ message.channel.id ].message = options.message;
				saveConfig();
				message.reply( alreadyAdded ? "modified!" : "added!" );

			} catch ( err ) {

				console.log( new Date(), "message", message.content );
				console.error( new Date(), err );
				try {

					message.reply( "invalid syntax. Example: `alert (map:/sheep.*tag/i or map:/tree.*tag/i) server:\"us\" message:\"@notify\"`" );

				} catch ( err ) {

					console.error( new Date(), err );

				}

			}
			break;

		}
		case "stop": {

			delete config[ message.channel.id ];
			saveConfig();

			try {

				message.reply( "stopped!" );

			} catch ( err ) {

				console.error( new Date(), err );

			}
			break;

		}
		case "restart": {

			if (
				message.author.id !== "287706612456751104" // verit
			)
				return;

			try {

				await message.reply( "restarting..." );
				console.log( new Date(), "restarting by command..." );
				await onProcessClose();

			} catch ( err ) {

				console.error( new Date(), err );

			}

			process.exit( 0 );
			break;

		}
		case "bulkdelete": {

			const amount = Math.min( parseInt( rest[ 0 ] ) || 10, 99 );
			console.log( new Date(), "bulk deleting", amount, "messages" );
			try {

				await message.channel.bulkDelete( amount + 1 );

			} catch ( err ) {

				console.error( new Date(), err );

			}

			break;

		}
		default: {

			message.reply( `unknown command: ${command}. Commands are \`alert\` and \`stop\`.` );

		}

	}

} );
