//
// The C Preprocessor done in JISON.
//
// This is a work-in-progress, i.e. don't expect 100% support for everything. RTFC.
//
// Fundamentally, this is a showcase how one might go about coding a beast like this
// in a JavaScript/JISON/LALR setting: the C preprocessor language per se IS NOT a
// CFG (Context Free Grammar) in many senses (not just the line-oriented nature of
// this particular animal)[^NONCFG], but you can do it anyway.
//
// I don't aim for WARP[^WARP] speeds but that don't mean I will do my best to
// make this bugger execute /fast/, as long as it doesn't blow up in my face re
// code readability.
//
// Meanwhile I also take this opportunity to showcase a few nasty manuevres when
// coding up compiler/translator with JISON, which might make you go Ah-ha!, smile
// or cry unconsolably, depending on your mental make-up. Any way, those actions
// will be easily identifiable by the comments announcing them.
//
//
// [^NONCFG] http://blog.robertelder.org/7-weird-old-things-about-the-c-preprocessor/
// [^WARP] https://code.facebook.com/posts/476987592402291/under-the-hood-warp-a-fast-c-and-c-preprocessor/
//
// ---
//
// ## Notes To Self - The Devilish Details of a possibly compliant C preprocessor
//
// 1. Who needs re-entrant lexers/parsers?
//
//    MAYBE we do?...
//
//    But then again, recursive invocation of a lexer or parser is a Severe Code Smell
//    to my olefoactory organ: I immediately sense a way to make this thing blow up
//    by feeding it an input which would require multiple call levels and thus blow 
//    out the (limited) JavaScript stack.
//
//    I think it's far better to reconsider and see if you can come up with a neat
//    non-recursive approach: an iteration = a loop!
//
//    Does it make sense to iterate some preprocessor phases until all work is done?
//    Certainly! But that, of course, only will fly when you have a way to 'persist'
//    knowledge (such as macro definitions) across the iterations.
//    And luckily we are not old skool yacc, but have a very neat and proper way 
//    in JISON to pass around info structures into and out of the parser and lexer
//    via the `yy` shared context object!
//    Next to that we can pass info structure (/object/) reference(s) into the
//    JISON parser via its `parse()` call interface through the use of `%parse-aparams`
//    in your grammar -- these datums are then internally added to the `yy` shared
//    context anyway so that every mick and cranny can access them.
//
//    That will be what we'll use in here!
//
//
//



%lex


// We're lazy: we require XRegExp at parse runtime to handle Unicode.
%options xregexp
%options easy_keyword_rules



ASCII_LETTER                        [a-zA-Z]

// Unicode literal chars set:
UNICODE_LETTER_RANGE                [\p{Alphabetic}]

IDENTIFIER_START                    [{UNICODE_LETTER_RANGE}_{DOLLAR}]
IDENTIFIER_REST                     [{IDENTIFIER_START}_\p{Number}]
DOLLAR                              [\u0024]
WHITESPACE                          [\s\r\n]

NON_OPERATOR_CHAR                   [{WHITESPACE}{IDENTIFIER_REST}]

ID                                  [{IDENTIFIER_START}][{IDENTIFIER_REST}]*
WORD                                [{IDENTIFIER_REST}]+

OPERATOR                            [^{NON_OPERATOR_CHAR}]{1,3}

// Match simple floating point values, for example `1.0`, but also `9.`, `.05` or just `7`:
BASIC_FLOATING_POINT_NUMBER         (?:[0-9]+(?:"."[0-9]*)?|"."[0-9]+)





%x CMD PATH STRING INLINE_COMMENT MULTILINE_COMMENT




%{
    /*
     * This chunk is included in the lexer action code at the very start of that method.
     *
     * `YY_START` is defined then, `YYSTATE` is not! `yy` and `yy_` are also available here.
     */
    var s, s2, s3;
    var rv, rv2, e_offset, col, row, len, value;
    var match, match2;

    //console.log("lexer action: ", yy, yy_, this, yytext, YY_START, $avoiding_name_collisions);

    var parser = yy.parser;
%}




%%




// recognize the CPP keywords:
#                                   %{
                                        // We've detected the command marker: it MAY be followed
                                        // by optional whitespace before a preprocessor keyword
                                        // (if any) is specified.
                                        //
                                        // When no preprocessor command word is identified next
                                        // on the same input line, this sole `#` is assumed to
                                        // represent the STRINGIFY operator, but only if we
                                        // find this situation while consuming a preprocessor
                                        // macro definition!
                                        //
                                        // From the GNU GCC manual:
                                        //
                                        // > These directives are not part of the C standard, 
                                        // > but they are not official GNU extensions either. 
                                        // > What historical information we have been able to find, 
                                        // > suggests they originated with System V.
                                        // > 
                                        // > The *null* directive consists of a `#` followed 
                                        // > by a newline, with only whitespace (including comments) 
                                        // > in between. A *null* directive is understood as 
                                        // > a preprocessing directive but has no effect on 
                                        // > the preprocessor output. The primary significance 
                                        // > of the existence of the *null* directive is that 
                                        // > an input line consisting of just a ‘#’ will produce 
                                        // > no output, rather than a line of output containing 
                                        // > just a ‘#’. Supposedly some old C programs contain 
                                        // > such lines.
                                        // > 

                                        this.pushState('CMD');

                                        return '#';
                                    %}

<CMD>{

include                             %{
                                        this.popState();
                                        this.pushState('PATH');

                                        return 'INCLUDE';
                                    %}

import                              %{
                                        this.popState();
                                        this.pushState('PATH');

                                        return 'IMPORT';
                                    %}

define                              this.popState(); return 'DEFINE';
enddef                              this.popState(); return 'ENDDEFINE';    // our custom extension to macro definitions
undef                               this.popState(); return 'UNDEF';

if                                  this.popState(); return 'IF';
elif                                this.popState(); return 'ELIF';
else                                this.popState(); return 'ELSE';
endif                               this.popState(); return 'ENDIF';

ifdef                               this.popState(); return 'IFDEF';
ifndef                              this.popState(); return 'IFNDEF';

line                                this.popState(); return 'LINE';
error                               this.popState(); return 'ERROR';
warning                             this.popState(); return 'WARNING';
pragma                              this.popState(); return 'PRAGMA';
ident                               this.popState(); return 'IDENT';

#                                   this.popState(); return 'CONCATENATE';

[\r\n]                              %{
                                        this.popState(); 

                                        // We've encountered a so-called NULL DIRECTIVE.
                                        //
                                        // Make sure the newline will be lexed / parsed by
                                        // the outer lexer mode by `unput()`-ting the 
                                        // entire matched string now:
                                        this.unput(yytext); 

                                        return 'NULL_DIRECTIVE';
                                    %}

\s+                                 /* skip/ignore in CMD mode */

{ID}                                %{
                                        this.popState();

                                        // When we hit ANY IDENTIFIER that's not a reserved
                                        // word or special operator (`##`, `#`), then the
                                        // lone initial `#` MUST be a STRINGIFY operator
                                        // of said ID macro parameter.

                                        return 'STRINGIFY';
                                    %}

.                                   %{
                                        this.popState();

                                        // When we hit ANYTHING ELSE, then the
                                        // lone initial `#` MUST be an ERROR.

                                        return 'error';
                                    %}

}   
// end of CMD mode section



<PATH>{

\s+                                 /* skip/ignore at start of PATH mode */

/*
 * Path As String Handling
 * -----------------------
 */

"'"([^'\r\n]*(?:"''"[^'\r\n]*)*)"'"
                                    %{
                                        s = this.matches[1];
                                        s2 = parser.dedupQuotedString(s, "'");
                                        yytext = s2;

                                        this.popState();

                                        return 'PATH';
                                    %}

'"'([^"\r\n]*(?:'""'[^"\r\n]*)*)'"'
                                    %{
                                        s = this.matches[1];
                                        s2 = parser.dedupQuotedString(s, '"');
                                        yytext = s2;

                                        this.popState();

                                        return 'PATH';
                                    %}

'<'([^>\r\n]*)'>'
                                    %{
                                        yytext = this.matches[1];

                                        this.popState();

                                        return 'PATH';
                                    %}

"\u2039"([^\u203a\r\n]*)"\u203a"
                                    %{                                                  /* ‹string› */
                                        yytext = this.matches[1];

                                        this.popState();

                                        return 'PATH';
                                    %}

"\u201c"([^\u201d\r\n]*)"\u201d"
                                    %{                                                  /* “string” */
                                        yytext = this.matches[1];

                                        this.popState();

                                        return 'PATH';
                                    %}

"\u00ab"([^\u00bb\r\n]*)"\u00bb"
                                    %{                                                  /* «string» */
                                        yytext = this.matches[1];

                                        this.popState();

                                        return 'PATH';
                                    %}


// When PATH is not encoded as some sort of STRING, then it can be a single
// sequence of non-whitespace characters:

[^{WHITESPACE}]+    
                                    %{ 
                                        this.popState();

                                        return 'PATH';
                                    %}

[\r\n]
                                    %{
                                        this.popState();

                                        // When we hit a NEWLINE while in PATH mode, 
                                        // then we MUST be in ERROR.
                                        //
                                        // WARNING: do not consume the newline so
                                        // that the outer lexer mode can lex it properly.
                                        this.unput(yytext);

                                        return 'error';
                                    %}

}   
// end of PATH mode section



// Recognize predefined operators and functions for use in conditionals, etc.:

// Functions:

defined
undefined

// cast to... (our extension)
number
string

// operators:
{OPERATOR}






/*
 * String Handling
 * ---------------
 */

"'"([^'\r\n]*(?:"''"[^'\r\n]*)*)"'"
                                    %{
                                        s = this.matches[1];
                                        s2 = parser.dedupQuotedString(s, "'");
                                        yytext = s2;

                                        return 'STRING';
                                    %}

'"'([^"\r\n]*(?:'""'[^"\r\n]*)*)'"'
                                    %{
                                        s = this.matches[1];
                                        s2 = parser.dedupQuotedString(s, '"');
                                        yytext = s2;

                                        return 'STRING';
                                    %}

"\u2039"([^\u203a\r\n]*)"\u203a"
                                    %{                                                  /* ‹string› */
                                        yytext = this.matches[1];

                                        return 'STRING';
                                    %}

"\u201c"([^\u201d\r\n]*)"\u201d"
                                    %{                                                  /* “string” */
                                        yytext = this.matches[1];

                                        return 'STRING';
                                    %}

"\u00ab"([^\u00bb\r\n]*)"\u00bb"
                                    %{                                                  /* «string» */
                                        yytext = this.matches[1];

                                        return 'STRING';
                                    %}




/*
 * Comment parsing
 * ---------------
 */

<INLINE_COMMENT>[^\/\*\)\}#!\u203c\u258c\u2590]+
        %{                                                  /* * / ) | # ! ‼ ▌ ▐ */
            /* keep it all; we haven't hit an end-of-comment marker starting character yet! */
            this.more();
        %}

<INLINE_COMMENT>.
        %{
            for (rv = 0, len = this.inline_comment_end_markers.length; rv < len; rv++) {
                s2 = this.inline_comment_end_markers[rv];
                if (s2[0] === this.matches[0]) {
                    // we got a POTENTIAL MATCH; let's see if we need more:
                    if (s2.length > 1) {
                        // when yes, test the next rule!
                        this.reject();
                        return false;
                    } else {
                        /*
                        * Full match! end of comment reached.
                        *
                        * Remove this last bit from the parsed text and strip leading / trailing whitespace.
                        *
                        * > ### Notes
                        * >
                        * > Since returning actual tokens for any inline comments would
                        * > break the LALR(1) grammar most severely, we concatenate
                        * > comments and attach them to the next token.
                        * >
                        * > Since the 'next token' MAY be `EOF`, we need the parser
                        * > to check if there's any leech called `comment` hanging
                        * > off that EOF it might've got dropped in the in-box...
                        */
                        parser.pushComment();
                        this.popState();
                        return false;
                    }
                }
            }
            // collect input until we hit something we know:
            this.more();
        %}

<INLINE_COMMENT>..
        %{
            /*
             * We only hit this rule when the previous one was `reject()`-ed
             * as that rule will match anything that's the start of this one.
             *
             * Hence we know we have a partial match on a comment terminator,
             * but we need to make sure.
             *
             * We also know that our longest 'end markers' are 2 characters wide,
             * so this solution is sufficient and complete.
             *
             * Now all we have to do is scan the longer-than-1-character
             * comment markers against what we've got here and if there's
             * NO MATCH, we need to keep in mind that nasty people can write
             * comments like `{***}` and we have a hit on `**}` so we may only
             * consume one character here in that case.
             */
            for (rv = 0, len = this.inline_comment_end_markers.length; rv < len; rv++) {
                s2 = this.inline_comment_end_markers[rv];
                if (s2 === this.matches[0]) {
                    /*
                     * Full match! end of comment reached.
                     *
                     * Remove this last bit from the parsed text and strip leading/trailing whitespace.
                     *
                     * Since returning actual tokens for any inline comments would
                     * break the LALR(1) grammar most severely, we concatenate
                     * comments and attach them to the next token.
                     *
                     * Since the 'next token' MAY be `EOF`, we need the parser
                     * to check if there's any leech called `comment` hanging
                     * of that EOF it might've got dropped in the in-box...
                     */
                    parser.pushComment();
                    this.popState();
                    return false;
                }
            }
            // we may only consume a single character, so we `unput()` the last one:
            this.less(1);

            // collect input until we hit something we know:
            this.more();
        %}

<INLINE_COMMENT><<EOF>>
        %{
            parser.pushComment();

            rv = yy.parser.parseError("Unterminated inline comment.", {
                text: yytext,
                //token: $error,
                line: yylloc,
                loc: yylloc,
                outer_loc: yylloc,
                expected: [],
                recoverable: false
            });
            assert(rv === null);
            return 'error';
        %}








/*
 * The sag wagon, which mops up the dregs
 * --------------------------------------
 */


\s+
        /*: skip whitespace */


<<EOF>>
        %{
            return 'EOF';
        %}

// When we get to this point in the lexer regex list, we don't know what to do
// with the first character at all (regex: `.`).
//
// In actual practice we find that we need to add a bit of 'sanity/recovery quality'
// to the lexer & grammar because we now would parse **erroneous input** like `Cost1[2014]`
// where `Cost1` is a row label but `2014` is **not** a legal column label, hence the entire
// thing **not** validating as a correct cell reference(!) this time around, as
//
// - ERROR token `C`
// - ERROR token `o` (we don't know what to make of `ost1[2014]` after all!)
// - ERROR token `s` (ditto for `st1[2014]`)
// - lexer & grammar have 'recovered' as now the lexer *can* make something of `t1` in `t1[2014]`:
//   that little snippet happens to validate as a legal cellref `T1`: totally obvious to the lexer,
//   but the resulting color coding in the formula editor is completely unintelligible by humans
//   as we now flag `Cos` as red=ERROR, while `T1` is capitalized and color-coded as a cellref,
//   followed by a `[` open bracket and `2014` numeric value plus a `]` close bracket.
//   --> `T1` (cellref), ...
//
// We don't want to see the above 'error recovery' in our color coding (which is driven by our
// token stream resulting from the lexer activity) so we need to smarten up our lexer just a little
// to improve our tokenization *after* hitting an error. (This is intelligence we add to the lexer
// which is not used by the grammar rules as those just barf after the initial parse error which
// kicked in at `C`(ERROR) already.)
//
// The heuristic we use here is to scan forward (and consume characters) until we hit our first
// TOKEN_SENTINEL. That way we can be sure to skip any half or whole cell/row/column label names
// and have a decent chance at spitting out some more or less decent tokens following
// the error event.
//
// Edit: we don't terminate the error token at the TOKEN_SENTINEL boundary because that one will
// force us to eat the `[` as well, which is not our intent here. We wish to consume entire labels,
// hence a more direct regex is more suitable: when the error character itself is part of a WORD
// we eat the entire label/function name hence we consume the entire DOTTED_WORDS sequence;
// otherwise we know we're looking at an error character which itself is NOT a label and then
// we simply eat that character only. Consequently we now have *two* error catching lexer rules
// below:
{DOTTED_WORDS}
        %{
            rv = yy.parser.parseError("Don't know what to do with this: it's unsupported input.", {
                text: yytext,
                //token: $error,
                line: yylloc,
                loc: yylloc,
                outer_loc: yylloc,
                expected: [],
                recoverable: false
            });
            assert(rv === null);
            return 'error';
        %}


// See note for the error lexer rule above: this is where we catch any erroneous non-label character.
.
        %{
            rv = yy.parser.parseError("Don't know what to do with this: it's unsupported input.", {
                text: yytext,
                //token: $error,
                line: yylloc,
                loc: yylloc,
                outer_loc: yylloc,
                expected: [],
                recoverable: false
            });
            assert(rv === null);
            return 'error';
        %}










/lex



%token      NUM             // Simple double precision number




/* Grammar follows */

%start input
%ebnf


%options default-action-mode=none,merge     // JISON shouldn't bother injecting the default `$$ = $1` action anywhere!

%parse-param globalSpace                    // extra function parameter for the generated parse() API; we use this one to pass in a reference to our workspace for the functions to play with.



%%


input:
  ε                             /* empty */
                                {
                                  $$ = [];
                                }
| input line
                                {
                                  if ($line.length) {
                                    // We MUST signal the end of an expression as otherwise our AST grammar
                                    // will be ambiguous (and thus our tree walkers confused and unable to
                                    // work) as we must be able to differentiate between 'end of function arglist'
                                    // and 'end of statement': since we expect more functions (and thus
                                    // arglist terminations) than statements, we choose to give the FUNCTION
                                    // arglist an implicit termination while the statement gets to have an
                                    // *explicit* termination (#EOL# token) so that we end up with a shorter
                                    // AST stream -- iff our assumption holds in actual use!
                                    //
                                    // NOTE: We only need to add a sentinel when multiple statements (lines)
                                    // are input: when there's only a single statement (line) it'll unambguously
                                    // terminated by EOF!
                                    if (01 && $input.length) {
                                      $line.push(#EOL#);
                                    }
                                    $$ = $input.concat($line);
                                  } else {
                                    $$ = $input;
                                  }
                                }
;

line:
  '#' cmd EOL
                                {
                                  $$ = $cmd;
                                }
| error EOL
                                {
                                  $$ = [#error#, #EOL#];
                                }
;

cmd:
  INCLUDE path                  { }
| IMPORT  path                  { }
| DEFINE  macro_spec macro_def
                                { }
| UNDEF   ID                    { }

| if_chunk EOL (elif_chunk EOL)* (else_chunk EOL)? ENDIF

| line_w_num PATH?              { }
| ERROR STRING                  { }
| WARNING STRING                { }
| IDENT STRING                  { }
| PRAGMA until_EOL              { }
| NULL_DIRECTIVE                { }
| CONCATENATE                   { /* error! */ }
| STRINGIFY                     { /* error! */ }
;


line_w_num:
  LINE NUMBER
                                {
                                    // This rule does not require look-ahead to resolve,
                                    // hence we can apply a 'lexer feedback hack' here
                                    // by pushing a lexer mode just before we'll be
                                    // lexing the next token in the input:
                                    lexer.pushState('PATH');
                                }
;


macro_spec:
  FID '(' arglist ')'
                                { }
| ID 
;


macro_def:
  classic_macro_def
                                { }
| multiline_macro_def ENDDEFINE
                                { }
;


if_chunk:
  IF conditional_expression     (EOL block)?
| IFDEF conditional_expression  (EOL block)?
| IFNDEF conditional_expression (EOL block)?
;


elif_chunk:
  ELIF conditional_expression   (EOL block)?
;


else_chunk:
  ELSE conditional_expression   (EOL block)?
;


conditional_expression:
;


block:
;














/*



  NUM
                                { $$ = [#NUM, $NUM]; }
| CONSTANT
                                { $$ = [#CONSTANT, $CONSTANT]; }
| VAR
                                { $$ = [#VAR, $VAR]; }
| ASSIGN exp
                                {
                                  /*
                                     Note: #assign is always to a simple variable, hence we don't need the `#VAR`
                                     token here: it is implicit as there's nothing else we can do.

                                     Technically, this is an AST optimization, but it's such a fundamental one
                                     we do it here instead of later.

                                     NOTE: #assign implies the presence of a VAR as lhs (left hand side) so it
                                     would only be cluttering the AST stream to have a #VAR# token in there:
                                     it is *implicit* to #assign!
                                   *))
                                  $$ = [#ASSIGN#, $ASSIGN].concat($exp);
                                }
| FUNCTION_0
                                { $$ = [#FUNCTION_0#, $FUNCTION_0]; }
| FUNCTION arglist END
                                {
                                  /*
                                     See the comment in the statement EOL rule above: to disambiguate a sequence
                                     of exp subtrees, we MUST add a terminator to either or both statement and
                                     function, otherwise the sequence `FUNCTION exp exp` is ambiguous: it could
                                     be:

                                     - a no-args functions and two more statements,
                                     - a single-arg function and one more statement,
                                     - a two-arg function.

                                     Of course, you may argue that adding 'number of arguments' knowledge to the
                                     FUNCTION token would also resolve this issue, and it would, but that would
                                     be a bit harder to encode in an LALR(1) grammar used as the treewalker core.
                                     It is easier to use a sentinel token in one or both spots.

                                     A lot of functions have only a few arguments, which we later optimize in our AST
                                     by including that knowledge in the FUNCTION token by using derivative tokens
                                     FUNCTION_0, FUNCTION_1, etc.: this can help a smart optimizer to include
                                     special optimizations for these functions without having to re-discover
                                     the arglist length.
                                     As that approach already disambiguates the function-versus-statement
                                     situation by having encoded arglist length in the FUNCTION token, these
                                     tokens never require a sentinel token in the AST stream: small AST stream size.

                                     Now we let the optimizer deal with this when the time comes...

                                     Meanwhile, keep it as simple as possible in here!

                                     Also don't forget to FLATTEN the arglist! ==> `concat.apply(a, arglist)`

                                     NOTE: the #FUNCTION# rule in Polish Notation is ambiguous unless we terminate it
                                     (which is easy to parse in an LALR(1) grammar while adding a argument count is not!)
                                     as we would otherwise get confused over this scenario:

                                          ... PLUS FUNCTION exp exp exp ...

                                     - is this a function with one argument and that last `exp` in there the second term
                                       of a binary(?) opcode waiting in the leading `...`?
                                     - is this a function with two arguments and that last `exp` the second
                                       term of the PLUS?
                                     - is this a function with three arguments and is the second term of the PLUS
                                       waiting in the trailing `...`?

                                     This is the trouble with opcodes which accept a variable number of arguments:
                                     such opcodes always have to be terminated by a sentinel to make the AST grammar
                                     unambiguous.
                                  *))
                                  $$ = [].concat.apply([#FUNCTION#, $FUNCTION], $arglist);
                                  $$.push(#END#);

                                }
| FUNCTION_1 exp
                                {
                                  $$ = [#FUNCTION_1#, $FUNCTION_1].concat($exp);
                                }
| FUNCTION_2 exp exp
                                {
                                  $$ = [#FUNCTION_2#, $FUNCTION_2].concat($exp1, $exp2);
                                }
| FUNCTION_3 exp exp exp
                                {
                                  $$ = [#FUNCTION_3#, $FUNCTION_3].concat($exp1, $exp2, $exp3);
                                }

| EQ exp exp
                                { $$ = [#EQ].concat($exp1, $exp2); }
| NEQ exp exp
                                { $$ = [#NEQ].concat($exp1, $exp2); }
| LEQ exp exp
                                { $$ = [#LEQ].concat($exp1, $exp2); }
| GEQ exp exp
                                { $$ = [#GEQ].concat($exp1, $exp2); }
| LT exp exp
                                { $$ = [#LT].concat($exp1, $exp2); }
| GT exp exp
                                { $$ = [#GT].concat($exp1, $exp2); }
| OR exp exp
                                { $$ = [#OR].concat($exp1, $exp2); }
| XOR exp exp
                                { $$ = [#XOR].concat($exp1, $exp2); }
| AND exp exp
                                { $$ = [#AND].concat($exp1, $exp2); }

| BITWISE_OR exp exp
                                { $$ = [#BITWISE_OR#].concat($exp1, $exp2); }
| BITWISE_XOR exp exp
                                { $$ = [#BITWISE_XOR#].concat($exp1, $exp2); }
| BITWISE_AND exp exp
                                { $$ = [#BITWISE_AND#].concat($exp1, $exp2); }

| ADD exp exp
                                { $$ = [#ADD#].concat($exp1, $exp2); }
| SUBTRACT exp exp
                                { $$ = [#SUBTRACT#].concat($exp1, $exp2); }
| MULTIPLY exp exp
                                { $$ = [#MULTIPLY#].concat($exp1, $exp2); }
| DIVIDE exp exp
                                { $$ = [#DIVIDE#].concat($exp1, $exp2); }
| MODULO exp exp
                                { $$ = [#MODULO#].concat($exp1, $exp2); }
| UMINUS exp
                                { $$ = [#UMINUS#].concat($exp); }
| UPLUS exp
                                { $$ = [#UPLUS#].concat($exp); }
| POWER exp exp
                                { $$ = [#POWER#].concat($exp1, $exp2); }
| PERCENT exp
                                { $$ = [#PERCENT#].concat($exp); }
| FACTORIAL exp
                                { $$ = [#FACTORIAL#].concat($exp); }

| BITWISE_NOT exp
                                { $$ = [#BITWISE_NOT#].concat($exp); }
| NOT exp
                                { $$ = [#NOT#].concat($exp); }


| IF_ELSE exp exp exp
                                {
                                  $$ = [#IF_ELSE#].concat($exp1, $exp2, $exp3);
                                }
| IF exp exp
                                {
                                  $$ = [#IF#].concat($exp1, $exp2);
                                }
;

arglist:
  exp
                                { $$ = [$exp]; }
| arglist exp
                                {
                                  $$ = $arglist;
                                  $$.push($exp);
                                }
;





/* End of grammar *))


%%





























Standard predefined macros
The compiler supports these predefined macros specified by the ISO C99 and ISO C++14 standards.
__cplusplus Defined as an integer literal value when the translation unit is compiled as C++. Otherwise, undefined.
__DATE__ The compilation date of the current source file. The date is a constant length string literal of the form Mmm dd yyyy. The month name Mmm is the same as the abbreviated month name in dates generated by the C Runtime Library asctime function. The first character of date dd is a space if the value is less than 10. This macro is always defined.
__FILE__ The name of the current source file. __FILE__ expands to a character string literal. To ensure that the full path to the file is displayed, use /FC (Full Path of Source Code File in Diagnostics). This macro is always defined.
__LINE__ Defined as the integer line number in the current source file. The value of the __LINE__ macro can be changed by using a #line directive. This macro is always defined.
__STDC__ Defined as 1 only when compiled as C and if the /Za compiler option is specified. Otherwise, undefined.
__STDC_HOSTED__ Defined as 1 if the implementation is a hosted implementation, one that supports the entire required standard library. Otherwise, defined as 0.
__STDCPP_THREADS__ Defined as 1 if and only if a program can have more than one thread of execution, and compiled as C++. Otherwise, undefined.
__TIME__ The time of translation of the preprocessed translation unit. The time is a character string literal of the form hh:mm:ss, the same as the time returned by the C Runtime Library asctime function. This macro is always defined.
Microsoft-specific predefined macros
Microsoft Visual C++ supports these additional predefined macros.
__ATOM__ Defined as 1 when the /favor:ATOM compiler option is set and the compiler target is x86 or x64. Otherwise, undefined.
__AVX__ Defined as 1 when the /arch:AVX or /arch:AVX2 compiler options are set and the compiler target is x86 or x64. Otherwise, undefined.
__AVX2__ Defined as 1 when the /arch:AVX2 compiler option is set and the compiler target is x86 or x64. Otherwise, undefined.
_CHAR_UNSIGNED Defined as 1 if the default char type is unsigned. This is set when the /J (Default char Type Is unsigned) compiler option is set. Otherwise, undefined.
__CLR_VER Defined as an integer literal that represents the version of the common language runtime used when the application was compiled. The value is encoded in the form Mmmbbbbb, where M is the major version of the runtime, mm is the minor version of the runtime, and bbbbb is the build number. __CLR_VER is defined if the /clr compiler option is set. Otherwise, undefined.
C++
// clr_ver.cpp  
// compile with: /clr  
using namespace System;  
int main() {  
   Console::WriteLine(__CLR_VER);  
}  

_CONTROL_FLOW_GUARD Defined as 1 when the /guard:cf (Enable Control Flow Guard) compiler option is set. Otherwise, undefined.
__COUNTER__ Expands to an integer literal that starts at 0 and is incremented by 1 every time it is used in a source file or included headers of the source file. __COUNTER__ remembers its state when you use precompiled headers. This macro is always defined.
This example uses __COUNTER__ to assign unique identifiers to three different objects of the same type. The exampleClass constructor takes an integer as a parameter. In main, the application declares three objects of type exampleClass, using __COUNTER__ as the unique identifier parameter:
C++
// macro__COUNTER__.cpp  
// Demonstration of __COUNTER__, assigns unique identifiers to  
// different objects of the same type.  
// Compile by using: cl /EHsc /W4 macro__COUNTER__.cpp  
#include <stdio.h>  

class exampleClass {  
    int m_nID;  
public:  
    // initialize object with a read-only unique ID  
    exampleClass(int nID) : m_nID(nID) {}  
    int GetID(void) { return m_nID; }  
};  

int main()  
{  
    // __COUNTER__ is initially defined as 0  
    exampleClass e1(__COUNTER__);  

    // On the second reference, __COUNTER__ is now defined as 1  
    exampleClass e2(__COUNTER__);  

    // __COUNTER__ is now defined as 2  
    exampleClass e3(__COUNTER__);  

    printf("e1 ID: %i\n", e1.GetID());  
    printf("e2 ID: %i\n", e2.GetID());  
    printf("e3 ID: %i\n", e3.GetID());  

    // Output  
    // ------------------------------  
    // e1 ID: 0  
    // e2 ID: 1  
    // e3 ID: 2  

    return 0;  
}  

__cplusplus_cli Defined as the integer literal value 200406 when compiled as C++ and the /clr, /clr:pure, or /clr:safe compiler option is set. Otherwise, undefined. When defined, __cplusplus_cli is in effect throughout the translation unit.
C++
// cplusplus_cli.cpp  
// compile by using /clr  
#include "stdio.h"  
int main() {  
   #ifdef __cplusplus_cli  
      printf("%d\n", __cplusplus_cli);  
   #else  
      printf("not defined\n");  
   #endif  
}  

__cplusplus_winrt Defined as the integer literal value 201009 when compiled as C++ and the /ZW (Windows Runtime Compilation) compiler option is set. Otherwise, undefined.
_CPPRTTI Defined as 1 if the /GR (Enable Run-Time Type Information) compiler option is set. Otherwise, undefined.
_CPPUNWIND Defined as 1 if one or more of the /GX (Enable Exception Handling), /clr (Common Language Runtime Compilation), or /EH (Exception Handling Model) compiler options are set. Otherwise, undefined.
_DEBUG Defined as 1 when the /LDd, /MDd, or /MTd compiler option is set. Otherwise, undefined.
_DLL Defined as 1 when the /MD or /MDd (Multithreaded DLL) compiler option is set. Otherwise, undefined.
__FUNCDNAME__ Defined as a string literal that contains the decorated name of the enclosing function. The macro is defined only within a function. The __FUNCDNAME__ macro is not expanded if you use the /EP or /P compiler option.
This example uses the __FUNCDNAME__, __FUNCSIG__, and __FUNCTION__ macros to display function information.
C++
// Demonstrates functionality of __FUNCTION__, __FUNCDNAME__, and __FUNCSIG__ macros
void exampleFunction()
{
    printf("Function name: %s\n", __FUNCTION__);
    printf("Decorated function name: %s\n", __FUNCDNAME__);
    printf("Function signature: %s\n", __FUNCSIG__);
    
    // Sample Output
    // -------------------------------------------------
    // Function name: exampleFunction
    // Decorated function name: ?exampleFunction@@YAXXZ
    // Function signature: void __cdecl exampleFunction(void)
}
__FUNCSIG__ Defined as a string literal that contains the signature of the enclosing function. The macro is defined only within a function. The __FUNCSIG__ macro is not expanded if you use the /EP or /P compiler option. When compiled for a 64-bit target, the calling convention is __cdecl by default. For an example of usage, see the __FUNCDNAME__ macro.
__FUNCTION__ Defined as a string literal that contains the undecorated name of the enclosing function. The macro is defined only within a function. The __FUNCTION__ macro is not expanded if you use the /EP or /P compiler option. For an example of usage, see the __FUNCDNAME__ macro.
_INTEGRAL_MAX_BITS Defined as the integer literal value 64, the maximum size (in bits) for a non-vector integral type. This macro is always defined.
C++
// integral_max_bits.cpp  
#include <stdio.h>  
int main() {  
   printf("%d\n", _INTEGRAL_MAX_BITS);  
}  

__INTELLISENSE__ Defined as 1 during an IntelliSense compiler pass in the Visual Studio IDE. Otherwise, undefined. You can use this macro to guard code the IntelliSense compiler does not understand, or use it to toggle between the build and IntelliSense compiler. For more information, see Troubleshooting Tips for IntelliSense Slowness.
_ISO_VOLATILE Defined as 1 if the /volatile:iso compiler option is set. Otherwise, undefined.
_KERNEL_MODE Defined as 1 if the /kernel (Create Kernel Mode Binary) compiler option is set. Otherwise, undefined.
_M_AMD64 Defined as the integer literal value 100 for compilations that target x64 processors. Otherwise, undefined.
_M_ARM Defined as the integer literal value 7 for compilations that target ARM processors. Otherwise, undefined.
_M_ARM_ARMV7VE Defined as 1 when the /arch:ARMv7VE compiler option is set for compilations that target ARM processors. Otherwise, undefined.
_M_ARM_FP Defined as an integer literal value that indicates which /arch compiler option was set, if the compilation target is an ARM processor. Otherwise, undefined.
In the range 30-39 if no /arch ARM option was specified, indicating the default architecture for ARM was set (VFPv3).
In the range 40-49 if /arch:VFPv4 was set.
See /arch (ARM) for more information.
_M_ARM64 Defined as 1 for compilations that target 64-bit ARM processors. Otherwise, undefined.
_M_CEE Defined as 001 if any /clr (Common Language Runtime Compilation) compiler option is set. Otherwise, undefined.
_M_CEE_PURE Defined as 001 if the /clr:pure compiler option is set. Otherwise, undefined.
_M_CEE_SAFE Defined as 001 if the /clr:safe compiler option is set. Otherwise, undefined.
_M_FP_EXCEPT Defined as 1 if the /fp:except or /fp:strict compiler option is set. Otherwise, undefined.
_M_FP_FAST Defined as 1 if the /fp:fast compiler option is set. Otherwise, undefined.
_M_FP_PRECISE Defined as 1 if the /fp:precise compiler option is set. Otherwise, undefined.
_M_FP_STRICT Defined as 1 if the /fp:strict compiler option is set. Otherwise, undefined.
_M_IX86 Defined as the integer literal value 600 for compilations that target x86 processors. This macro is not defined for x64 or ARM compilation targets.
_M_IX86_FP Defined as an integer literal value that indicates the /arch compiler option that was set, or the default. This macro is always defined when the compilation target is an x86 processor. Otherwise, undefined. When defined, the value is:
0 if the /arch:IA32 compiler option was set.
1 if the /arch:SSE compiler option was set.
2 if the /arch:SSE2, /arch:AVX or /arch:AVX2 compiler option was set. This value is the default if an /arch compiler option was not specified. When /arch:AVX is specified, the macro __AVX__ is also defined. When /arch:AVX2 is specified, both __AVX__ and __AVX2__ are also defined.
See /arch (x86) for more information.
_M_X64 Defined as the integer literal value 100 for compilations that target x64 processors. Otherwise, undefined.
_MANAGED Defined as 1 when the /clr compiler option is set. Otherwise, undefined.
_MSC_BUILD Defined as an integer literal that contains the revision number element of the compiler's version number. The revision number is the fourth element of the period-delimited version number. For example, if the version number of the Visual C++ compiler is 15.00.20706.01, the _MSC_BUILD macro evaluates to 1. This macro is always defined.
_MSC_EXTENSIONS Defined as 1 if the /Ze (Enable Language Extensions) compiler option is set, which is the default. Otherwise, undefined.
_MSC_FULL_VER Defined as an integer literal that encodes the major, minor, and build number elements of the compiler's version number. The major number is the first element of the period-delimited version number, the minor number is the second element, and the build number is the third element. For example, if the version number of the Visual C++ compiler is 15.00.20706.01, the _MSC_FULL_VER macro evaluates to 150020706. Enter cl /? at the command line to view the compiler's version number. This macro is always defined.
_MSC_VER Defined as an integer literal that encodes the major and minor number elements of the compiler's version number. The major number is the first element of the period-delimited version number and the minor number is the second element. For example, if the version number of the Visual C++ compiler is 17.00.51106.1, the _MSC_VER macro evaluates to 1700. Enter cl /? at the command line to view the compiler's version number. This macro is always defined.
_MSVC_LANG Defined as an integer literal that specifies the C++ language standard targeted by the compiler. When compiled as C++, the macro is the integer literal value 201402 if the /std:c++14 compiler option is set, or by default, and it is set to a higher, unspecified value when the /std:c++latest compiler option is set. Otherwise, the macro is undefined. The _MSVC_LANG macro and /std (Specify Language Standard Version) compiler options are available beginning in Visual Studio 2015 Update 3.
__MSVC_RUNTIME_CHECKS Defined as 1 when one of the /RTC compiler options is set. Otherwise, undefined.
_MT Defined as 1 when /MD or /MDd (Multithreaded DLL) or /MT or /MTd (Multithreaded) is specified. Otherwise, undefined.
_NATIVE_WCHAR_T_DEFINED Defined as 1 when the /Zc:wchar_t compiler option is set. Otherwise, undefined.
_OPENMP Defined as integer literal 200203, representing the date of the OpenMP specification implemented by Visual C++, if the /openmp (Enable OpenMP 2.0 Support) compiler option is set. Otherwise, undefined.
C++
// _OPENMP_dir.cpp  
// compile with: /openmp   
#include <stdio.h>   
int main() {  
   printf("%d\n", _OPENMP);  
}  

_PREFAST_ Defined as 1 when the /analyze compiler option is set. Otherwise, undefined.
__TIMESTAMP__ Defined as a string literal that contains the date and time of the last modification of the current source file, in the abbreviated, constant length form returned by the C Runtime Library asctime function, for example, Fri 19 Aug 13:32:58 2016. This macro is always defined.
_VC_NODEFAULTLIB Defined as 1 when the /Zl (Omit Default Library Name) compiler option is set. Otherwise, undefined.
_WCHAR_T_DEFINED Defined as 1 when the default /Zc:wchar_t compiler option is set. The _WCHAR_T_DEFINED macro is defined but has no value if the /Zc:wchar_t- compiler option is set, and wchar_t is defined in a system header file included in your project. Otherwise, undefined.
_WIN32 Defined as 1 when the compilation target is 32-bit ARM, 64-bit ARM, x86, or x64. Otherwise, undefined.
_WIN64 Defined as 1 when the compilation target is 64-bit ARM or x64. Otherwise, undefined.
_WINRT_DLL Defined as 1 when compiled as C++ and both /ZW (Windows Runtime Compilation) and /LD or /LDd compiler options are set. Otherwise, undefined.
Preprocessor macros used to determine the ATL or MFC library version are not predefined by the compiler. These macros are defined in the headers for the library, so they are undefined in preprocessor directives before the required header is included.
_ATL_VER Defined in <atldef.h> as an integer literal that encodes the ATL version number.
_MFC_VER Defined in <afxver_.h> as an integer literal that encodes the MFC version number.







*/

