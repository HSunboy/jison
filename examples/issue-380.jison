/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
"foobarfoo"           return 'FOOBARFOO'
<<EOF>>               return 'EOF'
.                     return 'error'

/lex

%% /* language grammar */

expressions
    :  FOOBARFOO EOF -> `
    		VAR ${$FOOBARFOO} ::= "${ $FOOBARFOO.replace(/foo(.+)foo/, '$1' ) };"
`;

/* -------------------------------------------------------------------

The above action code showcases SEVERAL features of `jison-gho`:

- the lexer recognizes 'error' as the generic `error` token and produces the error
  token ID instead of a string ID. This is a minor optimization.

  Another way to write that line in the lexer would be, f.e.:

	  .                     return 'INVALID'

  and the lexer would then have generated a token named 'INVALID', which the parser
  would not recognize and thus produce a **parse error**, the same it would do for

	  .                     return 'error'

  except then there not being an 'INVALID' token to report but merely the lexer
  failure at hand.	  

- an "arrow action" which is shorthand for a simple "return value statement", i.e.

      rule: production -> bla

  is equivalent to writing

      rule: production
      			{
      				$$ = bla;
      			}

- support for ES6 multiline ('backquoted') formattable strings.

  ES6 JavaScript supports '${ expression }' format elements in such strings.
  Here the relevant elements being copied into the resulting multiline string are:

				$FOOBARFOO

  and

  				$FOOBARFOO.replace(/foo(.+)foo/, '$1' )

  essentially producing a string result somehwat like

  				VAR fooXXXXXXfoo ::= "XXXXXX";

  Another way (without **arrow action** use) to have written this would have been:

		expressions
		    :  FOOBARFOO EOF
    		{									// start of action code block
    			let str = $FOOBARFOO;
    			let extract = str.replace(/foo(.+)foo/, '$1' );
    			$$ = `
		    		VAR ${ str } ::= "${ extract };"
		`;
			}									// end of action code block

- using named references instead of numbered references to production particles:

  $1 would be the same reference as $FOOBARFOO, both producing the *lexed value*
  of that token.

  Given the *implicit* lexer behaviour for the simple lexer rule

                "foobarfoo"           return 'FOOBARFOO'

  is to copy the matched string for the given regex into `this.yytext`, which is
  the lexer *value* attribute picked up by the parser when you use the $REFERENCE
  dollar-reference idiom, this means that $1 == $FOOBARFOO == "foobarfoo" (string).

  Hence the expression

               	$FOOBARFOO.replace(/foo(.+)foo/, '$1' )

  should be identical to writing in JavaScript:

  				"foobarfoo".replace(/foo(.+)foo/, '$1' )

  which would of course be expected to produce

  				"bar"

- the '$1' string in the .replace(...) statement should NOT be damaged by jison-gho,
  contrary to the behaviour of `jison` which is less "smart" about these matters.

  This is the core issue in https://github.com/zaach/jison/issues/380 and another
  selling point for jison-gho IMO.    :-)

  ------------------------------------------------------------------- */

%%





// feature of the GH fork: specify your own main.
//
// compile with
//
//      jison -o test.js --main that/will/be/me.jison
//
// then run
//
//      node ./test.js
//
// to see the output.

const assert = require("assert");

parser.main = function () {
    let rv = parser.parse('foobarfoo');
    console.log("test #1: 'foobarfoo' ==> ", rv, parser.yy);
    assert.equal(rv, `
    		VAR foobarfoo := "bar";
`);

    let rv = parser.parse('BLAM');
    console.log("test #2: erroneous input 'BLAM' ==> ", rv, parser.yy);
    assert.equal(rv, 'x');

    // if you get past the assert(), you're good.
    console.log("tested OK");
};
