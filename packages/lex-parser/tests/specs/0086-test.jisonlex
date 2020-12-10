//
// title: "should support multiple '%code imports' chunks"
// test_input: 'becky 7?'
//
// ...
//

%code imports %{
  const XRegExp = require('@gerhobbelt/xregexp');
%}

ASCII_LETTER                            [a-zA-z]

%code imports %{
  const helpers = require('../../../helpers-lib');
%}



%%
{ASCII_LETTER}		-> 'A'
\s 					-> ' '
.					-> '?'