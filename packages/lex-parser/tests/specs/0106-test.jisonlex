//
// title: "edge cases for {{...}}, etc. action markers usage"
// test_run_lexer_output: false
//
// ...
//

%%

a {{
    {
        yytext += '+1';
        return 'A';
        // note the terminating 'action code block marker' just below:
        // it's a matching set of braces, yet looks a tad... off.
        //
        // To prevent mishaps with complex action blocks, the 'end marker'
        // must stand apart.
        // Hence this MUST be considered as ILLEGAL input.
    }}}

b {{{
    {
        yytext += '+1';
        return 'B';
        // This MUST be considered as legal input. The end marker stands apart
        // from any other confusing closing braces.
    } }}}

c {{{{
    {
        yytext += '+1';
        return 'C';
        // This MUST be considered as legal input. The end marker stands apart
        // from any other confusing closing braces.
    }}} }}}} }}}}
    //       ^^^^--- THAT, of course, will be illegal lexer spec input as these
    //               just dangle here. This MUST reflect in the lexer token 
    //               stream output for this buggy lexer spec!

<<EOF>>                         return 'EOF';