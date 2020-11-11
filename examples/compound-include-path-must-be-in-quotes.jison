
/* 
 * description: compound %include paths must be put in quotes, or you'll get an error.
 *
 * This grammar will therefor FAIL TO COMPILE in JISON!
 */



/* lexical grammar */
%lex

%%

\s+                   /* skip whitespace */

<<EOF>>               return 'EOF';
.                     return 'INVALID';

/lex





%%


expressions
    : v EOF
    ;

v
    : NUMBER
    | error
    ;





// ----------------------------------------------------------------------------------------

%%


// This will error due to no quotes around the compound path:

%include includes/benchmark.js



