// title: minimal lexer example with arrow action
// test_input: "foo foo foofoofoo\nfoo FOO foo"
// ...
//  

// minimal lexer to help make the test grammars run and do "something sensible"
%%
'foo' 			-> 'foo'