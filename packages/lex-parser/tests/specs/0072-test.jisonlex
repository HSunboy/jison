//
// title: test braced action with surplus whitespace between rules
// test_input: 'ababbaab'
//
// ...
//

%%
"a" %{  //
return true;
%}  //
  //
"b" %{    return 11;
%}  //
  //

