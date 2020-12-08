//
// title: "test nested named groups () mix #3"
// input: 'one, two three four five, six seven eight nine'
//
// ...
//

%ebnf
%%
top : word[alice] (',' (word word) (word word) )*[bob] EOF;

