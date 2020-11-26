//
// title: "should support multiple '%code imports' chunks"
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