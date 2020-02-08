
import Discord, { MessageEmbed, ColorResolvable } from "discord.js";

const extractField = ( embed: MessageEmbed, fieldName: string ): string => {

	const field = embed.fields.find( f => f.name === fieldName );
	if ( field ) return field.value;

	return "?";

};

export class LobbyEmbed {

	title = "";
	url = "";
	thumbnail = "";
	footer = { text: "", icon: "" };
	gameName = "?";
	host = "?";
	realm = "?";
	players = "?";
	color: ColorResolvable = "";
	created = "";

	constructor( sourceEmbed?: MessageEmbed ) {

		if ( ! sourceEmbed ) return;

		this.title = sourceEmbed.title;
		this.url = sourceEmbed.url;
		if ( sourceEmbed.thumbnail )
			this.thumbnail = sourceEmbed.thumbnail.url;
		if ( sourceEmbed.footer )
			this.footer = { text: sourceEmbed.footer.text ?? "", icon: sourceEmbed.footer.iconURL ?? "" };
		this.gameName = extractField( sourceEmbed, "Game Name" );
		this.host = extractField( sourceEmbed, "Hosted by" );
		this.realm = extractField( sourceEmbed, "Realm" );
		this.players = extractField( sourceEmbed, "Players" );
		this.color = sourceEmbed.color ?? 0xe69500;
		this.created = extractField( sourceEmbed, "Creation Time" );

	}

	set<A extends keyof LobbyEmbed>( key: A, value: LobbyEmbed[A] ): LobbyEmbed {

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this[ key ] = value as any;
		return this;

	}

	toEmbed(): Discord.RichEmbed {

		return new Discord.RichEmbed()
			.setTitle( this.title )
			.setURL( this.url )
			.setThumbnail( this.thumbnail )
			.setFooter( this.footer.text, this.footer.icon )
			.addField( "Game Name", this.gameName )
			.addField( "Hosted by", this.host, true )
			.addField( "Realm", this.realm, true )
			.addField( "Players", this.players, true )
			.setColor( this.color ?? "" );

	}

}
