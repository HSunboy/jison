//
// title: "test named complex expression (()) with %option default-action-mode=skip"
// input: "one two three four, five,"
//
// ...
//

%ebnf
%option default-action-mode=skip
%%
top : word[alpha] (word[alex] (word[bob] word[carol] ',')+[david] word ',')*[enoch] EOF;

