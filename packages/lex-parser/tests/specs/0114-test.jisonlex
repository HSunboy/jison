// title: arrow action error with continue-on-error
// test_input: "F 1"
// ...
//  
%options parserErrorsAreRecoverable
%%
'foo' 			-> 1 + err