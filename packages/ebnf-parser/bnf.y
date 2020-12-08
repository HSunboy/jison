
%code imports %{
  import XRegExp from '@gerhobbelt/xregexp';        // for helping out the `%options xregexp` in the lexer
  import JSON5 from '@gerhobbelt/json5';            // TODO: quick fix until `%code imports` works in the lexer spec!
  import helpers from '../helpers-lib';
  import fs from 'fs';
  import path from 'path';
  import assert from 'assert';
  import transform from './ebnf-transform';

  import { 
    TOK_EXPRESSION,
    TOK_SUBEXPRESSION,
    TOK_SYMBOL,
    TOK_SYMBOLSTRING,
    TOK_XALIAS
  } from './token_constants';

%}



%start spec

// %parse-param options

%ebnf


/* grammar for parsing jison grammar files */




%code error_recovery_reduction %{
    // Note:
    //
    // This code section is specifically targetting error recovery handling in the
    // generated parser when the error recovery is unwinding the parse stack to arrive
    // at the targeted error handling production rule.
    //
    // This code is treated like any production rule action code chunk:
    // Special variables `$$`, `$@`, etc. are recognized, while the 'rule terms' can be
    // addressed via `$n` macros as in usual rule actions, only here we DO NOT validate
    // their usefulness as the 'error reduce action' accepts a variable number of
    // production terms (available in `yyrulelength` in case you wish to address the
    // input terms directly in the `yyvstack` and `yylstack` arrays, for instance).
    //
    // This example recovery rule simply collects all parse info stored in the parse
    // stacks and which would otherwise be discarded immediately after this call, thus
    // keeping all parse info details up to the point of actual error RECOVERY available
    // to userland code in the handling 'error rule' in this grammar.
%}


%%


%{
    const OPTION_DOES_NOT_ACCEPT_VALUE = 0x0001;
    const OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES = 0x0002;
    const OPTION_ACCEPTS_000_IDENTIFIER_NAMES = 0x0004;    
    // ^^^ extension of OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES: '8bit', etc. is a 'legal' identifier now too, but '42' (pure number) is not!
    const OPTION_ALSO_ACCEPTS_STAR_AS_IDENTIFIER_NAME = 0x0008;
    const OPTION_DOES_NOT_ACCEPT_MULTIPLE_OPTIONS = 0x0010;
    const OPTION_DOES_NOT_ACCEPT_COMMA_SEPARATED_OPTIONS = 0x0020;
%}


spec
    : init declaration_list start_productions_marker grammar epilogue EOF
        {
            $$ = $declaration_list;

            // transform ebnf to bnf if necessary
            if (yy.ebnf) {
                $$.ebnf = $grammar.grammar;        // keep the original source EBNF around for possible pretty-printing & AST exports.
                $$.bnf = ['...']; // transform($grammar.grammar);
            }
            else {
                $$.bnf = $grammar.grammar;
            }
            if ($grammar.actionInclude) {
                $$.actionInclude = $grammar.actionInclude;
            }

            // source code has already been checked!
            let srcCode = $epilogue;
            if (srcCode && srcCode.trim()) {
                yy.addDeclaration($$, { include: srcCode });
            }
            return $$;
        }
    | init declaration_list start_productions_marker error /* start_epilogue_marker ... */ EOF
        {
            yyerror(rmCommonWS`
                illegal input in the parser grammar productions definition section.

                Maybe you did not correctly separate trailing code from the grammar rule set with a '%%' marker on an otherwise empty line?

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @EOF)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = $declaration_list;
        }
    | init declaration_list error EOF
        {
            yyerror(rmCommonWS`
                Maybe you did not correctly separate the parse 'header section' (token definitions, options, lexer spec, etc.) from the grammar rule set with a '%%' on an otherwise empty line?

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @declaration_list)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = $declaration_list;
        }
    ;

// because JISON doesn't support mid-rule actions,
// we set up `yy` using this empty rule at the start:
init
    : ε
        {
            if (!yy.options) yy.options = {};

            yy.ebnf = false;

            // The next attribute + API set is a 'lexer/parser hack' in the sense that
            // it assumes zero look-ahead at some points during the parse
            // when a parser rule production's action code pushes or pops a value
            // on/off the context description stack to help the lexer produce
            // better informing error messages in case of a subsequent lexer
            // fail.
            yy.__options_flags__ = 0;
            yy.__options_category_description__ = '???';

            yy.__context_cfg_stack__ = [];

            yy.pushContext = function () {
                yy.__context_cfg_stack__.push({
                    flags: yy.__options_flags__,
                    descr: yy.__options_category_description__,
                });
            };
            yy.popContext = function (msg) {
                if (yy.__context_cfg_stack__.length >= 1) {
                    let r = yy.__context_cfg_stack__.pop();

                    yy.__options_flags__ = r.flags;
                    yy.__options_category_description__ = r.descr;
                } else {
                    yyerror('__context_cfg_stack__ stack depleted! Contact a developer! ' + msg);
                }
            };
            yy.getContextDepth = function () {
                return yy.__context_cfg_stack__.length;
            };
            yy.restoreContextDepth = function (depth) {
                if (depth > yy.__context_cfg_stack__.length) {
                    yyerror(`__context_cfg_stack__ stack CANNOT be reset to depth ${depth} as it is too shallow already: actual depth is ${yy.__context_cfg_stack__.length}. Contact a developer!`);
                } else {
                    yy.__context_cfg_stack__.length = depth;
                }
            };
        }
    ;

declaration_list
    : declaration_list declaration
        {
            $$ = $declaration_list;
            if ($declaration) {
                yy.addDeclaration($$, $declaration);
            }
        }
    | %epsilon
        {
            $$ = {};
        }
    ;

declaration
    : START id
        { $$ = {start: $id}; }
    | START error
        {
            // TODO ...
            yyerror(rmCommonWS`
                %start token error?

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @START)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        }
    | LEX_BLOCK
        { $$ = {lex: {text: $LEX_BLOCK, position: @LEX_BLOCK}}; }
    | FLEX_POINTER_MODE
        {
            // This is the only mode we do support in JISON...
            $$ = null;
        }
    | FLEX_ARRAY_MODE
        {
            yyerror(rmCommonWS`
                JISON does not support the %array lexing mode.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@FLEX_ARRAY_MODE)}
            `);
            $$ = null;
        }
    | operator
        { $$ = {operator: $operator}; }
    | TOKEN full_token_definitions
        { $$ = {token_list: $full_token_definitions}; }
    | TOKEN error
        {
            // TODO ...
            yyerror(rmCommonWS`
                %token definition list error?

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @TOKEN)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        }
    //
    // may be a *parser setup code section*, e.g.
    //
    //     %{
    //        console.log('setup info message');
    //     %}
    //
    // **Note** that the action block start marker `%{` MUST be positioned
    // at the start of a line to be accepted; indented action code blocks
    // are always related to a preceding parser spec item, such as a
    // grammar production rule.
    //
    | ACTION_START_AT_SOL action ACTION_END
        {
            let srcCode = trimActionCode($action + $ACTION_END, {
                startMarker: $ACTION_START_AT_SOL
            });
            if (srcCode) {
                let rv = checkActionBlock(srcCode, @action, yy);
                if (rv) {
                    yyerror(rmCommonWS`
                        The '%{...%}' grammar setup action code section does not compile: ${rv}

                          Erroneous area:
                        ${yylexer.prettyPrintRange(@action, @ACTION_START_AT_SOL)}
                    `);
                }
                $$ = {include: srcCode};
            } else {
                $$ = null;
            }
        }
    //
    // see the alternative above: this rule is added to aid error
    // diagnosis of user coding.
    //
    | UNTERMINATED_ACTION_BLOCK
        %{
            // The issue has already been reported by the lexer. No need to repeat
            // ourselves with another error report from here.
            $$ = null;
        %}
    //
    // see the alternative above: this rule is added to aid error
    // diagnosis of user coding.
    //
    | ACTION_START_AT_SOL error
        %{
            yyerror(rmCommonWS`
                There's very probably a problem with this '%{...%\}' parser setup action code section.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@ACTION_START_AT_SOL)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        %}
    //
    // see the alternative above: this rule is added to aid error
    // diagnosis of user coding.
    //
    // This rule detects the presence of an unattached *indented*
    // action code block.
    //
    | ACTION_START error
        %{
            let start_marker = $ACTION_START.trim();
            let marker_msg = (start_marker ? ' or similar, such as ' + start_marker : '');
            yyerror(rmCommonWS`
                The '%{...%\}' parser setup action code section MUST have its action
                block start marker (\`%{\`${marker_msg}) positioned
                at the start of a line to be accepted: *indented* action code blocks
                (such as this one) are always related to an immediately preceding parser spec item,
                e.g. a grammar production rule.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@ACTION_START)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        %}
    | parse_params
        {
            $$ = {parseParams: $parse_params};
        }
    | parser_type
        {
            $$ = {parserType: $parser_type};
        }
    //
    // may be an `%options` statement, e.g.
    //
    //     %options xregexp
    //
    | option_keyword option_list OPTIONS_END
        {
            let lst = $option_list;
			// Apply the %option to the current grammar parse immediately, as it MAY
			// impact the parser's behaviour, e.g. `%option do-not-test-compile`
            for (let i = 0, len = lst.length; i < len; i++) {
                yy.options[lst[i][0]] = lst[i][1];
            }
            yy.popContext('Line 344');
            $$ = {options: lst};
        }
    //
    // see the alternative above: this rule is added to aid error
    // diagnosis of user coding.
    //
    | option_keyword error OPTIONS_END
        {
            yyerror(rmCommonWS`
                ill defined '${$option_keyword} line.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @option_keyword, @OPTIONS_END)}

                  Technical error report:
                ${$error.errStr}
            `);
            yy.popContext('Line 362');
            $$ = null;
        }
    | option_keyword error
        {
            // TODO ...
            yyerror(rmCommonWS`
                ${$option_keyword} don't seem terminated?

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @option_keyword)}

                  Technical error report:
                ${$error.errStr}
            `);
            yy.popContext('Line 377');
            $$ = null;
        }
    | DEBUG
        {
            $$ = {options: [['debug', true]]};
        }
    | EBNF
        {
            yy.ebnf = true;
            $$ = {options: [['ebnf', true]]};
        }
    | UNKNOWN_DECL
        {
            $$ = {unknownDecl: $UNKNOWN_DECL};
        }
    | import_keyword option_list OPTIONS_END
        {
            // check if there are two unvalued options: 'name path'
            let lst = $option_list;
            let len = lst.length;
            let body;
            if (len === 2 && lst[0][1] === true && lst[1][1] === true) {
                // `name path`:
                body = {
                    name: lst[0][0],
                    path: lst[1][0]
                };
            } else if (len <= 2) {
                yyerror(rmCommonWS`
                    You did not specify a legal qualifier name and/or file path for the '%import' statement, which must have the format:
                        %import qualifier_name file_path

                      Erroneous code:
                    ${yylexer.prettyPrintRange(@option_list, @import_keyword)}
                `);
            } else {
                yyerror(rmCommonWS`
                    You did specify too many attributes for the '%import' statement, which must have the format:
                        %import qualifier_name file_path

                      Erroneous code:
                    ${yylexer.prettyPrintRange(@option_list, @import_keyword)}
                `);
            }

            yy.popContext('Line 423');

            $$ = {
                imports: body
            };
        }
    | import_keyword error OPTIONS_END
        {
            yyerror(rmCommonWS`
                %import name or source filename missing maybe?

                Note: each '%import' must be qualified by a name, e.g. 'required' before the import path itself:
                    %import qualifier_name file_path

                  Erroneous code:
                ${yylexer.prettyPrintRange(@error, @import_keyword)}

                  Technical error report:
                ${$error.errStr}
            `);
            yy.popContext('Line 443');
            $$ = null;
        }
    | init_code_keyword option_list ACTION_START action ACTION_END OPTIONS_END
        {
            // check there's only 1 option which is an identifier
            let lst = $option_list;
            let len = lst.length;
            let name;
            if (len === 1 && lst[0][1] === true) {
                // `name`:
                name = lst[0][0];
            } else if (len <= 1) {
                yyerror(rmCommonWS`
                    You did not specify a legal qualifier name for the '%code' initialization code statement, which must have the format:
                        %code qualifier_name %{...code...%}

                      Erroneous code:
                    ${yylexer.prettyPrintRange(@option_list, @init_code_keyword)}
                `);
            } else {
                yyerror(rmCommonWS`
                    You did specify too many attributes for the '%code' initialization code statement, which must have the format:
                        %code qualifier_name %{...code...%}

                      Erroneous code:
                    ${yylexer.prettyPrintRange(@option_list, @init_code_keyword)}
                `);
            }

            let srcCode = trimActionCode($action + $ACTION_END, {
                startMarker: $ACTION_START
            });
            let rv = checkActionBlock(srcCode, @action, yy);
            if (rv) {
                yyerror(rmCommonWS`
                    The '%code ${name}' initialization section's action code block does not compile: ${rv}

                      Erroneous area:
                    ${yylexer.prettyPrintRange(@action, @init_code_keyword)}
                `);
            }

            yy.popContext('Line 486');

            $$ = {
                initCode: {
                    qualifier: name,
                    include: srcCode
                }
            };
        }
    | init_code_keyword option_list ACTION_START error OPTIONS_END
        {
            let start_marker = $ACTION_START.trim();
            let marker_msg = (start_marker ? ' or similar, such as ' + start_marker : '');
            let end_marker_msg = marker_msg.replace(/\{/g, '}');
            yyerror(rmCommonWS`
                The '%code ID %{...%\}' initialization code section must be properly
                wrapped in block start markers (\`%{\`${marker_msg})
                and matching end markers (\`%}\`${end_marker_msg}). Expected format:

                    %code qualifier_name {action code}

                  Erroneous code:
                ${yylexer.prettyPrintRange(@error, @init_code_keyword)}

                  Technical error report:
                ${$error.errStr}
            `);
            yy.popContext('Line 513');
            $$ = null;
        }
    | init_code_keyword error ACTION_START /* ...action */ error OPTIONS_END
        {
            yyerror(rmCommonWS`
                Each '%code' initialization code section must be qualified by a name,
                e.g. 'required' before the action code itself:

                    %code qualifier_name {action code}

                  Erroneous code:
                ${yylexer.prettyPrintRange(@error1, @init_code_keyword)}

                  Technical error report:
                ${$error1.errStr}
            `);
            yy.popContext('Line 530');
            $$ = null;
        }
    | init_code_keyword error OPTIONS_END
        {
            yyerror(rmCommonWS`
                Each '%code' initialization code section must be qualified by a name,
                e.g. 'required' before the action code itself.

                The '%code ID %{...%\}' initialization code section must be properly
                wrapped in block start markers (e.g. \`%{\`) and matching end markers
                (e.g. \`%}\`). Expected format:

                    %code qualifier_name {action code}

                  Erroneous code:
                ${yylexer.prettyPrintRange(@error, @init_code_keyword)}

                  Technical error report:
                ${$error.errStr}
            `);
            yy.popContext('Line 551');
            $$ = null;
        }
    | on_error_recovery_keyword ACTION_START action ACTION_END
        {
            var srcCode = trimActionCode($action + $ACTION_END, $ACTION_START);
            var rv = checkActionBlock(srcCode, @action, yy);
            if (rv) {
                yyerror(rmCommonWS`
                    The '${$on_error_recovery_keyword}' action code section does not compile: ${rv}

                      Erroneous area:
                    ${yylexer.prettyPrintRange(@action, @on_error_recovery_keyword)}
                `);
            }
            $$ = {
                onErrorRecoveryAction: {
                  qualifier: $on_error_recovery_keyword,
                  include: srcCode
                }
            };
        }
    | on_error_recovery_keyword ACTION_START error /* ACTIONS_END */
        {
            var start_marker = $ACTION_START.trim();
            var marker_msg = (start_marker ? ' or similar, such as ' + start_marker : '');
            var end_marker_msg = marker_msg.replace(/\{/g, '}');
            yyerror(rmCommonWS`
                The '${$on_error_recovery_keyword} %{...%\}' initialization code section must be properly
                wrapped in block start markers (\`%{\`${marker_msg})
                and matching end markers (\`%}\`${end_marker_msg}). Expected format:

                    ${$on_error_recovery_keyword} {action code}

                  Erroneous code:
                ${yylexer.prettyPrintRange(@error, @on_error_recovery_keyword)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        }
    | error
        {
            yyerror(rmCommonWS`
                illegal input in the parser spec declarations section.

                This might be stuff incorrectly dangling off the previous
                '${yy.__options_category_description__}' definition statement, 
                so please do check above when the mistake isn't immediately 
                obvious from this error spot itself.

                Or maybe you did not correctly separate the parse 'header section' 
                (token definitions, options, lexer spec, etc.) from the grammar rule set
                with a '%%' on an otherwise empty line?

                  Erroneous code:
                ${yylexer.prettyPrintRange(@error, @0)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        }
    ;

option_keyword
    : OPTIONS
        {
            yy.pushContext();
            yy.__options_flags__ = OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES | OPTION_ACCEPTS_000_IDENTIFIER_NAMES;
            yy.__options_category_description__ = $OPTIONS;

            $$ = $1;
        }
    ;

import_keyword
    : IMPORT
        {
            yy.pushContext();
            yy.__options_flags__ = OPTION_DOES_NOT_ACCEPT_VALUE | OPTION_DOES_NOT_ACCEPT_COMMA_SEPARATED_OPTIONS;
            yy.__options_category_description__ = $IMPORT;

            $$ = $1;
        }
    ;

init_code_keyword
    : INIT_CODE
        {
            yy.pushContext();
            yy.__options_flags__ = OPTION_DOES_NOT_ACCEPT_VALUE | OPTION_DOES_NOT_ACCEPT_MULTIPLE_OPTIONS | OPTION_DOES_NOT_ACCEPT_COMMA_SEPARATED_OPTIONS;
            yy.__options_category_description__ = $INIT_CODE;

            $$ = $1;
        }
    ;

include_keyword
    : INCLUDE
        {
            yy.pushContext();
            yy.__options_flags__ = OPTION_DOES_NOT_ACCEPT_VALUE | OPTION_DOES_NOT_ACCEPT_COMMA_SEPARATED_OPTIONS;
            yy.__options_category_description__ = $INCLUDE;

            $$ = $1;
        }
    ;

on_error_recovery_keyword
    : ON_ERROR_RECOVERY_SHIFT
    | ON_ERROR_RECOVERY_REDUCE
    ;

start_productions_marker
    : '%%'
        {
            yy.pushContext();
            yy.__options_flags__ = 0;
            yy.__options_category_description__ = 'the grammar productions definition section';

            $$ = $1;
        }
    ;

start_epilogue_marker
    : '%%'
        {
            yy.pushContext();
            yy.__options_flags__ = 0;
            yy.__options_category_description__ = 'the grammar epilogue section';

            $$ = $1;
        }
    ;

parse_params
    : PARSE_PARAM token_list
        { $$ = $token_list; }
    | PARSE_PARAM error
        {
            // TODO ...
            yyerror(rmCommonWS`
                %parse-params declaration error?

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @PARSE_PARAM)}

                  Technical error report:
                ${$error.errStr}
            `);
        }
    ;

parser_type
    : PARSER_TYPE symbol
        { $$ = $symbol; }
    | PARSER_TYPE error
        {
            // TODO ...
            yyerror(rmCommonWS`
                %parser-type declaration error?

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @PARSER_TYPE)}

                  Technical error report:
                ${$error.errStr}
            `);
        }
    ;

operator
    : associativity token_list
        { $$ = [$associativity]; $$.push.apply($$, $token_list); }
    | associativity error
        {
            // TODO ...
            yyerror(rmCommonWS`
                operator token list error in an '${$associativity}' associativity statement?

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @associativity)}

                  Technical error report:
                ${$error.errStr}
            `);
        }
    ;

associativity
    : LEFT
        { $$ = 'left'; }
    | RIGHT
        { $$ = 'right'; }
    | NONASSOC
        { $$ = 'nonassoc'; }
    ;

token_list
    : token_list symbol
        { $$ = $token_list; $$.push($symbol); }
    | symbol
        { $$ = [$symbol]; }
    ;

// As per http://www.gnu.org/software/bison/manual/html_node/Token-Decl.html
full_token_definitions
    : optional_token_type id_list
        {
            let rv = [];
            let lst = $id_list;
            for (let i = 0, len = lst.length; i < len; i++) {
                let id = lst[i];
                let m = {id: id};
                if ($optional_token_type) {
                    m.type = $optional_token_type;
                }
                rv.push(m);
            }
            $$ = rv;
        }
    | optional_token_type one_full_token
        {
            let m = $one_full_token;
            if ($optional_token_type) {
                m.type = $optional_token_type;
            }
            $$ = [m];
        }
    ;

one_full_token
    : id token_value token_description
        {
            $$ = {
                id: $id,
                value: $token_value,
                description: $token_description
            };
        }
    | id token_description
        {
            $$ = {
                id: $id,
                description: $token_description
            };
        }
    | id token_value
        {
            $$ = {
                id: $id,
                value: $token_value
            };
        }
    ;

optional_token_type
    : %epsilon
        { $$ = false; }
    | TOKEN_TYPE
        { $$ = $TOKEN_TYPE; }
    ;

token_value
    : INTEGER
        { $$ = $INTEGER; }
    ;

token_description
    : STRING_LIT
        { $$ = $STRING_LIT; }
    ;

id_list
    : id_list id
        { $$ = $id_list; $$.push($id); }
    | id
        { $$ = [$id]; }
    ;

// token_id
//     : TOKEN_TYPE id
//         { $$ = $id; }
//     | id
//         { $$ = $id; }
//     ;

grammar
    : production_list
        {
            $$ = {
                grammar: $production_list
            };
        }
    ;

production_list
    : production_list production
        {
            $$ = $production_list;
            if ($production) {
                if ($production[0] in $$) {
                    $$[$production[0]] = $$[$production[0]].concat($production[1]);
                } else {
                    $$[$production[0]] = $production[1];
                }
            }
        }
    | production
        { 
            $$ = {}; 
            if ($production) {
                $$[$production[0]] = $production[1];
            }
        }
    ;

production
    : production_id handle_list ';'
        {
            if ($production_id) {
                $$ = [$production_id, $handle_list];
            } else {
                // ignore tail of erroneous production
                $$ = null;
            }
        }
    | production_id error ';'
        {
            // TODO ...
            yyerror(rmCommonWS`
                rule production declaration error?

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @production_id)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        }
    | production_id error
        {
            // TODO ...
            yyerror(rmCommonWS`
                rule production declaration error: did you terminate the rule production set with a semicolon?

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @production_id)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        }
    //
    // may be a *parser action header code section*, e.g.
    //
    //     %{
    //        console.log('setup info message');
    //     %}
    //
    // **Note** that the action block start marker `%{` MUST be positioned
    // at the start of a line to be accepted; indented action code blocks
    // are always related to a preceding parser spec item, such as a
    // grammar production rule.
    //
    | ACTION_START_AT_SOL action ACTION_END
        {
            let srcCode = trimActionCode($action + $ACTION_END, {
                startMarker: $ACTION_START_AT_SOL
            });
            if (srcCode) {
                let rv = checkActionBlock(srcCode, @action, yy);
                if (rv) {
                    yyerror(rmCommonWS`
                        The '%{...%}' grammar action header code section does not compile: ${rv}

                          Erroneous area:
                        ${yylexer.prettyPrintRange(@action, @ACTION_START_AT_SOL)}
                    `);
                }
                yy.addDeclaration($$, { actionInclude: srcCode });
            }
            $$ = null;
        }
    //
    // see the alternative above: this rule is added to aid error
    // diagnosis of user coding.
    //
    | UNTERMINATED_ACTION_BLOCK
        %{
            // The issue has already been reported by the lexer. No need to repeat
            // ourselves with another error report from here.
            $$ = null;
        %}
    //
    // see the alternative above: this rule is added to aid error
    // diagnosis of user coding.
    //
    | ACTION_START_AT_SOL error
        %{
            yyerror(rmCommonWS`
                There's very probably a problem with this '%{...%\}' grammar action header code section.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@ACTION_START_AT_SOL)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        %}
    //
    // see the alternative above: this rule is added to aid error
    // diagnosis of user coding.
    //
    // This rule detects the presence of an unattached *indented*
    // action code block.
    //
    | ACTION_START error
        %{
            let start_marker = $ACTION_START.trim();
            // When the start_marker is not an explicit `%{`, `{` or similar, the error
            // is more probably due to indenting the grammar rule production, rather than an error
            // in writing the action header code block:
            if (start_marker.indexOf('{') >= 0) {
	            let marker_msg = (start_marker ? ' or similar, such as ' + start_marker : '');
	            yyerror(rmCommonWS`
	                The '%{...%\}' grammar action header code section MUST have its action
	                block start marker (\`%{\`${marker_msg}) positioned
	                at the start of a line to be accepted: *indented* action code blocks
	                (such as this one) are always related to an immediately preceding parser spec item,
	                e.g. a grammar production rule.

	                  Erroneous area:
	                ${yylexer.prettyPrintRange(@ACTION_START)}

	                  Technical error report:
	                ${$error.errStr}
	            `);
            } else {
                yyerror(rmCommonWS`
                    There's probably an error in one or more of your grammar productions.
                    Did you perhaps indent the production? Note that all grammar productions
                    MUST start at the start of the line, i.e. text column 1. Indented text
                    is perceived as JavaScript action code related to the last production
                    rule.

                      Erroneous code:
                    ${yylexer.prettyPrintRange(@error)}

                      Technical error report:
                    ${$error.errStr}
                `);
            }
            $$ = null;
        %}
    //
    // Extra error checking: warn user when using %XYZ options, etc. in the wrong section (grammar section)
    //
    // These rules are added to aid error diagnosis of user coding. 
    //
    // The 'error' parts in these productions are here to gobble the remainder of the erroneous input.
    //
    | pct_token_which_belongs_in_header_section
        %{
            yyerror(rmCommonWS`
                The '${$pct_token_which_belongs_in_header_section}' keyword cannot be used in the grammar 
                section after the first '%%'. You must move this code to the grammar header section 
                above the '%%'.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@pct_token_which_belongs_in_header_section)}
            `);
            $$ = null;
        %}
    ;


//
// Extra error checking: warn user when using %XYZ options, etc. in the wrong section (grammar section)
//
// These rules are added to aid error diagnosis of user coding. 
//
// The 'error' parts in these productions are here to gobble the remainder of the erroneous input.
//
pct_token_which_belongs_in_header_section
    : START error
        {
            $$ = $1;
        }
    | LEX_BLOCK
    | FLEX_POINTER_MODE
    | FLEX_ARRAY_MODE
    | LEFT error
        {
            $$ = $1;
        }
    | RIGHT error
        {
            $$ = $1;
        }
    | NONASSOC error
        {
            $$ = $1;
        }
    | TOKEN error
        {
            $$ = $1;
        }
    | PARSE_PARAM error
        {
            $$ = $1;
        }
    | PARSER_TYPE error
        {
            $$ = $1;
        }
    | option_keyword error OPTIONS_END
        {
            $$ = $1;

            yy.popContext('Line 1076');
        }
    | DEBUG
    | EBNF
    | UNKNOWN_DECL
    | import_keyword error OPTIONS_END
        {
            $$ = $1;

            yy.popContext('Line 1085');
        }
    | init_code_keyword error OPTIONS_END
        {
            $$ = $1;

            yy.popContext('Line 1091');
        }
    | on_error_recovery_keyword error
        {
            $$ = $1;
        }
    ;

production_id
    : id production_description?[descr] ':'
        {
            $$ = $id;

            // TODO: carry rule description support into the parser generator...
        }
    | id production_description?[descr] error
        {
            // TODO ...
            yyerror(rmCommonWS`
                rule id should be followed by a colon, but that one seems missing?

                *Aside*: rule id may be followed by descriptive text (string) before the \`:\` colon.
                This text must be surrounded by single ('), double (") or backtick (\`) quotes.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @id)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        }
    | id production_description?[descr] ARROW_ACTION
        {
            // TODO ...
            yyerror(rmCommonWS`
                Production for rule '${$id}' is missing: arrows introduce action code in Jison.

                Jison does not support rule production definition using arrows (->, =>, →) but expects
                colons (:) instead, so maybe you intended this:

                    ${$id} : ${$ARROW_ACTION}

                while the user-defined action code block MAY be an arrow function, e.g.

                    rule: id -> Math.min($id, 42);

                  Erroneous area:
                ${yylexer.prettyPrintRange(@ARROW_ACTION, @id)}
            `);
            $$ = null;
        }
    ;

production_description
    : STRING_LIT
        { $$ = $STRING_LIT; }
    ;

handle_list
    : handle_list '|' handle_action
        {
            $$ = $handle_list;
            $$.push($handle_action);
        }
    | handle_action
        {
            $$ = [$handle_action];
        }
    //
    // Recognize a common mistake
    //
    | handle_list ':'[colon] error
        {
            // TODO ...
            yyerror(rmCommonWS`
                multiple alternative rule productions should be separated by a '|' pipe character, not a ':' colon!

                  Erroneous area:
                ${yylexer.prettyPrintRange(@colon, @handle_list)}
            `);
            $$ = $handle_list;
        }
    ;

handle_action
    : handle prec handle_action_start action ACTION_END
        {
            assert(Array.isArray($handle));
            assert($handle.length >= 1);
            let isEpsilonRule = ($handle[0] === null);
			let isArrowAction = $handle_action_start.is_arrow;
            let srcCode = null;

            if ($action) {
                srcCode = trimActionCode($action + $ACTION_END, {
                    startMarker: $handle_action_start.starter
                });
                let rv = checkActionBlock(srcCode, @action);
                if (rv) {
                    let indentedSrc = rmCommonWS([srcCode]).split('\n').join('\n    ');

                    let arrowMsg = isArrowAction ? rmCommonWS`
                        Please be aware that the reported compile error MAY be referring
                        to the wrapper code which is added by JISON automatically when
                        processing arrow actions: the entire action code chunk
                        (including wrapper) is:

                            ${indentedSrc}
					` : '';

                    yyerror(rmCommonWS`
                        ${isEpsilonRule ? 'epsilon ' : ''}production rule ${isArrowAction ? 'arrow ' : ''}action code block does not compile: ${rv}

						${arrowMsg.trim()}
						
                          Erroneous area:
                        ${yylexer.prettyPrintRange(@action, @handle)}
                    `);
                }
            }
            if ($prec) {
                if (isEpsilonRule) {
                    yyerror(rmCommonWS`
                        You cannot specify a precedence override for an epsilon (a.k.a. empty) rule!

                          Erroneous area:
                        ${yylexer.prettyPrintRange(@prec, @0 /* @handle is very probably NULL! We need this one for some decent location info! */)}
                    `);
                }
            }
            $$ = {
                handle: $handle,
                prec: $prec,
                action: srcCode
            };
        }
/*






TODO



okee, denk er aan:

epsilon rules hieronder zijn weg want handle pakt de epsilon al op

alles nog verder nalopen nu we een EBNF AST fabrieken. Alleen hierboven en op een paar plekken in deze file
al gedaan, de rest zit nog vol met .join() shit.

EBNF grammar (en lexer) kunnen compleet vervallen, want die deden toch niks anders dan de opnieuw 
geconstrueerde grammar rules omzetten naar een AST en dat doen we nu hier en laten dat zo.

Dit betekent dat ik heel de BNF parser code door moet EN JISON.JS ZELF voordat dit gaat werken: 
de code generator zal de nieuwe AST moeten gaan snappen.

Dit heeft ook gevolgen voor jison2json en json2jison, die nu allebei als stopper werken in het
build proces zodat ik niet /dist/ verneuk zonder dat te willen.












*/                    
    | handle prec /* no action code block */
        {
            assert(Array.isArray($handle));
            assert($handle.length >= 1);
            let isEpsilonRule = ($handle[0] === null);

            $$ = {
                handle: $handle,
                prec: $prec,
            };
            if ($prec) {
                if (isEpsilonRule) {
                    yyerror(rmCommonWS`
                        You cannot specify a precedence override for an epsilon (a.k.a. empty) rule!

                          Erroneous area:
                        ${yylexer.prettyPrintRange(@handle, @0 /* @handle is very probably NULL! We need this one for some decent location info! */)}
                    `);
                }
            }
        }
    ;

handle_action_start
	: ACTION_START 
		{
			$$ = {
				starter: $ACTION_START,
				is_arrow: false
			};
		}
	| ARROW_ACTION_START 
		{
			$$ = {
				starter: $ARROW_ACTION_START,
				is_arrow: true
			};
		}
	;	
		
handle
    : handle suffixed_expression
        {
            $$ = $handle;
            $$.push($suffixed_expression);
        }
    // empty rules, which are otherwise identical to %epsilon rules:
    // %epsilon may only be used to signal this is an empty rule alt;
    // hence it can only occur by itself
    // (with an optional action block, but no alias what-so-ever nor any precedence override).
    | %epsilon
        {
            $$ = [ null ];
        }
    | EPSILON
        {
            $$ = [ null ];
        }
    ;

handle_sublist
    : handle_sublist '|' handle
        {
            $$ = $handle_sublist;
            $$.push($handle);
        }
    | handle
        {
            $$ = [$handle];
        }
    ;

suffixed_expression
    : expression suffix ALIAS
        {
            if (!yy.ebnf && $suffix) {
                yyerror(rmCommonWS`
                    suffixes (*, +, ?) in a grammar rule are only supported in %ebnf mode.

                      Erroneous area:
                    ${yylexer.prettyPrintRange(@suffix)}
                `);
            }
            $$ = {
                type: TOK_XALIAS,
                expression: $expression,
                suffix: $suffix,
                alias: $ALIAS
            };
        }
    | expression suffix
        {
            if (!yy.ebnf && $suffix) {
                yyerror(rmCommonWS`
                    suffixes (*, +, ?) in a grammar rule are only supported in %ebnf mode.

                      Erroneous area:
                    ${yylexer.prettyPrintRange(@suffix)}
                `);
            }
            $$ = {
                type: TOK_EXPRESSION,
                expression: $expression,
                suffix: $suffix,
            };
        }
    ;

expression
    : ID
        {
            $$ = {
                type: TOK_SYMBOL,
                symbol: $ID,
            };
        }
    | EOF_ID
        {
            $$ = {
                type: TOK_SYMBOL,
                symbol: '$end',
            };
        }
    | STRING_LIT
        {
            // be made part of the rule rhs a.k.a. production (type: *string*) again and we want
            // to be able to handle all tokens, including *significant space*
            // encoded as literal tokens in a grammar such as this: `rule: A ' ' B`.
            $$ = {
                type: TOK_SYMBOLSTRING,
                symbol: $STRING_LIT,
            };
        }
    | '(' handle_sublist ')'
        {
            if (!yy.ebnf) {
                yyerror(rmCommonWS`
                    Bracketed sublists '( ... )' in a grammar rule are only supported in %ebnf mode.

                      Erroneous area:
                    ${yylexer.prettyPrintRange(@$)}
                `);
            }
            $$ = {
                type: TOK_SUBEXPRESSION,
                symbol: $handle_sublist,
            };
        }
    | '(' handle_sublist error
        {
            yyerror(rmCommonWS`
                Seems you did not correctly bracket a grammar rule sublist in '( ... )' brackets.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @1)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = {
                type: TOK_SUBEXPRESSION,
                symbol: $handle_sublist,
            };
        }
    ;

suffix
    : %epsilon
        { $$ = null; }
    | '*'
        { $$ = $1; }
    | '?'
        { $$ = $1; }
    | '+'
        { $$ = $1; }
    ;

prec
    : PREC symbol
        {
            $$ = $symbol;
        }
    | PREC error
        {
            // TODO ...
            yyerror(rmCommonWS`
                %prec precedence override declaration error?

                  Erroneous precedence declaration:
                ${yylexer.prettyPrintRange(@error, @PREC)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        }
    | %epsilon
        {
            $$ = null;
        }
    ;

symbol
    : ID
        {
            $$ = {
                type: TOK_SYMBOL,
                symbol: $ID,
            };
        }
    | STRING_LIT
        {
            // we want to be able to handle all tokens, including *significant space*
            // encoded as literal tokens in a grammar such as this: `rule: A ' ' B`.
            //
            // We also want to detect whether it was a *literal string* ID or a direct ID that
            // serves as a symbol anywhere else. That way, we can potentially cope with 'nasty'
            // lexer/parser constructs such as
            //
            //      %token 'N'
            //      %token N
            //
            //      rule: N 'N' N;
            //
            $$ = {
                type: TOK_SYMBOLSTRING,
                symbol: $STRING_LIT,
            };
        }
    ;

id
    : ID
        { $$ = $ID; }
    ;

action
    : action ACTION_BODY
        { $$ = $action + $ACTION_BODY; }
    | action include_macro_code
        { $$ = $action + '\n\n' + $include_macro_code + '\n\n'; }
    | action INCLUDE_PLACEMENT_ERROR
        {
            yyerror(rmCommonWS`
                You may place the '%include' instruction only at the start/front of a line.

                  Its use is not permitted at this position:
                ${yylexer.prettyPrintRange(@INCLUDE_PLACEMENT_ERROR, @0)}
            `);
            $$ = $action;
        }
    | action BRACKET_MISSING
        {
            yyerror(rmCommonWS`
                Missing curly braces: seems you did not correctly bracket a lexer rule action block in curly braces: '{ ... }'.

                  Offending action body:
                ${yylexer.prettyPrintRange(@BRACKET_MISSING, @0)}
            `);
            $$ = $action;
        }
    | action BRACKET_SURPLUS
        {
            yyerror(rmCommonWS`
                Too many curly braces: seems you did not correctly bracket a lexer rule action block in curly braces: '{ ... }'.

                  Offending action body:
                ${yylexer.prettyPrintRange(@BRACKET_SURPLUS, @0)}
            `);
            $$ = $action;
        }
    | action UNTERMINATED_STRING_ERROR
        {
            yyerror(rmCommonWS`
                Unterminated string constant in lexer rule action block.

                When your action code is as intended, it may help to enclose
                your rule action block code in a '%{...%}' block.

                  Offending action body:
                ${yylexer.prettyPrintRange(@UNTERMINATED_STRING_ERROR, @0)}
            `);
            $$ = $action;
        }
    | ε
        { $$ = ''; }
    ;


option_list
    : option_list ','[comma] option
        {
            // validate that this is legal behaviour under the given circumstances, i.e. parser context:
            if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_MULTIPLE_OPTIONS) {
                yyerror(rmCommonWS`
                    You may only specify one name/argument in a ${yy.__options_category_description__} statement.

                      Erroneous area:
                    ${yylexer.prettyPrintRange(yylexer.deriveLocationInfo(@comma, @option), @0)}
                `);
            }
            if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_COMMA_SEPARATED_OPTIONS) {
                let optlist = $option_list.map(function (opt) {
                    return opt[0];
                });
                optlist.push($option[0]);

                yyerror(rmCommonWS`
                    You may not separate entries in a ${yy.__options_category_description__} statement using commas.
                    Use whitespace instead, e.g.:

                        ${$-1} ${optlist.join(' ')} ...

                      Erroneous area:
                    ${yylexer.prettyPrintRange(yylexer.deriveLocationInfo(@comma, @option_list), @0)}
                `);
            }
            $$ = $option_list;
            if ($option) {
                $$.push($option);
            }
        }
    | option_list option
        {
            // validate that this is legal behaviour under the given circumstances, i.e. parser context:
            if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_MULTIPLE_OPTIONS) {
                yyerror(rmCommonWS`
                    You may only specify one name/argument in a ${yy.__options_category_description__} statement.

                      Erroneous area:
                    ${yylexer.prettyPrintRange(yylexer.deriveLocationInfo(@option), @0)}
                `);
            }
            $$ = $option_list;
            if ($option) {
                $$.push($option);
            }
        }
    | option
        {
            $$ = [];
            if ($option) {
                $$.push($option);
            }
        }
    | option_list ','[comma] error?[err] '=' any_option_value
        {
            let with_value_msg = ' (with optional value assignment)';
            if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_VALUE) {
                with_value_msg = '';
            }
            yyerror(rmCommonWS`
                Expected a valid option name${with_value_msg} in a ${yy.__options_category_description__} statement.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@err, @comma)}

                  Technical error report:
                ${$err ? $err.errStr : '---'}
            `);

            $$ = $option_list;
        }
    ;

option
    : option_name
        {
            $$ = [$option_name, true];
        }
    | option_name '=' any_option_value
        {
            // validate that this is legal behaviour under the given circumstances, i.e. parser context:
            if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_VALUE) {
                yyerror(rmCommonWS`
                    The entries in a ${yy.__options_category_description__} statement MUST NOT be assigned values, such as '${$option_name}=${$any_option_value}'.

                      Erroneous area:
                    ${yylexer.prettyPrintRange(yylexer.deriveLocationInfo(@any_option_value, @option_name), @-1)}
                `);
            }
            $$ = [$option_name, $any_option_value];
        }
    | option_name '=' error
        {
            // TODO ...
            yyerror(rmCommonWS`
                Internal error: option "${$option}" value assignment failure in a ${yy.__options_category_description__} statement.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@error, @-1)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = null;
        }
// WARNING: this production placed here will cause a LR(1) conflict, due to the options not necessarily being
// separated by ',' comma's, so it is ambiguous if 'option_name = any_option_value' should then be interpreted
// as a correct option *or* as a lone 'option_name' *plus* '%epsilon = any_option_value'.
//
// To resolve this conflict, we move this production to the 'option_list' where it MAY be applied when the
// option_list is comma-separated.
//
//    | error?[err] '=' any_option_value
//        {
//            let with_value_msg = ' (with optional value assignment)';
//            if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_VALUE) {
//                with_value_msg = '';
//            }
//            yyerror(rmCommonWS`
//                Expected a valid option name${with_value_msg} in a ${yy.__options_category_description__} statement.
//
//                  Erroneous area:
//                ${yylexer.prettyPrintRange(@err, @-1)}
//
//                  Technical error report:
//                ${$err.errStr}
//            `);
//        }
//        $$ = null;
    ;

option_name
    : nonnumeric_option_value[name]
        {
            // validate that this is legal input under the given circumstances, i.e. parser context:
            if (yy.__options_flags__ & OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES) {
                let name = $name;
                let identifier = mkIdentifier(name);
                // check if the transformation is obvious & trivial to humans;
                // if not, report an error as we don't want confusion due to
                // typos and/or garbage input here producing something that
                // is usable from a machine perspective.
                if (!isLegalIdentifierInput(name)) {
                    name = name.replace(/\d/g, '');
                    if (!isLegalIdentifierInput(name) || !(yy.__options_flags__ & OPTION_ACCEPTS_000_IDENTIFIER_NAMES)) {
                        let with_value_msg = ' (with optional value assignment)';
                        if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_VALUE) {
                            with_value_msg = '';
                        }
                        yyerror(rmCommonWS`
                            Expected a valid name/argument${with_value_msg} in a ${yy.__options_category_description__} statement.
                            Entries (names) must look like regular programming language
                            identifiers, with the addition that option names MAY contain
                            '-' dashes, e.g. 'example-option-1'.

                            You may also start an option identifier with a number, but 
                            then it must not be *only* a number, so '%option 8bit' is okay,
                            while '%option 42' is not okay.

                            Suggested name:
                                ${identifier}

                              Erroneous area:
                            ${yylexer.prettyPrintRange(@name, @-1)}
                        `);
                    }
                }
                $$ = identifier;
            } else {
                $$ = $name;
            }
        }
    | '*'[star]
        {
            // validate that this is legal input under the given circumstances, i.e. parser context:
            if (!(yy.__options_flags__ & OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES) || (yy.__options_flags__ & OPTION_ALSO_ACCEPTS_STAR_AS_IDENTIFIER_NAME)) {
                $$ = $star;
            } else {
                let with_value_msg = ' (with optional value assignment)';
                if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_VALUE) {
                    with_value_msg = '';
                }
                yyerror(rmCommonWS`
                    Expected a valid name/argument${with_value_msg} in a ${yy.__options_category_description__} statement.
                    Entries (names) must look like regular programming language
                    identifiers, with the addition that option names MAY contain
                    '-' dashes, e.g. 'example-option-1'

                      Erroneous area:
                    ${yylexer.prettyPrintRange(@star, @-1)}
                `);
            }
        }
    ;

nonnumeric_option_value
    : OPTION_STRING
        { $$ = JSON5.parse($OPTION_STRING); }
    | OPTION_VALUE
        { $$ = parseValue($OPTION_VALUE); }
    ;

any_option_value
    : nonnumeric_option_value
    | INTEGER
    ;

epilogue
    : %empty
        {
            $$ = '';
        }
    | start_epilogue_marker
        {
            yy.popContext('Line 1773');

            $$ = '';
        }
    | start_epilogue_marker epilogue_chunks
        {
            let srcCode = trimActionCode($epilogue_chunks);
            if (srcCode) {
                let rv = checkActionBlock(srcCode, @epilogue_chunks);
                if (rv) {
                    yyerror(rmCommonWS`
                        The '%%' parser epilogue code section does not compile: ${rv}

                          Erroneous area:
                        ${yylexer.prettyPrintRange(@epilogue_chunks, @1)}
                    `);
                }
            }

            yy.popContext('Line 1792');

            $$ = srcCode;
        }
    ;

epilogue_chunks
    : epilogue_chunks epilogue_chunk
        {
            $$ = $epilogue_chunks + $epilogue_chunk;
        }
    | epilogue_chunk
        {
            $$ = $epilogue_chunk;
        }
    ;

epilogue_chunk
    //
    // `%include` automatically injects a `ACTION_START` / `ACTION_START_AT_SOL` token.
    // We don't tolerate `ACTION_START` tokens -- indented `%{` markers -- in the epilogue.
    //
    // To help epilogue code to delineate code chunks from %include blocks in
    // pathological condition, we do support wrapping chunks of epilogue
    // in `%{...%}`.
    //
    : ACTION_START_AT_SOL action ACTION_END
        {
            let srcCode = trimActionCode($action + $ACTION_END, {
                startMarker: $ACTION_START_AT_SOL
            });
            if (srcCode) {
                let rv = checkActionBlock(srcCode, @action, yy);
                if (rv) {
                    yyerror(rmCommonWS`
                        The '%{...%}' lexer epilogue code chunk does not compile: ${rv}

                          Erroneous area:
                        ${yylexer.prettyPrintRange(@action, @ACTION_START_AT_SOL)}
                    `);
                }
            }
            // Since the epilogue is concatenated as-is (see the `epilogue_chunks` rule above)
            // we append those protective double newlines right now, as the calling site
            // won't do it for us:
            $$ = '\n\n' + srcCode + '\n\n';
        }
    //
    // see the alternative above: this rule is added to aid error
    // diagnosis of user coding.
    //
    | ACTION_START_AT_SOL error
        %{
            let start_marker = $ACTION_START_AT_SOL.trim();
            let marker_msg = (start_marker ? ' or similar, such as ' + start_marker : '');
            yyerror(rmCommonWS`
                There's very probably a problem with this '%{...%\}' lexer setup action code section.

                  Erroneous area:
                ${yylexer.prettyPrintRange(@ACTION_START_AT_SOL)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = '';
        %}
    //
    // see the alternative above: this rule is added to aid error
    // diagnosis of user coding.
    //
    | UNTERMINATED_ACTION_BLOCK
        %{
            // The issue has already been reported by the lexer. No need to repeat
            // ourselves with another error report from here.
            $$ = '';
        %}
    | TRAILING_CODE_CHUNK
        {
            // these code chunks are very probably incomplete, hence compile-testing
            // for these should be deferred until we've collected the entire epilogue.
            $$ = $TRAILING_CODE_CHUNK;
        }
    | error
        {
            yyerror(rmCommonWS`
                There's an error in your lexer epilogue code block.

                  Erroneous code:
                ${yylexer.prettyPrintRange(@error, @-1)}

                  Technical error report:
                ${$error.errStr}
            `);
            $$ = '';
        }
    ;

include_macro_code
    : include_keyword option_list OPTIONS_END
        {
            // check if there is only 1 unvalued options: 'path'
            let lst = $option_list;
            let len = lst.length;
            let include_path;
            if (len === 1 && lst[0][1] === true) {
                // `path`:
                include_path = lst[0][0];
            } else if (len <= 1) {
                yyerror(rmCommonWS`
                    You did not specify a legal file path for the '%include' statement, which must have the format:
                        %include file_path

                      Erroneous code:
                    ${yylexer.prettyPrintRange(@option_list, @include_keyword)}
                `);
            } else {
                yyerror(rmCommonWS`
                    You did specify too many attributes for the '%include' statement, which must have the format:
                        %include file_path

                      Erroneous code:
                    ${yylexer.prettyPrintRange(@option_list, @include_keyword)}
                `);
            }

            if (!fs.existsSync(include_path)) {
                yyerror(rmCommonWS`
                    Cannot %include "${include_path}":
                    The file does not exist.

                    The current working directory (set up by JISON) is:

                      ${process.cwd()}

                    hence the full path to the given %include file is:

                      ${path.resolve(include_path)}

                      Erroneous area:
                    ${yylexer.prettyPrintRange(@$)}
                `);
                $$ = '\n\n\n\n';
            } else {
                // **Aside**: And no, we don't support nested '%include'!
                let fileContent = fs.readFileSync(include_path, { encoding: 'utf-8' });

                let srcCode = trimActionCode(fileContent);
                if (srcCode) {
                    let rv = checkActionBlock(srcCode, @$, yy);
                    if (rv) {
                        yyerror(rmCommonWS`
                            The source code included from file '${include_path}' does not compile: ${rv}

                              Erroneous area:
                            ${yylexer.prettyPrintRange(@$)}
                        `);
                    }
                }

                // And no, we don't support nested '%include':
                $$ = '\n// Included by Jison: ' + include_path + ':\n\n' + srcCode + '\n\n// End Of Include by Jison: ' + include_path + '\n\n';
            }

            yy.popContext('Line 1955');
        }
    | include_keyword error
        {
            yyerror(rmCommonWS`
                %include MUST be followed by a valid file path.

                  Erroneous path:
                ${yylexer.prettyPrintRange(@error, @include_keyword)}

                  Technical error report:
                ${$error.errStr}
            `);
            yy.popContext('Line 1968');
            $$ = null;
        }
    ;

%%


const rmCommonWS = helpers.rmCommonWS;
const dquote = helpers.dquote;
const checkActionBlock = helpers.checkActionBlock;
const mkIdentifier = helpers.mkIdentifier;
const isLegalIdentifierInput = helpers.isLegalIdentifierInput;
const trimActionCode = helpers.trimActionCode;
const braceArrowActionCode = helpers.braceArrowActionCode;


// convert string value to number or boolean value, when possible
// (and when this is more or less obviously the intent)
// otherwise produce the string itself as value.
function parseValue(v) {
    if (v === 'false') {
        return false;
    }
    if (v === 'true') {
        return true;
    }
    // http://stackoverflow.com/questions/175739/is-there-a-built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
    // Note that the `v` check ensures that we do not convert `undefined`, `null` and `''` (empty string!)
    if (v && !isNaN(v)) {
        let rv = +v;
        if (isFinite(rv)) {
            return rv;
        }
    }
    return v;
}


parser.warn = function p_warn() {
    console.warn.apply(console, arguments);
};

parser.log = function p_log() {
    console.log.apply(console, arguments);
};

parser.pre_parse = function p_lex() {
    if (parser.yydebug) parser.log('pre_parse:', arguments);
};

parser.yy.pre_parse = function p_lex() {
    if (parser.yydebug) parser.log('pre_parse YY:', arguments);
};

parser.yy.post_lex = function p_lex() {
    if (parser.yydebug) parser.log('post_lex:', arguments);
};

