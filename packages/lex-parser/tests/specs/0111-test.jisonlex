//
// title: "options: easy_keyword_rules should augment the lexer regex rules"
// test_input: main class extends nat if else for printNat readNat this new var null
//
// ...
//

digit      [0-9]
id         [a-zA-Z_][a-zA-Z0-9_]*

%options easy_keyword_rules 
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
.               return 'Illegal character';
$               return 'ENDOFFILE';

<<EOF>>         return 'EOF';