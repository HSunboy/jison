//
// title: "options may have identifiers which start with a number, e.g. '8bit'"
// test_input: "2020-11-12 % X"
// ...
//


%option 8bit
%option case-insensitive
%option never-interactive
%option prefix="pp"

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

%%

\d\d\d\d"-"\d\d"-"\d\d  return 'date';
":"                         return ':';
[\s\r\n]					return 'WS';
<<EOF>>                     return 'EOF';
.                           return 'INVALID';

