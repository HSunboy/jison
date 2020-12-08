//
// title: "test named group () without wildcard operator"
// input: 'one, two'
//
// ...
//

%ebnf
%%
top : word[alice] (',' word)[bob] EOF;

