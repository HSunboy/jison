//
// title: "test nested named groups () mix #2"
// input: 'one, two three, four five'
//
// ...
//

%ebnf
%%
top : word[alice] (',' (word word) )*[bob] EOF;

