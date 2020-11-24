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
 *********************************************************************
 */

// %option noyywrap

%{
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
    yylval.value = atof(yytext);
    return VALUE;
    }
{DIGIT}+"."{DIGIT}*        {
    yylval.value = atof(yytext);
    return VALUE;
    }
{DIGIT}+[eE]["+""-"]?{DIGIT}*        {
    yylval.value = atof(yytext);
    return VALUE;
    }
{DIGIT}+"."{DIGIT}*[eE]["+""-"]?{DIGIT}*        {
    yylval.value = atof(yytext);
    return VALUE;
    }
{ID}        {
    yylval.string = yytext;
    return IDENTIFIER;
    }
"+"       { return ADD; }
"-"       { return SUB; }
"*"       { return MULT; }
"/"       { return DIV; }
"("       { return LBRACE; }
")"       { return RBRACE; }
";"       { return SEMICOLON; }
"="       { return ASSIGN; }

.         {
    return yytext[0];
    }
%%

/*--------------------------------------------------------------------
 * lex.l
 *------------------------------------------------------------------*/

function atof(str) {
    return Number(str);
}