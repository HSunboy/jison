
import fs from 'fs';
import path from 'path';
import process from 'process';
import nomnom from '@gerhobbelt/nomnom';
import assert from 'assert';

import helpers from '../helpers-lib';
const rmCommonWS = helpers.rmCommonWS;
const mkIdentifier = helpers.mkIdentifier;
const mkdirp = helpers.mkdirp;

import RegExpLexer from './regexp-lexer.js';



assert(RegExpLexer);
assert(RegExpLexer.defaultJisonLexOptions);
assert(typeof RegExpLexer.mkStdOptions === 'function');


const version = '0.7.0-220';                              // require('./package.json').version;


function getCommandlineOptions() {
    const defaults = RegExpLexer.defaultJisonLexOptions;
    let opts = nomnom
        .script('jison-lex')
        .unknownOptionTreatment(false)              // do not accept unknown options!
        .options({
            file: {
                flag: true,
                position: 0,
                help: 'file containing a lexical grammar.'
            },
            json: {
                abbr: 'j',
                flag: true,
                default: defaults.json,
                help: 'jison will expect a grammar in either JSON/JSON5 or JISON format: the precise format is autodetected.'
            },
            outfile: {
                abbr: 'o',
                metavar: 'FILE',
                help: 'Filepath and base module name of the generated parser. When terminated with a "/" (dir separator) it is treated as the destination directory where the generated output will be stored.'
            },
            debug: {
                abbr: 't',
                flag: true,
                default: defaults.debug,
                transform: function (val) {
                    console.error('debug arg:', {val});
                    return parseInt(val);
                },
                help: 'Debug mode.'
            },
            dumpSourceCodeOnFailure: {
                full: 'dump-sourcecode-on-failure',
                flag: true,
                default: defaults.dumpSourceCodeOnFailure,
                help: 'Dump the generated source code to a special named file when the internal generator tests fail, i.e. when the generated source code does not compile in the JavaScript engine. Enabling this option helps you to diagnose/debug crashes (thrown exceptions) in the code generator due to various reasons: you can, for example, load the dumped sourcecode in another environment (e.g. NodeJS) to get more info on the precise location and cause of the compile failure.'
            },
            throwErrorOnCompileFailure: {
                full: 'throw-on-compile-failure',
                flag: true,
                default: defaults.throwErrorOnCompileFailure,
                help: 'Throw an exception when the generated source code fails to compile in the JavaScript engine. **WARNING**: Turning this feature OFF permits the code generator to produce non-working source code and treat that as SUCCESS. This MAY be desirable code generator behaviour, but only rarely.'
            },
            reportStats: {
                full: 'info',
                abbr: 'I',
                flag: true,
                default: defaults.reportStats,
                help: 'Report some statistics about the generated lexer.'
            },
            moduleType: {
                full: 'module-type',
                abbr: 'm',
                default: defaults.moduleType,
                metavar: 'TYPE',
                choices: [ 'commonjs', 'cjs', 'amd', 'umd', 'js', 'iife', 'es' ],
                help: 'The type of module to generate.'
            },
            moduleName: {
                full: 'module-name',
                abbr: 'n',
                metavar: 'NAME',
                default: defaults.defaultModuleName,
                help: 'The name of the generated parser object, namespace supported.'
            },
            exportAllTables: {
                full: 'export-all-tables',
                abbr: 'E',
                flag: true,
                default: defaults.exportAllTables,
                help: "Next to producing a lexer source file, also export the symbols, macros and rule tables to separate JSON files for further use by other tools. The files' names will be derived from the outputFile name by appending a suffix."
            },
            exportAST: {
                full: 'export-ast',
                optional: true,
                metavar: 'false|true|FILE',
                default: defaults.exportAST,
                help: 'Output lexer AST to file in JSON / JSON5 format (as identified by the file extension, JSON by default).',
                transform: function (val) {
                    switch (val) {
                    case 'false':
                    case '0':
                        return false;

                    case 'true':
                    case '1':
                        return true;

                    default:
                        return val;
                    }
                }
            },
            prettyCfg: {
                full: 'pretty',
                flag: true,
                metavar: 'false|true|CFGFILE',
                default: defaults.prettyCfg,
                transform: function (val) {
                    console.log("prettyCfg:", {val});
                    switch (val) {
                    case 'false':
                    case '0':
                        return false;

                    case 'true':
                    case '1':
                        return true;

                    default:
                        try {
                            let src = fs.readFileSync(val, "utf8");
                            let cfg = JSON5.parse(src);
                            return cfg;
                        } catch (ex) {
                            console.error(rmCommonWS`
                                Cannot open/read/decode the prettyPrint config file '${val}'.

                                Error: ${ex.message}

                            `);
                            throw ex;
                        }
                    }
                },
                help: "Output the generated code pretty-formatted; turning this option OFF will output the generated code as-is a.k.a. 'raw'."
            },
            main: {
                full: 'main',
                abbr: 'x',
                flag: true,
                default: !defaults.noMain,
                help: 'Include .main() entry point in generated commonjs module.'
            },
            moduleMain: {
                full: 'module-main',
                abbr: 'y',
                metavar: 'NAME',
                help: 'The main module function definition.'
            },
            version: {
                abbr: 'V',
                flag: true,
                help: 'Print version and exit.',
                callback: function () {
                    console.log(version);
                    process.exit(0);
                }
            }
        }).parse();

    if (opts.debug) {
        console.log('JISON-LEX CLI options:\n', opts);
    }

    return opts;
}


function cliMain(opts) {

    opts = RegExpLexer.mkStdOptions(opts);

    function isDirectory(fp) {
        try {
            return fs.lstatSync(fp).isDirectory();
        } catch (e) {
            return false;
        }
    }

    function processInputFile() {
        // getting raw files
        let lex;
        const original_cwd = process.cwd();

        try {
            opts.file = path.resolve(opts.file);
            let raw = fs.readFileSync(opts.file, 'utf8');

            // making best guess at json mode
            opts.json = /\.json\d?$/.test(opts.file) || opts.json;

            // When only the directory part of the output path was specified, then we
            // do NOT have the target module name in there as well!
            let outpath = opts.outfile;
            if (typeof outpath === 'string') {
                if (/[\\\/]$/.test(outpath) || isDirectory(outpath)) {
                    opts.outfile = null;
                    outpath = outpath.replace(/[\\\/]$/, '');
                } else {
                    outpath = path.dirname(outpath);
                }
            } else {
                outpath = null;
            }
            if (outpath && outpath.length > 0) {
                outpath += '/';
            } else {
                outpath = '';
            }

            // setting output file name and module name based on input file name
            // if they aren't specified.
            let name = path.basename(opts.outfile || opts.file);

            // get the base name (i.e. the file name without extension)
            // i.e. strip off only the extension and keep any other dots in the filename
            name = path.basename(name, path.extname(name));

            opts.outfile = opts.outfile || path.join(outpath, name + '.js');
            if (!opts.moduleName && name) {
                opts.moduleName = opts.defaultModuleName = mkIdentifier(name);
            }

            if (opts.exportAST) {
                // When only the directory part of the AST output path was specified, then we
                // still need to construct the JSON AST output file name!
                var astpath, astname, ext;

                astpath = opts.exportAST;
                if (typeof astpath === 'string') {
                    if (/[\\\/]$/.test(astpath) || isDirectory(astpath)) {
                        opts.exportAST = null;
                    } else {
                        astpath = path.dirname(astpath);
                    }
                } else {
                    astpath = path.dirname(opts.outfile);
                }
                if (astpath == null) {
                    astpath = '';
                }

                // setting AST output file name and module name based on input file name
                // if they aren't specified.
                if (typeof opts.exportAST === 'string') {
                    // get the base name (i.e. the file name without extension)
                    // i.e. strip off only the extension and keep any other dots in the filename.
                    ext = path.extname(astname);
                    astname = path.basename(opts.exportAST, ext);
                } else {
                    // get the base name (i.e. the file name without extension)
                    // i.e. strip off only the extension and keep any other dots in the filename.
                    astname = path.basename(opts.outfile, path.extname(opts.outfile));

                    // Then add the name postfix '-AST' to ensure we won't collide with the input file.
                    astname += '-AST';
                    ext = '.jisonlex';
                }

                opts.exportAST = path.resolve(path.join(astpath, astname + ext));
            }

            opts.outfile = path.resolve(opts.outfile);

            // Change CWD to the directory where the source grammar resides: this helps us properly
            // %include any files mentioned in the grammar with relative paths:
            let new_cwd = path.dirname(opts.file);
            process.chdir(new_cwd);

            let lexer = cli.generateLexerString(raw, opts);

            // and change back to the CWD we started out with:
            process.chdir(original_cwd);

            mkdirp(path.dirname(opts.outfile));
            fs.writeFileSync(opts.outfile, lexer, 'utf8');
            console.log('JISON-LEX output for module [' + opts.moduleName + '] has been written to file:', opts.outfile);

            if (opts.exportAllTables.enabled) {
                // Determine the output file path 'template' for use by the exportAllTables
                // functionality:
                let out_base_fname = path.join(path.dirname(opts.outfile), path.basename(opts.outfile, path.extname(opts.outfile)));

                let t = opts.exportAllTables;

                for (let id in t) {
                    if (t.hasOwnProperty(id) && id !== 'enabled') {
                        var content = t[id];
                        if (content) {
                            var fname = out_base_fname + '.' + id.replace(/[^a-zA-Z0-9_]/g, '_') + '.json';
                            fs.writeFileSync(fname, JSON.stringify(content, null, 2), 'utf8');
                            console.log('JISON table export', 'for [' + id + '] has been written to file:', fname);
                        }
                    }
                }
            }

            if (opts.exportAST) {
                var content = opts.exportedAST;
                var fname = opts.exportAST;

                var ext = path.extname(fname);
                switch (ext) {
                case '.json5':
                case '.jison':
                case '.y':
                case '.yacc':
                case '.l':
                case '.lex':
                    content = Jison.prettyPrint(content, {
                        format: ext.substr(1)
                    });
                    break;

                default:
                case '.json':
                    content = JSON.stringify(content, null, 2);
                    break;
                }
                mkdirp(path.dirname(fname));
                fs.writeFileSync(fname, content, 'utf8');
                console.log('Grammar AST export', 'for module [' + opts.moduleName + '] has been written to file:', fname);
            }
        } catch (ex) {
            console.error('JISON-LEX failed to compile module [' + opts.moduleName + ']:', ex);
        } finally {
            // reset CWD to the original path, no matter what happened
            process.chdir(original_cwd);
        }
    }

    function readin(cb) {
        const stdin = process.openStdin();
        let data = '';

        stdin.setEncoding('utf8');
        stdin.addListener('data', function (chunk) {
            data += chunk;
        });
        stdin.addListener('end', function () {
            cb(data);
        });
    }

    function processStdin() {
        readin(function processStdinReadInCallback(raw) {
            console.log('', cli.generateLexerString(raw, opts));
        });
    }

    // if an input file wasn't given, assume input on stdin
    if (opts.file) {
        processInputFile();
    } else {
        processStdin();
    }
}


function generateLexerString(lexerSpec, opts) {
    // var settings = RegExpLexer.mkStdOptions(opts);
    let predefined_tokens = null;

    return RegExpLexer.generate(lexerSpec, predefined_tokens, opts);
}

var cli = {
    main: cliMain,
    generateLexerString: generateLexerString
};


export default cli;


if (require.main === module) {
    const opts = getCommandlineOptions();
    cli.main(opts);
}

