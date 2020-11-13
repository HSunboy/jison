//
// title: errorneous grammar 
//
// ...
//

%ebnf
%%
// double :: instead of single :
top :: word+ EOF;

bogus: foo bar;
