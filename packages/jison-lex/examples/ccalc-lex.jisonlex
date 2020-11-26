// title: Simple lexer example - a lexer spec without any errors
// test_input: a=3+-71e2
// ...
//  

/*! @file lex.l
 * @brief Lexical Analysis
 *********************************************************************
 * a simple calculator with variables
 * 
 * sample-files for a artikel in developerworks.ibm.com
 * Author: Christian Hagen, chagen@de.ibm.com
 * 
 * @par lex.l & lex.c
 * input for flex the lexical analysis generator
 * 
 * Ported to jison-gho (JavaScript)
 *
 *********************************************************************
 */

// Note:
//
// We don't use `yylval` global like the original flex/lex spec, but
// assign to `yytext` instead, which is /not/ a global and can carry
// any value to t he calling parser.

%{
    // no special init code
%}

/*--------------------------------------------------------------------
 * 
 * flex definitions
 * 
 *------------------------------------------------------------------*/
DIGIT    [0-9]
ID       [_a-zA-Z][_a-zA-Z0-9]*

%%

[ \t\r\n]+  {
        /* eat up whitespace */
    }
{DIGIT}+  {
        yytext = atof(yytext);
        return 'VALUE';
    }
{DIGIT}+"."{DIGIT}*        {
        yytext = atof(yytext);
        return 'VALUE';
    }
{DIGIT}+[eE]["+""-"]?{DIGIT}*        {
        yytext = atof(yytext);
        return 'VALUE';
    }
{DIGIT}+"."{DIGIT}*[eE]["+""-"]?{DIGIT}*        {
        yytext = atof(yytext);
        return 'VALUE';
    }
{ID}        {
        // keep yytext as-is
        return 'IDENTIFIER';
    }
"+"       { return 'ADD'; }
"-"       { return 'SUB'; }
"*"       { return 'MULT'; }
"/"       { return 'DIV'; }
"("       { return 'LBRACE'; }
")"       { return 'RBRACE'; }
";"       { return 'SEMICOLON'; }
"="       { return 'ASSIGN'; }

.         {
        return yytext;
    }
%%

/*--------------------------------------------------------------------
 * lex.l
 *------------------------------------------------------------------*/

function atof(str) {
    return Number(str);
}