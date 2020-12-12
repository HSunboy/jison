const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const yaml = require('@gerhobbelt/js-yaml');
const JSON5 = require('@gerhobbelt/json5');
const globby = require('globby');
const helpers = require('../../helpers-lib/dist/helpers-lib-cjs');
const trimErrorForTestReporting = helpers.trimErrorForTestReporting;
const stripErrorStackPaths = helpers.stripErrorStackPaths;
const cleanStackTrace4Comparison = helpers.cleanStackTrace4Comparison;
const rmCommonWS = helpers.rmCommonWS;
const mkdirp = helpers.mkdirp;
const bnf = require('../dist/ebnf-parser-cjs');





function parser_reset() {
    if (bnf.bnf_parser.parser.yy) {
        let y = bnf.bnf_parser.parser.yy;
        if (y.parser) {
            delete y.parser;
        }
        if (y.lexer) {
            delete y.lexer;
        }
    }

    //bnf.bnf_parser.parser.yy = {};

    let debug = 0;

    if (!debug) {
        // silence warn+log messages from the test internals:
        bnf.bnf_parser.parser.warn = function bnf_warn() {
            // console.warn("TEST WARNING: ", arguments);
        };

        bnf.bnf_parser.parser.log = function bnf_log() {
            // console.warn("TEST LOG: ", arguments);
        };
    }
}








function cleanPath(filepath) {
    // does input path contain a Windows Drive or Network path? 
    // If so, prevent bugs in path.join() re Windows paths to kick in 
    // while the input path is an absolute path already anyway:
    if (!filepath.includes(':')) {
        filepath = path.join(__dirname, filepath);
    }
    return path.normalize(filepath).replace(/\\/g, '/');  // UNIXify the path
}

const PATHROOT = cleanPath('../../..');
const PATHBASE = cleanPath('.');

function extractYAMLheader(src) {
    // extract the top comment (possibly empty), which carries the title, etc. metadata:
    let header = src.substr(0, src.indexOf('\n\n') + 1);

    // check if this chunk is indeed a YAML header: we ASSUME it contains at least
    // one line looking like this:
    let is_yaml_chunk = header.split('\n').filter((l) => l.replace(/^\/\/ ?/gm, '').trim() === '...').length > 0;
    if (!is_yaml_chunk) {
        return '';
    }
    return header;
}

function mkFilePath4Display(filepath, our_name) {
    return filepath.replace(PATHROOT, '')
    .replace(new RegExp(`^\\/packages\\/${our_name}\\/`), ':/')
    .replace(/\/tests\/specs\//, '/tests/')
    .replace(/\/tests\/lex\//, '/lex/')
    .replace(/\/packages\//, '/')
    .replace(/\/reference-output\//, '/')
    .replace(/:\/tests\//, ':/')
}


console.log('exec glob....', __dirname);
const original_cwd = process.cwd();
process.chdir(__dirname);
let testset = globby.sync([
    './specs/0*.jison',
    './specs/0*.bnf',
    './specs/0*.ebnf',
    './specs/0*.json5',
    '!'+  './specs/0*-ref.json5',
    './specs/0*.js',
]);

testset = testset.sort();

testset = testset.map(function (filepath) {
    // Get document, or throw exception on error
    try {
        let spec;
        let header;
        let extra;
        let grammar;

        filepath = cleanPath(filepath);

        let filepath4display = mkFilePath4Display(filepath, 'jison-lex');
        console.log('Lexer Grammar file:', filepath4display);

        if (filepath.match(/\.js$/)) {
            spec = require(filepath);

            let hdrspec = fs.readFileSync(filepath, 'utf8').replace(/\r\n|\r/g, '\n');

            // extract the top comment (possibly empty), which carries the title, etc. metadata:
            header = extractYAMLheader(hdrspec);

            grammar = spec;
        } else {
            spec = fs.readFileSync(filepath, 'utf8').replace(/\r\n|\r/g, '\n');

            // extract the top comment (possibly empty), which carries the title, etc. metadata:
            header = extractYAMLheader(spec);

            grammar = spec;
        }

        // then strip off the comment prefix for every line:
        header = header.replace(/^\/\/ ?/gm, '').replace(/\n...\n[^]*$/, function (m) {
            extra = m;
            return '';
        });

        //console.error("YAML safeload:", { header, filepath });
        let doc = yaml.safeLoad(header, {
            filename: filepath
        }) || {};

        if (doc.crlf && typeof grammar === 'string') {
            grammar = grammar.replace(/\n/g, '\r\n');
        }

        let outbase = path.dirname(filepath);
        if (!outbase.includes(PATHBASE)) {
            // mapping test files from other sub-packages to their own specs/output.../ directories in here to prevent collisions
            outbase = cleanPath(path.join('specs', path.dirname(filepath4display.replace(/^\/examples\//, '/jison/examples/').replace(/^[:\/]+/, '').replace('/tests/', '/'))));
        }
        let refOutFilePath = cleanPath(path.join(outbase, 'reference-output', path.basename(filepath) + '-ref.json5'));
        let testOutFilePath = cleanPath(path.join(outbase, 'output', path.basename(filepath) + '-ref.json5'));
        let lexerRefFilePath = cleanPath(path.join(outbase, 'reference-output', path.basename(filepath) + '-lex.json5'));
        let lexerOutFilePath = cleanPath(path.join(outbase, 'output', path.basename(filepath) + '-lex.json5'));
        mkdirp(path.dirname(refOutFilePath));
        mkdirp(path.dirname(testOutFilePath));

        let refOut;
        try {
            var soll = fs.readFileSync(refOutFilePath, 'utf8').replace(/\r\n|\r/g, '\n');
            if (doc.crlf) {
                soll = soll.replace(/\n/g, '\r\n');
            }
            refOut = JSON5.parse(soll);
        } catch (ex) {
            refOut = null;
        }

        let lexerRefOut;
        try {
            var soll = fs.readFileSync(lexerRefFilePath, 'utf8').replace(/\r\n|\r/g, '\n');
            if (doc.crlf) {
                soll = soll.replace(/\n/g, '\r\n');
            }
            lexerRefOut = soll;
        } catch (ex) {
            lexerRefOut = null;
        }

        return {
            type: path.extname(filepath).toLowerCase(),
            filepath4display,
            path: filepath,
            outputRefPath: refOutFilePath,
            outputOutPath: testOutFilePath,
            lexerRefPath: lexerRefFilePath,
            lexerOutPath: lexerOutFilePath,
            spec,
            grammar,
            meta: doc,
            metaExtra: extra,
            lexerRef: lexerRefOut,
            ref: refOut
        };
    } catch (ex) {
        console.log(ex);
        throw ex;
    }
    return false;
})
.filter(function (info) {
    return !!info;
});


if (0) {
    console.error(JSON5.stringify(testset, {
        replacer: function (key, value) {
            if (typeof value === 'string') {
                let a = value.split('\n');
                if (value.length > 500 || a.length > 5) {
                    return `[...string (length: ${value.length}, lines: ${a.length}) ...]`;
                }
            }
            if (/^(?:ref|lexerRef|spec|grammar)$/.test(key) && typeof value === 'object') {
                return '[... JSON ...]';
            }
            return value;
        },
        space: 2,
    }));
}


function testrig_JSON5circularRefHandler(obj, circusPos, objStack, keyStack, key, err) {
    // and produce an alternative structure to JSON-ify:
    return {
        circularReference: true,
        // ex: {
        //   message: err.message,
        //   type: err.name
        // },
        index: circusPos,
        parentDepth: objStack.length - circusPos - 1,
        key: key,
        keyStack: keyStack    // stack & keyStack have already been snapshotted by the JSON5 library itself so passing a direct ref is fine here!
    };
}

function reduceWhitespace(src) {
    // replace tabs with space, clean out multiple spaces and kill trailing spaces:
    return src
      .replace(/\r\n|\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/ +$/gm, '');
}

// WARNING:
// This function will fatally destroy some parts of the object you feed it!
// DO NOT expect good behaviour from it for its original purposes, once we're done in here!
// 
// This function was introduced as the JSON5.stringify() calls in the test rig used to
// write output/reference files were taking forever and for larger test files were even
// causing stack overflow in Node. 
// Further investigation uncovered the culprit: stack run-away in deep esprima ASTs which
// are stored as part of checked action code chunks in the options.lex_rule_dictionary.rules[], etc.
function stripForSerialization(obj, depth) {
    if (!obj) return false;

    if (typeof obj !== 'object') {
        return false;
    }

    depth = depth || 0;
    if (Array.isArray(obj)) {
        for (let i in obj) {
            stripForSerialization(obj[i], depth + 1);
        }
        return false;
    } else {
        if (depth > 8) return true;

        for (let key in obj) {
            let el = obj[key];

            if (key === 'ast') {
                // if attribute is itself an object, which contains an AST member,
                // PLUS a `source` attribute alongside, nuke the AST sub attribute.
                if (el && el.ast && el.source) {
                    el.ast = '[recast AST]';
                    if (el.augmentedSource) {
                        el.augmentedSource = '[LINE-SHIFTED SOURCE]';
                    }
                    if (el.source === obj.srcCode) {
                        el.source = '[IDEM: srcCode]';
                    }
                }
            }

            if (stripForSerialization(el, depth + 1)) {
                obj[key] = '[OBJECT @ DEPTH LIMIT]';
            }
        }
        return false;
    }
}










//
// compile these lexer specs and run a sample input through them
//
describe('BNF lexer', function () {
    beforeEach(function beforeEachTest() {
        parser_reset();
    });

    testset.forEach(function (filespec) {
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
        it(testname, function testEachParserExampleA() {
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
            tokens = trimErrorForTestReporting(tokens);

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
                circularRefHandler: testrig_JSON5circularRefHandler
            });

            // strip away devbox-specific paths in error stack traces in the output:
            refOut = stripErrorStackPaths(refOut);

            refOut = rmCommonWS`
                /* 
                 * grammar spec generated by @gerhobbelt/ebnf-parser for input file:
                 *     ${filespec.filepath4display}
                 */

            `.trimStart() + refOut;

            // and convert it back so we have a `tokens` set that's cleaned up
            // and potentially matching the stored reference set:
            tokens = JSON5.parse(refOut);

            let ref = JSON5.parse(filespec.lexerRef);
            if (ref) {
                // Perform the validations only AFTER we've written the files to output:
                // several tests produce very large outputs, which we shouldn't let assert() process
                // for diff reporting as that takes bloody ages:
                //assert.deepEqual(ast, ref);
            } else {
                fs.writeFileSync(filespec.lexerRefPath, refOut, 'utf8');
                filespec.lexerRef = ref = tokens;
            }
            fs.writeFileSync(filespec.lexerOutPath, refOut, 'utf8');

            // now that we have saved all data, perform the validation checks:
            assert.deepEqual(cleanStackTrace4Comparison(tokens), cleanStackTrace4Comparison(ref), 'grammar should be lexed correctly');
        });
    });
});











describe('BNF parser', function () {
    beforeEach(function beforeEachTest() {
        parser_reset();
    });

    testset.forEach(function (filespec) {
        // process this file:
        let title = (filespec.meta ? filespec.meta.title : null);

        let testname = 'test: ' + filespec.filepath4display + (title ? ' :: ' + title : '');

        console.error('generate test: ', testname);

        // and create a test for it:
        it(testname, function testEachParserExampleB() {

            let err, ast, grammar;

            try {
                // Change CWD to the directory where the source grammar resides: this helps us properly
                // %include any files mentioned in the grammar with relative paths:
                process.chdir(path.dirname(filespec.path));

                grammar = filespec.grammar; // "%% test: foo bar | baz ; hello: world ;";

                ast = bnf.parse(grammar);
                ast.__original_input__ = grammar;
            } catch (ex) {
                // save the error:
                err = ex;
                // and make sure ast !== undefined:
                ast = {
                    fail: 1,
                    spec: filespec.grammar,
                    err: trimErrorForTestReporting(ex)
                };
            } finally {
                process.chdir(original_cwd);
            }

            ast = trimErrorForTestReporting(ast);

            // either we check/test the correctness of the collected input, iff there's
            // a reference provided, OR we create the reference file for future use:
            let refOut = JSON5.stringify(ast, {
                space: 2,
                circularRefHandler: testrig_JSON5circularRefHandler
            });

            // strip away devbox-specific paths in error stack traces in the output:
            refOut = stripErrorStackPaths(refOut);

            refOut = rmCommonWS`
                /* 
                 * grammar spec generated by @gerhobbelt/ebnf-parser for input file:
                 *     ${filespec.filepath4display}
                 */

            `.trimStart() + refOut;

            // and convert it back so we have a `tokens` set that's cleaned up
            // and potentially matching the stored reference set:
            ast = JSON5.parse(refOut);

            if (filespec.ref) {
                // Perform the validations only AFTER we've written the files to output:
                // several tests produce very large outputs, which we shouldn't let assert() process
                // for diff reporting as that takes bloody ages:
                //assert.deepEqual(ast, filespec.ref);
            } else {
                fs.writeFileSync(filespec.outputRefPath, refOut, 'utf8');
                filespec.ref = ast;
            }
            fs.writeFileSync(filespec.outputOutPath, refOut, 'utf8');

            // now that we have saved all data, perform the validation checks:
            assert.deepEqual(cleanStackTrace4Comparison(ast), cleanStackTrace4Comparison(filespec.ref), 'grammar should be parsed correctly');
        });
    });
});

