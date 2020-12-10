//
// title: "regression for bare action chunks containing | pipe symbol"
// test_input: a b c d 0; a
//
// ...
//

%s THWART

%%

// now the | char is inside an {...} action code chunk, and while though it's a 'raw' action code chunk,
// the {...} enclosure should suffice to make the lexer recognize this as action code like any human would.
//
// just trying to thwart the lexer into "recognizing" a 'rule alternate' |-pipe symbol...

<INITIAL,THWART>{

    a   {       yytext += '7'         
            |
                0;
                return 'A';
        }
    b       return 7 | 40;

    c 
            return 'C';
}

<<EOF>>                         return 'EOF';