//
// title: 'test quoted tokens (edge case #1)'
// input: '"'
//
// ...
//
// a weird 'token' consisting of a single AND a double-quote: either way, one of them will end up being escaped!
//

%ebnf
%%
top : '"\'' EOF;

