// title: "jison-lex should be smart enough to correctly decide which 'yytext' items to expand/rewrite"
// ...
//
// Currently, this is an example of buggy jison-lex behaviour: *all* yytext identifiers are rewritten,
// resulting in a b0rked lexer.
//
// Compare to test 016, which this one was derived off.

%%

%{
    // Normally, I would have dumped this piece of setup at the end of the spec, past the last '%%',
    // BUT the test rig DOES NOT include that part into the generated lexer used for testing.  :-(

    yy.parseError = function custom_parseError(str, hash, ExceptionClass) {
        console.error("invoking custom parseError:", {str, yyrulenumber});
        
        // ,---- *none* of the three 'yytext' identifiers below should be exapanded!
        if (str === 'bogus-condition-to-prevent-runtime-crash') {
            this.yytext = {
                "yytext": this.yytext,
                message: str,
                yyrulenumber
            };
        } else {
            // both these 'yytext' identifiers SHOULD be expanded and will access the yy_ in the performAction() closure.
            yytext = {
                text: yytext,
                message: str,
                yyrulenumber
            };
        }
        return 666;
    };
%}


.   {
        // API Note:
        //
        // *all* `yyerror()` functions are expected to either return a token ID or throw an exception...
        //
        // Aside: by default, when your custom parseError() doesn't return a token ID, the token 'ERROR'
        // will be produced instead.
        //
        return yyerror(`'${yytext[0]}' (${yytext.charCodeAt(0)}): illegal character at line ${yylineno}.`);
    }

%%
