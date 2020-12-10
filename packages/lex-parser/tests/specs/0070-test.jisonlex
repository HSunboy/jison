//
// title: "test macro for commit SHA-1: 1246dbb75472cee8e4e91318cc5a0d4739a8fe12"
// crlf: windows
// test_input: 'a \n c\nd\n'
// 
// ...
//

BR  \r\n|\n|\r
%%
{BR} %{
return true;
%}

