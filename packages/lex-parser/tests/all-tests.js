const assert = require('assert');
const fs = require('fs');
const path = require('path');
const yaml = require('@gerhobbelt/js-yaml');
const JSON5 = require('@gerhobbelt/json5');
const globby = require('globby');
const helpers = require('../../helpers-lib');
const rmCommonWS = helpers.rmCommonWS;

const lex = require('../dist/lex-parser-cjs');





function lexer_reset() {
    let lexer = lex.parser.lexer;
    lexer.cleanupAfterLex();

    if (lex.parser.yy) {
        let y = lex.parser.yy;
        if (y.parser) {
            delete y.parser;
        }
        if (y.lexer) {
            delete y.lexer;
        }
    }

    lex.parser.yy = {};

    let debug = 0;

    if (!debug) {
        // silence warn+log messages from the test internals:
        lex.warn = function tl_warn() {
            // console.warn("TEST WARNING: ", arguments);
        };

        lex.log = function tl_log() {
            // console.warn("TEST LOG: ", arguments);
        };

        lex.parser.warn = function tl_warn() {
            // console.warn("TEST WARNING: ", arguments);
        };

        lex.parser.log = function tl_log() {
            // console.warn("TEST LOG: ", arguments);
        };
    }
}








console.log('exec glob....', __dirname);
const original_cwd = process.cwd();
process.chdir(__dirname);
let testset = globby.sync([
    './specs/*.jisonlex', 
    './lex/*.jisonlex',
]);

testset = testset.sort((a, b) => {
    let rv;
    if (a.includes('/lex/') && !b.includes('/lex/')) {
        rv = 1;
    } else {
        rv = a.localeCompare(b);
    }
    return rv;
});

const testsetSpec = helpers.setupFileBasedTestRig(__dirname, testset, 'lex-parser', { useGeneratorRef: true });






//
// compile these lexer specs and run a sample input through them
//
describe('Test Lexer Grammars', function () {

    beforeEach(function beforeEachTest() {
        lexer_reset();
    });

    testsetSpec.filespecList.forEach(function (filespec) {
        // process this file:
        let title = (filespec.meta ? filespec.meta.title : null);

        let testname = 'test: ' + filespec.filepath4display + (title ? ' :: ' + title : '');

        // don't dump more than 4 EOF tokens at the end of the stream:
        const maxEOFTokenCount = 4;
        // don't dump more than 20 error tokens in the output stream:
        const maxERRORTokenCount = 20;
        // maximum number of tokens in the output stream:
        const maxTokenCount = 10000;

        console.error('generate test: ', testname);

        // and create a test for it:
        it(testname, function testEachLexerExample() {
            let err;
            let i = 0;
            let tokens = [];
            
            let lexer = lex.parser.lexer;

            let grammar = filespec.grammar;

            let countEOFs = 0;
            let countERRORs = 0;
            let countParseErrorCalls = 0;
            let countDetectedParseErrorCalls = 0;
            let countFATALs = 0;

            let yy = {
                parseError: function customMainParseError(str, hash, ExceptionClass) {
                    countParseErrorCalls++;

                    if (0) {
                        console.error("parseError: ", str, (new Error('')).stack);
                    }

                    // augment the returned value when possible:

                    // WARNING: it may appear there is no need for shallow copy as a new hash 
                    // is created for every parseError() call; HOWEVER, every hash instance is
                    // tracked in an error queue, which will be cleaned up when the parser
                    // (or userland code) invokes the `cleanupAfterLex()` API.
                    const rv = Object.assign({}, hash);
                    if (rv.yy) {
                        // shallow copy to keep (most of) current internal lexer state intact:
                        rv.yy = Object.assign({}, rv.yy);
                    }
                    if (rv.loc) {
                        rv.loc = Object.assign({}, rv.loc);
                        rv.loc.range = rv.loc.range.slice();
                    }

                    rv.errorDiag = {
                        inputPos: this._input ? this._input.length : -1,
                        yytext: this.yytext,
                        yyleng: this.yyleng,
                        matches: this.matches,
                        activeCondition: this.topState(),
                        conditionStackDepth: this.conditionStack.length,
                    };

                    //if (hash.yyErrorInvoked) ... 
                    
                    // we dump yytext in the token stream, so we can use that to dump a little
                    // more info for comparison & diagnostics:
                    this.yytext = rv;

                    return -42; // this.ERROR;
                }
            };
        
            try {
                // Change CWD to the directory where the source grammar resides: this helps us properly
                // %include any files mentioned in the grammar with relative paths:
                process.chdir(path.dirname(filespec.path));

                lexer.setInput(grammar, yy);

                for (i = 0; i < maxTokenCount; i++) {
                    let tok = lexer.lex();
                    tokens.push({
                        id: tok,
                        token: lex.parser.describeSymbol(tok),
                        yytext: lexer.yytext,
                        yylloc: lexer.yylloc
                    });
                    if (tok === lexer.EOF) {
                        // and make sure EOF stays EOF, i.e. continued invocation of `lex()` will only
                        // produce more EOF tokens at the same location:
                        countEOFs++;
                        if (countEOFs >= maxEOFTokenCount) {
                            break;
                        }
                    }
                    else if (tok === lexer.ERROR) {
                        countERRORs++;
                        if (countERRORs >= maxERRORTokenCount) {
                            break;
                        }
                    }
                    else if (tok === -42) {
                        countDetectedParseErrorCalls++;
                        if (countDetectedParseErrorCalls >= maxERRORTokenCount) {
                            break;
                        }
                    }
                }
            } catch (ex) {
                countFATALs++;
                
                // save the error:
                err = ex;
                tokens.push({
                    id: -1,
                    token: null,
                    fail: 1,
                    meta: filespec.spec.meta,
                    err: ex
                });
            } finally {
                process.chdir(original_cwd);
            }

            // write a summary node at the end of the stream:
            tokens.push({
                id: -2,
                token: null,
                summary: {
                    totalTokenCount: tokens.length,
                    EOFTokenCount: countEOFs,
                    ERRORTokenCount: countERRORs,
                    ParseErrorCallCount: countParseErrorCalls,
                    DetectedParseErrorCallCount: countDetectedParseErrorCalls,
                    fatalExceptionCount: countFATALs
                }
            });
            // if (lexerSourceCode) {
            //   tokens.push(lexerSourceCode);
            // }
            tokens = testsetSpec.trimErrorForTestReporting(tokens);

            // either we check/test the correctness of the collected input, iff there's
            // a reference provided, OR we create the reference file for future use:
            let refOut = JSON5.stringify(tokens, {
                replacer: function remove_lexer_objrefs(key, value) {
                    if (value === lexer) {
                        return '[lexer instance]';
                    }
                    return value;
                },
                space: 2,
                circularRefHandler: testsetSpec.testrig_JSON5circularRefHandler
            });

            // strip away devbox-specific paths in error stack traces in the output:
            refOut = testsetSpec.stripErrorStackPaths(refOut);

            refOut = rmCommonWS`
                /* 
                 * grammar spec generated by @gerhobbelt/lex-parser for input file:
                 *     ${filespec.filepath4display}
                 */

            `.trimStart() + refOut;

            if (filespec.generatorRef) {
                // Perform the validations only AFTER we've written the files to output:
                // several tests produce very large outputs, which we shouldn't let assert() process
                // for diff reporting as that takes bloody ages:
            } else {
                fs.writeFileSync(filespec.generatorRefPath, refOut, 'utf8');
                filespec.generatorRef = refOut;
            }
            fs.writeFileSync(filespec.generatorOutPath, refOut, 'utf8');

            // now that we have saved all data, perform the validation checks:
            // keep them simple so assert doesn't need a lot of time to produce diff reports
            // when the test fails:
            testsetSpec.assertOutputMatchesReference(refOut, filespec.generatorRef, 'grammar should be parsed correctly');
        });
    });
});











describe('LEX parser', function () {
    beforeEach(function beforeEachTest() {
        lexer_reset();
    });

    testsetSpec.filespecList.forEach(function (filespec) {
        // process this file:
        let title = (filespec.meta ? filespec.meta.title : null);

        let testname = 'test: ' + filespec.filepath4display + (title ? ' :: ' + title : '');

        // don't dump more than 4 EOF tokens at the end of the stream:
        const maxEOFTokenCount = 4;
        // don't dump more than 20 error tokens in the output stream:
        const maxERRORTokenCount = 20;
        // maximum number of tokens in the output stream:
        const maxTokenCount = 10000;

        console.error('generate test: ', testname);

        // and create a test for it:
        it(testname, function testEachParserExample() {
            let err, ast;

            let grammar = filespec.grammar;
        
            let countEOFs = 0;
            let countERRORs = 0;
            let countFATALs = 0;

            let pre_called = 0;
            lex.parser.pre_parse = function pre(sharedState_yy) {
                pre_called++;
            };
            let post_called = 0;
            let post_info = null;
            lex.parser.post_parse = function post(sharedState_yy, resultValue, hash) {
                post_called++;
                post_info = {
                    sharedState_yy,
                    //resultValue,
                    hash,
                    reentrant_call_depth: this.__reentrant_call_depth,
                    // these are cleared at the end in .parse(), hence we must shallow-copy these:
                    error_infos_stack: this.__error_infos.slice(),
                    error_recovery_stack: this.__error_recovery_infos.slice(),
                    error_infos_stack_size: this.__error_infos.length,
                    error_recovery_stack_size: this.__error_recovery_infos.length,
                };
            };

            try {
                // Change CWD to the directory where the source grammar resides: this helps us properly
                // %include any files mentioned in the grammar with relative paths:
                process.chdir(path.dirname(filespec.path));

                // reset parser:lexer internals for the extreme situation where the `lex.parse()` invocation below
                // will crash BEFORE it has set the lexer input, thus resulting in the lexer context not having
                // been reset since the last test and thus containing lingering cruft from the last test. 
                // 
                // Ugly!
                let lexer = lex.parser.lexer;
                lexer.setInput("FUBAR");

                // run parser                
                ast = lex.parse(grammar);
            } catch (ex) {
                // save the error:
                err = ex;
                // and make sure ast !== undefined:
                ast = {
                    id: -1,
                    token: null,
                    fail: 1,
                    spec: filespec.grammar,
                    err: ex
                };
            } finally {
                process.chdir(original_cwd);
                if (ast) {
                    ast.__extra_diag_info__ = {
                        pre_parse_callback_callCount: pre_called,
                        post_parse_callback_callCount: post_called,
                        post_parse_diaginfo: post_info,
                        
                        // these are expected to be ZERO as they're fetched AFTER
                        // parser.cleanupAfterParse() has executed (and cleaned out
                        // these arrays):
                        reentrant_call_depth: lex.parser.__reentrant_call_depth,
                        error_infos_stack_size: lex.parser.__error_infos.length,
                        error_recovery_stack_size: lex.parser.__error_recovery_infos.length,
                    };
                    ast.__original_input__ = grammar;
                }
            }

            ast = testsetSpec.trimErrorForTestReporting(ast);
            testsetSpec.stripForSerialization(ast);

            // either we check/test the correctness of the collected input, iff there's
            // a reference provided, OR we create the reference file for future use:
            let refOut = JSON5.stringify(ast, {
                space: 2,
                circularRefHandler: testsetSpec.testrig_JSON5circularRefHandler
            });

            // strip away devbox-specific paths in error stack traces in the output:
            refOut = testsetSpec.stripErrorStackPaths(refOut);

            refOut = rmCommonWS`
                /* 
                 * grammar spec generated by @gerhobbelt/lex-parser for input file:
                 *     ${filespec.filepath4display}
                 */

            `.trimStart() + refOut;

            if (filespec.ref) {
                // Perform the validations only AFTER we've written the files to output:
                // several tests produce very large outputs, which we shouldn't let assert() process
                // for diff reporting as that takes bloody ages:
            } else {
                fs.writeFileSync(filespec.outputRefPath, refOut, 'utf8');
                filespec.ref = refOut;
            }
            fs.writeFileSync(filespec.outputOutPath, refOut, 'utf8');

            // now that we have saved all data, perform the validation checks:
            // keep them simple so assert doesn't need a lot of time to produce diff reports
            // when the test fails:
            testsetSpec.assertOutputMatchesReference(refOut, filespec.ref, 'grammar should be parsed correctly');
        });
    });
});

