//
// title: test options spread across multiple lines
// test_input: 'foofoofoo'
//
// ...
//
// option names are camelcased: camel-casing is done very early in the game: see lex.y source code.
// 

%options ping=666
 bla=blub
 bool1 s1="s1value"
 s2='s2value'
 s3=false
 s4="false"
 a-b-c="d"
%%
"foo" 				yytext += `:${yy.options.s2}:${yy.options.aBC}:${yy.options.bool1}:${yy.options.bla}:${yy.options.s1}`; return 11;

