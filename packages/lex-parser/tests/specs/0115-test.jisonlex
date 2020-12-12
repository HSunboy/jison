// title: arrow action error with continue-on-error
// test_input: "F 1"
// ...
//  
%options parserErrorsAreRecoverable
%%
'foo' 			-> // nada => error in arrow function!