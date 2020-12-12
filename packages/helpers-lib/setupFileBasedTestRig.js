
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import yaml from '@gerhobbelt/js-yaml';
import JSON5 from '@gerhobbelt/json5';
import mkdirp from './mkdirp';
import { trimErrorForTestReporting, stripErrorStackPaths, cleanStackTrace4Comparison } from './trimErrorForTestReporting';




export default function setupFileBasedTestRig(__DIRNAME__ /* __dirname */, testset, __NAME__, options) {
    options = options || {};

    function cleanPath(filepath) {
        // does input path contain a Windows Drive or Network path? 
        // If so, prevent bugs in path.join() re Windows paths to kick in 
        // while the input path is an absolute path already anyway:
        if (!filepath.includes(':')) {
            filepath = path.join(__DIRNAME__, filepath);
        }
        return path.resolve(filepath).replace(/\\/g, '/');  // UNIXify the path
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

    function mkFilePath4Display(filepath) {
        return filepath.replace(PATHROOT, '')
        .replace(new RegExp(`^\\/packages\\/${__NAME__}\\/`), ':/')
        .replace(/\/tests\/specs\//, '/tests/')
        .replace(/\/tests\/lex\//, '/lex/')
        .replace(/\/packages\//, '/')
        .replace(/\/reference-output\//, '/')
        .replace(/-ref\./, '.')
        .replace(/:\/tests\//, ':/')
    }


    // collision detection helper for the generated output+reference files
    let __hits__ = {};


    testset = testset.map(function (filepath) {
        // Get document, or throw exception on error
        try {
            let spec;
            let header;
            let extra;
            let grammar;

            filepath = cleanPath(filepath);

            let filepath4display = mkFilePath4Display(filepath);
            console.log('Grammar file:', filepath4display);

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
            let refOutFilePath = cleanPath(path.join(outbase, 'reference-output', path.basename(filepath4display) + '-ref.json5'));
            let testOutFilePath = cleanPath(path.join(outbase, 'output', path.basename(filepath4display) + '-ref.json5'));
            let generatorRefFilePath = cleanPath(path.join(outbase, 'reference-output', path.basename(filepath4display) + '-lex.json5'));
            let generatorOutFilePath = cleanPath(path.join(outbase, 'output', path.basename(filepath4display) + '-lex.json5'));

            let collision;
            if (!__hits__[testOutFilePath]) {
                __hits__[testOutFilePath] = {
                    filepath, 
                    outbase, 
                    raw: filepath4display.replace(/^\/examples\//, '/jison/examples/').replace(/^[:\/]+/, '').replace('/tests/', '/')
                };
            } else {
                collision = __hits__[testOutFilePath];
                console.error("TEST FILE MAPPING COLLISION:", {
                    filepath, 
                    outbase, 
                    testOutFilePath, 
                    raw: filepath4display.replace(/^\/examples\//, '/jison/examples/').replace(/^[:\/]+/, '').replace('/tests/', '/'),
                    '**HIT**': collision
                });        
                throw new Error(`TEST FILE MAPPING COLLISION for '${filepath}' vs. ${collisionfilepath}'`);
            }

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

            let generatorRefOut;
            try {
                if (options.useGeneratorRef) {
                    var soll = fs.readFileSync(generatorRefFilePath, 'utf8').replace(/\r\n|\r/g, '\n');
                    if (doc.crlf) {
                        soll = soll.replace(/\n/g, '\r\n');
                    }
                    generatorRefOut = soll;
                } else {
                    generatorRefOut = null;
                }
            } catch (ex) {
                generatorRefOut = null;
            }

            return {
                type: path.extname(filepath).toLowerCase(),
                filepath4display,
                path: filepath,
                outputRefPath: refOutFilePath,
                outputOutPath: testOutFilePath,
                generatorRefPath: generatorRefFilePath,
                generatorOutPath: generatorOutFilePath,
                spec,
                grammar,
                meta: doc,
                metaExtra: extra,
                useGeneratorRef: options.useGeneratorRef,
                generatorRef: generatorRefOut,
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


    return {
        filespecList: testset,

        testrig_JSON5circularRefHandler,
        stripForSerialization,
        reduceWhitespace,
        trimErrorForTestReporting, 
        stripErrorStackPaths, 
        cleanStackTrace4Comparison,
    };
}
