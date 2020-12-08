//
// title: "test nested named groups () mix #1"
// input: 'one, two three, four five'
//
// ...
//

%ebnf
%%
top : word[alice] (',' (word word)[uncle] )*[bob] EOF;

