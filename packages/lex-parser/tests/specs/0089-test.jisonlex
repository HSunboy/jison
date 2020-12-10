//
// title: "options may have identifiers which start with a number, e.g. '8bit'"
// test_input: "2020-11-12 % X"
// ...
//


%option 8bit
%option case-insensitive
%option never-interactive
%option prefix="pp"
%option buzz = qqq

%option stack

%option noyy_top_state
%option noyy_scan_buffer
%option noyy_scan_bytes
%option noyy_scan_string

%option noyyget_extra
%option noyyset_extra
%option noyyget_leng
%option noyyget_text
%option noyyget_lineno
%option noyyset_lineno
%option noyyget_in
%option noyyset_in
%option noyyget_out
%option noyyset_out
%option noyyget_lval
%option noyyset_lval
%option noyyget_lloc
%option noyyset_lloc
%option noyyget_debug
%option noyyset_debug

// bad option identifers:
%option 6445
%option 42-42
%option 8
%option -5
%option ''
%option " "
%option -
%option '-'
%option {x}
%option __beelzebub!
%option @you
%option me@home
%option #no-more-bad-S
%option foo:bar
%option "a=b"
%option ~a
%option $a$
%option a#b
%option al.ka.selzer

// We also recognize the alias %options (plural):
%options foo
%options bar, but, top 						// 3 options
%options bar bi tu ra te 					// that would be 5 options
%options fu=bar, neg=-45, pos=71, hex=0x1A6F, max=666
%options Fu=bar Neg=-45 Pos=71 Hex=0x1A6F Max=666
%options NotANum=42A, neither-a-number=0x1AF_Z

%option xbar, xbut, xtop 						// 3 options
%option xbar xbi xtu xra xte 					// that would be 5 options
%option xfu=bar, xneg=-45, xpos=71, xhex=0x1A6F, xmax=666
%option xFu=bar xNeg=-45 xPos=71 xHex=0x1A6F xMax=666

%%

\d\d\d\d"-"\d\d"-"\d\d  	return 'date';
":"                         return ':';
[\s\r\n]					return 'WS';
<<EOF>>                     return 'EOF';
.                           return 'INVALID';

