//
// title: "test nested unnamed groups () without wildcard operator #2"
// input: 'one, two three'
//
// ...
//

%ebnf
%%
top : word[alice] ( ',' ( word word) ) EOF;

