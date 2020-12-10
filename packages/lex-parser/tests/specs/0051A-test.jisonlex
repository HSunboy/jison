//
// title: "test *sans* %options flex"
// test_input: 'foofoofoo'
//
// ...
//

// %options flex  -- not using this option means first come, first serve in the lexer
%%
"foo" return 11;
"foofoo" return 12;

