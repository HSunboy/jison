/* Patterns: Numeric Literal */
DecimalDigits                       [0-9]+
DecimalIntegerLiteral               "0"|([1-9]{DecimalDigits}?)
ExponentPart                        [eE][+-]?{DecimalDigits}
DecimalLiteral                      ({DecimalIntegerLiteral}"."{DecimalDigits}?{ExponentPart}?)|("."{DecimalDigits}{ExponentPart}?)|({DecimalIntegerLiteral}{ExponentPart}?)
OctalDigit                          [0-7]
OctalIntegerLiteral                 "0"{OctalDigit}+
// jison-gho reports error for this one as it clashes with Unicode regex \p{HexDigit} and thus would cause ambiguity/confusion:
//HexDigit                            [0-9a-fA-F]
// --> renamed to HexadecimalDigit
HexadecimalDigit                    [0-9a-fA-F]
HexIntegerLiteral                   "0"[xX]{HexadecimalDigit}+
NumericLiteral                      {HexIntegerLiteral}|{OctalIntegerLiteral}|{DecimalLiteral}

/* Patterns: String Literal */
LineContinuation                    \\(\r\n|\r|\n)
OctalEscapeSequence                 (?:[1-7][0-7]{0,2}|[0-7]{2,3})
HexEscapeSequence                   [x]{HexadecimalDigit}{2}
UnicodeEscapeSequence               [u]{HexadecimalDigit}{4}
CharacterEscapeSequence             [^0-9xu]
EscapeSequence                      {CharacterEscapeSequence}|{OctalEscapeSequence}|{HexEscapeSequence}|{UnicodeEscapeSequence}
DoubleStringCharacter               ([^\"\\\n\r]+)|(\\{EscapeSequence})|{LineContinuation}
SingleStringCharacter               ([^\'\\\n\r]+)|(\\{EscapeSequence})|{LineContinuation}
StringLiteral                       (\"{DoubleStringCharacter}*\")|(\'{SingleStringCharacter}*\')

/* Patterns: Regular Expression Literal */
RegularExpressionNonTerminator      [^\n\r]
RegularExpressionBackslashSequence  \\{RegularExpressionNonTerminator}
RegularExpressionClassChar          [^\n\r\]\\]|{RegularExpressionBackslashSequence}
RegularExpressionClass              \[{RegularExpressionClassChar}*\]
RegularExpressionFlags              {IdentifierPart}*
RegularExpressionFirstChar          ([^\n\r\*\\\/\[])|{RegularExpressionBackslashSequence}|{RegularExpressionClass}
RegularExpressionChar               ([^\n\r\\\/\[])|{RegularExpressionBackslashSequence}|{RegularExpressionClass}
RegularExpressionBody               {RegularExpressionFirstChar}{RegularExpressionChar}*
RegularExpressionLiteral            \/{RegularExpressionBody}\/{RegularExpressionFlags}

/* Patterns: Identifier */
IdentifierStart                     [$_A-Za-z\x7f-\uffff]|\\{UnicodeEscapeSequence}
IdentifierPart                      {IdentifierStart}|[0-9]
IdentifierName                      {IdentifierStart}{IdentifierPart}*

%%

\s+                                 /* skip whitespaces */;

/* Tokens: Literal */
"null"                              return 'NULL';
"undefined"                         return 'UNDEFINED';
"true"                              return 'TRUE';
"false"                             return 'FALSE';
{NumericLiteral}                    return 'NUMBER';
{StringLiteral}                     return 'STRING';
{RegularExpressionLiteral}          return 'REGEXP';

/* Tokens: Operator */
","                                 return ",";
"?"                                 return '?';
":"                                 return ':';
"||"                                return '||';
"&&"                                return '&&';
"|"                                 return '|';
"^"                                 return '^';
"&"                                 return '&';
"<<"                                return '<<';
">>>"                               return '>>>';
">>"                                return '>>';
"==="                               return '===';
"!=="                               return '!==';
"=="                                return '==';
"!="                                return '!=';
"<="                                return '<=';
"<"                                 return '<';
">="                                return '>=';
">"                                 return '>';
"+"                                 return '+';
"-"                                 return '-';
"*"                                 return '*';
"/"                                 return '/';
"%"                                 return '%';
"!"                                 return '!';
"~"                                 return '~';
"("                                 return '(';
")"                                 return ')';
"["                                 return '[';
"]"                                 return ']';
"."                                 return '.';
"in"                                return 'IN';
"instanceof"                        return 'INSTANCEOF';
"typeof"                            return 'TYPEOF';

/* Tokens: Others */
{IdentifierName}                    return 'IDENTIFIER';
<<EOF>>                             return 'EOF';

