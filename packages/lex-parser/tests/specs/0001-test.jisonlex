
//
// title: test lex grammar with macros
// test_input: "{9ohhai}{D}ohhai"
//
// ...
//

D [0-9]
ID [a-zA-Z_][a-zA-Z0-9_]+

%%

{D}"ohhai" {return '{D}ohhai';}
"{" return '{';

