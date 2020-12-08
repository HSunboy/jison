//
// title: test named repeat (*) with %option default-action-mode=skip
// input: oneword
//
// ...
//

%option default-action-mode=skip
%ebnf
%%
top : word*[bob] EOF;

