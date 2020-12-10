//
// title: "%code chunks with other labels than init/required/imports should be appended at the end"
// test_input: 'becky 7!'
//
// ...
//

%code A %{
  // first A chunk
  console.log('A');
%}

ASCII_LETTER                            [a-zA-z]

%code B %{
  // first B chunk
  console.log('B');
%}

%code A %{
  // second A chunk
  console.log('C');
%}



%%
{ASCII_LETTER}		-> 'A'
\s 					-> ' '
.					-> '?'