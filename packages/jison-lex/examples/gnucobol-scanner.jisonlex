// title: GNU COBOL lexer example - unported, hence action code chunks are not verified
//
// ...
//  

/*
   Copyright (C) 2001-2012, 2014-2017 Free Software Foundation, Inc.
   Written by Keisuke Nishida, Roger While, Simon Sobisch, Edwart Hart

   This file is part of GnuCOBOL.

   The GnuCOBOL compiler is free software: you can redistribute it
   and/or modify it under the terms of the GNU General Public License
   as published by the Free Software Foundation, either version 3 of the
   License, or (at your option) any later version.

   GnuCOBOL is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with GnuCOBOL.  If not, see <http://www.gnu.org/licenses/>.
*/


%option case-insensitive
%option never-interactive
%option nodefault

%option do-not-test-compile
%{
/* Local variables */
let last_token_is_dot = 0;
let integer_is_label = 0;
let inside_bracket = 0;
%}

%s DECIMAL_IS_PERIOD DECIMAL_IS_COMMA
%x PICTURE_STATE FUNCTION_STATE

%%

%{
	if (1) {
		this.begin('DECIMAL_IS_PERIOD');
	} else {
		this.begin('DECIMAL_IS_COMMA');
	}

	/* We treat integer literals immediately after '.' as labels;
	   that is, they must be level numbers or section names. */
	if (last_token_is_dot) {
		integer_is_label = 1;
		last_token_is_dot = 0;
	} else {
		integer_is_label = 0;
	}
%}


<*>^[ ]?"#DEFLIT".*\n {
	scan_define_options (yytext);
}

<*>^[ ]?"#OPTION".*\n {
	scan_options (yytext, 1);
}

<*>^[ ]?"#DEFOFF".*\n {
	scan_options (yytext, 2);
}

<*>^[ ]?"#DEFENV".*\n {
	scan_options (yytext, 3);
}

<*>\n {
	cb_source_line++;
}

^"#LINE"[ ]?[0-9]+" ".* {
	/* Line directive */
	char		*p1;
	char		*p2;

	p1 = strchr (yytext, '"');
	if (p1) {
		p2 = cobc_strdup (p1 + 1);
		p1 = strrchr (p2, '"');
		if (p1) {
			*p1 = 0;
			cb_source_file = cobc_parse_strdup (p2);
			cb_source_line = (int)strtol (yytext + 5, NULL, 10) - 1;
		}
		cobc_free (p2);
	}
}

^"#".* {
	/* Ignore */
}

"PIC" |
"PICTURE" {
	this.begin('PICTURE_STATE');
}

"FUNCTION" {
	this.begin('FUNCTION_STATE');
}

[\'\"] {
	/* String literal */
	return 'LITERAL';
}

X\'[^\'\n]*\' |
X\"[^\"\n]*\" {
	/* X string literal */
	return 'LITERAL';
}

N[\'\"] {
	/* N national string literal */
	return 'LITERAL';
}

NX\'[^\'\n]*\' |
NX\"[^\"\n]*\" {
	/* NX string literal */
	return 'LITERAL';
}

Z\'[^\'\n]*\' |
Z\"[^\"\n]*\" {
	/* Z string literal */
	return 'LITERAL';
}

L\'[^\'\n]*\' |
L\"[^\"\n]*\" {
	/* L string literal */
	return 'LITERAL';
}

H\'[^\'\n]*\' |
H\"[^\"\n]*\" {
	/* H hexdecimal/numeric literal */
	return 'LITERAL';
}

B\'[^\'\n]*\' |
B\"[^\"\n]*\" {
	/* B boolean/numeric literal */
	return 'LITERAL';
}

BX\'[^\'\n]*\' |
BX\"[^\"\n]*\" {
	/* BX boolean hexadecimal string literal */
	return 'LITERAL';
}

B#[0-9]* {
	/*
	  To avoid subtle silent errors, such as B#021, this rule (and the ones
	  following) here admit some invalid literals which emit errors when
	  they are processed.
	*/
	/* ACUCOBOL binary numeric literal */
	return 'LITERAL';
}

O#[0-9]* {
	/* ACUCOBOL octal numeric literal */
	return 'LITERAL';
}

X#[0-9A-Za-z]* |
H#[0-9A-Za-z]* {
	/* ACUCOBOL hexadecimal numeric literal */
	return 'LITERAL';
}

\( {
	inside_bracket++;
	return 'TOK_OPEN_PAREN';
}

\) {
	if (inside_bracket > 0) {
		inside_bracket--;
	}
	return 'TOK_CLOSE_PAREN';
}

[0-9]+ {
	if (integer_is_label) {
		/* Integer label or level number */
		return 'WORD';
	}
	return 'LITERAL';
}

[+-][0-9]+ {
	/* Numeric literal (signed) */
	return 'LITERAL';
}

<*>[ ]+ {
	/* Ignore */
}

<*>;+ {
	if (inside_bracket) {
		return 'SEMI_COLON';
	}
	/* Ignore */
}

<DECIMAL_IS_PERIOD>[+-]?[0-9]*\.[0-9]+E[+-]?[0-9]+ {
	/* Numeric floating point literal */
	return 'LITERAL';
}

<DECIMAL_IS_PERIOD>[+-]?[0-9]*\.[0-9]+E[+-]?[0-9]*\.[0-9]+ {
	/* Invalid numeric floating point literal */
	return 'LITERAL';
}

<DECIMAL_IS_PERIOD>[+-]?[0-9]*\.[0-9]+ {
	/* Numeric literal */
	return 'LITERAL';
}

<DECIMAL_IS_PERIOD>,+ {
	if (inside_bracket) {
		return 'COMMA_DELIM';
	}
	/* Ignore */
}

<DECIMAL_IS_COMMA>[+-]?[0-9]*,[0-9]+E[+-]?[0-9]+ {
	/* Numeric floating point literal */
	return 'LITERAL';
}

<DECIMAL_IS_COMMA>[+-]?[0-9]*,[0-9]+E[+-]?[0-9]*,[0-9]+ {
	/* Invalid numeric floating point literal */
	return 'LITERAL';
}

<DECIMAL_IS_COMMA>[+-]?[0-9]*,[0-9]+ {
	/* Numeric literal */
	return 'LITERAL';
}

<DECIMAL_IS_COMMA>,{2,} {
	this.unput(',');
}

<DECIMAL_IS_COMMA>, {
	if (inside_bracket) {
		return 'COMMA_DELIM';
	}
	/* Ignore */
}

"END"[ ,;\n]+"PROGRAM" {
	return 'END_PROGRAM';
}

"END"[ ,;\n]+"FUNCTION" {
	return 'END_FUNCTION';
}

"PICTURE"[ ,;\n]+"SYMBOL" {
	return 'PICTURE_SYMBOL';
}

"FROM"[ ,;\n]+"CRT" {
	return 'FROM_CRT';
}

"SCREEN"[ ,;\n]+"CONTROL" {
	return 'SCREEN_CONTROL';
}

"EVENT"[ ,;\n]+"STATUS" {
	return 'EVENT_STATUS';
}

"READY"[ ,;\n]+"TRACE" {
	return 'READY_TRACE';
}

"RESET"[ ,;\n]+"TRACE" {
	return 'RESET_TRACE';
}

"GREATER"[ ,;\n]+"OR"[ ,;\n]+"EQUAL"[ ,;\n]+"TO"[ ,;\n] |
"GREATER"[ ,;\n]+"OR"[ ,;\n]+"EQUAL"[ ,;\n] |
"GREATER"[ ,;\n]+"THAN"[ ,;\n]+"OR"[ ,;\n]+"EQUAL"[ ,;\n]+"TO"[ ,;\n] |
"GREATER"[ ,;\n]+"THAN"[ ,;\n]+"OR"[ ,;\n]+"EQUAL"[ ,;\n] {
	return 'GREATER_OR_EQUAL';
}

"GREATER"[ ,;\n]+"THAN"[ ,;\n] {
	return 'GREATER';
}

"LESS"[ ,;\n]+"OR"[ ,;\n]+"EQUAL"[ ,;\n]+"TO"[ ,;\n] |
"LESS"[ ,;\n]+"OR"[ ,;\n]+"EQUAL"[ ,;\n] |
"LESS"[ ,;\n]+"THAN"[ ,;\n]+"OR"[ ,;\n]+"EQUAL"[ ,;\n]+"TO"[ ,;\n] |
"LESS"[ ,;\n]+"THAN"[ ,;\n]+"OR"[ ,;\n]+"EQUAL"[ ,;\n] {
	return 'LESS_OR_EQUAL';
}

"LESS"[ ,;\n]+"THAN"[ ,;\n] {
	return 'LESS';
}

"EQUAL"[ ,;\n]+"TO"[ ,;\n] {
	return 'EQUAL';
}

"THEN"[ ,;\n]+"REPLACING"[ ,;\n] {
	return 'REPLACING';
}

"LINES"[ ,;\n]+"AT"[ ,;\n]+"TOP"[ ,;\n] |
"LINES"[ ,;\n]+"TOP"[ ,;\n] |
"AT"[ ,;\n]+"TOP"[ ,;\n] {
	return 'TOP';
}

"LINES"[ ,;\n]+"AT"[ ,;\n]+"BOTTOM"[ ,;\n] |
"LINES"[ ,;\n]+"BOTTOM"[ ,;\n] |
"AT"[ ,;\n]+"BOTTOM"[ ,;\n] {
	return 'BOTTOM';
}

"WITH"[ ,;\n]+"NO"[ ,;\n]+"ADVANCING" |
"NO"[ ,;\n]+"ADVANCING" {
	return 'NO_ADVANCING';
}

"ON"[ ,;\n]+"NEXT"[ ,;\n]+"PAGE"[ ,;\n] |
"NEXT"[ ,;\n]+"PAGE"[ ,;\n] {
	return 'NEXT_PAGE';
}

"NOT"[ ,;\n]+"ON"[ ,;\n]+"SIZE"[ ,;\n]+"ERROR"[ ,;\n] |
"NOT"[ ,;\n]+"SIZE"[ ,;\n]+"ERROR"[ ,;\n] {
	return 'NOT_SIZE_ERROR';
}

"ON"[ ,;\n]+"SIZE"[ ,;\n]+"ERROR"[ ,;\n] |
"SIZE"[ ,;\n]+"ERROR"[ ,;\n] {
	return 'SIZE_ERROR';
}

"NOT"[ ,;\n]+"ON"[ ,;\n]+"ESCAPE"[ ,;\n] |
"NOT"[ ,;\n]+"ESCAPE"[ ,;\n] {
	return 'NOT_ESCAPE';
}

"NOT"[ ,;\n]+"ON"[ ,;\n]+"EXCEPTION"[ ,;\n] |
"NOT"[ ,;\n]+"EXCEPTION"[ ,;\n] {
	return 'NOT_EXCEPTION';
}

"ON"[ ,;\n]+"ESCAPE"[ ,;\n] {
	return 'ESCAPE';
}

"ON"[ ,;\n]+"EXCEPTION"[ ,;\n] {
	return 'EXCEPTION';
}

"NOT"[ ,;\n]+"ON"[ ,;\n]+"OVERFLOW"[ ,;\n] |
"NOT"[ ,;\n]+"OVERFLOW"[ ,;\n] {
	return 'NOT_OVERFLOW';
}

"NOT"[ ,;\n]+"AT"[ ,;\n]+"END"[ ,;\n] |
"NOT"[ ,;\n]+"END"[ ,;\n] {
	return 'NOT_END';
}

"AT"[ ,;\n]+"END"[ ,;\n] {
	return 'END';
}

"ON"[ ,;\n]+"OVERFLOW"[ ,;\n] |
"OVERFLOW"[ ,;\n] {
	return 'TOK_OVERFLOW';
}

"NOT"[ ,;\n]+"AT"[ ,;\n]+"END-OF-PAGE"[ ,;\n] |
"NOT"[ ,;\n]+"AT"[ ,;\n]+"EOP"[ ,;\n] |
"NOT"[ ,;\n]+"END-OF-PAGE"[ ,;\n] |
"NOT"[ ,;\n]+"EOP"[ ,;\n] {
	return 'NOT_EOP';
}

"AT"[ ,;\n]+"END-OF-PAGE"[ ,;\n] |
"AT"[ ,;\n]+"EOP"[ ,;\n] |
"END-OF-PAGE"[ ,;\n] |
"EOP"[ ,;\n] {
	return 'EOP';
}

"NOT"[ ,;\n]+"INVALID"[ ,;\n]+"KEY"[ ,;\n] {
	return 'NOT_INVALID_KEY';
}

"NOT"[ ,;\n]+"INVALID"[ ,;\n] {
	return 'NOT_INVALID_KEY';
}

"INVALID"[ ,;\n]+"KEY"[ ,;\n] {
	return 'INVALID_KEY';
}

"INVALID"[ ,;\n] {
	return 'INVALID_KEY';
}

"NO"[ ,;\n]+"DATA"[ ,;\n] {
	return 'NO_DATA';
}

"WITH"[ ,;\n]+"DATA"[ ,;\n] {
	return 'DATA';
}

"UPON"[ ,;\n]+"ENVIRONMENT-NAME" {
	return 'UPON_ENVIRONMENT_NAME';
}

"UPON"[ ,;\n]+"ENVIRONMENT-VALUE" {
	return 'UPON_ENVIRONMENT_VALUE';
}

"UPON"[ ,;\n]+"ARGUMENT-NUMBER" {
	return 'UPON_ARGUMENT_NUMBER';
}

"UPON"[ ,;\n]+"COMMAND-LINE" {
	return 'UPON_COMMAND_LINE';
}

"AFTER"[ ,;\n]+"EXCEPTION"[ ,;\n]+"CONDITION"[ ,;\n] {
	return 'EXCEPTION_CONDITION';
}

"EXCEPTION"[ ,;\n]+"CONDITION"[ ,;\n] {
	return 'EXCEPTION_CONDITION';
}

"AFTER"[ ,;\n]+"EC"[ ,;\n] {
	return 'EC';
}

"LENGTH"[ ,;\n]+"OF"[ ,;\n] {
	/* FIXME: check with "lookup_register ("LENGTH OF") != NULL"
	          if we actually want to do this,
			  otherwise return 2 (!) WORD tokens (by adding a que
			  of tokens to be returned)
	*/
	return 'LENGTH_OF';
}

"SWITCH"[ ]+([0-9][0-9]?|[A-Z])[ ,;\n] {
	/* ACUCOBOL extension: switch-names with space and with letter */

	unput (yytext[yyleng-1]); /* unput seperator */
	/* FIXME: move the code for filling "name" here and first
	          check with "lookup_system_name (name) != NULL"
	          if we actually want to do this,
			  otherwise return 2 (!) WORD tokens (by adding a que
			  of tokens to be returned)
	*/
	return 'WORD';
}

[A-Z0-9\x80-\xFF]([_A-Z0-9\x80-\xFF-]*[A-Z0-9\x80-\xFF]+)? {
	return 'WORD';
}

"<=" {
	return 'LESS_OR_EQUAL';
}

">=" {
	return 'GREATER_OR_EQUAL';
}

"<>" {
	return 'NOT_EQUAL';
}

"**" {
	return 'EXPONENTIATION';
}

"."([ \n]*".")* {
	if (last_token_is_dot || strlen (yytext) > 1) {
		cb_warning (COBC_WARN_FILLER, _("ignoring redundant ."));
	}

	if (!last_token_is_dot) {
		last_token_is_dot = 1;
		return 'TOK_DOT';
	}
}

"&" {
	return 'TOK_AMPER';
}

":" {
	return 'TOK_COLON';
}

"=" {
	return 'TOK_EQUAL';
}

"/" {
	return 'TOK_DIV';
}

"*" {
	return 'TOK_MUL';
}

"+" {
	return 'TOK_PLUS';
}

"-" {
	return 'TOK_MINUS';
}

"<" {
	return 'TOK_LESS';
}

">" {
	return 'TOK_GREATER';
}

. {
	let	c;

	yyerror(`invalid symbol '${yytext}' - skipping word`);
	while ((c = this.input()) != this.EOF) {
		if (c === '\n' || c === ' ') {
			break;
		}
	}
	if (c !== this.EOF) {
		this.unput(c);
	}
}


<PICTURE_STATE>{
  "IS" {
	/* Ignore */
  }
  [^ \n;]+ {
	BEGIN INITIAL;
	return 'PICTURE';
  }
}

<FUNCTION_STATE>{
  [A-Z0-9-]+ {
	return 'FUNCTION_NAME';
  }
  . {
	return yytext[0];
  }
}

<<EOF>> {
	/* At EOF - Clear variables */
	last_token_is_dot = 0;
	integer_is_label = 0;
	inside_bracket = 0;
	yyterminate();
}

%%

function scan_options (text, optype)
{
}

function scan_define_options (text)
{
}

