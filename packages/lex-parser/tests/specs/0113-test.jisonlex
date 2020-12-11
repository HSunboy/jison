//
// title: "options: easy_keyword_rules lexer-errors-are-recoverable"
// test_input: null 95 ZZ extends main
//
// ...
//

digit      [0-9]
id         [a-zA-Z_][a-zA-Z0-9_]*

%options easy_keyword_rules parser-errors-are-recoverable
%%

\/\/.*         /* ignore comment */
main          return 'MAIN';
class         return 'CLASS';
extends       return 'EXTENDS';
nat           return 'NATTYPE';
if            return 'IF';
else          return 'ELSE';
for           return 'FOR';
printNat      return 'PRINTNAT';
readNat       return 'READNAT';
this          return 'THIS';
new           return 'NEW';
var           return 'VAR';
null          return 'NUL';
{digit}+        return 'NATLITERAL';
{id}            return 'ID';
\s+             /* skip whitespace */
.               return yyerror('Illegal character');   // with the %options, yyerror should not throw, but return an error token instead.
$               return 'ENDOFFILE';

<<EOF>>         return 'EOF';