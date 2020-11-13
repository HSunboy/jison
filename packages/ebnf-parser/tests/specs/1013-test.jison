//
// title: errorneous grammar spec (missing semicolon)
//
// ...
//

%ebnf
%%
// missing ; at end of rules:
top : word+ EOF

bottom : word+ EOF;
