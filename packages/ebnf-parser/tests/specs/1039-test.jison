//
// title: "test nested named groups () mix #4"
// input: 'one, two, three, four'
//
// ...
//

%ebnf
%%
top : word[alice] (',' (word)[uncle] )*[bob] EOF;

