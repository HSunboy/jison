//
// title: test windows line endings
// crlf: windows
// test_input: '[a\n\t     b]'
// 
// ...
//

%%
"["[^\]]"]" %{
return true;
%}

