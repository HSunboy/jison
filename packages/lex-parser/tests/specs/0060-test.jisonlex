//
// title: test no brace action with surplus whitespace between rules
// test_input: 'abaabb'
//
// ...
//

%%
"a" return true;
  //
"b" return 1;
  //

