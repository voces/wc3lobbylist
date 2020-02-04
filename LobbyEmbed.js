
import Discord from "discord.js";

const extractField = ( embed, fieldName ) => {

	const field = embed.fields.find( f => f.name === fieldName );
	if ( field ) return field.value;

	return "?";

};

export default class LobbyEmbed {

	title = "";
	url = "";
	thumbnail = "";
	footer = { text: "", icon: "" };
	gameName = "?";
	author = "?";
	realm = "?";
	players = "?";
	color = "";
	created = "";

	constructor( sourceEmbed ) {

		if ( ! sourceEmbed ) return;

		this.title = sourceEmbed.title || "";
		this.url = sourceEmbed.url;
		if ( sourceEmbed.thumbnail )
			this.thumbnail = sourceEmbed.thumbnail.url;
		if ( sourceEmbed.footer )
			this.footer = { text: sourceEmbed.footer.text, icon: sourceEmbed.footer.iconURL };
		this.gameName = extractField( sourceEmbed, "Game Name" );
		this.author = extractField( sourceEmbed, "Hosted by" );
		this.realm = extractField( sourceEmbed, "Realm" );
		this.players = extractField( sourceEmbed, "Players" );
		this.color = sourceEmbed.color;
		this.created = extractField( sourceEmbed, "Creation Time" );

	}

	set( key, value ) {

		this[ key ] = value;
		return this;

	}

	toEmbed() {

		return new Discord.RichEmbed()
			.setTitle( this.title )
			.setURL( this.url )
			.setThumbnail( this.thumbnail )
			.setFooter( this.footer.text, this.footer.icon )
			.addField( "Game Name", this.gameName )
			.addField( "Hosted by", this.author, true )
			.addField( "Realm", this.realm, true )
			.addField( "Players", this.players, true )
			.setColor( this.color );

	}

}
