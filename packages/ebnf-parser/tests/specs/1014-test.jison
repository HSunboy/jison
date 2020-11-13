//
// title: errorneous grammar 
//
// ...
//

%ebnf
%%
// arrow notation for productions is not supported
top -> word+ EOF;

bogus: foo bar;
