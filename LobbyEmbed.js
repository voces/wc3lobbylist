
import Discord from "discord.js";

const extractField = ( embed, fieldName ) => {

	const field = embed.fields.find( f => f.name === fieldName );
	if ( field ) return field.value;

	return "?";

};

const withoutStrikeout = str => str
	.replace( /^~~/, "" )
	.replace( /~~$/, "" );

const withStrikeout = ( str, hasStrikeout ) =>
	hasStrikeout && str && str.length ? `~~${str}~~` : str;

export default class LobbyEmbed {

	title = "";
	url = "";
	thumbnail = "";
	footer = "";
	gameName = "?";
	author = "?";
	realm = "?";
	players = "?";
	strikeout = false;

	constructor( sourceEmbed ) {

		if ( ! sourceEmbed ) return;

		this.title = withoutStrikeout( sourceEmbed.title || "" );
		this.url = sourceEmbed.url;
		if ( sourceEmbed.thumbnail )
			this.thumbnail = sourceEmbed.thumbnail.url;
		if ( sourceEmbed.footer )
			this.footer = { text: sourceEmbed.footer.text, icon: sourceEmbed.footer.iconURL };
		const rawGameName = extractField( sourceEmbed, "Game Name" );
		this.gameName = withoutStrikeout( rawGameName );
		this.author = withoutStrikeout( extractField( sourceEmbed, "Hosted by" ) );
		this.realm = withoutStrikeout( extractField( sourceEmbed, "Realm" ) );
		this.players = withoutStrikeout( extractField( sourceEmbed, "Players" ) );
		this.strikeout = this.title.startsWith( "~~" );

	}

	set( key, value ) {

		this[ key ] = value;
		return this;

	}

	toEmbed() {

		return new Discord.RichEmbed()
			.setTitle( withStrikeout( this.title, this.strikeout ) )
			.setURL( this.url )
			.setThumbnail( this.thumbnail )
			.setFooter( this.footer.text, this.footer.icon )
			.addField( "Game Name", withStrikeout( this.gameName, this.strikeout ) )
			.addField( "Hosted by", withStrikeout( this.author, this.strikeout ), true )
			.addField( "Realm", withStrikeout( this.realm, this.strikeout ), true )
			.addField( "Players", withStrikeout( this.players, this.strikeout ), true );

	}

}
