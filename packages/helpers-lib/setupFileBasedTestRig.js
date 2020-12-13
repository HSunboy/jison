
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
        src = src.replace(/\s+$/g, '').trim() + '\n\n\n';
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
        .replace(/^\/([^\/]+)\/tests\//, '/$1/')
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

            let doc = yaml.safeLoad(header, {
                filename: filepath
            }) || {};
            //console.error("YAML safeload:", { header, filepath, doc });

            if (doc.crlf && typeof grammar === 'string') {
                grammar = grammar.replace(/\n/g, '\r\n');
            }

            // indirection: load referenced file as grammar instead:
            if (doc.load) {
                let refd_filepath = path.resolve(path.join(path.dirname(filepath), doc.load));
                if (!fs.existsSync(refd_filepath)) {
                    throw new Error(`YAML::load referenced source file '${doc.load}' does not exist; absolute path: '${refd_filepath}'.`);
                }
                spec = fs.readFileSync(refd_filepath, 'utf8').replace(/\r\n|\r/g, '\n');

                grammar = spec;
            }

            // indirection: load input file(s) into `test_input`:
            if (doc.test_input_file) {
                let lst = Array.isArray(doc.test_input_file) ? doc.test_input_file : [ doc.test_input_file ];
                doc.test_input = lst.map(function load_indirect_input_textfile(f) {
                    let refd_filepath = path.resolve(path.join(path.dirname(filepath), f));
                    if (!fs.existsSync(refd_filepath)) {
                        throw new Error(`YAML::load referenced input text file '${f}' does not exist; absolute path: '${refd_filepath}'.`);
                    }
                    let input = fs.readFileSync(refd_filepath, 'utf8').replace(/\r\n|\r/g, '\n');

                    if (doc.crlf) {
                        input = input.replace(/\n/g, '\r\n');
                    }
                    return input;
                });

                if (doc.test_input.length === 1) {
                    doc.test_input = doc.test_input[0];
                }
            }

            let outbase = path.dirname(filepath);
            let extradirs = '';
            if (!outbase.includes(PATHBASE)) {
                // mapping test files from other sub-packages to their own specs/output.../ directories in here to prevent collisions
                extradirs = path.dirname(filepath4display.replace(/^\/examples\//, '/jison/examples/').replace(/^[:\/]+/, '').replace('/tests/', '/')).replace(/^\//, '');
                outbase = cleanPath('specs');
            }
            let refOutFilePath = cleanPath(path.join(outbase, 'reference-output', extradirs, path.basename(filepath4display) + '-ref.json5'));
            let testOutFilePath = cleanPath(path.join(outbase, 'output', extradirs, path.basename(filepath4display) + '-ref.json5'));
            let generatorRefFilePath = cleanPath(path.join(outbase, 'reference-output', extradirs, path.basename(filepath4display) + '-lex.json5'));
            let generatorOutFilePath = cleanPath(path.join(outbase, 'output', extradirs, path.basename(filepath4display) + '-lex.json5'));
            let generatorJSRefFilePath = cleanPath(path.join(outbase, 'reference-output', extradirs, path.basename(filepath4display) + '-engine.js'));
            let generatorJSOutFilePath = cleanPath(path.join(outbase, 'output', extradirs, path.basename(filepath4display) + '-engine.js'));

            let collision;
            if (!__hits__[testOutFilePath]) {
                __hits__[testOutFilePath] = {
                    filepath, 
                    outbase, 
                    extradirs,
                };
            } else {
                collision = __hits__[testOutFilePath];
                console.error("TEST FILE MAPPING COLLISION:", {
                    filepath, 
                    outbase, 
                    testOutFilePath, 
                    extradirs,
                    '**HIT**': collision
                });        
                throw new Error(`TEST FILE MAPPING COLLISION for '${filepath}' vs. ${collisionfilepath}'`);
            }

            mkdirp(path.dirname(refOutFilePath));
            mkdirp(path.dirname(testOutFilePath));

            let refOut;
            try {
                let soll = fs.readFileSync(refOutFilePath, 'utf8').replace(/\r\n|\r/g, '\n');
                if (doc.crlf) {
                    soll = soll.replace(/\n/g, '\r\n');
                }
                refOut = soll;
            } catch (ex) {
                refOut = null;
            }

            let generatorRefOut;
            try {
                if (options.useGeneratorRef) {
                    let soll = fs.readFileSync(generatorRefFilePath, 'utf8').replace(/\r\n|\r/g, '\n');
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

            let generatorJSRefOut;
            try {
                if (options.useGeneratorJSRef) {
                    let soll = fs.readFileSync(generatorJSRefFilePath, 'utf8').replace(/\r\n|\r/g, '\n');
                    if (doc.crlf) {
                        soll = soll.replace(/\n/g, '\r\n');
                    }
                    generatorJSRefOut = soll;
                } else {
                    generatorJSRefOut = null;
                }
            } catch (ex) {
                generatorJSRefOut = null;
            }

            return {
                type: path.extname(filepath).toLowerCase(),
                filepath4display,
                path: filepath,
                outputRefPath: refOutFilePath,
                outputOutPath: testOutFilePath,
                generatorRefPath: generatorRefFilePath,
                generatorOutPath: generatorOutFilePath,
                generatorJSRefPath: generatorJSRefFilePath,
                generatorJSOutPath: generatorJSOutFilePath,
                spec,
                grammar,
                meta: doc,
                metaExtra: extra,
                useGeneratorRef: options.useGeneratorRef,
                useGeneratorJSRef: options.useGeneratorJSRef,
                generatorRef: generatorRefOut,
                generatorJSRef: generatorJSRefOut,
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


    // assert which makes sure we have a fast response in the testrig: DO NOT report diffs when
    // the inputs are large/huge.
    function assertOutputMatchesReference(ist, soll, msg) {
        const maxSize = 1000;

        assert.strictEqual(typeof ist, 'string');
        assert.strictEqual(typeof soll, 'string');
        ist = cleanStackTrace4Comparison(ist);
        soll = cleanStackTrace4Comparison(soll);
        //assert.strictEqual(reduceWhitespace(ist), reduceWhitespace(soll), msg);
        ist = reduceWhitespace(ist);
        soll = reduceWhitespace(soll);
        
        if (ist === soll) return;
        
        if (ist.length > maxSize || soll.length > maxSize) {
            msg = `${msg}\n               [strings are too large (${ist.length} & ${soll.length}) to show a full diff quickly]`;
            // shorten the long ones to get a decent diff performance?
            // 
            // At least help the developer by seeking the first spot where things went wrong:
            // move through the strings at half-size stepping, so there's always about maxSize/2 data
            // to diff-visualize.
            //
            // First scan through the strings quickly to find the index of the first difference:
            const shortestLength = Math.min(ist.length, soll.length);
            const seekStep = Math.max(maxSize, shortestLength / 16);
            let firstHit = shortestLength + 1;

            // the max is shortestLength+1 so we will be able to notice the length difference as an actual difference (of 1 character):
            for (let i = 0, step = seekStep, max = shortestLength + 1 - step; i <= max; i += step) {
                let s1 = ist.substring(i, i + step);
                let s2 = soll.substring(i, i + step);

                // when identical, check next chunk
                if (s1 === s2) continue;

                // narrow the chunk until we have an chunk of size 1: that will be our first hit:
                if (step > 1) {
                    // make sure the next for() iteration re-visits this chunk (to be segmented into 4 subchunks). 
                    // No need to reduce 'max' as we scan sequentially and already know 
                    // the first hit change must be near (within `step` chracters from here).
                    // 
                    // First reduce the chunk size
                    step = Math.max(1, (step / 4) | 0);
                    // now adjust the offset `i` so we revisit the block:
                    i -= step;
                    continue;
                } else {
                    firstHit = i;
                    break;
                }
            }

            // Now that we have the firstHit index, we want to offer a decent number of lines before & aft.
            // Ideally the lines are short, but since ideal doesn't happen in the real world, we scan back
            // for a newline from maxSize/4 characters back, so we have a deccent prelude and also some
            // sizable diff to show:
            let preludeIndex = Math.max(0, firstHit - (maxSize / 4) | 0);
            let nlBlockStart = Math.max(0, preludeIndex - maxSize / 2);
            let a = ist.substring(nlBlockStart, preludeIndex).split('\n');
            // pick the last (partial?) line in this clip and move back that amount to arrive at SOL:
            let backpedalLen = a[a.length - 1].length;
            preludeIndex -= backpedalLen;
            assert(preludeIndex >= 0);

            // now extract the segment which contains the first diff:
            ist = (preludeIndex > 0 ?  `[...removed first part of ISTWERT;  starting at offset ${preludeIndex} ...]\n` : '') + (ist.length > maxSize ? ist.substring(preludeIndex, preludeIndex + maxSize) +   '\n\n\n[... ISTWERT (result)    has been shortened...]' : ist);
            soll = (preludeIndex > 0 ? `[...removed first part of SOLLWERT; starting at offset ${preludeIndex} ...]\n` : '') + (soll.length > maxSize ? soll.substring(preludeIndex, preludeIndex + maxSize) + '\n\n\n[...SOLLWERT (reference) has been shortened...]' : soll);
        }
        assert.strictEqual(ist, soll, msg);
    }

    return {
        filespecList: testset,

        testrig_JSON5circularRefHandler,
        stripForSerialization,
        reduceWhitespace,
        trimErrorForTestReporting, 
        stripErrorStackPaths, 
        cleanStackTrace4Comparison,

        assertOutputMatchesReference,
    };
}
