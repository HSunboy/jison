//
// title: "regression for bare action chunks containing | pipe symbol"
// test_input: a b c d 0; a
//
// ...
//

%%

// no | pipe symbol at start of line should suffice to make lexer recognize this a code, like any human would.
//
// just trying to thwart the lexer into "recognizing" a 'rule alternate' |-pipe symbol...

a           yytext += '7'         |
            0;
            return 'A';

b       return 7 | 40;

c 
        return 'C';

<<EOF>>                         return 'EOF';