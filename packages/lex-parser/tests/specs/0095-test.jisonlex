//
// title: "working %include with relative path"
// test_input: a1 1a 37 becky boo!
//
// ...
//

%include "../../../jison-lex/examples/includes/comments.helpers.js"

digit [0-9]
id [a-zA-Z_\$][a-zA-Z0-9_\$]*

%%

{id}                            return 'IDENT:' + getTypes(yytext)
{digit}                         return 'NUMBER'
\s 								return 'SPACE';

<<EOF>>                         return 'EOF';