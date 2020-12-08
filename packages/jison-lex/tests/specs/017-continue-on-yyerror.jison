// title: "continue parsing when encountering yyerror(), using a custom handler"
// ...
//

%%

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

// WARNING:
// The test rig DOES NOT include this 'epilogue' section into the generated lexer used for testing.  :-(
//
// Compare results with test 016, which 'fixes' this.
//
// DO NOTE that this is behaviour *specific* to the jison-lex test rig only! Both 016 and 017 should 
// behave the same when compiled to a full lexer using jison-gho/jison-lex.

lexer.yy = {
    parseError: function custom_parseError(str, hash, ExceptionClass) {
        if (0) console.error("invoking custom parseError:", {str});
        
        this.yytext = {
            text: this.yytext,
            message: str,
            // yyrulenumber      <-- that one is not accessible here.
        };
        return 666;
    }
};
