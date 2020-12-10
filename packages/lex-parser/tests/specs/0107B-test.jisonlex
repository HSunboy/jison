//
// title: "regression for bare action chunks containing | pipe symbol"
// test_input: a b c d 0; a
//
// ...
//

%s THWART

%%

// trouble now is that the *first* indent after an empty line would be rule start, 
// any other indent SHOULD be read as 'action code'.
//
// just trying to thwart the lexer into "recognizing" a 'rule alternate' |-pipe symbol...

<INITIAL,THWART>{

    a           yytext += '7'         
            |
                0;
                return 'A';

    b       return 7 | 40;

    c 
            return 'C';
}

<<EOF>>                         return 'EOF';