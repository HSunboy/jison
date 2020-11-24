/* ICL language grammar
*
* Copyright (c) 2017 by Mahieddine CHERIF
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*
* Project : Ichiro configuration language
* Developed by : Mahieddine CHERIF 
*/


%options case-insensitive
%options flex

DIGIT                                                   [0-9]
DIGITS                                                  {DIGIT}+
FLOAT                                                   ['+'|'-']?{DIGITS}[.]{DIGITS}
EQUAL_OPERATOR                                          ['=']
INTEGER                                                 {DIGITS}|\-{DIGITS}|\+{DIGITS}
BOOLEAN                                                 "true"|"false"
FRAC                                                    [.]{DIGITS}
EXP                                                     {E}{DIGITS}
E                                                       [eE][+-]?
HEX_DIGIT                                               [0-9a-f]
NUMBER                                                  {FLOAT}|{INTEGER}
NULL                                                    "null"
NONDIGIT_ASCII_CHAR                                     [a-z|A-Z|_|\-]
UNESCAPEDCHAR                                           [ -!#-\[\]-~]
ESCAPEDCHAR                                             \\["\\bfnrt/]
UNICODECHAR                                             \\u{HEX_DIGIT}{HEX_DIGIT}{HEX_DIGIT}{HEX_DIGIT}
CHAR                                                    {UNESCAPEDCHAR}|{ESCAPEDCHAR}|{UNICODECHAR}
STRING                                                  ((?=[\"\'])(?:\"[^\"\\]*(?:\\[\s\S][^\"\\]*)*\"|\'[^\'\\]*(?:\\[\s\S][^\'\\]*)*\'))
MULTILINE_STRING                                        ['<']{3}([a-z|A-Z|_]+)(.|\r|\n)*\2
CHARS                                                   {CHAR}+
ASCII_CHAR                                              [a-z|A-Z|_|\-|0-9]
SINGLE_QUOTE                                            ["'"]                                  
DBL_QUOTE                                               ["]
COMMA                                                   [,]
WHITESPACE                                              [\s|\n|\r|\t]
NEWLINE                                                 [\n|\r]
ANY_CHAR                                                .|[\r|\n]
ALL_CHARS                                               [\s|\S]
MULTILINE_COMMENT                                       ('/*'([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|('//'.*)
INLINE_COMMENT                                          ('#'|'//').*?(\n|\$)
PARAM_PREFIX                                            ['@']  
OPEN_BRACKET                                            '['
CLOSE_BRACKET                                           ']'

%s start_block_declaration
%s start_block_hierarchy
%s take_begin_declaration
%s start_inheritance_declaration
%s start_block_param_declaration
%%

/* we must declare it before identifier! */

{MULTILINE_COMMENT}|{INLINE_COMMENT}                                            /*skip comments*/
^take                                                                           {
                                                                                    this.begin('take_begin_declaration');
                                                                                    return 'TAKE_DECLARATION';
                                                                                }

<take_begin_declaration>{COMMA}                                                 {
                                                                                    return 'IMPORT_SEPARATOR';
                                                                                }

<take_begin_declaration>((\$\/)*(({ASCII_CHAR}|[.]{1,2})+)(\/({ASCII_CHAR}+|[.]{1,2}))*)                {
                                                                                    //console.log(yy.lexer.rules);
                                                                                    return 'FILE_NAME';
                                                                                }

<take_begin_declaration>{NEWLINE}+                                              {
                                                                                    this.popState();
                                                                                }
[\s|\r\n|\r|\n]+   								                                /* skip whitespaces + new lines */
<start_block_hierarchy,start_block_param_declaration,start_block_declaration>\bfrom\b   {
                                                                                    this.begin('start_inheritance_declaration');
                                                                                    return 'FROM';
                                                                                }            
<start_block_hierarchy>\bapply\b                                                {
                                                                                    return 'APPLY';
                                                                                }
<start_block_hierarchy>\bas\b                                                   {                                                                                    
                                                                                    return 'AS';
                                                                                }
<start_block_hierarchy>\btable\b                                                {
                                                                                    return 'TABLE';
                                                                                }
\b{NONDIGIT_ASCII_CHAR}+({DIGIT}|{NONDIGIT_ASCII_CHAR})*('.'{NONDIGIT_ASCII_CHAR}+({DIGIT}|{NONDIGIT_ASCII_CHAR})?)+\b {                                                                                    
                                                                                    return 'PARENT_BLOCK';
                                                                                }                                                                                
/* an identifier indicate a start configuration block declaration
   so we initiate the state start_block_declaration
*/
(?!true|false|null)('::')?\b({NONDIGIT_ASCII_CHAR}+{DIGIT}*{NONDIGIT_ASCII_CHAR}*)|(true|false|null)({NONDIGIT_ASCII_CHAR}+{DIGIT}*{NONDIGIT_ASCII_CHAR}*)\b {   
                                                                                    //console.log(yy.lexer.rules);
                                                                                    this.begin('start_block_declaration');
                                                                                    return 'IDENTIFIER';
                                                                                 }
/*
   a block name declaration can only be declared after the begining of the block declaration
*/
<start_block_declaration,start_block_hierarchy>{DBL_QUOTE}\b{NONDIGIT_ASCII_CHAR}+{DIGIT}*{NONDIGIT_ASCII_CHAR}*\b{DBL_QUOTE}
                                                                                 {
                                                                                     this.begin('start_block_hierarchy');
                                                                                     //https://github.com/zaach/jison/issues/340
                                                                                     // remove string quotes
                                                                                     yytext = this.matches[0].replace(/^"|"$/g, '');
                                                                                     return 'ASCII_STRING';
                                                                                 }
<start_block_declaration,start_block_hierarchy,start_block_param_declaration>({PARAM_PREFIX}{1,2})({NONDIGIT_ASCII_CHAR}+{DIGIT}*{NONDIGIT_ASCII_CHAR}*)('.'({NONDIGIT_ASCII_CHAR}+{DIGIT}*{NONDIGIT_ASCII_CHAR}*))* {
                                                                                    //console.log(yy.lexer.rules);
                                                                                    this.begin('start_block_param_declaration');
                                                                                    return 'PARAM';
                                                                                }
<start_block_declaration,start_inheritance_declaration>{PARAM_PREFIX}           {                                                                                   
                                                                                    return 'PARAM_PREFIX';
                                                                                }
/*
    a block primitive value can only exists after the block name
*/
<start_block_declaration,start_inheritance_declaration,start_block_hierarchy,start_block_param_declaration>{MULTILINE_STRING} {                                                                                    
                                                                                    // retrieve marker seq
                                                                                    let markerSeq = this.matches[0].replace(/['<']{3}([a-z|A-Z|_]+)(.|\r|\n)*\1/g, '$1'); 
                                                                                    // remove here document
                                                                                    yytext = this.matches[0].replace(new RegExp('^<<<'+markerSeq+'|'+markerSeq+'$', "g"),'');
                                                                                    return 'BLOCK_VALUE_PRIMITIVE';
                                                                                 }
/*
    a block primitive value can only exists after the block name
*/
<start_block_declaration,start_inheritance_declaration,start_block_hierarchy,start_block_param_declaration>({NUMBER}|{BOOLEAN}|{STRING}|{NULL}) {                                                                                   
                                                                                    if(!isNaN(yytext)) {
                                                                                        yytext = Number(yytext);
                                                                                    }                                                                                    
                                                                                    if(typeof yytext ==='string') {                                                                                                                                                                   
                                                                                        // remove string quotes
                                                                                        //yytext = this.matches[0].replace(/^"|"|^'|'$/g, '');
                                                                                        yytext = this.matches[0].replace(/^"|"$|^'|'$/g, '');
                                                                                        //yytext = this.matches[0].replace(/^'|'$/g, '');
                                                                                        if(yytext.toLowerCase() === 'true') {
                                                                                            yytext = true;
                                                                                        } else if(yytext.toLowerCase() === 'false') {
                                                                                            yytext = false;
                                                                                        } 
                                                                                        else if(yytext == 'null') {
                                                                                            yytext = {};
                                                                                        }                                                                                        
                                                                                    }

                                                                                    return 'BLOCK_VALUE_PRIMITIVE';
                                                                                 }
/*all complex block values starts with '{'*/
<start_block_declaration,start_block_hierarchy,start_inheritance_declaration,start_block_param_declaration>'{' 
                                                                                {
                                                                                    return 'BLOCK_VALUE_COMPLEX_START';
                                                                                }
/*all complex block values ends with '}'*/
<start_block_declaration,start_block_hierarchy,start_inheritance_declaration,start_block_param_declaration>'}' {        
                                                                                    this.popState();
                                                                                    this.popState();
                                                                                    return 'BLOCK_VALUE_COMPLEX_END';
                                                                                }
<start_block_declaration,start_block_hierarchy,start_inheritance_declaration,start_block_param_declaration>{EQUAL_OPERATOR} {
                                                                                    return 'EQUAL_OPERATOR';
                                                                                }
<start_block_declaration,start_block_hierarchy,start_inheritance_declaration,start_block_param_declaration>{CLOSE_BRACKET}                                                                  {
                                                                                    return 'CLOSE_BRACKET';
                                                                                }
<start_block_declaration,start_block_hierarchy,start_inheritance_declaration,start_block_param_declaration>{OPEN_BRACKET}                                                                  {
                                                                                    return 'OPEN_BRACKET';
                                                                                }
{COMMA}                                                                         {
                                                                                    return 'COMMA_SEPARATOR';
                                                                                }
<<EOF>>								                                            return 'EOF'    ;
.												                                return 'INVALID';
