// title: "%token processing"
// test_input: "F 1"
// ...
//  
%options parser-errors-are-recoverable lexer-errors-are-recoverable

%code imports %{
  import JSON5 from '@gerhobbelt/json5';            // TODO: quick fix until `%code imports` works in the lexer spec!
%}

%nonassoc NA NB

%left '*' '+' '?' RANGE_REGEX
%left '|'
%left '('

%token NAME_BRACE  "macro name in '{...}' curly braces"
%token TRUE FALSE DOT NULL STRING
%token <string>   IDENTIFIER
%token <value>    VALUE
%type <value>     expression
%token TOKEN_EOF 0 "end of file"
%token W 42 <int>

// You can explicitly specify the numeric code for a token kind 
// by appending a nonnegative decimal or hexadecimal integer value 
// in the field immediately following the token name:

%token NUM 300
%token XNUM 0x12d // a GNU extension

%union {              /* define stack type */
  double val;
  symrec *tptr;
}
%token <val> NUM      /* define token NUM and its type */

// You can associate a literal string token with a token kind name 
// by writing the literal string at the end of a %token declaration 
// which declares the name. For example: 

%token  <operator>  OR      "||"
%token  <operator>  LE 134  "<="

// %left <type> symbols…

// For backward compatibility, there is a confusing difference 
// between the argument lists of %token and precedence declarations. 
// Only a %token can associate a literal string with a token kind name. 
// A precedence declaration always interprets a literal string as 
// a reference to a separate token. For example: 

%left  XOR ">="         // Does not declare an alias.
%left  BANG 134 "<<" 135 // Declares 134 for BANG and 135 for "<<".

%precedence  CAT "?"     // gives only precedence to the symbols, and defines no associativity at all. Use this to define precedence only, and leave any potential conflict due to associativity enabled. 

%token
    OR     "||"
    LPAREN "("
    RPAREN ")"
    '\n'   "end of line"
  <double>
    NUM    "number"


%option default-action-mode=skip,merge


%%

%{
    const OPTION_VALUE = 0x0001;
%}


start
    : init 'F' '1' EOF
    ;

init : ; 
