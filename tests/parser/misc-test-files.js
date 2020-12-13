const assert = require('chai').assert;
const Jison = require('../setup').Jison;
const Lexer = require('../setup').Lexer;
const fs = require('fs');
const path = require('path');
const yaml = require('@gerhobbelt/js-yaml');
const JSON5 = require('@gerhobbelt/json5');
const globby = require('globby');
const helpers = require('../../packages/helpers-lib');
const rmCommonWS = helpers.rmCommonWS;





function generator_reset() {
    //bnf.bnf_parser.parser.yy = {};

    let debug = 0;

    if (!debug) {
        // TODO
        
        // silence warn+log messages from the test internals:
        Jison.warn = function bnf_warn() {
            // console.warn("TEST WARNING: ", arguments);
        };

        Jison.log = function bnf_log() {
            // console.warn("TEST LOG: ", arguments);
        };
    }
}







console.log('exec glob....', __dirname);
const original_cwd = process.cwd();
process.chdir(__dirname);
let testset = globby.sync([
    '../specs/*.jison',
]);

testset = testset.sort();

const testsetSpec = helpers.setupFileBasedTestRig(__dirname, testset, 'jison-gho', { useGeneratorRef: true });






//
// compile these grammars and run a sample input through them
//
describe('JISON code generator', function () {
    beforeEach(function beforeEachTest() {
        generator_reset();
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
            let i = 0;
            let tokens = [];
            let lexer = bnf.bnf_parser.parser.lexer;

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

                    // NOTE: there is no need for shallow copy the hash as a new one
                    // is created for every parseError() call. 
                    // 
                    // NOTE: before jison-gho 0.7.0 a shallow copy was required if you
                    // desired to persist the `hash` error info past the lexer run itself.
                    // 
                    // WARNING: if you want to keep a SNAPSHOT of the `yy`, `loc`, etc. 
                    // members of this moment in time, you MUST shallow-copy those anyway!
                    // 
                    // The lexer kernel provides these members as *references* to allow
                    // userland `parseError` handlers to custom-tweak the kernel state,
                    // if so desired. THIS IS NOT SHOWCASED HERE.
                    // 
                    //const rv = Object.assign({}, hash);
                    const rv = hash;
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

                ast = lexer.setInput(grammar, yy);
                ast.__original_input__ = grammar;

                for (i = 0; i < maxTokenCount; i++) {
                    let tok = lexer.lex();
                    tokens.push({
                        id: tok,
                        token: bnf.bnf_parser.parser.describeSymbol(tok),
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
                // and make sure ast !== undefined:
                if (!ast) {
                    ast = { fail: 1 };
                }
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
                 * grammar spec generated by jison-gho for input file:
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

