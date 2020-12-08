// title: "continue parsing when encountering yyerror(), using a custom handler"
// ...
//

%%

%{
    // Normally, I would have dumped this piece of setup at the end of the spec, past the last '%%',
    // BUT the test rig DOES NOT include that part into the generated lexer used for testing.  :-(

    yy.parseError = function custom_parseError(str, hash, ExceptionClass) {
        if (0) console.error("invoking custom parseError:", {str, yyrulenumber});
        
        yytext = {
            text: yytext,
            message: str,
            yyrulenumber
        };
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
