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

const json2jison = require('../json2jison');






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
    './specs/*.json',
    './specs/*.json5',
]);
// also compile and run the JSON5 grammars in the /jison2json/tests/specs/**/reference-output/ directories:
let testset2 = globby.sync([
    '../../jison2json/tests/specs/**/reference-output/*.json5',
]);

testset = testset.sort();
testset2 = testset2.sort();
testset = testset.concat(testset2);     // append testset2 at the end of the list

testset = testset.map(function (filepath) {
    // Get document, or throw exception on error
    try {
        let spec;
        let header;
        let extra;
        let grammar;

        filepath = cleanPath(filepath);

        let filepath4display = mkFilePath4Display(filepath, 'json2jison');
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

        return {
            type: path.extname(filepath).toLowerCase(),
            filepath4display,
            path: filepath,
            outputRefPath: refOutFilePath,
            outputOutPath: testOutFilePath,
            spec,
            grammar,
            meta: doc,
            metaExtra: extra,
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










describe('JSON2JISON', function () {

    beforeEach(function beforeEachTest() {
        // ...
    });

    testset.forEach(function (filespec) {
        // process this file:
        let title = (filespec.meta ? filespec.meta.title : null);

        let testname = 'test: ' + filespec.filepath4display + (title ? ' :: ' + title : '');

        console.error('generate test: ', testname);

        // and create a test for it:
        it(testname, function testEachExample() {
            let json = filespec.grammar;
            let grammarspec = null;

            try {
                // Change CWD to the directory where the source grammar resides: this helps us properly
                // %include any files mentioned in the grammar with relative paths:
                process.chdir(path.dirname(filespec.path));

                grammarspec = json2jison.convert(json);
            } catch (ex) {
                grammarspec = {
                    fail: 1,
                    meta: filespec.spec.meta,
                    err: ex
                };
            } finally {
                process.chdir(original_cwd);
            }

            // either we check/test the correctness of the collected input, iff there's
            // a reference provided, OR we create the reference file for future use:
            let refOut = grammarspec;

            // strip away devbox-specific paths in error stack traces in the output:
            refOut = stripErrorStackPaths(refOut);

            refOut = rmCommonWS`
                /* 
                 * grammar spec generated by @gerhobbelt/json2jison for input file:
                 *     ${filespec.filepath4display}
                 */

            `.trimStart() + refOut;

            if (filespec.ref) {
                // Perform the validations only AFTER we've written the files to output:
                // several tests produce very large outputs, which we shouldn't let assert() process
                // for diff reporting as that takes bloody ages:
                //assert.deepEqual(refOut, filespec.ref);
            } else {
                fs.writeFileSync(filespec.outputRefPath, refOut, 'utf8');
                filespec.ref = refOut;
            }
            fs.writeFileSync(filespec.outputOutPath, refOut, 'utf8');

            // now that we have saved all data, perform the validation checks:
            // keep them simple so assert doesn't need a lot of time to produce diff reports
            // when the test fails:
            let ist = cleanStackTrace4Comparison(json);
            let soll = cleanStackTrace4Comparison(filespec.ref);
            assert.equal(reduceWhitespace(ist), reduceWhitespace(soll), 'generated grammar spec does not match reference; please compare /output/ vs /reference-output/');
        });
    });
});

