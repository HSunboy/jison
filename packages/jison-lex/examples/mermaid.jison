/** mermaid
 *  http://knsv.github.io/mermaid/
 *  (c) 2015 Knut Sveidqvist
 *  MIT license.
 */

%options case-insensitive

%{
	// Pre-lexer code can go here
%}

%%

[\n]+             return 'NL';
"showInfo"		  return 'showInfo';
"info"		      return 'info';
"say"			  return 'say';
":"[^#\n;]+       return 'TXT';
<<EOF>>           return 'EOF';
.                 return 'INVALID';

%%