//
// title: "test nested named groups ()"
// input: 'one, two three four five'
//
// ...
//

%ebnf
%%
top : word[alice] (',' (word word)*[uncle] )*[bob] EOF;

