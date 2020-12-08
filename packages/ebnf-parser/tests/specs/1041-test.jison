//
// title: "test named complex expression (())"
// input: "one two three four, five,"
//
// ...
//

%ebnf
%%
top : word[alpha] (word[alex] (word[bob] word[carol] ',')+[david] word ',')*[enoch] EOF;

