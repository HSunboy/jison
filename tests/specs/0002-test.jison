
// title: incorrect macro expansion inside ES6 template string
// 
// ...
// 
// Only diff with test0001 is single quotes instead of " double quotes around the ${...} bits in the ES6 template string.

%token MACRO_NAME
%token MACRO_END

%token regex

%%

definition
    //
    // may be a *macro definition*, e.g.
    //
    //     HEX_NUMBER                              "0"[xX][0-9a-fA-F]+
    //
    : MACRO_NAME regex MACRO_END
        {
            // Note: make sure we don't try re-define/override any XRegExp `\p{...}` or `\P{...}`
            // macros here:
            if (XRegExp._getUnicodeProperty($MACRO_NAME)) {
                // Work-around so that you can use `\p{ascii}` for a XRegExp slug, a.k.a.
                // Unicode 'General Category' Property cf. http://unicode.org/reports/tr18/#Categories,
                // while using `\p{ASCII}` as a *macro expansion* of the `ASCII`
                // macro:
                if ($MACRO_NAME.toUpperCase() !== $MACRO_NAME) {
                    yyerror(rmCommonWS`
                      Cannot use name '${$MACRO_NAME}' as a macro name
                      as it clashes with the same XRegExp "\\p{..}" Unicode \'General Category\'
                      Property name.
                      Use all-uppercase macro names, e.g. name your macro
                      '${$MACRO_NAME.toUpperCase()}' to work around this issue
                      or give your offending macro a different name.

                        Erroneous area:
                      ${yylexer.prettyPrintRange(@MACRO_NAME)}
                    `);
                }
            }
        }
    ;

