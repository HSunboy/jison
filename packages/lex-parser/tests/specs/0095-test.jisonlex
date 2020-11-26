//
// title: "working %include with relative path"
//
// ...
//

%include "../../../jison-lex/examples/includes/comments.helpers.js"

digit [0-9]
id [a-zA-Z_\$][a-zA-Z0-9_\$]*

%%

{id}                            return 'IDENT'
{digit}                         return 'NUMBER'
\s 								return 'SPACE';

<<EOF>>                         return 'EOF';