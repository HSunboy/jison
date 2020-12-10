//
// title: "edge cases for {{...}}, etc. action markers usage"
// test_input: a b c
//
// ...
//

%%

a {{
    {{
        yytext += '+1';
        return 'A';
        // note the terminating 'action code block marker' just below:
        // it's a matching set of braces, yet looks a tad... off.
        // This MUST be considered as legal input.
    }} }}

b {{{
    {
        yytext += '+1';
        return 'B';
        // note the terminating 'action code block marker' just below:
        // it's a matching set of braces, yet looks a tad... off.
        // This MUST be considered as legal input.
    } }}}

c {{{{
    {{
        yytext += '+1';
        return 'C';
        // note the terminating 'action code block marker' just below:
        // it's a matching set of braces, yet looks a tad... off.
        // This MUST be considered as legal input.
    }} }}}}

<<EOF>>                         return 'EOF';