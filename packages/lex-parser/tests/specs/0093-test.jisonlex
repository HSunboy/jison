//
// title: "erroneous lexer rule coding"
// test_input: 'a "\a/b\c/d\u14a7",becky boo"\\",37'
//
// ...
//

digit [0-9]
id [a-zA-Z_\$][a-zA-Z0-9_\$]*
esc \\

%%


{id}                            return 'IDENT'
{digit}                         return 'NUMBER'
// next line is lightly wrong: the trailing semicolon (which is part of the regex, but the action code does not seem to reflect this with `yyleng-2`:
\"(?:{esc}[\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\"{esc}])*\", 
								yytext = yytext.substr(1,yyleng-2); return 'STRING';


<<EOF>>                         return 'EOF';