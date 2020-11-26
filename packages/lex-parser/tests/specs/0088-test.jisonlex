//
// title: "mistake tolerated by vanilla jison but not accepted by jison-gho"
// test_input: "2020-11-12\n%%\nX"
// ...
//


%%

\%%[^\n]*               /* erroneous escape: MUST escape both % */
\d\d\d\d"-"\d\d"-"\d\d  return 'date';
":"                         return ':';
[\s\r\n]					return 'WS';
<<EOF>>                     return 'EOF';
.                           return 'INVALID';

