
import discord from "../discord.js";
import { parser } from "./parser.js";
import { config } from "../config.js";
import { promises as fs } from "fs";
import { Message } from "discord.js";
import { stringifyReplacer } from "./stringify.js";
import { onProcessClose } from "../index.js";

const checkAlert = ( message: Message ): void => {

	if ( ! config[ message.channel.id ] ) {

		try {

			message.reply( "there is no alert configured." );

		} catch ( err ) {

			console.error( err );

		}

		return;

	}

	try {

		message.reply( `\`${JSON.stringify( config[ message.channel.id ], stringifyReplacer ).replace( /`/g, "\\`" )}\`` );

	} catch ( err ) {

		console.error( err );

	}

};

discord.on( "message", async message => {

	// only consider messages that mention us
	if ( ! message.mentions.users.has( discord.user.id ) ) return;

	if (
		! message.guild.member( message.author.id ).hasPermission( "MANAGE_MESSAGES" ) &&
		message.author.id !== "287706612456751104" // verit
	)
		return;

	const [ command, ...rest ] = message.content.replace( `<@!${discord.user.id}>`, "" ).trim().split( " " );

	console.log( command, rest );

	switch ( command ) {

		case "alert": {

			if ( rest.length === 0 ) return checkAlert( message );

			try {

				const { filter, options } = parser( rest.join( " " ).replace( /^`/, "" ).replace( /`$/, "" ) );
				const alreadyAdded = !! config[ message.channel.id ];
				config[ message.channel.id ] = { filter };
				if ( options && options.message )
					config[ message.channel.id ].message = options.message;
				fs.writeFile(
					"./data/config.json",
					JSON.stringify( config, stringifyReplacer, 2 ),
				);
				message.reply( alreadyAdded ? "modified!" : "added!" );

			} catch ( err ) {

				console.log( "message", message.content );
				console.error( err );
				try {

					message.reply( "invalid syntax. Example: `alert (map:/sheep.*tag/i or map:/tree.*tag/i) server:\"us\" message:\"@notify\"`" );

				} catch ( err ) {

					console.error( err );

				}

			}
			break;

		}
		case "stop": {

			delete config[ message.channel.id ];
			fs.writeFile(
				"./data/config.json",
				JSON.stringify( config, stringifyReplacer, 2 ),
			);
			try {

				message.reply( "stopped!" );

			} catch ( err ) {

				console.error( err );

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

				console.error( err );

			}

			process.exit( 0 );
			break;

		}
		case "bulkdelete": {

			const amount = Math.min( parseInt( rest[ 0 ] ) || 10, 99 );
			console.log( "bulk deleting", amount, "messages" );
			try {

				await message.channel.bulkDelete( amount + 1 );

			} catch ( err ) {

				console.error( err );

			}

			break;

		}
		default: {

			message.reply( `unknown command: ${command}. Commands are \`alert\` and \`stop\`.` );

		}

	}

} );
