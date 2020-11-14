//
// Helper library for safe code execution/compilation, including dumping offending code to file for further error analysis
// (the idea was originally coded in https://github.com/GerHobbelt/jison/commit/85e367d03b977780516d2b643afbe6f65ee758f2 )
//
// MIT Licensed
//
//
// This code is intended to help test and diagnose arbitrary chunks of code, answering questions like this:
//
// the given code fails, but where exactly and why? It's precise failure conditions are 'hidden' due to
// the stuff running inside an `eval()` or `Function(...)` call, so we want the code dumped to file so that
// we can test the code in a different environment so that we can see what precisely is causing the failure.
//


import fs from 'fs';
import path from 'path';
import JSON5 from '@gerhobbelt/json5';



function chkBugger(src) {
    src = String(src);
    if (src.match(/\bcov_\w+/)) {
        console.error('### ISTANBUL COVERAGE CODE DETECTED ###\n', src);
    }
}




// Helper function: pad number with leading zeroes
function pad(n, p) {
    p = p || 2;
    let rv = '0000' + n;
    return rv.slice(-p);
}


function convertExceptionToObject(ex) {
    if (!ex) return ex;

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
    // 
    // - Copy enumerable properties (which may exist when this is a custom exception class derived off Error)
    let rv = Object.assign({}, ex);
    // - Set up the default fields which should ALWAYS be present:
    rv.message = ex.message;
    rv.name = ex.name;
    rv.stack = ex.stack; // this assignment stringifies the stack trace in ex.stack.
    // - Set the optional fields:
    if (ex.code !== undefined) rv.code = ex.code;
    if (ex.type !== undefined) rv.type = ex.type;
    if (ex.fileName !== undefined) rv.fileName = ex.fileName;
    if (ex.lineNumber !== undefined) rv.lineNumber = ex.lineNumber;
    if (ex.columnNumber !== undefined) rv.columnNumber = ex.columnNumber;
    if (Array.isArray(ex.errors)) {
        rv.errors = [];
        for (let se of ex.errors) {
            rv.errors.push(convertExceptionToObject(se));
        }
    }
    return rv;
}

// attempt to dump in one of several locations: first winner is *it*!
function dumpSourceToFile(sourcecode, errname, err_id, options, ex) {
    let dumpfile;
    options = options || {};

    try {
        const dumpPaths = [ (options.outfile ? path.dirname(options.outfile) : null), options.inputPath, process.cwd() ];
        let dumpName = path.basename(options.inputFilename || options.moduleName || (options.outfile ? path.dirname(options.outfile) : null) || options.defaultModuleName || errname)
        .replace(/\.[a-z]{1,5}$/i, '')          // remove extension .y, .yacc, .jison, ...whatever
        .replace(/[^a-z0-9_]/ig, '_');          // make sure it's legal in the destination filesystem: the least common denominator.
        if (dumpName === '' || dumpName === '_') {
            dumpName = '__bugger__';
        }
        err_id = err_id || 'XXX';

        const ts = new Date();
        const tm = ts.getUTCFullYear() +
            '_' + pad(ts.getUTCMonth() + 1) +
            '_' + pad(ts.getUTCDate()) +
            'T' + pad(ts.getUTCHours()) +
            '' + pad(ts.getUTCMinutes()) +
            '' + pad(ts.getUTCSeconds()) +
            '.' + pad(ts.getUTCMilliseconds(), 3) +
            'Z';

        dumpName += '.fatal_' + err_id + '_dump_' + tm + '.js';

        for (let i = 0, l = dumpPaths.length; i < l; i++) {
            if (!dumpPaths[i]) {
                continue;
            }

            try {
                dumpfile = path.normalize(dumpPaths[i] + '/' + dumpName);

                const dump = {
                    errname,
                    err_id,
                    options,
                    ex: convertExceptionToObject(ex)
                };
                let d = JSON5.stringify(dump, {
                    replacer: function remove_lexer_objrefs(key, value) {
                        if (value instanceof Error) {
                            return convertExceptionToObject(value);
                        }
                        return value;
                    },
                    space: 2,
                    circularRefHandler: (value, circusPos, stack, keyStack, key, err) => '[!circular ref!]',
                });
                // make sure each line is a comment line:
                d = d.split('\n').map((l) => '// ' + l);
                d = d.join('\n');

                fs.writeFileSync(dumpfile, sourcecode + '\n\n\n' + d, 'utf8');
                console.error('****** offending generated ' + errname + ' source code dumped into file: ', dumpfile);
                break;          // abort loop once a dump action was successful!
            } catch (ex3) {
                //console.error("generated " + errname + " source code fatal DUMPING error ATTEMPT: ", i, " = ", ex3.message, " -- while attempting to dump into file: ", dumpfile, "\n", ex3.stack);
                if (i === l - 1) {
                    throw ex3;
                }
            }
        }
    } catch (ex2) {
        console.error('generated ' + errname + ' source code fatal DUMPING error: ', ex2.message, ' -- while attempting to dump into file: ', dumpfile, '\n', ex2.stack);
    }

    // augment the exception info, when available:
    if (ex) {
        ex.offending_source_code = sourcecode;
        ex.offending_source_title = errname;
        ex.offending_source_dumpfile = dumpfile;
    }
}




//
// `code_execution_rig` is a function which gets executed, while it is fed the `sourcecode` as a parameter.
// When the `code_execution_rig` crashes, its failure is caught and (using the `options`) the sourcecode
// is dumped to file for later diagnosis.
//
// Two options drive the internal behaviour:
//
// - options.dumpSourceCodeOnFailure        -- default: FALSE
// - options.throwErrorOnCompileFailure     -- default: FALSE
//
// Dumpfile naming and path are determined through these options:
//
// - options.outfile
// - options.inputPath
// - options.inputFilename
// - options.moduleName
// - options.defaultModuleName
//
function exec_and_diagnose_this_stuff(sourcecode, code_execution_rig, options, title) {
    options = options || {};
    let errname = '' + (title || 'exec_test');
    let err_id = errname.replace(/[^a-z0-9_]/ig, '_');
    if (err_id.length === 0) {
        err_id = 'exec_crash';
    }
    const debug = 0;

    if (debug) console.warn('generated ' + errname + ' code under EXEC TEST.');
    if (debug > 1) {
        console.warn(`
        ######################## source code ##########################
        ${sourcecode}
        ######################## source code ##########################
        `);
    }

    let p;
    try {
        // p = eval(sourcecode);
        if (typeof code_execution_rig !== 'function') {
            throw new Error('safe-code-exec-and-diag: code_execution_rig MUST be a JavaScript function');
        }
        chkBugger(sourcecode);
        p = code_execution_rig.call(this, sourcecode, options, errname, debug);
    } catch (ex) {
        if (debug > 1) console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

        if (debug) console.log('generated ' + errname + ' source code fatal error: ', ex.message);

        if (debug > 1) console.log('exec-and-diagnose options:', options);

        if (debug > 1) console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');

        if (options.dumpSourceCodeOnFailure || 1) {
            dumpSourceToFile(sourcecode, errname, err_id, options, ex);
        }

        if (options.throwErrorOnCompileFailure) {
            throw ex;
        }
    }
    return p;
}






export default {
    exec: exec_and_diagnose_this_stuff,
    dump: dumpSourceToFile,
    convertExceptionToObject,
};
