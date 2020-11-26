//
// title: "erroneous lexer rule coding"
//
// ...
//

digit [0-9]
id [a-zA-Z_\$][a-zA-Z0-9_\$]*
esc \\

%%


{id}                            return 'IDENT'
{digit}                         return 'NUMBER'
// next line should barf:
"\"(?:{esc}[\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\"{esc}])*\"", "yytext = yytext.substr(1,yyleng-2); return 'STRING';"


<<EOF>>                         return 'EOF';