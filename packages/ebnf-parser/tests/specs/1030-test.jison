//
// title: test named group ()
// input: 'one, two'
//
// ...
//

%ebnf
%%
top : word[alice] (',' word)*[bob] EOF;

