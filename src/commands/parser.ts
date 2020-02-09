
import * as moo2 from "moo";

// We do this casting because jest or js complains without it...
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moo = ( moo2 as any ).default ? ( moo2 as any ).default : moo2;

const lexer = moo.compile( {
	WS: /[ \t]+/,
	string: /"(?:\\["\\]|[^\n"\\])*"/,
	regexp: /\/(?:[^/]|\/\/)*\/i?/,
	term: ":",
	keyword: [ "or" ],
	key: [ "map", "host", "name", "server" ],
	options: [ "message" ],
	lparen: "(",
	rparen: ")",
} );

type GroupRule = {type: "and" | "or"; rules: Rule[]}
export type Key = "map" | "host" | "name" | "server"

export type Rule = GroupRule
	| {type: "term"; key: Key; value: string | RegExp}
	| {type: "option"; option: "message"; value: string}

export type RootRule = Rule & {message?: string};

const isGroupRule = ( rule: Rule ): rule is GroupRule =>
	rule.type === "and" || rule.type === "or";

const simplify = ( rule: Rule ): RootRule => {

	if ( isGroupRule( rule ) ) {

		if ( rule.rules.length === 1 )
			if ( isGroupRule( rule.rules[ 0 ] ) ) {

				return simplify( Object.assign( rule, rule.rules[ 0 ] ) );

			} else {

				simplify( Object.assign( rule, rule.rules[ 0 ] ) );
				delete rule.rules;
				return rule;

			}
		else if ( rule.rules.every( childRule => ! isGroupRule( childRule ) || childRule.type === rule.type ) ) {

			let length = rule.rules.length;
			for ( let i = 0; i < length; i ++ ) {

				const childRule = rule.rules[ i ];
				if ( isGroupRule( childRule ) ) {

					rule.rules.splice( i, 1, ...childRule.rules );
					i += childRule.rules.length - 1;
					length += childRule.rules.length - 1;

				}

			}

		}

		for ( const childRule of rule.rules )
			simplify( childRule );

		return rule;

	}

	return rule;

};

/**
 * Takes in a string and outputs the rules
 */
export const parser = ( string: string ): {filter: Rule; options?: {message?: string}} => {

	const terms: moo.Token[] = [];

	lexer.reset( string );

	while ( true ) {

		const term = lexer.next();
		if ( term ) terms.push( term );
		else break;

	}

	const root: RootRule = { type: "and", rules: [] };
	const rules: Rule[] = [ root ];
	let rule: Rule = root;

	for ( const term of terms )
		switch ( term.type ) {

			case "WS": continue;
			case "key": {

				if ( rule.type === "and" || rule.type === "or" ) {

					const newRule: Rule = { type: "term", key: term.value as Key, value: "" };
					rule.rules.push( newRule );
					rules.push( newRule );
					rule = newRule;
					continue;

				}

				console.warn( "bad lexer" );
				continue;

			}
			case "string": {

				if ( rule.type === "term" ) {

					rule.value = term.value.slice( 1, - 1 );
					rules.pop();
					rule = rules[ rules.length - 1 ];
					if ( rule.type === "or" ) {

						rules.pop();
						rule = rules[ rules.length - 1 ];

					}
					continue;

				} else if ( rule.type === "option" ) {

					root[ rule.option ] = term.value.slice( 1, - 1 );
					rules.pop();
					rule = rules[ rules.length - 1 ];

				}

				console.warn( "bad lexer" );
				continue;

			}
			case "regexp": {

				if ( rule.type === "term" ) {

					const regex = term.value.endsWith( "/i" ) ?
						new RegExp( term.value.slice( 1, - 2 ), "i" ) :
						new RegExp( term.value.slice( 1, - 1 ) );

					rule.value = regex;
					rules.pop();
					rule = rules[ rules.length - 1 ];
					if ( rule.type === "or" ) {

						rules.pop();
						rule = rules[ rules.length - 1 ];

					}
					continue;

				}

				console.warn( "bad lexer" );
				continue;

			}
			case "term": {

				if ( rule.type === "term" && rule.value === "" )
					continue;

				console.warn( "bad lexer", rule, term );
				continue;

			}
			case "lparen": {

				if ( rule.type === "and" || rule.type === "or" ) {

					const newRule: Rule = { type: "and", rules: [] };
					rule.rules.push( newRule );
					rules.push( newRule );
					rule = newRule;
					continue;

				}

				console.warn( "bad lexer" );
				continue;

			}
			case "rparen": {

				if ( rule.type === "and" ) {

					rules.pop();
					rule = rules[ rules.length - 1 ];
					continue;

				}

				console.warn( "bad lexer" );
				continue;

			}
			case "keyword": {

				if ( rule.type === "and" ) {

					const prevRule = rule.rules.pop();

					if ( ! prevRule ) {

						console.warn( "bad lexer" );
						continue;

					}

					const newRule: Rule = { type: "or", rules: [ prevRule ] };
					rule.rules.push( newRule );
					rules.push( newRule );
					rule = newRule;
					continue;

				}

				console.warn( "bad lexer", rule, term );
				continue;

			}
			case "options": {

				if ( isGroupRule( rule ) ) {

					const option: Rule = { type: "option", option: term.value as "message", value: "" };
					rules.push( option );
					rule = option;
					continue;

				}

				console.warn( "bad lexer" );
				continue;

			}
			default: {

				console.warn( "bad lexer", rule, term );
				continue;

			}

		}

	const filter = simplify( root );
	const result: {filter: Rule; options?: {message?: string}} = { filter };
	if ( filter.message ) {

		result.options = { message: filter.message };
		delete filter.message;

	}
	return result;

};
