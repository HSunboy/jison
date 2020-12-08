//
// title: "test named option (?)"
// input: 
// - 'oneor two'
// - 'oneword'
//
// ...
//

%ebnf
%%
top : word[alex] word?[bob] EOF;

