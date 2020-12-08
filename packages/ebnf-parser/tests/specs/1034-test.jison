//
// title: "test nested unnamed groups () without wildcard operator #1"
// input: 'one, two'
//
// ...
//

%ebnf
%%
top : word[alice] ( (',' word) ) EOF;

