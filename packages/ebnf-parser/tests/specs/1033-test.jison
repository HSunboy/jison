//
// title: "test unnamed group () without wildcard operator"
// input: 'one, two'
//
// ...
//

%ebnf
%%
top : word[alice] (',' word) EOF;

