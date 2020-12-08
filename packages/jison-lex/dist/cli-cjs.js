#!/usr/bin/env node


'use strict';

var fs = require('fs');
var path = require('path');
var nomnom = require('@gerhobbelt/nomnom');
var JSON5$1 = require('@gerhobbelt/json5');
var XRegExp = require('@gerhobbelt/xregexp');
var recast = require('recast');
var assert$1 = require('assert');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var nomnom__default = /*#__PURE__*/_interopDefaultLegacy(nomnom);
var JSON5__default = /*#__PURE__*/_interopDefaultLegacy(JSON5$1);
var XRegExp__default = /*#__PURE__*/_interopDefaultLegacy(XRegExp);
var recast__default = /*#__PURE__*/_interopDefaultLegacy(recast);
var assert__default = /*#__PURE__*/_interopDefaultLegacy(assert$1);

// Return TRUE if `src` starts with `searchString`.
function startsWith(src, searchString) {
    return src.substr(0, searchString.length) === searchString;
}



// tagged template string helper which removes the indentation common to all
// non-empty lines: that indentation was added as part of the source code
// formatting of this lexer spec file and must be removed to produce what
// we were aiming for.
//
// Each template string starts with an optional empty line, which should be
// removed entirely, followed by a first line of error reporting content text,
// which should not be indented at all, i.e. the indentation of the first
// non-empty line should be treated as the 'common' indentation and thus
// should also be removed from all subsequent lines in the same template string.
//
// See also: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals
function rmCommonWS$1(strings, ...values) {
    // As `strings[]` is an array of strings, each potentially consisting
    // of multiple lines, followed by one(1) value, we have to split each
    // individual string into lines to keep that bit of information intact.
    //
    // We assume clean code style, hence no random mix of tabs and spaces, so every
    // line MUST have the same indent style as all others, so `length` of indent
    // should suffice, but the way we coded this is stricter checking as we look
    // for the *exact* indenting=leading whitespace in each line.
    let indent_str = null;
    let src = strings.map(function splitIntoLines(s) {
        let a = s.split('\n');

        indent_str = a.reduce(function analyzeLine(indent_str, line, index) {
            // only check indentation of parts which follow a NEWLINE:
            if (index !== 0) {
                let m = /^(\s*)\S/.exec(line);
                // only non-empty ~ content-carrying lines matter re common indent calculus:
                if (m) {
                    if (indent_str == null) {
                        indent_str = m[1];
                    } else if (m[1].length < indent_str.length) {
                        indent_str = m[1];
                    }
                }
            }
            return indent_str;
        }, indent_str);

        return a;
    });

    // Also note: due to the way we format the template strings in our sourcecode,
    // the last line in the entire template must be empty when it has ANY trailing
    // whitespace:
    {
        let a = src[src.length - 1];
        a[a.length - 1] = a[a.length - 1].replace(/\s+$/, '');
    }

    // Done removing common indentation.
    //
    // Process template string partials now, but only when there's
    // some actual UNindenting to do:
    if (indent_str) {
        for (let i = 0, len = src.length; i < len; i++) {
            let a = src[i];
            // only correct indentation at start of line, i.e. only check for
            // the indent after every NEWLINE ==> start at j=1 rather than j=0
            for (let j = 1, linecnt = a.length; j < linecnt; j++) {
                if (startsWith(a[j], indent_str)) {
                    a[j] = a[j].substr(indent_str.length);
                }
            }
        }
    }

    // now merge everything to construct the template result:
    {
        let rv = [];
        let i = 0;
        for (let len = values.length; i < len; i++) {
            rv.push(src[i].join('\n'));
            rv.push(values[i]);
        }
        // the last value is always followed by a last template string partial:
        rv.push(src[i].join('\n'));

        let sv = rv.join('');
        return sv;
    }
}

// Convert dashed option keys to Camel Case, e.g. `camelCase('camels-have-one-hump')` => `'camelsHaveOneHump'`
/** @public */
function camelCase(s) {
    // Convert first character to lowercase
    return s.replace(/^\w/, function (match) {
        return match.toLowerCase();
    })
    .replace(/-\w/g, function (match) {
        const c = match.charAt(1);
        const rv = c.toUpperCase();
        // do not mutate 'a-2' to 'a2':
        if (c === rv && c.match(/\d/)) {
            return match;
        }
        return rv;
    });
}

// https://www.ecma-international.org/ecma-262/6.0/#sec-reserved-words
const reservedWords = ((list) => {
    let rv = new Set();
    for (let w of list) {
        //console.error('reserved word:', w);
        rv.add(w);
    }
    return rv;
})([
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'finally',
    'for',
    'function',
    'if',
    'implements',
    'import',
    'in',
    'instanceof',
    'interface',
    'new',
    'package',
    'private',
    'protected',
    'public',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield'
]);

// Convert dashed option keys and other inputs to Camel Cased legal JavaScript identifiers
/** @public */
function mkIdentifier(s) {
    s = '' + s;

    let rv = s
    // Convert dashed ids to Camel Case (though NOT lowercasing the initial letter though!),
    // e.g. `camelCase('camels-have-one-hump')` => `'camelsHaveOneHump'`
    .replace(/-\w/g, function (match) {
        let c = match.charAt(1);
        let rv = c.toUpperCase();
        // mutate 'a-2' to 'a_2':
        if (c === rv && c.match(/\d/)) {
            return '_' + match.substr(1);
        }
        return rv;
    })
    // cleanup: replace any non-suitable character series to a single underscore:
    .replace(/^([\d])/, '_$1')      // where leading numbers are prefixed by an underscore: '1' --> '_1'
    .replace(/^[^\w_]/, '_')
    // do not accept numerics at the leading position, despite those matching regex `\w`:
    .replace(/^\d/, '_')
    .replace(/[^\w\d_]/g, '_')
    // and only accept multiple (double, not triple) underscores at start or end of identifier name:
    .replace(/^__+/, '#')
    .replace(/__+$/, '#')
    .replace(/_+/g, '_')
    .replace(/#/g, '__');

    if (reservedWords.has(rv)) {
        rv = '_' + rv;
    }
    return rv;
}

// Check if the start of the given input matches a regex expression.
// Return the length of the regex expression or -1 if none was found.
/** @public */
function scanRegExp(s) {
    s = '' + s;
    // code based on Esprima scanner: `Scanner.prototype.scanRegExpBody()`
    let index = 0;
    let length = s.length;
    let ch = s[index];
    //assert.assert(ch === '/', 'Regular expression literal must start with a slash');
    let str = s[index++];
    let classMarker = false;
    let terminated = false;
    while (index < length) {
        ch = s[index++];
        str += ch;
        if (ch === '\\') {
            ch = s[index++];
            // https://tc39.github.io/ecma262/#sec-literals-regular-expression-literals
            if (isLineTerminator(ch.charCodeAt(0))) {
                break;             // UnterminatedRegExp
            }
            str += ch;
        } else if (isLineTerminator(ch.charCodeAt(0))) {
            break;                 // UnterminatedRegExp
        } else if (classMarker) {
            if (ch === ']') {
                classMarker = false;
            }
        } else if (ch === '/') {
            terminated = true;
            break;
        } else if (ch === '[') {
            classMarker = true;
        }
    }
    if (!terminated) {
        return -1;                  // UnterminatedRegExp
    }
    return index;
}


// https://tc39.github.io/ecma262/#sec-line-terminators
function isLineTerminator(cp) {
    return (cp === 0x0A) || (cp === 0x0D) || (cp === 0x2028) || (cp === 0x2029);
}

// Check if the given input can be a legal identifier-to-be-camelcased:
// use this function to check if the way the identifier is written will
// produce a sensible & comparable identifier name using the `mkIdentifier'
// API - for humans that transformation should be obvious/trivial in
// order to prevent confusion.
/** @public */
function isLegalIdentifierInput(s) {
    s = '' + s;
    // Convert dashed ids to Camel Case (though NOT lowercasing the initial letter though!),
    // e.g. `camelCase('camels-have-one-hump')` => `'camelsHaveOneHump'`
    let ref = s
    .replace(/-\w/g, function (match) {
        let c = match.charAt(1);
        let rv = c.toUpperCase();
        // mutate 'a-2' to 'a_2':
        if (c === rv && c.match(/\d/)) {
            return '_' + match.substr(1);
        }
        return rv;
    });
    let alt = mkIdentifier(s);
    return alt === ref;
}

// properly quote and escape the given input string
function dquote$1(s) {
    let sq = (s.indexOf('\'') >= 0);
    let dq = (s.indexOf('"') >= 0);
    if (sq && dq) {
        s = s.replace(/"/g, '\\"');
        dq = false;
    }
    if (dq) {
        s = '\'' + s + '\'';
    } else {
        s = '"' + s + '"';
    }
    return s;
}

// Return `true` when the directory has been created
function mkdirp(fp) {
    if (!fp || fp === '.') {
        return false;
    }
    try {
        fs__default['default'].mkdirSync(fp);
        return true;
    } catch (e) {
        if (e.code === 'ENOENT') {
            let parent = path__default['default'].dirname(fp);
            // Did we hit the root directory by now? If so, abort!
            // Else, create the parent; iff that fails, we fail too...
            if (parent !== fp && mkdirp(parent)) {
                try {
                    // Retry creating the original directory: it should succeed now
                    fs__default['default'].mkdirSync(fp);
                    return true;
                } catch (e) {
                    return false;
                }
            }
        }
    }
    return false;
}

//



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


function find_suitable_app_dump_path() {
    return process.cwd()
    .replace(/\\/g, '/')
    .replace(/\/node_modules\/.*$/, (m) => '/___nm___/')
    .replace(/(\/jison\/)(.*)$/, (m, p1, p2) => p1 + '___' + p2.split('/').map((d) => d.charAt(0).toUpperCase()).join('_'));
}

// attempt to dump in one of several locations: first winner is *it*!
function dumpSourceToFile(sourcecode, errname, err_id, options, ex) {
    let dumpfile;
    options = options || {};

    try {
        const dumpPaths = [ (options.outfile ? path__default['default'].dirname(options.outfile) : null), options.inputPath, find_suitable_app_dump_path() ];
        let dumpName = options.inputFilename || options.moduleName || (options.outfile ? path__default['default'].dirname(options.outfile) : null) || options.defaultModuleName || errname;
        // get the base name (i.e. the file name without extension)
        // i.e. strip off only the extension and keep any other dots in the filename
        dumpName = path__default['default'].basename(dumpName, path__default['default'].extname(dumpName));
        // make sure it's legal in the destination filesystem: the least common denominator:
        dumpName = mkIdentifier(dumpName)
        .substr(0, 100);
        if (dumpName === '' || dumpName === '_') {
            dumpName = '__bugger__';
        }

        // generate a stacktrace for the dump no matter what:
        if (!ex) {
            try {
                throw new Error("Not an error: only fetching stacktrace in sourcecode dump helper so you can see which code invoked this.");
            } catch (ex2) {
                ex = ex2;
            }
        }

        err_id = err_id || 'XXX';
        // make sure it's legal in the destination filesystem: the least common denominator.
        err_id = mkIdentifier(err_id)
        .substr(0, 50);

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
                dumpfile = path__default['default'].normalize(path__default['default'].join(dumpPaths[i], dumpName));

                const dump = {
                    errname,
                    err_id,
                    options,
                    ex: convertExceptionToObject(ex)
                };
                let d = JSON5__default['default'].stringify(dump, {
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

                mkdirp(path__default['default'].dirname(dumpfile));
                fs__default['default'].writeFileSync(dumpfile, sourcecode + '\n\n\n' + d, 'utf8');
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
    const debug = options.debug || 0;

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

        if (options.dumpSourceCodeOnFailure) {
            dumpSourceToFile(sourcecode, errname, err_id, options, ex);
        }

        if (options.throwErrorOnCompileFailure) {
            throw ex;
        }
    }
    return p;
}






var exec = {
    exec: exec_and_diagnose_this_stuff,
    dump: dumpSourceToFile,
    convertExceptionToObject,
};

//



assert__default['default'](recast__default['default']);
//var types = recast.types;
//assert(types);
//var namedTypes = types.namedTypes;
//assert(namedTypes);
//var b = types.builders;
//assert(b);
//assert(astUtils);



// WARNING: this regex MUST match the regex for `ID` in ebnf-parser::bnf.l jison language lexer spec! (`ID = [{ALPHA}]{ALNUM}*`)
//
// This is the base XRegExp ID regex used in many places; this should match the ID macro definition in the EBNF/BNF parser et al as well!
const ID_REGEX_BASE = '[\\p{Alphabetic}_][\\p{Alphabetic}_\\p{Number}]*';
// regex set expression which can be used as part of a conditional check to find word/ID/token boundaries
// as this lists all characters which are not allowed in an Identifier anywhere:
const IN_ID_CHARSET = '\\p{Alphabetic}_\\p{Number}';




// Determine which Unicode NonAsciiIdentifierStart characters
// are unused in the given sourcecode and provide a mapping array
// from given (JISON) start/end identifier character-sequences
// to these.
//
// The purpose of this routine is to deliver a reversible
// transform from JISON to plain JavaScript for any action
// code chunks.
//
// This is the basic building block which helps us convert
// jison variables such as `$id`, `$3`, `$-1` ('negative index' reference),
// `@id`, `#id`, `#TOK#` to variable names which can be
// parsed by a regular JavaScript parser such as esprima or babylon.
function generateMapper4JisonGrammarIdentifiers(input) {
    // IMPORTANT: we only want the single char Unicodes in here
    // so we can do this transformation at 'Char'-word rather than 'Code'-codepoint level.

    //const IdentifierStart = unicode4IdStart.filter((e) => e.codePointAt(0) < 0xFFFF);

    // As we will be 'encoding' the Jison Special characters @ and # into the IDStart Unicode
    // range to make JavaScript parsers *not* barf a hairball on Jison action code chunks, we
    // must consider a few things while doing that:
    //
    // We CAN use an escape system where we replace a single character with multiple characters,
    // as JavaScript DOES NOT discern between single characters and multi-character strings: anything
    // between quotes is a string and there's no such thing as C/C++/C#'s `'c'` vs `"c"` which is
    // *character* 'c' vs *string* 'c'.
    //
    // As we can safely escape characters, all we need to do is find a character (or set of characters)
    // which are in the ID_Start range and are expected to be used rarely while clearly identifyable
    // by humans for ease of debugging of the escaped intermediate values.
    //
    // The escape scheme is simple and borrowed from ancient serial communication protocols and
    // the JavaScript string spec alike:
    //
    // - assume the escape character is A
    // - then if the original input stream includes an A, we output AA
    // - if the original input includes a character #, which must be escaped, it is encoded/output as A
    //
    // This is the same as the way the backslash escape in JavaScript strings works and has a minor issue:
    // sequences of AAA with an odd number of A's CAN occur in the output, which might be a little hard to read.
    // Those are, however, easily machine-decodable and that's what's most important here.
    //
    // To help with that AAA... issue AND because we need to escape multiple Jison markers, we choose to
    // a slightly tweaked approach: we are going to use a set of 2-char wide escape codes, where the
    // first character is fixed and the second character is chosen such that the escape code
    // DOES NOT occur in the original input -- unless someone would have intentionally fed nasty input
    // to the encoder as we will pick the 2 characters in the escape from 2 utterly different *human languages*:
    //
    // - the first character is ဩ which is highly visible and allows us to quickly search through a
    //   source to see if and where there are *any* Jison escapes.
    // - the second character is taken from the Unicode CANADIAN SYLLABICS range (0x1400-0x1670) as far as
    //   those are part of ID_Start (0x1401-0x166C or there-abouts) and, unless an attack is attempted at jison,
    //   we can be pretty sure that this 2-character sequence won't ever occur in real life: even when one
    //   writes such a escape in the comments to document this system, e.g. 'ဩᐅ', then there's still plenty
    //   alternatives for the second character left.
    // - the second character represents the escape type: $-n, $#, #n, @n, #ID#, etc. and each type will
    //   pick a different base shape from that CANADIAN SYLLABICS charset.
    // - note that the trailing '#' in Jison's '#TOKEN#' escape will be escaped as a different code to
    //   signal '#' as a token terminator there.
    // - meanwhile, only the initial character in the escape needs to be escaped if encountered in the
    //   original text: ဩ -> ဩဩ as the 2nd and 3rd character are only there to *augment* the escape.
    //   Any CANADIAN SYLLABICS in the original input don't need escaping, as these only have special meaning
    //   when prefixed with ဩ
    // - if the ဩ character is used often in the text, the alternative ℹ இ ண ஐ Ϟ ല ઊ characters MAY be considered
    //   for the initial escape code, hence we start with analyzing the entire source input to see which
    //   escapes we'll come up with this time.
    //
    // The basic shapes are:
    //
    // - 1401-141B:  ᐁ             1
    // - 142F-1448:  ᐯ             2
    // - 144C-1465:  ᑌ             3
    // - 146B-1482:  ᑫ             4
    // - 1489-14A0:  ᒉ             5
    // - 14A3-14BA:  ᒣ             6
    // - 14C0-14CF:  ᓀ
    // - 14D3-14E9:  ᓓ             7
    // - 14ED-1504:  ᓭ             8
    // - 1510-1524:  ᔐ             9
    // - 1526-153D:  ᔦ
    // - 1542-154F:  ᕂ
    // - 1553-155C:  ᕓ
    // - 155E-1569:  ᕞ
    // - 15B8-15C3:  ᖸ
    // - 15DC-15ED:  ᗜ            10
    // - 15F5-1600:  ᗵ
    // - 1614-1621:  ᘔ
    // - 1622-162D:  ᘢ
    //
    // ## JISON identifier formats ##
    //
    // - direct symbol references, e.g. `#NUMBER#` when there's a `%token NUMBER` for your grammar.
    //   These represent the token ID number.
    //
    //   -> (1+2) start-# + end-#
    //
    // - alias/token value references, e.g. `$token`, `$2`
    //
    //   -> $ is an accepted starter, so no encoding required
    //
    // - alias/token location reference, e.g. `@token`, `@2`
    //
    //   -> (6) single-@
    //
    // - alias/token id numbers, e.g. `#token`, `#2`
    //
    //   -> (3) single-#
    //
    // - alias/token stack indexes, e.g. `##token`, `##2`
    //
    //   -> (4) double-#
    //
    // - result value reference `$$`
    //
    //   -> $ is an accepted starter, so no encoding required
    //
    // - result location reference `@$`
    //
    //   -> (6) single-@
    //
    // - rule id number `#$`
    //
    //   -> (3) single-#
    //
    // - result stack index `##$`
    //
    //   -> (4) double-#
    //
    // - 'negative index' value references, e.g. `$-2`
    //
    //   -> (8) single-negative-$
    //
    // - 'negative index' location reference, e.g. `@-2`
    //
    //   -> (7) single-negative-@
    //
    // - 'negative index' stack indexes, e.g. `##-2`
    //
    //   -> (5) double-negative-#
    //

    // count the number of occurrences of ch in src:
    //
    // function countOccurrences(ch, src) {
    //     let cnt = 0;
    //     let offset = 0;
    //     for (;;) {
    //         let pos = src.indexOf(ch, offset);
    //         if (pos === -1) {
    //             return cnt;
    //         }
    //         cnt++;
    //         offset = pos + 1;
    //     }
    // }
    function countOccurrences(ch, src) {
        let i = ch.codePointAt(0);
        return hash[i] || 0;
    }

    // pick an infrequent occurring character from the given `set`.
    // Preferrably has ZERO occurrences in the given `input`, but otherwise
    // deliver the one with the least number of occurrences.
    function pickChar(set, input) {
        // strip out the spaces:
        set = set.replace(/\s+/g, '');

        assert__default['default'](set.length >= 1);
        let lsidx = 0;
        let lsfreq = Infinity;
        for (let i = 0, l = set.length; i < l; i++) {
            let ch = set[i];
            let freq = countOccurrences(ch);
            if (freq === 0) {
                return ch;
            }
            if (freq < lsfreq) {
                lsfreq = freq;
                lsidx = i;
            }
        }
        return set[lsidx];
    }

    const escCharSet = 'ဩ ℹ இ ண ஐ Ϟ ല ઊ';

    // Currently we only need 7 rows of typeIdCharSets. The other rows are commented out but available for future use:
    const typeIdCharSets = [
        'ᐁ  ᐂ  ᐃ  ᐄ  ᐅ  ᐆ  ᐇ  ᐈ  ᐉ  ᐊ  ᐋ  ᐌ  ᐍ  ᐎ  ᐏ  ᐐ  ᐑ  ᐒ  ᐓ  ᐔ  ᐕ  ᐖ  ᐗ  ᐘ  ᐙ  ᐚ  ᐛ  ᐫ  ᐬ  ᐭ  ᐮ',
        //"ᐯ  ᐰ  ᐱ  ᐲ  ᐳ  ᐴ  ᐵ  ᐶ  ᐷ  ᐸ  ᐹ  ᐺ  ᐻ  ᐼ  ᐽ  ᐾ  ᐿ  ᑀ  ᑁ  ᑂ  ᑃ  ᑄ  ᑅ  ᑆ  ᑇ  ᑈ",
        'ᑌ  ᑍ  ᑎ  ᑏ  ᑐ  ᑑ  ᑒ  ᑓ  ᑔ  ᑕ  ᑖ  ᑗ  ᑘ  ᑙ  ᑚ  ᑛ  ᑜ  ᑝ  ᑞ  ᑟ  ᑠ  ᑡ  ᑢ  ᑣ  ᑤ  ᑥ  ᑧ  ᑨ  ᑩ  ᑪ',
        'ᑫ  ᑬ  ᑭ  ᑮ  ᑯ  ᑰ  ᑱ  ᑲ  ᑳ  ᑴ  ᑵ  ᑶ  ᑷ  ᑸ  ᑹ  ᑺ  ᑻ  ᑼ  ᑽ  ᑾ  ᑿ  ᒀ  ᒁ  ᒂ  ᒅ  ᒆ  ᒇ  ᒈ',
        //"ᒉ  ᒊ  ᒋ  ᒌ  ᒍ  ᒎ  ᒏ  ᒐ  ᒑ  ᒒ  ᒓ  ᒔ  ᒕ  ᒖ  ᒗ  ᒘ  ᒙ  ᒚ  ᒛ  ᒜ  ᒝ  ᒞ  ᒟ  ᒠ",
        //"ᒣ  ᒤ  ᒥ  ᒦ  ᒧ  ᒨ  ᒩ  ᒪ  ᒫ  ᒬ  ᒭ  ᒮ  ᒯ  ᒰ  ᒱ  ᒲ  ᒳ  ᒴ  ᒵ  ᒶ  ᒷ  ᒸ  ᒹ  ᒺ",
        //"ᓓ  ᓔ  ᓕ  ᓖ  ᓗ  ᓘ  ᓙ  ᓚ  ᓛ  ᓜ  ᓝ  ᓞ  ᓟ  ᓠ  ᓡ  ᓢ  ᓣ  ᓤ  ᓥ  ᓦ  ᓧ  ᓨ  ᓩ",
        //"ᓭ  ᓮ  ᓯ  ᓰ  ᓱ  ᓲ  ᓳ  ᓴ  ᓵ  ᓶ  ᓷ  ᓸ  ᓹ  ᓺ  ᓻ  ᓼ  ᓽ  ᓾ  ᓿ  ᔀ  ᔁ  ᔂ  ᔃ  ᔄ",
        //"ᔐ  ᔑ  ᔒ  ᔓ  ᔔ  ᔕ  ᔖ  ᔗ  ᔘ  ᔙ  ᔚ  ᔛ  ᔜ  ᔝ  ᔞ  ᔟ  ᔠ  ᔡ  ᔢ  ᔣ  ᔤ",
        'ᔦ  ᔧ  ᔨ  ᔩ  ᔪ  ᔫ  ᔬ  ᔭ  ᔮ  ᔯ  ᔰ  ᔱ  ᔲ  ᔳ  ᔴ  ᔵ  ᔶ  ᔷ  ᔸ  ᔹ  ᔺ  ᔻ  ᔼ  ᔽ',
        //"ᓀ  ᓁ  ᓂ  ᓃ  ᓄ  ᓅ  ᓆ  ᓇ  ᓈ  ᓉ  ᓊ  ᓋ  ᓌ  ᓍ  ᓎ  ᓏ",
        //"ᕂ  ᕃ  ᕄ  ᕅ  ᕆ  ᕇ  ᕈ  ᕉ  ᕊ  ᕋ  ᕌ  ᕍ  ᕎ  ᕏ",
        //"ᕞ  ᕟ  ᕠ  ᕡ  ᕢ  ᕣ  ᕤ  ᕥ  ᕦ  ᕧ  ᕨ  ᕩ",
        //"ᖸ  ᖹ  ᖺ  ᖻ  ᖼ  ᖽ  ᖾ  ᖿ  ᗀ  ᗁ  ᗂ  ᗃ",
        'ᗜ  ᗝ  ᗞ  ᗟ  ᗠ  ᗡ  ᗢ  ᗣ  ᗤ  ᗥ  ᗦ  ᗧ  ᗨ  ᗩ  ᗪ  ᗫ  ᗬ  ᗭ',
        //"ᗯ  ᗰ  ᗱ  ᗲ  ᗳ  ᗴ  ᗵ  ᗶ  ᗷ  ᗸ  ᗹ  ᗺ  ᗻ  ᗼ  ᗽ  ᗾ  ᗿ  ᘀ",
        'ᘔ  ᘕ  ᘖ  ᘗ  ᘘ  ᘙ  ᘚ  ᘛ  ᘜ  ᘝ  ᘞ  ᘟ  ᘠ  ᘡ',
        //"ᘢ  ᘣ  ᘤ  ᘥ  ᘦ  ᘧ  ᘨ  ᘩ  ᘪ  ᘫ  ᘬ  ᘭ  ᘴ  ᘵ  ᘶ  ᘷ  ᘸ  ᘹ",
        //"ᕓ  ᕔ  ᕕ  ᕖ  ᕗ  ᕘ  ᕙ  ᕚ  ᕛ  ᕜ",
        'ᗄ  ᗅ  ᗆ  ᗇ  ᗈ  ᗉ  ᗊ  ᗋ  ᗌ  ᗍ  ᗎ  ᗏ  ᗐ  ᗑ  ᗒ  ᗓ  ᗔ  ᗕ  ᗖ  ᗗ  ᗘ  ᗙ  ᗚ  ᗛ'
    ];

    //const I = 'ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ';   // 1..12, but accepted as IdentifierStart in JavaScript :-)

    // Probable speed improvement: scan a single time through the (probably large) input source,
    // looking for all characters in parallel, instead of scanning N times through there:
    // construct a regex to dig out all potential occurrences and take it from there.
    let reStr = escCharSet + typeIdCharSets.join('');
    reStr = reStr.replace(/\s+/g, '');
    const re = new RegExp(`[${reStr}]`, 'g');
    var hash = new Array(0xD800);
    let m;
    while ((m = re.exec(input)) !== null) {
        let i = m[0].codePointAt();
        hash[i] = (hash[i] || 0) + 1;
    }

    //
    // The basic shapes are:
    //
    // - 1401-141B:  ᐁ             1
    // - 142F-1448:  ᐯ             2
    // - 144C-1465:  ᑌ             3
    // - 146B-1482:  ᑫ             4
    // - 1489-14A0:  ᒉ             5
    // - 14A3-14BA:  ᒣ             6
    // - 14C0-14CF:  ᓀ
    // - 14D3-14E9:  ᓓ             7
    // - 14ED-1504:  ᓭ             8
    // - 1510-1524:  ᔐ             9
    // - 1526-153D:  ᔦ
    // - 1542-154F:  ᕂ
    // - 1553-155C:  ᕓ
    // - 155E-1569:  ᕞ
    // - 15B8-15C3:  ᖸ
    // - 15DC-15ED:  ᗜ            10
    // - 15F5-1600:  ᗵ
    // - 1614-1621:  ᘔ
    // - 1622-162D:  ᘢ
    //
    // ## JISON identifier formats ##
    //
    // - direct symbol references, e.g. `#NUMBER#` when there's a `%token NUMBER` for your grammar.
    //   These represent the token ID number.
    //
    //   -> (1+2) start-# + end-#
    //
    // - alias/token value references, e.g. `$token`, `$2`
    //
    //   -> $ is an accepted starter, so no encoding required
    //
    // - alias/token location reference, e.g. `@token`, `@2`
    //
    //   -> (6) single-@
    //
    // - alias/token id numbers, e.g. `#token`, `#2`
    //
    //   -> (3) single-#
    //
    // - alias/token stack indexes, e.g. `##token`, `##2`
    //
    //   -> (4) double-#
    //
    // - result value reference `$$`
    //
    //   -> $ is an accepted starter, so no encoding required
    //
    // - result location reference `@$`
    //
    //   -> (6) single-@
    //
    // - rule id number `#$`
    //
    //   -> (3) single-#
    //
    // - result stack index `##$`
    //
    //   -> (4) double-#
    //
    // - 'negative index' value references, e.g. `$-2`
    //
    //   -> (8) single-negative-$
    //
    // - 'negative index' location reference, e.g. `@-2`
    //
    //   -> (7) single-negative-@
    //
    // - 'negative index' stack indexes, e.g. `##-2`
    //
    //   -> (5) double-negative-#
    //

    const escChar = pickChar(escCharSet);
    let typeIdChar = [];
    for (let i = 0, l = typeIdCharSets.length; i < l; i++) {
        typeIdChar[i] = pickChar(typeIdCharSets[i]);
    }

    // produce a function set for encoding and decoding content,
    // plus the basic strings to build regexes for matching the various jison
    // identifier types:
    return {
        // - direct symbol references, e.g. `#NUMBER#` when there's a `%token NUMBER` for your grammar.
        //   These represent the token ID number.
        //
        //   -> (1) start-#
        tokenDirectIdentifierStart: escChar + typeIdChar[0],
        tokenDirectIdentifierRe: new XRegExp__default['default'](`#(${ID_REGEX_BASE})#`, 'g'),

        // - alias/token value references, e.g. `$token`, `$2`
        //
        //   -> $ is an accepted starter, so no encoding required
        // - result value reference `$$`
        //
        //   -> $ is an accepted starter, so no encoding required
        tokenValueReferenceStart: '$',
        tokenValueReferenceRe: new XRegExp__default['default'](`$(${ID_REGEX_BASE})|$([0-9]+)`, 'g'),

        // - alias/token location reference, e.g. `@token`, `@2`
        //
        //   -> (6) single-@
        // - result location reference `@$`
        //
        //   -> (6) single-@
        tokenLocationStart: escChar + typeIdChar[1],
        tokenLocationRe: new XRegExp__default['default'](`@(${ID_REGEX_BASE})|@([0-9]+)`, 'g'),

        // - alias/token id numbers, e.g. `#token`, `#2`
        //
        //   -> (3) single-#
        // - rule id number `#$`
        //
        //   -> (3) single-#
        tokenIdentifierStart: escChar + typeIdChar[2],
        tokenIdentifierRe: new XRegExp__default['default'](`#(${ID_REGEX_BASE})|#([0-9]+)`, 'g'),

        // - alias/token stack indexes, e.g. `##token`, `##2`
        //
        //   -> (4) double-#
        // - result stack index `##$`
        //
        //   -> (4) double-#
        tokenStackIndexStart: escChar + typeIdChar[3],
        tokenStackIndexRe: new XRegExp__default['default'](`##(${ID_REGEX_BASE})|##([0-9]+)`, 'g'),

        // - 'negative index' value references, e.g. `$-2`
        //
        //   -> (8) single-negative-$
        tokenNegativeValueReferenceStart: escChar + typeIdChar[4],
        tokenValueReferenceRe: new XRegExp__default['default']('$-([0-9]+)', 'g'),

        // - 'negative index' location reference, e.g. `@-2`
        //
        //   -> (7) single-negative-@
        tokenNegativeLocationStart: escChar + typeIdChar[5],
        tokenNegativeLocationRe: new XRegExp__default['default']('@-([0-9]+)', 'g'),

        // - 'negative index' stack indexes, e.g. `##-2`
        //
        //   -> (5) double-negative-#
        tokenNegativeStackIndexStart: escChar + typeIdChar[6],
        tokenNegativeStackIndexRe: new XRegExp__default['default']('#-([0-9]+)', 'g'),

        // combined regex for encoding direction
        tokenDetect4EncodeRe: new XRegExp__default['default'](`([^$@#${IN_ID_CHARSET}])([$@#]|##)(${ID_REGEX_BASE}|[$]|-?[0-9]+)(#?)(?![$@#${IN_ID_CHARSET}])`, 'g'),

        // combined regex for decoding direction
        tokenDetect4DecodeRe: new XRegExp__default['default'](`([^$${IN_ID_CHARSET}])(${escChar}[${typeIdChar.slice(0, 7).join('')}])(${ID_REGEX_BASE}|[$]|[0-9]+)(?![$@#${IN_ID_CHARSET}])`, 'g'),

        encode: function encodeJisonTokens(src, locationOffsetSpec) {
            let re = this.tokenDetect4EncodeRe;

            // reset regex
            re.lastIndex = 0;

            // patch `src` for the lookbehind emulation in the main regex used:
            src = ' ' + src;

            // Perform the encoding, one token at a time via callback function.
            //
            // Note: all erroneous inputs are IGNORED as those MAY be part of a string
            // or comment, where they are perfectly legal.
            // This is a tad sub-optimal as we won't be able to report errors early
            // but otherwise we would be rejecting some potentially *legal* action code
            // and we DO NOT want to be pedantically strict while we are unable to parse
            // the input very precisely yet.
            src = src.replace(re, (m, p1, p2, p3, p4, offset) => {
                // p1 is only serving as lookbehind emulation

                switch (p2) {
                case '$':
                    // no encoding required UNLESS it's a negative index; p4 MUST be empty
                    if (p4 !== '') {
                        if (locationOffsetSpec) {
                            locationOffsetSpec.reportLocation(`syntax error: ${p2 + p3} cannot be followed by ${p4}`, src, offset + p1.length + p2.length + p3.length);
                        }
                        return p1 + p2 + p3 + p4;
                    }
                    if (p3[0] === '-') {
                        return p1 + this.tokenNegativeValueReferenceStart + p3.substring(1);
                    }
                    return p1 + p2 + p3;

                case '##':
                    // p4 MUST be empty
                    if (p4 !== '') {
                        if (locationOffsetSpec) {
                            locationOffsetSpec.reportLocation(`syntax error: ${p2 + p3} cannot be followed by ${p4}`, src, offset + p1.length + p2.length + p3.length);
                        }
                        return p1 + p2 + p3 + p4;
                    }
                    if (p3[0] === '-') {
                        return p1 + this.tokenNegativeStackIndexStart + p3.substring(1);
                    }
                    return p1 + this.tokenStackIndexStart + p3;

                case '@':
                    // p4 MUST be empty
                    if (p4 !== '') {
                        if (locationOffsetSpec) {
                            locationOffsetSpec.reportLocation(`syntax error: ${p2 + p3} cannot be followed by ${p4}`, src, offset + p1.length + p2.length + p3.length);
                        }
                        return p1 + p2 + p3 + p4;
                    }
                    if (p3[0] === '-') {
                        return p1 + this.tokenNegativeLocationStart + p3.substring(1);
                    }
                    return p1 + this.tokenLocationStart + p3;

                case '#':
                    // p4 MAY be non-empty; p3 CANNOT be a negative value or token ID
                    if (p3[0] === '-') {
                        if (locationOffsetSpec) {
                            locationOffsetSpec.reportLocation(`syntax error: ${p2 + p3 + p4} is an illegal negative reference type`, src, offset + p1.length + p2.length);
                        }
                        return p1 + p2 + p3 + p4;
                    }
                    if (p4 !== '') {
                        return p1 + this.tokenDirectIdentifierStart + p3;
                    }
                    return p1 + this.tokenIdentifierStart + p3;

                // no default case needed as all possible matches are handled in the cases above.
                }
            });

            // and remove the added prefix which was used for lookbehind emulation:
            return src.substring(1);
        },

        decode: function decodeJisonTokens(src, locationOffsetSpec) {
            let re = this.tokenDetect4DecodeRe;

            // reset regex
            re.lastIndex = 0;

            // patch `src` for the lookbehind emulation in the main regex used:
            src = ' ' + src;

            // Perform the encoding, one token at a time via callback function.
            //
            // Note: all erroneous inputs are IGNORED as those MAY be part of a string
            // or comment, where they are perfectly legal.
            // This is a tad sub-optimal as we won't be able to report errors early
            // but otherwise we would be rejecting some potentially *legal* action code
            // and we DO NOT want to be pedantically strict while we are unable to parse
            // the input very precisely yet.
            src = src.replace(re, (m, p1, p2, p3, offset) => {
                // p1 is only serving as lookbehind emulation

                switch (p2) {
                case this.tokenNegativeValueReferenceStart:
                    return p1 + '$-' + p3;

                case this.tokenNegativeStackIndexStart:
                    return p1 + '##-' + p3;

                case this.tokenStackIndexStart:
                    return p1 + '##' + p3;

                case this.tokenNegativeLocationStart:
                    return p1 + '@-' + p3;

                case this.tokenLocationStart:
                    return p1 + '@' + p3;

                case this.tokenDirectIdentifierStart:
                    // p3 CANNOT be a negative value or token ID
                    if (p3[0] === '-') {
                        if (locationOffsetSpec) {
                            locationOffsetSpec.reportLocation(`syntax error: ${p2 + p3 + p4} is an illegal negative reference type`, src, offset + p1.length + p2.length);
                        }
                        return p1 + p2 + p3;
                    }
                    return p1 + '#' + p3 + '#';

                case this.tokenIdentifierStart:
                    // p3 CANNOT be a negative value or token ID
                    if (p3[0] === '-') {
                        if (locationOffsetSpec) {
                            locationOffsetSpec.reportLocation(`syntax error: ${p2 + p3 + p4} is an illegal negative reference type`, src, offset + p1.length + p2.length);
                        }
                        return p1 + p2 + p3;
                    }
                    return p1 + '#' + p3;

                default:
                    if (locationOffsetSpec) {
                        locationOffsetSpec.reportLocation(`syntax error: unexpected jison token sentinel escape ${p2} at ${p2 + p3}`, src, offset + p1.length);
                    }
                    return p1 + p2 + p3;
                }
            });

            // and remove the added prefix which was used for lookbehind emulation:
            return src.substring(1);
        }
    };
}


// Reduce the RECAST AST in total size; the `loc` nodes contain a `tokens` set each,
// which carries references to the parsed tokens that are contained within that `loc`
// range. 
// Tests have shown that the generated output is the samee when I nuke every `loc.tokens`
// in the TREE.
// It also turned out in the tests that the root object has a `tokens` array itself,
// which is of course faster to traverse than the often rather deep AST (tree), 
// so we've chosen to attack that one instead, as it seemed those tokens were just
// more references to the same token objects as contained in `loc.tokens[]` for those
// tree nodes of various names and types.
// 
// So now we just go through the root.tokens[] array and nuke all its members' 
// `loc` attributes and everything is hunky-dory with the generated output. 
// 
function stripAST(ast) {
    if (!ast) return;

    let tokens = ast.tokens;
    for (let i = 0, len = tokens.length; i < len; i++) {
        let node = tokens[i];
        // if (node.loc && node.loc.tokens) {
        //     delete node.loc.tokens;
        // }
        if (node.loc) {
            delete node.loc;
        }
    }
}






function parseCodeChunkToAST(src, options) {
    options = options || {};
    if (options.doNotTestCompile) {
        return false;        // simply accept everything...
    }

    src = src
    .replace(/@/g, '\uFFDA')
    .replace(/#/g, '\uFFDB')
    ;
    const ast = recast__default['default'].parse(src);
    stripAST(ast);
    return ast;
}


// function compileCodeToES5(src, options) {
//     options = Object.assign({}, {
//         ast: true,
//         code: true,
//         sourceMaps: true,
//         comments: true,
//         filename: 'compileCodeToES5.js',
//         sourceFileName: 'compileCodeToES5.js',
//         sourceRoot: '.',
//         sourceType: 'module',

//         babelrc: false,

//         ignore: [
//             'node_modules/**/*.js'
//         ],
//         compact: false,
//         retainLines: false,
//         presets: [
//             [ '@babel/preset-env', {
//                 targets: {
//                     browsers: [ 'last 2 versions' ],
//                     node: '8.0'
//                 }
//             } ]
//         ]
//     }, options);

//     return babel.transformSync(src, options); // => { code, map, ast }
// }


function prettyPrintAST(ast, options) {
    const defaultOptions = {
        tabWidth: 2,
        quote: 'single',
        arrowParensAlways: true,

        // Do not reuse whitespace (or anything else, for that matter)
        // when printing generically.
        reuseWhitespace: false
    };
    options = Object.assign({}, defaultOptions, options);
    
    let s = recast__default['default'].prettyPrint(ast, options);
    let new_src = s.code;

    new_src = new_src
    .replace(/\r\n|\n|\r/g, '\n')    // platform dependent EOL fixup
    // backpatch possible jison variables extant in the prettified code:
    .replace(/\uFFDA/g, '@')
    .replace(/\uFFDB/g, '#')
    ;

    return new_src;
}




// validate the given JISON+JavaScript snippet: does it compile?
//
// Return either the parsed AST (object) or an error message (string).
function checkActionBlock(src, yylloc, options) {
    options = options || {};
    if (options.doNotTestCompile) {
        return false;        // simply accept everything...
    }

    // empty action code is A-okay all the time:
    if (!src || !src.trim()) {
        return false;
    }

    // make sure reasonable line numbers, etc. are reported in any
    // potential parse errors by pushing the source code down:
    if (yylloc && yylloc.first_line > 0) {
        let cnt = yylloc.first_line;
        let lines = new Array(cnt);
        src = lines.join('\n') + src;
    }

    try {
        void parseCodeChunkToAST(src, options);
        return false;
    } catch (ex) {
        return ex.message || 'code snippet cannot be parsed';
    }
}



// The rough-and-ready preprocessor for any action code block:
// this one trims off any surplus whitespace and removes any
// trailing semicolons and/or wrapping `{...}` braces,
// when such is easily possible *without having to actually
// **parse** the `src` code block in order to do this safely*.
//
// Returns the trimmed sourcecode which was provided via `src`.
//
// Note: the `startMarker` argument is special in that a lexer/parser
// can feed us the delimiter which started the code block here:
// when the starting delimiter actually is `{` we can safely
// remove the outer `{...}` wrapper (which then *will* be present!),
// while otherwise we may *not* do so as complex/specially-crafted
// code will fail when it was wrapped in other delimiters, e.g.
// action code specs like this one:
//
//              %{
//                  {  // trimActionCode sees this one as outer-starting: WRONG
//                      a: 1
//                  };
//                  {
//                      b: 2
//                  }  // trimActionCode sees this one as outer-ending: WRONG
//              %}
//
// Of course the example would be 'ludicrous' action code but the
// key point here is that users will certainly be able to come up with
// convoluted code that is smarter than our simple regex-based
// `{...}` trimmer in here!
//
function trimActionCode(src, options) {
    options = options || {};
    let s = src.trim();
    // remove outermost set of braces UNLESS there's
    // a curly brace in there anywhere: in that case
    // we should leave it up to the sophisticated
    // code analyzer to simplify the code!
    //
    // This is a very rough check as it will also look
    // inside code comments, which should not have
    // any influence.
    //
    // Nevertheless: this is a *safe* transform as
    // long as the code doesn't end with a C++-style
    // comment which happens to contain that closing
    // curly brace at the end!
    //
    // Also DO strip off any trailing optional semicolon,
    // which might have ended up here due to lexer rules
    // like this one:
    //
    //     [a-z]+              -> 'TOKEN';
    //
    // We can safely ditch any trailing semicolon(s) as
    // our code generator reckons with JavaScript's
    // ASI rules (Automatic Semicolon Insertion).
    //
    //
    // TODO: make this is real code edit without that
    // last edge case as a fault condition.
    if (!options.dontTrimSurroundingCurlyBraces) {
        if (options.startMarker === '{') {
            // code is wrapped in `{...}` for sure: remove the wrapping braces.
            s = s.replace(/^\{([^]*?)\}$/, '$1').trim();
        } else {
            // code may not be wrapped or otherwise non-simple: only remove
            // wrapping braces when we can guarantee they're the only ones there,
            // i.e. only exist as outer wrapping.
            s = s.replace(/^\{([^}]*)\}$/, '$1').trim();
        }
    }
    s = s.replace(/;+$/, '').trim();
    return s;
}





// Put (...) braces around the given (arrow-)action code to ensure
// that it MUST be arrow-action legal on test-compile and use.
// 
// From bnf.y:
// 
// add braces around ARROW_ACTION so that the action chunk test/compiler
// will uncover any illegal action code following the arrow operator, e.g.
// multiple statements separated by semicolon.
//
// But only do so when the arrow action is not itself surrounded by curly braces
// when it would, for instance, attempt to return an object instance.
//
// Also nuke the possible superfluous semicolon, but *only* when it's in 
// the outer-most scope as the user may be defining an IIFE or *function*
// as a return value!
//
// Also note there's no need to put braces around the code when it DOES NOT
// contain any ';' semicolons or {} curly braces, those being the premier
// statement separators in JavaScript. IFF you happen to be a semicolon hater
// then your code will have additional newlines to separate statements at 
// least and we'll put braces around it to ensure the auto-semicolon JS rule
// doesn't kick in at a bad time.
// 
// WARNING: Bad Things(tm) will happen when you start your action with a comment
// and then follow it by a {...} object instance to return: we COULD remove
// all comments from the action code and then check again, but we haven't
// made that effort yet, so you'll need to rewrite such arrow-action code. 
// 
// Yeah, this stuff can get pretty hairy!   |:-\
function braceArrowActionCode(src) {
    let s = src.trim();
    s = s.replace(/;+$/, '').trim();

    if (s.includes('{') && s.includes('}')) {
        return s;
    }
    // wrap code that contains ANY:
    // - multiple lines
    // - comments anywhere (we only check for the initial / so division math will be wrapped as well. Soit.)
    // - semicolon(s)
    if (/[\r\n;\/]/.test(s)) {
        s = `(
            ${s}
        )`;
    }

    return s;
}




var parse2AST = {
    generateMapper4JisonGrammarIdentifiers,
    parseCodeChunkToAST,
    //compileCodeToES5,
    prettyPrintAST,
    checkActionBlock,
    trimActionCode,
    braceArrowActionCode,

    ID_REGEX_BASE,
    IN_ID_CHARSET
};

function chkBugger$1(src) {
    src = String(src);
    if (src.match(/\bcov_\w+/)) {
        console.error('### ISTANBUL COVERAGE CODE DETECTED ###\n', src);
    }
}


/// HELPER FUNCTION: print the function in source code form, properly indented.
/** @public */
function printFunctionSourceCode(f) {
    const src = String(f);
    chkBugger$1(src);
    return src;
}



const funcRe = /^function[\s\r\n]*[^\(]*\(([^\)]*)\)[\s\r\n]*\{([^]*?)\}$/;
const arrowFuncRe = /^(?:(?:\(([^\)]*)\))|(?:([^\(\)]+)))[\s\r\n]*=>[\s\r\n]*(?:(?:\{([^]*?)\})|(?:(([^\s\r\n\{)])[^]*?)))$/;

/// HELPER FUNCTION: print the function **content** in source code form, properly indented,
/// ergo: produce the code for inlining the function.
///
/// Also supports ES6's Arrow Functions:
///
/// ```
/// function a(x) { return x; }        ==> 'return x;'
/// function (x)  { return x; }        ==> 'return x;'
/// (x) => { return x; }               ==> 'return x;'
/// (x) => x;                          ==> 'return x;'
/// (x) => do(1), do(2), x;            ==> 'return (do(1), do(2), x);'
///
/** @public */
function printFunctionSourceCodeContainer(f) {
    let action = printFunctionSourceCode(f).trim();
    let args;

    // Also cope with Arrow Functions (and inline those as well?).
    // See also https://github.com/zaach/jison-lex/issues/23
    let m = funcRe.exec(action);
    if (m) {
        args = m[1].trim();
        action = m[2].trim();
    } else {
        m = arrowFuncRe.exec(action);
        if (m) {
            if (m[2]) {
                // non-bracketed arguments:
                args = m[2].trim();
            } else {
                // bracketed arguments: may be empty args list!
                args = m[1].trim();
            }
            if (m[5]) {
                // non-bracketed version: implicit `return` statement!
                //
                // Q: Must we make sure we have extra braces around the return value
                // to prevent JavaScript from inserting implit EOS (End Of Statement)
                // markers when parsing this, when there are newlines in the code?
                // A: No, we don't have to as arrow functions rvalues suffer from this
                // same problem, hence the arrow function's programmer must already
                // have formatted the code correctly.
                action = m[4].trim();
                action = 'return ' + action + ';';
            } else {
                action = m[3].trim();
            }
        } else {
            const e = new Error('Cannot extract code from function');
            e.subject = action;
            throw e;
        }
    }
    return {
        args: args,
        code: action
    };
}







var stringifier = {
    printFunctionSourceCode,
    printFunctionSourceCodeContainer
};

//
//
//
function detectIstanbulGlobal() {
    const gcv = '__coverage__';
    const globalvar = new Function('return this')();
    const coverage = globalvar[gcv];
    return coverage || false;
}

//
// Helper library for safe code execution/compilation
//
// MIT Licensed
//
//
// This code is intended to help test and diagnose arbitrary regexes, answering questions like this:
//
// - is this a valid regex, i.e. does it compile?
// - does it have captures, and if yes, how many?
//

//import XRegExp from '@gerhobbelt/xregexp';


// validate the given regex.
//
// You can specify an (advanced or regular) regex class as a third parameter.
// The default assumed is the standard JavaScript `RegExp` class.
//
// Return FALSE when there's no failure, otherwise return an `Error` info object.
function checkRegExp(re_src, re_flags, XRegExp) {
    let re;

    // were we fed a RegExp object or a string?
    if (re_src
        && typeof re_src.source === 'string'
        && typeof re_src.flags === 'string'
        && typeof re_src.toString === 'function'
        && typeof re_src.test === 'function'
        && typeof re_src.exec === 'function'
    ) {
        // we're looking at a RegExp (or XRegExp) object, so we can trust the `.source` member
        // and the `.toString()` method to produce something that's compileable by XRegExp
        // at least...
        if (!re_flags || re_flags === re_src.flags) {
            // no change of flags: we assume it's okay as it's already contained
            // in an RegExp or XRegExp object
            return false;
        }
    }
    // we DO accept empty regexes: `''` but we DO NOT accept null/undefined
    if (re_src == null) {
        return new Error('invalid regular expression source: ' + re_src);
    }

    re_src = '' + re_src;
    if (re_flags == null) {
        re_flags = undefined;       // `new RegExp(..., flags)` will barf a hairball when `flags===null`
    } else {
        re_flags = '' + re_flags;
    }

    XRegExp = XRegExp || RegExp;

    try {
        re = new XRegExp(re_src, re_flags);
    } catch (ex) {
        return ex;
    }
    return false;
}

// provide some info about the given regex.
//
// You can specify an (advanced or regular) regex class as a third parameter.
// The default assumed is the standard JavaScript `RegExp` class.
//
// Return FALSE when the input is not a legal regex.
function getRegExpInfo(re_src, re_flags, XRegExp) {
    let re1, re2, m1, m2;

    // were we fed a RegExp object or a string?
    if (re_src
        && typeof re_src.source === 'string'
        && typeof re_src.flags === 'string'
        && typeof re_src.toString === 'function'
        && typeof re_src.test === 'function'
        && typeof re_src.exec === 'function'
    ) {
        // we're looking at a RegExp (or XRegExp) object, so we can trust the `.source` member
        // and the `.toString()` method to produce something that's compileable by XRegExp
        // at least...
        if (!re_flags || re_flags === re_src.flags) {
            // no change of flags: we assume it's okay as it's already contained
            // in an RegExp or XRegExp object
            re_flags = undefined;
        }
    } else if (re_src == null) {
        // we DO NOT accept null/undefined
        return false;
    } else {
        re_src = '' + re_src;

        if (re_flags == null) {
            re_flags = undefined;       // `new RegExp(..., flags)` will barf a hairball when `flags===null`
        } else {
            re_flags = '' + re_flags;
        }
    }

    XRegExp = XRegExp || RegExp;

    try {
        // A little trick to obtain the captures from a regex:
        // wrap it and append `(?:)` to ensure it matches
        // the empty string, then match it against it to
        // obtain the `match` array.
        re1 = new XRegExp(re_src, re_flags);
        re2 = new XRegExp('(?:' + re_src + ')|(?:)', re_flags);
        m1 = re1.exec('');
        m2 = re2.exec('');
        return {
            acceptsEmptyString: !!m1,
            captureCount: m2.length - 1
        };
    } catch (ex) {
        return false;
    }
}








var reHelpers = {
    checkRegExp: checkRegExp,
    getRegExpInfo: getRegExpInfo
};

const convertExceptionToObject$1 = exec.convertExceptionToObject;

let cycleref = [];
let cyclerefpath = [];

let linkref = [];
let linkrefpath = [];

let breadcrumbs = [];

function shallow_copy(src) {
    if (typeof src === 'object') {
        if (src instanceof Array) {
            return src.slice();
        }

        let dst = {};
        if (src instanceof Error) {
            dst = convertExceptionToObject$1(src);
        } else {
            for (let k in src) {
                if (Object.prototype.hasOwnProperty.call(src, k)) {
                    dst[k] = src[k];
                }
            }
        }
        return dst;
    }
    return src;
}


function shallow_copy_and_strip_depth(src, parentKey) {
    if (typeof src === 'object') {
        let dst;

        if (src instanceof Array) {
            dst = src.slice();
            for (let i = 0, len = dst.length; i < len; i++) {
                breadcrumbs.push('[' + i + ']');
                dst[i] = shallow_copy_and_strip_depth(dst[i], parentKey + '[' + i + ']');
                breadcrumbs.pop();
            }
        } else {
            dst = {};
            if (src instanceof Error) {
                dst = convertExceptionToObject$1(src);
            } else {
                for (let k in src) {
                    if (Object.prototype.hasOwnProperty.call(src, k)) {
                        let el = src[k];
                        if (el && typeof el === 'object') {
                            dst[k] = '[cyclic reference::attribute --> ' + parentKey + '.' + k + ']';
                        } else {
                            dst[k] = src[k];
                        }
                    }
                }
            }
        }
        return dst;
    }
    return src;
}


// strip developer machine specific parts off any paths in a given stacktrace (string)
// to ease cross-platform comparison of these stacktraces.
function stripErrorStackPaths(msg) {
    // strip away devbox-specific paths in error stack traces in the output:
    // and any `nyc` profiler run added trailing cruft has to go too, e.g. ', <anonymous>:1489:27)':
    msg = msg
    .replace(/\bat ([^\r\n(\\\/]+?)\([^)]*?[\\\/]([a-z0-9_-]+\.js):([0-9]+:[0-9]+)\)(?:, <anonymous>:[0-9]+:[0-9]+\))?/gi, 'at $1(/$2:$3)')
    .replace(/\bat [^\r\n ]*?[\\\/]([a-z0-9_-]+\.js):([0-9]+:[0-9]+)/gi, 'at /$1:$2');

    return msg;
}


// strip off the line/position info from any stacktrace as a assert.deepEqual() on these
// will otherwise FAIL due to us running this stuff through both regular `node` and 
// the `nyc` profiler: the latter reformats the sourcecode-under-test, thus producing 
// exceptions and stacktraces which point completely somewhere else and this would b0rk
// our test rigs for the jison subpackages.
function cleanStackTrace4Comparison(obj) {
    if (typeof obj === 'string') {
        // and any `nyc` profiler run added trailing cruft has to go too, e.g. ', <anonymous>:1489:27)':
        let msg = obj
        .replace(/\bat ([^\r\n(\\\/]+?)\([^)]*?[\\\/]([a-z0-9_-]+\.js):([0-9]+:[0-9]+)\)(?:, <anonymous>:[0-9]+:[0-9]+\))?/gi, 'at $1(/$2)')
        .replace(/\bat [^\r\n ]*?[\\\/]([a-z0-9_-]+\.js):([0-9]+:[0-9]+)/gi, 'at /$1');

        return msg;
    }

    if (obj) {
        if (obj.stack) {
            obj.stack = cleanStackTrace4Comparison(obj.stack);
        }
        let keys = Object.keys(obj);
        for (let i in keys) {
            let key = keys[i];
            let el = obj[key];
            cleanStackTrace4Comparison(el);
        }
    }
    return obj;
}






function trim_array_tail(arr) {
    if (arr instanceof Array) {
        let len;
        for (len = arr.length; len > 0; len--) {
            if (arr[len - 1] != null) {
                break;
            }
        }
        if (arr.length !== len) {
            arr.length = len;
        }
    }
}

function treat_value_stack(v) {
    if (v instanceof Array) {
        let idx = cycleref.indexOf(v);
        if (idx >= 0) {
            v = '[cyclic reference to parent array --> ' + cyclerefpath[idx] + ']';
        } else {
            idx = linkref.indexOf(v);
            if (idx >= 0) {
                v = '[reference to sibling array --> ' + linkrefpath[idx] + ', length = ' + v.length + ']';
            } else {
                cycleref.push(v);
                cyclerefpath.push(breadcrumbs.join('.'));
                linkref.push(v);
                linkrefpath.push(breadcrumbs.join('.'));

                v = treat_error_infos_array(v);

                cycleref.pop();
                cyclerefpath.pop();
            }
        }
    } else if (v) {
        v = treat_object(v);
    }
    return v;
}

function treat_error_infos_array(arr) {
    let inf = arr.slice();
    trim_array_tail(inf);
    for (let key = 0, len = inf.length; key < len; key++) {
        let err = inf[key];
        if (err) {
            breadcrumbs.push('[' + key + ']');

            err = treat_object(err);

            if (typeof err === 'object') {
                if (err.lexer) {
                    err.lexer = '[lexer]';
                }
                if (err.parser) {
                    err.parser = '[parser]';
                }
                trim_array_tail(err.symbol_stack);
                trim_array_tail(err.state_stack);
                trim_array_tail(err.location_stack);
                if (err.value_stack) {
                    breadcrumbs.push('value_stack');
                    err.value_stack = treat_value_stack(err.value_stack);
                    breadcrumbs.pop();
                }
            }

            inf[key] = err;

            breadcrumbs.pop();
        }
    }
    return inf;
}

function treat_lexer(l) {
    // shallow copy object:
    l = shallow_copy(l);
    delete l.simpleCaseActionClusters;
    delete l.rules;
    delete l.conditions;
    delete l.__currentRuleSet__;

    if (l.__error_infos) {
        breadcrumbs.push('__error_infos');
        l.__error_infos = treat_value_stack(l.__error_infos);
        breadcrumbs.pop();
    }

    return l;
}

function treat_parser(p) {
    // shallow copy object:
    p = shallow_copy(p);
    delete p.productions_;
    delete p.table;
    delete p.defaultActions;

    if (p.__error_infos) {
        breadcrumbs.push('__error_infos');
        p.__error_infos = treat_value_stack(p.__error_infos);
        breadcrumbs.pop();
    }

    if (p.__error_recovery_infos) {
        breadcrumbs.push('__error_recovery_infos');
        p.__error_recovery_infos = treat_value_stack(p.__error_recovery_infos);
        breadcrumbs.pop();
    }

    if (p.lexer) {
        breadcrumbs.push('lexer');
        p.lexer = treat_lexer(p.lexer);
        breadcrumbs.pop();
    }

    return p;
}

function treat_hash(h) {
    // shallow copy object:
    h = shallow_copy(h);

    if (h.parser) {
        breadcrumbs.push('parser');
        h.parser = treat_parser(h.parser);
        breadcrumbs.pop();
    }

    if (h.lexer) {
        breadcrumbs.push('lexer');
        h.lexer = treat_lexer(h.lexer);
        breadcrumbs.push();
    }

    return h;
}

function treat_error_report_info(e) {
    // shallow copy object:
    e = shallow_copy(e);

    if (e.hash) {
        breadcrumbs.push('hash');
        e.hash = treat_hash(e.hash);
        breadcrumbs.pop();
    }

    if (e.parser) {
        breadcrumbs.push('parser');
        e.parser = treat_parser(e.parser);
        breadcrumbs.pop();
    }

    if (e.lexer) {
        breadcrumbs.push('lexer');
        e.lexer = treat_lexer(e.lexer);
        breadcrumbs.pop();
    }

    if (e.__error_infos) {
        breadcrumbs.push('__error_infos');
        e.__error_infos = treat_value_stack(e.__error_infos);
        breadcrumbs.pop();
    }

    if (e.__error_recovery_infos) {
        breadcrumbs.push('__error_recovery_infos');
        e.__error_recovery_infos = treat_value_stack(e.__error_recovery_infos);
        breadcrumbs.pop();
    }

    trim_array_tail(e.symbol_stack);
    trim_array_tail(e.state_stack);
    trim_array_tail(e.location_stack);
    if (e.value_stack) {
        breadcrumbs.push('value_stack');
        e.value_stack = treat_value_stack(e.value_stack);
        breadcrumbs.pop();
    }

    for (let key in e) {
        switch (key) {
        case 'hash':
        case 'parser':
        case 'lexer':
        case '__error_infos':
        case '__error_recovery_infos':
        case 'symbol_stack':
        case 'state_stack':
        case 'location_stack':
        case 'value_stack':
            break;

        default:
            if (e[key] && typeof e[key] === 'object') {
                breadcrumbs.push(key);
                e[key] = treat_object(e[key]);
                breadcrumbs.pop();
            }
            break;
        }
    }

    return e;
}

function treat_object(e) {
    if (e) {
        if (e instanceof Array) {
            e = e.slice();
            for (let key in e) {
                breadcrumbs.push('[' + key + ']');
                e[key] = treat_object(e[key]);
                breadcrumbs.pop();
            }
        } else if (typeof e === 'object') {
            let idx = cycleref.indexOf(e);
            if (idx >= 0) {
                // cyclic reference, most probably an error instance.
                // we still want it to be READABLE in a way, though:
                e = shallow_copy_and_strip_depth(e, cyclerefpath[idx]);
            } else {
                idx = linkref.indexOf(e);
                if (idx >= 0) {
                    e = '[reference to sibling --> ' + linkrefpath[idx] + ']';
                } else {
                    cycleref.push(e);
                    cyclerefpath.push(breadcrumbs.join('.'));
                    linkref.push(e);
                    linkrefpath.push(breadcrumbs.join('.'));

                    e = treat_error_report_info(e);

                    cycleref.pop();
                    cyclerefpath.pop();
                }
            }
        }
    }
    return e;
}


// strip off large chunks from the Error exception object before
// it will be fed to a test log or other output.
//
// Internal use in the unit test rigs.
function trimErrorForTestReporting(e) {
    cycleref.length = 0;
    cyclerefpath.length = 0;
    linkref.length = 0;
    linkrefpath.length = 0;
    breadcrumbs = [ '*' ];

    if (e) {
        e = treat_object(e);
    }

    cycleref.length = 0;
    cyclerefpath.length = 0;
    linkref.length = 0;
    linkrefpath.length = 0;
    breadcrumbs = [ '*' ];

    return e;
}

function findSymbolTable(o, sectionName) {
    if (o) {
        let s = o[sectionName];
        if (s && typeof s === 'object' && Object.keys(s).length > 0) {
            return s;
        }
        for (let key in o) {
            let rv = findSymbolTable(o[key]);
            if (rv) return rv;
        }
    }
    return null;
}


function extractSymbolTableFromFile(filepath, sectionName) {
    let source;
    let import_error;
    let predefined_symbols;

    sectionName = sectionName || 'symbols_';

    try {
        filepath = path__default['default'].resolve(filepath);

        source = fs__default['default'].readFileSync(filepath, 'utf8');
        // It's either a JSON file or a JISON generated output file:
        //
        //     symbols_: {
        //       "symbol": ID, ...
        //     },
        try {
            let obj = JSON5__default['default'].parse(source);

            // two options: 
            // 
            // 1. symbol table is part of a larger JSON5 file
            // 2. JSON5 file specifies the symbol table only & directly,
            //    i.e. no 'symbols_:' prelude.
            let s = findSymbolTable(obj, sectionName);
            if (!s && obj && typeof obj === 'object' && Object.keys(obj).length > 0) {
                s = obj;
            }
            if (!s) {
                throw new Error(`No symbol table named '${sectionName}' found in the JSON5 file '${filepath}'.`);
            }
            predefined_symbols = s;
        } catch (ex) {
            import_error = ex;

            // attempt to read the file as a JISON-generated parser source instead:
            try {
            	let re = new RegExp(`[\\r\\n](\\s*["']?${sectionName}["']?:\\s*\\{[\\s\\S]*?\\}),?\\s*[\\r\\n]`);
                let m = re.exec(source);
            	//console.error("extractSymbolTableFromFile REGEX match:", {re, m: m && m[1]});
                if (m && m[1]) {
                    source = `
                        {
                            // content extracted from file:
                            ${m[1]}
                        }
                    `;
                    let obj = JSON5__default['default'].parse(source);
                    let s = findSymbolTable(obj, sectionName);
                    if (!s) {
                        // let this error override anything that came before:
                        import_error = null;
                        throw new Error(`No symbol table found in the extracted '${sectionName}' section of file '${filepath}'.`);
                    }
                    predefined_symbols = s;
                    import_error = null;
                } else {
                    throw new Error(`No potential '${sectionName}' symbol table section found in the file '${filepath}'.`);
                }
            } catch (ex2) {
                if (!import_error) {
                    import_error = ex2;
                }
            }
        }
    } catch (ex3) {
        import_error = ex3;
    }

    assert__default['default'](predefined_symbols ? !import_error : import_error);
    if (import_error) {
        throw new Error((rmCommonWS$1`
            Error: '%import symbols <path>' must point to either a JSON file containing 
            a symbol table (hash table) or a previously generated JISON JavaScript file, 
            which contains such a symbol table.

            Expected file format: 
            It's either a JSON file or a JISON generated output file, which contains 
            a section like this:

                ${sectionName}: {
                    "symbol": ID, 
                    ...
                }

            Reported error:
                ${import_error}
        `).trim(), import_error);
    }
    assert__default['default'](predefined_symbols);
    assert__default['default'](typeof predefined_symbols === 'object');
    return predefined_symbols;
}

var helpers = {
    rmCommonWS: rmCommonWS$1,
    camelCase,
    mkIdentifier,
    isLegalIdentifierInput,
    scanRegExp,
    dquote: dquote$1,
    trimErrorForTestReporting,
    stripErrorStackPaths,
    cleanStackTrace4Comparison,
    extractSymbolTableFromFile,

    checkRegExp: reHelpers.checkRegExp,
    getRegExpInfo: reHelpers.getRegExpInfo,

    exec: exec.exec,
    dump: exec.dump,
    convertExceptionToObject: exec.convertExceptionToObject,

    mkdirp,

    generateMapper4JisonGrammarIdentifiers: parse2AST.generateMapper4JisonGrammarIdentifiers,
    parseCodeChunkToAST: parse2AST.parseCodeChunkToAST,
    //compileCodeToES5: parse2AST.compileCodeToES5,
    prettyPrintAST: parse2AST.prettyPrintAST,
    checkActionBlock: parse2AST.checkActionBlock,
    trimActionCode: parse2AST.trimActionCode,
    braceArrowActionCode: parse2AST.braceArrowActionCode,

    ID_REGEX_BASE: parse2AST.ID_REGEX_BASE,
    IN_ID_CHARSET: parse2AST.IN_ID_CHARSET,

    printFunctionSourceCode: stringifier.printFunctionSourceCode,
    printFunctionSourceCodeContainer: stringifier.printFunctionSourceCodeContainer,

    detectIstanbulGlobal
};

// See also:
// http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript/#35881508
// but we keep the prototype.constructor and prototype.name assignment lines too for compatibility
// with userland code which might access the derived class in a 'classic' way.
function JisonParserError(msg, hash) {
    Object.defineProperty(this, 'name', {
        enumerable: false,
        writable: false,
        value: 'JisonParserError'
    });

    if (msg == null) msg = '???';

    Object.defineProperty(this, 'message', {
        enumerable: false,
        writable: true,
        value: msg
    });

    this.hash = hash;

    let stacktrace;
    if (hash && hash.exception instanceof Error) {
        let ex2 = hash.exception;
        this.message = ex2.message || msg;
        stacktrace = ex2.stack;
    }
    if (!stacktrace) {
        if (Error.hasOwnProperty('captureStackTrace')) {        // V8/Chrome engine
            Error.captureStackTrace(this, this.constructor);
        } else {
            stacktrace = (new Error(msg)).stack;
        }
    }
    if (stacktrace) {
        Object.defineProperty(this, 'stack', {
            enumerable: false,
            writable: false,
            value: stacktrace
        });
    }
}

if (typeof Object.setPrototypeOf === 'function') {
    Object.setPrototypeOf(JisonParserError.prototype, Error.prototype);
} else {
    JisonParserError.prototype = Object.create(Error.prototype);
}
JisonParserError.prototype.constructor = JisonParserError;
JisonParserError.prototype.name = 'JisonParserError';




        // helper: reconstruct the productions[] table
        function bp(s) {
            let rv = [];
            let p = s.pop;
            let r = s.rule;
            for (let i = 0, l = p.length; i < l; i++) {
                rv.push([
                    p[i],
                    r[i]
                ]);
            }
            return rv;
        }
    


        // helper: reconstruct the defaultActions[] table
        function bda(s) {
            let rv = {};
            let d = s.idx;
            let g = s.goto;
            for (let i = 0, l = d.length; i < l; i++) {
                let j = d[i];
                rv[j] = g[i];
            }
            return rv;
        }
    


        // helper: reconstruct the 'goto' table
        function bt(s) {
            let rv = [];
            let d = s.len;
            let y = s.symbol;
            let t = s.type;
            let a = s.state;
            let m = s.mode;
            let g = s.goto;
            for (let i = 0, l = d.length; i < l; i++) {
                let n = d[i];
                let q = {};
                for (let j = 0; j < n; j++) {
                    let z = y.shift();
                    switch (t.shift()) {
                    case 2:
                        q[z] = [
                            m.shift(),
                            g.shift()
                        ];
                        break;

                    case 0:
                        q[z] = a.shift();
                        break;

                    default:
                        // type === 1: accept
                        q[z] = [
                            3
                        ];
                    }
                }
                rv.push(q);
            }
            return rv;
        }
    


        // helper: runlength encoding with increment step: code, length: step (default step = 0)
        // `this` references an array
        function s(c, l, a) {
            a = a || 0;
            for (let i = 0; i < l; i++) {
                this.push(c);
                c += a;
            }
        }

        // helper: duplicate sequence from *relative* offset and length.
        // `this` references an array
        function c(i, l) {
            i = this.length - i;
            for (l += i; i < l; i++) {
                this.push(this[i]);
            }
        }

        // helper: unpack an array using helpers and data, all passed in an array argument 'a'.
        function u(a) {
            let rv = [];
            for (let i = 0, l = a.length; i < l; i++) {
                let e = a[i];
                // Is this entry a helper function?
                if (typeof e === 'function') {
                    i++;
                    e.apply(rv, a[i]);
                } else {
                    rv.push(e);
                }
            }
            return rv;
        }
    

let parser = {
    // Code Generator Information Report
    // ---------------------------------
    //
    // Options:
    //
    //   default action mode: ............. ["skip","merge"]
    //   test-compile action mode: ........ "parser:*,lexer:*"
    //   try..catch: ...................... true
    //   default resolve on conflict: ..... true
    //   on-demand look-ahead: ............ false
    //   error recovery token skip maximum: 3
    //   yyerror in parse actions is: ..... NOT recoverable,
    //   yyerror in lexer actions and other non-fatal lexer are:
    //   .................................. NOT recoverable,
    //   debug grammar/output: ............ false
    //   has partial LR conflict upgrade:   true
    //   rudimentary token-stack support:   false
    //   parser table compression mode: ... 2
    //   export debug tables: ............. false
    //   export *all* tables: ............. false
    //   module type: ..................... es
    //   parser engine type: .............. lalr
    //   output main() in the module: ..... true
    //   has user-specified main(): ....... false
    //   has user-specified require()/import modules for main():
    //   .................................. false
    //   number of expected conflicts: .... 0
    //
    //
    // Parser Analysis flags:
    //
    //   no significant actions (parser is a language matcher only):
    //   .................................. false
    //   uses yyleng: ..................... false
    //   uses yylineno: ................... false
    //   uses yytext: ..................... false
    //   uses yylloc: ..................... false
    //   uses ParseError API: ............. false
    //   uses YYERROR: .................... true
    //   uses YYRECOVERING: ............... false
    //   uses YYERROK: .................... false
    //   uses YYCLEARIN: .................. false
    //   tracks rule values: .............. true
    //   assigns rule values: ............. true
    //   uses location tracking: .......... true
    //   assigns location: ................ true
    //   uses yystack: .................... false
    //   uses yysstack: ................... false
    //   uses yysp: ....................... true
    //   uses yyrulelength: ............... false
    //   uses yyMergeLocationInfo API: .... true
    //   has error recovery: .............. true
    //   has error reporting: ............. true
    //
    // --------- END OF REPORT -----------

trace: function no_op_trace() { },
JisonParserError: JisonParserError,
yy: {},
options: {
  type: "lalr",
  hasPartialLrUpgradeOnConflict: true,
  errorRecoveryTokenDiscardCount: 3,
  ebnf: true
},
symbols_: {
  "$": 16,
  "$accept": 0,
  "$end": 1,
  "%%": 34,
  "(": 8,
  ")": 9,
  "*": 11,
  "+": 10,
  ",": 17,
  ".": 14,
  "/": 13,
  "/!": 42,
  "<": 3,
  "=": 18,
  ">": 6,
  "?": 12,
  "ACTION_BODY": 36,
  "ACTION_END": 24,
  "ACTION_START": 26,
  "ACTION_START_AT_SOL": 23,
  "ARROW_ACTION_START": 35,
  "BRACKET_MISSING": 38,
  "BRACKET_SURPLUS": 39,
  "CHARACTER_LIT": 52,
  "DUMMY": 19,
  "EOF": 1,
  "ESCAPED_CHAR": 44,
  "IMPORT": 29,
  "INCLUDE": 31,
  "INCLUDE_PLACEMENT_ERROR": 37,
  "INIT_CODE": 30,
  "INTEGER": 55,
  "MACRO_END": 21,
  "MACRO_NAME": 20,
  "NAME_BRACE": 45,
  "OPTIONS": 28,
  "OPTIONS_END": 22,
  "OPTION_STRING": 53,
  "OPTION_VALUE": 54,
  "RANGE_REGEX": 50,
  "REGEX_SET": 49,
  "REGEX_SET_END": 47,
  "REGEX_SET_START": 46,
  "REGEX_SPECIAL_CHAR": 43,
  "SPECIAL_GROUP": 41,
  "START_EXC": 33,
  "START_INC": 32,
  "STRING_LIT": 51,
  "TRAILING_CODE_CHUNK": 56,
  "UNKNOWN_DECL": 27,
  "UNTERMINATED_ACTION_BLOCK": 25,
  "UNTERMINATED_REGEX_SET": 48,
  "UNTERMINATED_STRING_ERROR": 40,
  "^": 15,
  "action": 75,
  "any_group_regex": 83,
  "any_group_regex_option": 97,
  "any_option_value": 92,
  "definition": 61,
  "definitions": 60,
  "epilogue": 93,
  "epilogue_chunk": 95,
  "epilogue_chunks": 94,
  "err": 98,
  "error": 2,
  "import_keyword": 63,
  "include_keyword": 65,
  "include_macro_code": 96,
  "init": 59,
  "init_code_keyword": 64,
  "lex": 57,
  "literal_string": 87,
  "name_expansion": 82,
  "nonempty_regex_list": 79,
  "nonnumeric_option_value": 91,
  "option": 89,
  "option_keyword": 62,
  "option_list": 88,
  "option_name": 90,
  "range_regex": 86,
  "regex": 77,
  "regex_base": 81,
  "regex_concat": 80,
  "regex_list": 78,
  "regex_set": 84,
  "regex_set_atom": 85,
  "rule": 74,
  "rule_block": 73,
  "rules": 71,
  "rules_and_epilogue": 58,
  "scoped_rules_collective": 72,
  "start_conditions": 76,
  "start_conditions_marker": 68,
  "start_epilogue_marker": 70,
  "start_exclusive_keyword": 67,
  "start_inclusive_keyword": 66,
  "start_productions_marker": 69,
  "{": 4,
  "|": 7,
  "}": 5
},
terminals_: {
  1: "EOF",
  2: "error",
  3: "<",
  4: "{",
  5: "}",
  6: ">",
  7: "|",
  8: "(",
  9: ")",
  10: "+",
  11: "*",
  12: "?",
  13: "/",
  14: ".",
  15: "^",
  16: "$",
  17: ",",
  18: "=",
  19: "DUMMY",
  20: "MACRO_NAME",
  21: "MACRO_END",
  22: "OPTIONS_END",
  23: "ACTION_START_AT_SOL",
  24: "ACTION_END",
  25: "UNTERMINATED_ACTION_BLOCK",
  26: "ACTION_START",
  27: "UNKNOWN_DECL",
  28: "OPTIONS",
  29: "IMPORT",
  30: "INIT_CODE",
  31: "INCLUDE",
  32: "START_INC",
  33: "START_EXC",
  34: "%%",
  35: "ARROW_ACTION_START",
  36: "ACTION_BODY",
  37: "INCLUDE_PLACEMENT_ERROR",
  38: "BRACKET_MISSING",
  39: "BRACKET_SURPLUS",
  40: "UNTERMINATED_STRING_ERROR",
  41: "SPECIAL_GROUP",
  42: "/!",
  43: "REGEX_SPECIAL_CHAR",
  44: "ESCAPED_CHAR",
  45: "NAME_BRACE",
  46: "REGEX_SET_START",
  47: "REGEX_SET_END",
  48: "UNTERMINATED_REGEX_SET",
  49: "REGEX_SET",
  50: "RANGE_REGEX",
  51: "STRING_LIT",
  52: "CHARACTER_LIT",
  53: "OPTION_STRING",
  54: "OPTION_VALUE",
  55: "INTEGER",
  56: "TRAILING_CODE_CHUNK"
},
terminal_descriptions_: {
  45: "macro name in '{...}' curly braces"
},
TERROR: 2,
    EOF: 1,

    // internals: defined here so the object *structure* doesn't get modified by parse() et al,
    // thus helping JIT compilers like Chrome V8.
    originalQuoteName: null,
    originalParseError: null,
    cleanupAfterParse: null,
    constructParseErrorInfo: null,
    yyMergeLocationInfo: null,
    copy_yytext: null,
    copy_yylloc: null,

    __reentrant_call_depth: 0,      // INTERNAL USE ONLY
    __error_infos: [],              // INTERNAL USE ONLY: the set of parseErrorInfo objects created since the last cleanup
    __error_recovery_infos: [],     // INTERNAL USE ONLY: the set of parseErrorInfo objects created since the last cleanup

    // APIs which will be set up depending on user action code analysis:
    //yyRecovering: 0,
    //yyErrOk: 0,
    //yyClearIn: 0,

    // Helper APIs
    // -----------

    // Helper function which can be overridden by user code later on: put suitable quotes around
    // literal IDs in a description string.
    quoteName: function parser_quoteName(id_str) {
        return '"' + id_str + '"';
    },

    // Return the name of the given symbol (terminal or non-terminal) as a string, when available.
    //
    // Return NULL when the symbol is unknown to the parser.
    getSymbolName: function parser_getSymbolName(symbol) {
        if (this.terminals_[symbol]) {
            return this.terminals_[symbol];
        }

        // Otherwise... this might refer to a RULE token i.e. a non-terminal: see if we can dig that one up.
        //
        // An example of this may be where a rule's action code contains a call like this:
        //
        //      parser.getSymbolName(#$)
        //
        // to obtain a human-readable name of the current grammar rule.
        const s = this.symbols_;
        for (let key in s) {
            if (s[key] === symbol) {
                return key;
            }
        }
        return null;
    },

    // Return a more-or-less human-readable description of the given symbol, when available,
    // or the symbol itself, serving as its own 'description' for lack of something better to serve up.
    //
    // Return NULL when the symbol is unknown to the parser.
    describeSymbol: function parser_describeSymbol(symbol) {
        if (symbol !== this.EOF && this.terminal_descriptions_ && this.terminal_descriptions_[symbol]) {
            return this.terminal_descriptions_[symbol];
        } else if (symbol === this.EOF) {
            return 'end of input';
        }

        let id = this.getSymbolName(symbol);
        if (id) {
            return this.quoteName(id);
        }
        return null;
    },

    // Produce a (more or less) human-readable list of expected tokens at the point of failure.
    //
    // The produced list may contain token or token set descriptions instead of the tokens
    // themselves to help turning this output into something that easier to read by humans
    // unless `do_not_describe` parameter is set, in which case a list of the raw, *numeric*,
    // expected terminals and nonterminals is produced.
    //
    // The returned list (array) will not contain any duplicate entries.
    collect_expected_token_set: function parser_collect_expected_token_set(state, do_not_describe) {
        const TERROR = this.TERROR;
        let tokenset = [];
        let check = {};

        // Has this (error?) state been outfitted with a custom expectations description text for human consumption?
        // If so, use that one instead of the less palatable token set.
        if (!do_not_describe && this.state_descriptions_ && this.state_descriptions_[state]) {
            return [
                this.state_descriptions_[state]
            ];
        }
        for (let p in this.table[state]) {
            p = +p;
            if (p !== TERROR) {
                let d = do_not_describe ? p : this.describeSymbol(p);
                if (d && !check[d]) {
                    tokenset.push(d);
                    check[d] = true;        // Mark this token description as already mentioned to prevent outputting duplicate entries.
                }
            }
        }
        return tokenset;
    },
productions_: bp({
  pop: u([
  57,
  s,
  [58, 4],
  59,
  60,
  60,
  s,
  [61, 21],
  s,
  [62, 10, 1],
  71,
  71,
  s,
  [72, 5],
  73,
  73,
  s,
  [74, 17],
  s,
  [75, 7],
  76,
  76,
  77,
  78,
  78,
  s,
  [79, 5],
  80,
  80,
  s,
  [81, 18],
  82,
  s,
  [83, 4],
  84,
  84,
  85,
  85,
  86,
  87,
  87,
  s,
  [88, 4],
  s,
  [89, 3],
  90,
  90,
  91,
  91,
  92,
  92,
  s,
  [93, 3],
  94,
  94,
  s,
  [95, 5],
  96,
  96,
  97,
  97,
  98,
  98
]),
  rule: u([
  4,
  s,
  [3, 3],
  0,
  0,
  2,
  0,
  3,
  2,
  3,
  2,
  c,
  [4, 3],
  1,
  2,
  2,
  3,
  3,
  2,
  1,
  3,
  3,
  6,
  5,
  5,
  3,
  s,
  [1, 10],
  2,
  2,
  0,
  2,
  4,
  c,
  [43, 3],
  2,
  0,
  s,
  [4, 3],
  s,
  [3, 3],
  c,
  [41, 5],
  c,
  [27, 8],
  s,
  [2, 4],
  0,
  4,
  c,
  [46, 3],
  c,
  [69, 3],
  c,
  [21, 3],
  c,
  [62, 4],
  c,
  [34, 3],
  s,
  [2, 4],
  c,
  [12, 3],
  s,
  [1, 7],
  c,
  [93, 4],
  c,
  [13, 7],
  c,
  [95, 3],
  5,
  c,
  [35, 3],
  s,
  [1, 6],
  0,
  c,
  [72, 4],
  c,
  [18, 3],
  c,
  [23, 4],
  0,
  c,
  [14, 3]
])
}),
performAction: function parser__PerformAction(yyloc, yystate /* action[1] */, yysp, yyvstack, yylstack) {

          /* this == yyval */

          // the JS engine itself can go and remove these statements when `yy` turns out to be unused in any action code!
          let yy = this.yy;
          let yyparser = yy.parser;
          let yylexer = yy.lexer;

          const OPTION_DOES_NOT_ACCEPT_VALUE = 0x0001;
    const OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES = 0x0002;
    const OPTION_ACCEPTS_000_IDENTIFIER_NAMES = 0x0004;    
    // ^^^ extension of OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES: '8bit', etc. is a 'legal' identifier now too, but '42' (pure number) is not!
    const OPTION_ALSO_ACCEPTS_STAR_AS_IDENTIFIER_NAME = 0x0008;
    const OPTION_DOES_NOT_ACCEPT_MULTIPLE_OPTIONS = 0x0010;
    const OPTION_DOES_NOT_ACCEPT_COMMA_SEPARATED_OPTIONS = 0x0020;

          switch (yystate) {
case 0:
    /*! Production::    $accept : lex $end */

    // default action (generated by JISON mode skip/merge :: 1/2,VT,VA,-,-,LT,LA,-,-):
    this._$ = yylstack[yysp - 1];
    // END of default action (generated by JISON mode skip/merge :: 1/2,VT,VA,-,-,LT,LA,-,-)
    break;

case 1:
    /*! Production::    lex : init definitions rules_and_epilogue EOF */

    // default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 3, yysp);
    // END of default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    this.$ = Object.assign(yyvstack[yysp - 1], yyvstack[yysp - 2]);
    
    // if there are any options, add them all, otherwise set options to NULL:
    // can't check for 'empty object' by `if (yy.options) ...` so we do it this way:
    for (let key in yy.options) {
      this.$.options = yy.options;
      break;
    }
    
    if (yy.actionInclude) {
      let asrc = yy.actionInclude.join('\n\n');
      // Only a non-empty action code chunk should actually make it through:
      if (asrc.trim() !== '') {
        this.$.actionInclude = asrc;
      }
    }
    
    delete yy.options;
    delete yy.actionInclude;
    return this.$
    }

case 2:
    /*! Production::    rules_and_epilogue : start_productions_marker rules epilogue */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    if (yyvstack[yysp]) {
        this.$ = { rules: yyvstack[yysp - 1], moduleInclude: yyvstack[yysp] };
    } else {
        this.$ = { rules: yyvstack[yysp - 1] };
    }
    yy.popContext('Line 77');
    break;

case 3:
    /*! Production::    rules_and_epilogue : start_productions_marker error epilogue */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        There's probably an error in one or more of your lexer regex rules.
        The lexer rule spec should have this structure:
    
                regex  action_code
    
        where 'regex' is a lex-style regex expression (see the
        jison and jison-lex documentation) which is intended to match a chunk
        of the input to lex, while the 'action_code' block is the JS code
        which will be invoked when the regex is matched. The 'action_code' block
        may be any (indented!) set of JS statements, optionally surrounded
        by '{...}' curly braces or otherwise enclosed in a '%{...%}' block.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp - 1].errStr}
    `);
    yy.popContext('Line 100');
    this.$ = { rules: [] };
    break;

case 4:
    /*! Production::    rules_and_epilogue : start_productions_marker DUMMY error */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        There's probably an error in one or more of your lexer regex rules.
        There's an error in your lexer regex rules section.
        Maybe you did not correctly separate the lexer sections with
        a '%%' on an otherwise empty line? Did you correctly
        delimit every rule's action code block?
        The lexer spec file should have this structure:
    
            definitions
            %%
            rules
            %%                  // <-- only needed if ...
            extra_module_code   // <-- ... epilogue is present.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    yy.popContext('Line 125');
    this.$ = { rules: [] };
    break;

case 5:
    /*! Production::    rules_and_epilogue : %epsilon */

    // default action (generated by JISON mode skip/merge :: 0/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(null, null, null, null, true);
    // END of default action (generated by JISON mode skip/merge :: 0/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = { rules: [] };
    break;

case 6:
    /*! Production::    init : %epsilon */

    // default action (generated by JISON mode skip/merge :: 0/1,VT,VA,-,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(null, null, null, null, true);
    // END of default action (generated by JISON mode skip/merge :: 0/1,VT,VA,-,-,LT,LA,-,-)
    
    
    {
    yy.actionInclude = [];
    if (!yy.options) yy.options = {};
    
    // Store the `%s` and `%x` condition states in `yy` to ensure the rules section of the
    // lex language parser can reach these and use them for validating whether the lexer
    // rules written by the user actually reference *known* condition states.
    yy.startConditions = {};            // hash table
    
    // The next attribute + API set is a 'lexer/parser hack' in the sense that
    // it assumes zero look-ahead at some points during the parse
    // when a parser rule production's action code pushes or pops a value
    // on/off the context description stack to help the lexer produce
    // better informing error messages in case of a subsequent lexer
    // fail.
    yy.__options_flags__ = 0;
    yy.__options_category_description__ = '???';
    yy.__inside_scoped_ruleset__ = false;
    
    yy.__context_cfg_stack__ = [];
    
    yy.pushContext = function () {
        yy.__context_cfg_stack__.push({
            flags: yy.__options_flags__,
            descr: yy.__options_category_description__,
            scoped: yy.__inside_scoped_ruleset__,
        });
    };
    yy.popContext = function (msg) {
        if (yy.__context_cfg_stack__.length >= 1) {
            let r = yy.__context_cfg_stack__.pop();
    
            yy.__options_flags__ = r.flags;
            yy.__options_category_description__ = r.descr;
            yy.__inside_scoped_ruleset__ = r.scoped;
        } else {
            yyparser.yyError('__context_cfg_stack__ stack depleted! Contact a developer! ' + msg);
        }
    };
    yy.getContextDepth = function () {
        return yy.__context_cfg_stack__.length;
    };
    yy.restoreContextDepth = function (depth) {
        if (depth > yy.__context_cfg_stack__.length) {
            yyparser.yyError(`__context_cfg_stack__ stack CANNOT be reset to depth ${depth} as it is too shallow already: actual depth is ${yy.__context_cfg_stack__.length}. Contact a developer!`);
        } else {
            yy.__context_cfg_stack__.length = depth;
        }
    };
    }
    break;

case 7:
    /*! Production::    definitions : definitions definition */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    this.$ = yyvstack[yysp - 1];
    if (yyvstack[yysp]) {
        switch (yyvstack[yysp].type) {
        case 'macro':
            this.$.macros[yyvstack[yysp].name] = yyvstack[yysp].body;
            break;
    
        case 'names':
            let condition_defs = yyvstack[yysp].names;
            for (let i = 0, len = condition_defs.length; i < len; i++) {
                let name = condition_defs[i][0];
                if (name in this.$.startConditions && this.$.startConditions[name] !== condition_defs[i][1]) {
                    yyparser.yyError(rmCommonWS$2`
                        You have specified the lexer condition state '${name}' as both
                        EXCLUSIVE ('%x') and INCLUSIVE ('%s'). Pick one, please, e.g.:
    
                            %x ${name}
                            %%
                            <${name}>LEXER_RULE_REGEX    return 'TOK';
    
                          Erroneous code:
                        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
                    `);
                }
                this.$.startConditions[name] = condition_defs[i][1];     // flag as 'exclusive'/'inclusive'
            }
    
            // and update the `yy.startConditions` hash table as well, so we have a full set
            // by the time this parser arrives at the lexer rules in the input-to-parse:
            yy.startConditions = this.$.startConditions;
            break;
    
        case 'unknown':
            this.$.unknownDecls.push(yyvstack[yysp].body);
            break;
    
        case 'imports':
            this.$.importDecls.push(yyvstack[yysp].body);
            break;
    
        case 'codeSection':
            this.$.codeSections.push(yyvstack[yysp].body);
            break;
    
        default:
            yyparser.yyError(rmCommonWS$2`
              Encountered an unsupported definition type: ${yyvstack[yysp].type}.
    
                Erroneous area:
              ${yylexer.prettyPrintRange(yylstack[yysp])}
            `);
            break;
        }
    }
    }
    break;

case 8:
    /*! Production::    definitions : %epsilon */

    // default action (generated by JISON mode skip/merge :: 0/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(null, null, null, null, true);
    // END of default action (generated by JISON mode skip/merge :: 0/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = {
      macros: {},           // { hash table }
      startConditions: {},  // { hash table }
      codeSections: [],     // [ array of {qualifier,include} pairs ]
      importDecls: [],      // [ array of {name,path} pairs ]
      unknownDecls: []      // [ array of {name,value} pairs ]
    };
    break;

case 9:
    /*! Production::    definition : MACRO_NAME regex MACRO_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    // Note: make sure we don't try re-define/override any XRegExp `\p{...}` or `\P{...}`
    // macros here:
    if (XRegExp__default['default']._getUnicodeProperty(yyvstack[yysp - 2])) {
        // Work-around so that you can use `\p{ascii}` for a XRegExp slug, a.k.a.
        // Unicode 'General Category' Property cf. http://unicode.org/reports/tr18/#Categories,
        // while using `\p{ASCII}` as a *macro expansion* of the `ASCII`
        // macro:
        if (yyvstack[yysp - 2].toUpperCase() !== yyvstack[yysp - 2]) {
            yyparser.yyError(rmCommonWS$2`
              Cannot use name "${$MACRO_NAME}" as a macro name
              as it clashes with the same XRegExp "\\p{..}" Unicode \'General Category\'
              Property name.
              Use all-uppercase macro names, e.g. name your macro
              "${$MACRO_NAME.toUpperCase()}" to work around this issue
              or give your offending macro a different name.
    
                Erroneous area:
              ${yylexer.prettyPrintRange(yylstack[yysp - 2])}
            `);
        }
    }
    
    this.$ = {
        type: 'macro',
        name: yyvstack[yysp - 2],
        body: yyvstack[yysp - 1]
    };
    break;

case 10:
    /*! Production::    definition : MACRO_NAME error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        ill defined macro definition.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    this.$ = null;
    break;

case 11:
    /*! Production::    definition : start_inclusive_keyword option_list OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let lst = yyvstack[yysp - 1];
    for (let i = 0, len = lst.length; i < len; i++) {
        lst[i][1] = 0;     // flag as 'inclusive'
    }
    
    yy.popContext('Line 326');
    
    this.$ = {
        type: 'names',
        names: lst         // 'inclusive' conditions have value 0, 'exclusive' conditions have value 1
    };
    }
    break;

case 12:
    /*! Production::    definition : start_inclusive_keyword error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        ill defined '%s' inclusive lexer condition set specification.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    yy.popContext('Line 348');
    this.$ = null;
    break;

case 13:
    /*! Production::    definition : start_exclusive_keyword option_list OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let lst = yyvstack[yysp - 1];
    for (let i = 0, len = lst.length; i < len; i++) {
        lst[i][1] = 1;     // flag as 'exclusive'
    }
    
    yy.popContext('Line 363');
    
    this.$ = {
        type: 'names',
        names: lst         // 'inclusive' conditions have value 0, 'exclusive' conditions have value 1
    };
    }
    break;

case 14:
    /*! Production::    definition : start_exclusive_keyword error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        ill defined '%x' exclusive lexer condition set specification.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    yy.popContext('Line 385');
    this.$ = null;
    break;

case 15:
    /*! Production::    definition : ACTION_START_AT_SOL action ACTION_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let srcCode = trimActionCode$1(yyvstack[yysp - 1] + yyvstack[yysp], {
        startMarker: yyvstack[yysp - 2]
    });
    if (srcCode) {
        let rv = checkActionBlock$1(srcCode, yylstack[yysp - 1], yy);
        if (rv) {
            yyparser.yyError(rmCommonWS$2`
                The '%{...%}' lexer setup action code section does not compile: ${rv}
    
                  Erroneous area:
                ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2])}
            `);
        }
        yy.actionInclude.push(srcCode);
    }
    this.$ = null;
    }
    break;

case 16:
    /*! Production::    definition : UNTERMINATED_ACTION_BLOCK */
case 57:
    /*! Production::    rule : UNTERMINATED_ACTION_BLOCK */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    // The issue has already been reported by the lexer. No need to repeat
    // ourselves with another error report from here.
    this.$ = null;
    break;

case 17:
    /*! Production::    definition : ACTION_START_AT_SOL error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        There's very probably a problem with this '%{...%}' lexer setup action code section.
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    this.$ = null;
    break;

case 18:
    /*! Production::    definition : ACTION_START error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let start_marker = yyvstack[yysp - 1].trim();
    let marker_msg = (start_marker ? ' or similar, such as ' + start_marker : '');
    yyparser.yyError(rmCommonWS$2`
        The '%{...%}' lexer setup action code section MUST have its action
        block start marker (\`%{\`${marker_msg}) positioned
        at the start of a line to be accepted: *indented* action code blocks
        (such as this one) are always related to an immediately preceding lexer spec item,
        e.g. a lexer match rule expression (see 'lexer rules').
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    this.$ = null;
    }
    break;

case 19:
    /*! Production::    definition : option_keyword option_list OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let lst = yyvstack[yysp - 1];
    // Apply the %option to the current lexing process immediately, as it MAY
    // impact the lexer's behaviour, e.g. `%option do-not-test-compile`
    for (let i = 0, len = lst.length; i < len; i++) {
        yy.options[lst[i][0]] = lst[i][1];
    }
    yy.popContext('Line 485');
    this.$ = null;
    }
    break;

case 20:
    /*! Production::    definition : option_keyword error OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        ill defined '${yyvstack[yysp - 2]} line.
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2], yylstack[yysp])}
    
          Technical error report:
        ${yyvstack[yysp - 1].errStr}
    `);
    yy.popContext('Line 503');
    this.$ = null;
    break;

case 21:
    /*! Production::    definition : option_keyword error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    // TODO ...
    yyparser.yyError(rmCommonWS$2`
        ${yyvstack[yysp - 1]} don't seem terminated?
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    yy.popContext('Line 518');
    this.$ = null;
    break;

case 22:
    /*! Production::    definition : UNKNOWN_DECL */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = {
        type: 'unknown',
        body: yyvstack[yysp]
    };
    break;

case 23:
    /*! Production::    definition : import_keyword option_list OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    // check if there are two unvalued options: 'name path'
    let lst = yyvstack[yysp - 1];
    let len = lst.length;
    let body;
    if (len === 2 && lst[0][1] === true && lst[1][1] === true) {
        // `name path`:
        body = {
            name: lst[0][0],
            path: lst[1][0]
        };
    } else if (len <= 2) {
        yyparser.yyError(rmCommonWS$2`
            You did not specify a legal qualifier name and/or file path for the '%import' statement, which must have the format:
                %import qualifier_name file_path
    
              Erroneous code:
            ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2])}
        `);
    } else {
        yyparser.yyError(rmCommonWS$2`
            You did specify too many attributes for the '%import' statement, which must have the format:
                %import qualifier_name file_path
    
              Erroneous code:
            ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2])}
        `);
    }
    
    yy.popContext('Line 558');
    
    this.$ = {
        type: 'imports',
        body: body
    };
    }
    break;

case 24:
    /*! Production::    definition : import_keyword error OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        %import name or source filename missing maybe?
    
        Note: each '%import' must be qualified by a name, e.g. 'required' before the import path itself:
            %import qualifier_name file_path
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2])}
    
          Technical error report:
        ${yyvstack[yysp - 1].errStr}
    `);
    yy.popContext('Line 579');
    this.$ = null;
    break;

case 25:
    /*! Production::    definition : init_code_keyword option_list ACTION_START action ACTION_END OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 6/6,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 5, yysp);
    // END of default action (generated by JISON mode skip/merge :: 6/6,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    // check there's only 1 option which is an identifier
    let lst = yyvstack[yysp - 4];
    let len = lst.length;
    let name;
    if (len === 1 && lst[0][1] === true) {
        // `name`:
        name = lst[0][0];
    } else if (len <= 1) {
        yyparser.yyError(rmCommonWS$2`
            You did not specify a legal qualifier name for the '%code' initialization code statement, which must have the format:
                %code qualifier_name %{...code...%}
    
              Erroneous code:
            ${yylexer.prettyPrintRange(yylstack[yysp - 4], yylstack[yysp - 5])}
        `);
    } else {
        yyparser.yyError(rmCommonWS$2`
            You did specify too many attributes for the '%code' initialization code statement, which must have the format:
                %code qualifier_name %{...code...%}
    
              Erroneous code:
            ${yylexer.prettyPrintRange(yylstack[yysp - 4], yylstack[yysp - 5])}
        `);
    }
    
    let srcCode = trimActionCode$1(yyvstack[yysp - 2] + yyvstack[yysp - 1], {
        startMarker: yyvstack[yysp - 3]
    });
    let rv = checkActionBlock$1(srcCode, yylstack[yysp - 2], yy);
    if (rv) {
        yyparser.yyError(rmCommonWS$2`
            The '%code ${name}' initialization section's action code block does not compile: ${rv}
    
              Erroneous area:
            ${yylexer.prettyPrintRange(yylstack[yysp - 2], yylstack[yysp - 5])}
        `);
    }
    
    yy.popContext('Line 622');
    
    this.$ = {
        type: 'codeSection',
        body: {
          qualifier: name,
          include: srcCode
        }
    };
    }
    break;

case 26:
    /*! Production::    definition : init_code_keyword option_list ACTION_START error OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 5/5,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 4, yysp);
    // END of default action (generated by JISON mode skip/merge :: 5/5,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let start_marker = yyvstack[yysp - 2].trim();
    let marker_msg = (start_marker ? ' or similar, such as ' + start_marker : '');
    let end_marker_msg = marker_msg.replace(/\{/g, '}');
    yyparser.yyError(rmCommonWS$2`
        The '%code ID %{...%\}' initialization code section must be properly
        wrapped in block start markers (\`%{\`${marker_msg})
        and matching end markers (\`%}\`${end_marker_msg}). Expected format:
    
            %code qualifier_name {action code}
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 4])}
    
          Technical error report:
        ${yyvstack[yysp - 1].errStr}
    `);
    yy.popContext('Line 650');
    this.$ = null;
    }
    break;

case 27:
    /*! Production::    definition : init_code_keyword error ACTION_START error OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 5/5,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 4, yysp);
    // END of default action (generated by JISON mode skip/merge :: 5/5,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Each '%code' initialization code section must be qualified by a name,
        e.g. 'required' before the action code itself:
    
            %code qualifier_name {action code}
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp - 3], yylstack[yysp - 4])}
    
          Technical error report:
        ${yyvstack[yysp - 3].errStr}
    `);
    yy.popContext('Line 667');
    this.$ = null;
    break;

case 28:
    /*! Production::    definition : init_code_keyword error OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Each '%code' initialization code section must be qualified by a name,
        e.g. 'required' before the action code itself.
    
        The '%code ID %{...%\}' initialization code section must be properly
        wrapped in block start markers (e.g. \`%{\`) and matching end markers
        (e.g. \`%}\`). Expected format:
    
            %code qualifier_name {action code}
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2])}
    
          Technical error report:
        ${yyvstack[yysp - 1].errStr}
    `);
    yy.popContext('Line 688');
    this.$ = null;
    break;

case 29:
    /*! Production::    definition : error */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        illegal input in the lexer spec definitions section.
    
        This might be stuff incorrectly dangling off the previous
        '${yy.__options_category_description__}' definition statement, so please do check above
        when the mistake isn't immediately obvious from this error spot itself.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    this.$ = null;
    break;

case 30:
    /*! Production::    option_keyword : OPTIONS */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yy.pushContext();
    yy.__options_flags__ = OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES | OPTION_ACCEPTS_000_IDENTIFIER_NAMES;
    yy.__options_category_description__ = yyvstack[yysp];
    
    this.$ = yyvstack[yysp];
    break;

case 31:
    /*! Production::    import_keyword : IMPORT */
case 33:
    /*! Production::    include_keyword : INCLUDE */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yy.pushContext();
    yy.__options_flags__ = OPTION_DOES_NOT_ACCEPT_VALUE | OPTION_DOES_NOT_ACCEPT_COMMA_SEPARATED_OPTIONS;
    yy.__options_category_description__ = yyvstack[yysp];
    
    this.$ = yyvstack[yysp];
    break;

case 32:
    /*! Production::    init_code_keyword : INIT_CODE */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yy.pushContext();
    yy.__options_flags__ = OPTION_DOES_NOT_ACCEPT_VALUE | OPTION_DOES_NOT_ACCEPT_MULTIPLE_OPTIONS | OPTION_DOES_NOT_ACCEPT_COMMA_SEPARATED_OPTIONS;
    yy.__options_category_description__ = yyvstack[yysp];
    
    this.$ = yyvstack[yysp];
    break;

case 34:
    /*! Production::    start_inclusive_keyword : START_INC */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yy.pushContext();
    yy.__options_flags__ = OPTION_DOES_NOT_ACCEPT_VALUE | OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES;
    yy.__options_category_description__ = 'the inclusive lexer start conditions set (%s)';
    
    this.$ = yyvstack[yysp];
    break;

case 35:
    /*! Production::    start_exclusive_keyword : START_EXC */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yy.pushContext();
    yy.__options_flags__ = OPTION_DOES_NOT_ACCEPT_VALUE | OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES;
    yy.__options_category_description__ = 'the exclusive lexer start conditions set (%x)';
    
    this.$ = yyvstack[yysp];
    break;

case 36:
    /*! Production::    start_conditions_marker : "<" */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yy.pushContext();
    yy.__options_flags__ = OPTION_DOES_NOT_ACCEPT_VALUE | OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES | OPTION_ALSO_ACCEPTS_STAR_AS_IDENTIFIER_NAME;
    yy.__options_category_description__ = 'the <...> delimited set of lexer start conditions';
    
    this.$ = null;
    break;

case 37:
    /*! Production::    start_productions_marker : "%%" */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yy.pushContext();
    yy.__options_flags__ = 0;
    yy.__options_category_description__ = 'the lexer rules definition section';
    
    this.$ = null;
    break;

case 38:
    /*! Production::    start_epilogue_marker : "%%" */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yy.pushContext();
    yy.__options_flags__ = 0;
    yy.__options_category_description__ = 'the lexer epilogue section';
    
    this.$ = null;
    break;

case 39:
    /*! Production::    rules : rules scoped_rules_collective */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    if (yyvstack[yysp]) {
        this.$ = yyvstack[yysp - 1].concat(yyvstack[yysp]);
    } else {
        this.$ = yyvstack[yysp - 1];
    }
    break;

case 40:
    /*! Production::    rules : rules rule */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    if (yyvstack[yysp]) {
        this.$ = yyvstack[yysp - 1].concat([yyvstack[yysp]]);
    } else {
        this.$ = yyvstack[yysp - 1];
    }
    break;

case 41:
    /*! Production::    rules : %epsilon */
case 48:
    /*! Production::    rule_block : %epsilon */

    // default action (generated by JISON mode skip/merge :: 0/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(null, null, null, null, true);
    // END of default action (generated by JISON mode skip/merge :: 0/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = [];
    break;

case 42:
    /*! Production::    scoped_rules_collective : start_conditions rule */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    if (yyvstack[yysp - 1]) {
        yyvstack[yysp].unshift(yyvstack[yysp - 1]);
    }
    
    yy.popContext('Line 837');
    
    this.$ = [yyvstack[yysp]];
    break;

case 43:
    /*! Production::    scoped_rules_collective : start_conditions "{" rule_block "}" */

    // default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 3, yysp);
    // END of default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-)
    
    
    if (yyvstack[yysp - 3]) {
        yyvstack[yysp - 1].forEach(function (d) {
            d.unshift(yyvstack[yysp - 3]);
        });
    }
    
    yy.popContext('Line 849');
    
    this.$ = yyvstack[yysp - 1];
    break;

case 44:
    /*! Production::    scoped_rules_collective : start_conditions "{" error "}" */

    // default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 3, yysp);
    // END of default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Seems you made a mistake while specifying one of the lexer rules inside
        the start condition
           <${yyvstack[yysp - 3].join(',')}> { rules... }
        block.
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yyparser.mergeLocationInfo((yysp - 3), (yysp)), yylstack[yysp - 3])}
    
          Technical error report:
        ${yyvstack[yysp - 1].errStr}
    `);
    yy.popContext('Line 867');
    this.$ = null;
    break;

case 45:
    /*! Production::    scoped_rules_collective : start_conditions "{" error */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Seems you did not correctly bracket a lexer rules set inside
        the start condition
          <${yyvstack[yysp - 2].join(',')}> { rules... }
        as a terminating curly brace '}' could not be found.
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    yy.popContext('Line 884');
    this.$ = null;
    break;

case 46:
    /*! Production::    scoped_rules_collective : start_conditions error "}" */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Seems you did not correctly bracket a lexer rules set inside
        the start condition
          <${yyvstack[yysp - 2].join(',')}> { rules... }
        as a terminating curly brace '}' could not be found.
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2])}
    
          Technical error report:
        ${yyvstack[yysp - 1].errStr}
    `);
    yy.popContext('Line 901');
    this.$ = null;
    break;

case 47:
    /*! Production::    rule_block : rule_block rule */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp - 1];
    if (yyvstack[yysp]) {
        this.$.push(yyvstack[yysp]);
    }
    break;

case 49:
    /*! Production::    rule : regex ACTION_START action ACTION_END */
case 50:
    /*! Production::    rule : regex ACTION_START_AT_SOL action ACTION_END */

    // default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 3, yysp);
    // END of default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let srcCode = trimActionCode$1(yyvstack[yysp - 1] + yyvstack[yysp], {
        startMarker: yyvstack[yysp - 2]
    });
    let rv = checkActionBlock$1(srcCode, yylstack[yysp - 1], yy);
    if (rv) {
        yyparser.yyError(rmCommonWS$2`
            The lexer rule's action code section does not compile: ${rv}
    
              Erroneous area:
            ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 3])}
        `);
    }
    this.$ = [yyvstack[yysp - 3], srcCode];
    }
    break;

case 51:
    /*! Production::    rule : regex ARROW_ACTION_START action ACTION_END */

    // default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 3, yysp);
    // END of default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let srcCode = trimActionCode$1(yyvstack[yysp - 1] + yyvstack[yysp], {
        dontTrimSurroundingCurlyBraces: true
    });
    // add braces around ARROW_ACTION_CODE so that the action chunk test/compiler
    // will uncover any illegal action code following the arrow operator, e.g.
    // multiple statements separated by semicolon.
    //
    // Note/Optimization:
    // there's no need for braces in the generated expression when we can
    // already see the given action is an identifier string or something else
    // that's a sure simple thing for a JavaScript `return` statement to carry.
    // By doing this, we simplify the token return replacement code replacement
    // process which will be applied to the parsed lexer before its code
    // will be generated by JISON.
    srcCode = 'return ' + braceArrowActionCode$1(srcCode);
    
    let rv = checkActionBlock$1(srcCode, yylstack[yysp - 1], yy);
    if (rv) {
        let indentedSrc = rmCommonWS$2([srcCode]).split('\n').join('\n    ');
    
        yyparser.yyError(rmCommonWS$2`
            The lexer rule's 'arrow' action code section does not compile: ${rv}
    
            # NOTE that the arrow action automatically wraps the action code
            # in a \`return (...);\` statement to prevent hard-to-diagnose run-time
            # errors down the line.
            #
            # Please be aware that the reported compile error MAY be referring
            # to the wrapper code which is added by JISON automatically when
            # processing arrow actions: the entire action code chunk
            # (including wrapper) is:
    
                ${indentedSrc}
    
              Erroneous area:
            ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 3])}
        `);
    }
    
    this.$ = [yyvstack[yysp - 3], srcCode];
    }
    break;

case 52:
    /*! Production::    rule : regex ARROW_ACTION_START error */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = [yyvstack[yysp - 2], yyvstack[yysp]];
    yyparser.yyError(rmCommonWS$2`
        A lexer rule action arrow must be followed by a single JavaScript expression specifying the lexer token to produce, e.g.:
    
            /rule/   -> 'BUGGABOO'
    
        which is equivalent to:
    
            /rule/      %{ return 'BUGGABOO'; %}
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    break;

case 53:
    /*! Production::    rule : regex ACTION_START error */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    // TODO: REWRITE
    this.$ = [yyvstack[yysp - 2], yyvstack[yysp]];
    yyparser.yyError(rmCommonWS$2`
        A lexer rule regex action code must be properly terminated and must contain a JavaScript statement block (or anything that does parse as such), e.g.:
    
            /rule/      %{ invokeHooHaw(); return 'TOKEN'; %}
    
        NOTE: when you have very simple action code, wrapping it in '%{...}%' or equivalent is not required as long as you keep the code indented, e.g.:
    
            /rule/      invokeHooHaw();
                        return 'TOKEN';
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    break;

case 54:
    /*! Production::    rule : regex ACTION_START_AT_SOL error */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    // TODO: REWRITE
    this.$ = [yyvstack[yysp - 2], yyvstack[yysp]];
    yyparser.yyError(rmCommonWS$2`
        A lexer rule regex action code must be properly terminated and must contain a JavaScript statement block (or anything that does parse as such), e.g.:
    
            /rule/
            %{
                invokeHooHaw();
                return 'TOKEN';
            %}
    
        You may indent the initial '%{' to disambiguate this as being a rule action code block instead of a lexer init code block:
    
            /rule/
              %{
                invokeHooHaw();
                return 'TOKEN';
            %}
    
        You can also accomplish this by placing the '%{' on the same line as the regex:
    
            /rule/      %{
                invokeHooHaw();
                return 'TOKEN';
            %}
    
        NOTE: when you have very simple action code, wrapping it in '%{...}%' or equivalent is not required as long as you keep the code indented, e.g.:
    
            /rule/      invokeHooHaw();
                        return 'TOKEN';
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    break;

case 55:
    /*! Production::    rule : regex error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = [yyvstack[yysp - 1], yyvstack[yysp]];
    yyparser.yyError(rmCommonWS$2`
        Lexer rule regex action code declaration error?
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    break;

case 56:
    /*! Production::    rule : ACTION_START_AT_SOL action ACTION_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,LU,LUbA):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,LU,LUbA)
    
    
    {
    if (yy.__inside_scoped_ruleset__) {
        yyparser.yyError(rmCommonWS$2`
            '%{...%}' lexer setup action code sections are not accepted inside
            '<...>{ ... }' scoped rule blocks. Move this action code to the top
            of the '%%' section instead.
    
              Erroneous area:
            ${yylexer.prettyPrintRange(this._$)}
        `);
    } else {
        let srcCode = trimActionCode$1(yyvstack[yysp - 1] + yyvstack[yysp], {
            startMarker: yyvstack[yysp - 2]
        });
        if (srcCode) {
            let rv = checkActionBlock$1(srcCode, yylstack[yysp - 1], yy);
            if (rv) {
                yyparser.yyError(rmCommonWS$2`
                    The '%{...%}' lexer setup action code section does not compile: ${rv}
    
                      Erroneous area:
                    ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2])}
                `);
            }
            yy.actionInclude.push(srcCode);
        }
    }
    this.$ = null;
    }
    break;

case 58:
    /*! Production::    rule : ACTION_START_AT_SOL error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let start_marker = yyvstack[yysp - 1].trim();
    yyparser.yyError(rmCommonWS$2`
        There's very probably a problem with this '%{...%}' lexer setup action code section.
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    this.$ = null;
    }
    break;

case 59:
    /*! Production::    rule : ACTION_START error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let start_marker = yyvstack[yysp - 1].trim();
    // When the start_marker is not an explicit `%{`, `{` or similar, the error
    // is more probably due to indenting the rule regex, rather than an error
    // in writing the setup action code block:
    if (start_marker.indexOf('{') >= 0) {
        let marker_msg = (start_marker ? ' or similar, such as ' + start_marker : '');
        yyparser.yyError(rmCommonWS$2`
            The '%{...%}' lexer setup action code section MUST have its action
            block start marker (\`%{\`${marker_msg}) positioned
            at the start of a line to be accepted: *indented* action code blocks
            (such as this one) are always related to an immediately preceding lexer spec item,
            e.g. a lexer match rule expression (see 'lexer rules').
    
              Erroneous area:
            ${yylexer.prettyPrintRange(yylstack[yysp - 1])}
    
              Technical error report:
            ${yyvstack[yysp].errStr}
        `);
    } else {
        yyparser.yyError(rmCommonWS$2`
            There's probably an error in one or more of your lexer regex rules.
            Did you perhaps indent the rule regex? Note that all rule regexes
            MUST start at the start of the line, i.e. text column 1. Indented text
            is perceived as JavaScript action code related to the last lexer
            rule regex.
    
              Erroneous code:
            ${yylexer.prettyPrintRange(yylstack[yysp])}
    
              Technical error report:
            ${yyvstack[yysp].errStr}
        `);
    }
    this.$ = null;
    }
    break;

case 60:
    /*! Production::    rule : start_inclusive_keyword */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        \`${yy.__options_category_description__}\` statements must be placed in
        the top section of the lexer spec file, above the first '%%'
        separator. You cannot specify any in the second section as has been
        done here.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp])}
    `);
    yy.popContext('Line 1217');
    this.$ = null;
    break;

case 61:
    /*! Production::    rule : start_exclusive_keyword */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        \`${yy.__options_category_description__}\` statements must be placed in
        the top section of the lexer spec file, above the first '%%'
        separator. You cannot specify any in the second section as has been
        done here.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp])}
    `);
    yy.popContext('Line 1231');
    this.$ = null;
    break;

case 62:
    /*! Production::    rule : option_keyword */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        \`${yy.__options_category_description__}\` statements must be placed in
        the top section of the lexer spec file, above the first '%%'
        separator. You cannot specify any in the second section as has been
        done here.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp])}
    `);
    yy.popContext('Line 1245');
    this.$ = null;
    break;

case 63:
    /*! Production::    rule : UNKNOWN_DECL */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        \`${yyvstack[yysp].name}\` statements must be placed in
        the top section of the lexer spec file, above the first '%%'
        separator. You cannot specify any in the second section as has been
        done here.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp])}
    `);
    this.$ = null;
    break;

case 64:
    /*! Production::    rule : import_keyword */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        \`${yy.__options_category_description__}\` statements must be placed in
        the top section of the lexer spec file, above the first '%%'
        separator. You cannot specify any in the second section as has been
        done here.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp])}
    `);
    yy.popContext('Line 1272');
    this.$ = null;
    break;

case 65:
    /*! Production::    rule : init_code_keyword */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        \`${yy.__options_category_description__}\` statements must be placed in
        the top section of the lexer spec file, above the first '%%'
        separator. You cannot specify any in the second section as has been
        done here.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp])}
    `);
    yy.popContext('Line 1286');
    this.$ = null;
    break;

case 66:
    /*! Production::    action : action ACTION_BODY */
case 83:
    /*! Production::    regex_concat : regex_concat regex_base */
case 95:
    /*! Production::    regex_base : regex_base range_regex */
case 108:
    /*! Production::    regex_set : regex_set regex_set_atom */
case 131:
    /*! Production::    epilogue_chunks : epilogue_chunks epilogue_chunk */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp - 1] + yyvstack[yysp];
    break;

case 67:
    /*! Production::    action : action include_macro_code */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp - 1] + '\n\n' + yyvstack[yysp] + '\n\n';
    break;

case 68:
    /*! Production::    action : action INCLUDE_PLACEMENT_ERROR */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        You may place the '%include' instruction only at the start/front of a line.
    
          Its use is not permitted at this position:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    `);
    this.$ = yyvstack[yysp - 1];
    break;

case 69:
    /*! Production::    action : action BRACKET_MISSING */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Missing curly braces: seems you did not correctly bracket a lexer rule action block in curly braces: '{ ... }'.
    
          Offending action body:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    `);
    this.$ = yyvstack[yysp - 1];
    break;

case 70:
    /*! Production::    action : action BRACKET_SURPLUS */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Too many curly braces: seems you did not correctly bracket a lexer rule action block in curly braces: '{ ... }'.
    
          Offending action body:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    `);
    this.$ = yyvstack[yysp - 1];
    break;

case 71:
    /*! Production::    action : action UNTERMINATED_STRING_ERROR */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Unterminated string constant in lexer rule action block.
    
        When your action code is as intended, it may help to enclose
        your rule action block code in a '%{...%}' block.
    
          Offending action body:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    `);
    this.$ = yyvstack[yysp - 1];
    break;

case 72:
    /*! Production::    action : %epsilon */
case 77:
    /*! Production::    regex_list : %epsilon */
case 128:
    /*! Production::    epilogue : %epsilon */

    // default action (generated by JISON mode skip/merge :: 0/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(null, null, null, null, true);
    // END of default action (generated by JISON mode skip/merge :: 0/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = '';
    break;

case 73:
    /*! Production::    start_conditions : start_conditions_marker option_list OPTIONS_END ">" */

    // default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 3, yysp);
    // END of default action (generated by JISON mode skip/merge :: 4/4,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    // rewrite + accept star '*' as name + check if we allow empty list?
    this.$ = yyvstack[yysp - 2].map(function (el) {
        let name = el[0];
    
        // Validate the given condition state: when it isn't known, print an error message
        // accordingly:
        if (name !== '*' && name !== 'INITIAL' && !(name in yy.startConditions)) {
            yyparser.yyError(rmCommonWS$2`
                You specified an unknown lexer condition state '${name}'.
                Is this a typo or did you forget to include this one in the '%s' and '%x'
                inclusive and exclusive condition state sets specifications at the top of
                the lexer spec?
    
                As a rough example, things should look something like this in your lexer
                spec file:
    
                    %s ${name}
                    %%
                    <${name}>LEXER_RULE_REGEX    return 'TOK';
    
                  Erroneous code:
                ${yylexer.prettyPrintRange(yylstack[yysp - 2], yylstack[yysp - 3], yylstack[yysp])}
            `);
        }
    
        return name;
    });
    
    // Optimization: these two calls cancel one another out here:
    //
    // yy.popContext('Line 1376');
    // yy.pushContext();
    
    yy.__inside_scoped_ruleset__ = true;
    
    // '<' '*' '>'
    //    { $$ = ['*']; }
    }
    break;

case 74:
    /*! Production::    start_conditions : start_conditions_marker option_list error */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    // rewrite + accept star '*' as name + check if we allow empty list?
    let lst = yyvstack[yysp - 1].map(function (el) {
        return el[0];
    });
    
    yyparser.yyError(rmCommonWS$2`
        Seems you did not correctly terminate the start condition set
            <${lst.join(',')},???>
        with a terminating '>'
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    
    // Optimization: these two calls cancel one another out here:
    //
    // yy.popContext('Line 1405');
    // yy.pushContext();
    
    yy.__inside_scoped_ruleset__ = true;
    
    this.$= null;
    }
    break;

case 75:
    /*! Production::    regex : nonempty_regex_list */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    // Detect if the regex ends with a pure (Unicode) word;
    // we *do* consider escaped characters which are 'alphanumeric'
    // to be equivalent to their non-escaped version, hence these are
    // all valid 'words' for the 'easy keyword rules' option:
    //
    // - hello_kitty
    // - γεια_σου_γατούλα
    // - \u03B3\u03B5\u03B9\u03B1_\u03C3\u03BF\u03C5_\u03B3\u03B1\u03C4\u03BF\u03CD\u03BB\u03B1
    //
    // http://stackoverflow.com/questions/7885096/how-do-i-decode-a-string-with-escaped-unicode#12869914
    //
    // As we only check the *tail*, we also accept these as
    // 'easy keywords':
    //
    // - %options
    // - %foo-bar
    // - +++a:b:c1
    //
    // Note the dash in that last example: there the code will consider
    // `bar` to be the keyword, which is fine with us as we're only
    // interested in the trailing boundary and patching that one for
    // the `easy_keyword_rules` option.
    this.$ = yyvstack[yysp];
    if (yy.options.easy_keyword_rules) {
      // We need to 'protect' `eval` here as keywords are allowed
      // to contain double-quotes and other leading cruft.
      // `eval` *does* gobble some escapes (such as `\b`) but
      // we protect against that through a simple replace regex:
      // we're not interested in the special escapes' exact value
      // anyway.
      // It will also catch escaped escapes (`\\`), which are not
      // word characters either, so no need to worry about
      // `eval(str)` 'correctly' converting convoluted constructs
      // like '\\\\\\\\\\b' in here.
      this.$ = this.$
      .replace(/\\\\/g, '.')
      .replace(/"/g, '.')
      .replace(/\\c[A-Z]/g, '.')
      .replace(/\\[^xu0-7]/g, '.');
    
      try {
        // Convert Unicode escapes and other escapes to their literal characters
        // BEFORE we go and check whether this item is subject to the
        // `easy_keyword_rules` option.
        this.$ = JSON.parse('"' + this.$ + '"');
      }
      catch (ex) {
        yyparser.warn('easy-keyword-rule FAIL on eval: ', ex);
    
        // make the next keyword test fail:
        this.$ = '.';
      }
      // a 'keyword' starts with an alphanumeric character,
      // followed by zero or more alphanumerics or digits:
      let re = new XRegExp__default['default']('\\w[\\w\\d]*$');
      if (XRegExp__default['default'].match(this.$, re)) {
        this.$ = yyvstack[yysp] + "\\b";
      } else {
        this.$ = yyvstack[yysp];
      }
    }
    }
    break;

case 76:
    /*! Production::    regex_list : nonempty_regex_list */
case 82:
    /*! Production::    nonempty_regex_list : regex_concat */
case 84:
    /*! Production::    regex_concat : regex_base */
case 94:
    /*! Production::    regex_base : name_expansion */
case 100:
    /*! Production::    regex_base : REGEX_SPECIAL_CHAR */
case 101:
    /*! Production::    regex_base : literal_string */
case 103:
    /*! Production::    name_expansion : NAME_BRACE */
case 109:
    /*! Production::    regex_set : regex_set_atom */
case 110:
    /*! Production::    regex_set_atom : REGEX_SET */
case 112:
    /*! Production::    range_regex : RANGE_REGEX */
case 126:
    /*! Production::    any_option_value : nonnumeric_option_value */
case 127:
    /*! Production::    any_option_value : INTEGER */
case 132:
    /*! Production::    epilogue_chunks : epilogue_chunk */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp];
    break;

case 78:
    /*! Production::    nonempty_regex_list : nonempty_regex_list "|" regex_concat */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp - 2] + '|' + yyvstack[yysp];
    break;

case 79:
    /*! Production::    nonempty_regex_list : nonempty_regex_list "|" */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp - 1] + '|';
    break;

case 80:
    /*! Production::    nonempty_regex_list : "|" regex_concat */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = '|' + yyvstack[yysp];
    break;

case 81:
    /*! Production::    nonempty_regex_list : "|" */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = '|';
    break;

case 85:
    /*! Production::    regex_base : "(" regex_list ")" */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = '(' + yyvstack[yysp - 1] + ')';
    break;

case 86:
    /*! Production::    regex_base : SPECIAL_GROUP regex_list ")" */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp - 2] + yyvstack[yysp - 1] + ')';
    break;

case 87:
    /*! Production::    regex_base : "(" regex_list error */
case 88:
    /*! Production::    regex_base : SPECIAL_GROUP regex_list error */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,-,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,-,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Seems you did not correctly bracket a lex rule regex part in '(...)' braces.
    
          Unterminated regex part:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    break;

case 89:
    /*! Production::    regex_base : regex_base "+" */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp - 1] + '+';
    break;

case 90:
    /*! Production::    regex_base : regex_base "*" */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp - 1] + '*';
    break;

case 91:
    /*! Production::    regex_base : regex_base "?" */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp - 1] + '?';
    break;

case 92:
    /*! Production::    regex_base : "/" regex_base */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = '(?=' + yyvstack[yysp] + ')';
    break;

case 93:
    /*! Production::    regex_base : "/!" regex_base */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = '(?!' + yyvstack[yysp] + ')';
    break;

case 96:
    /*! Production::    regex_base : any_group_regex */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,-,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,-,-,LT,LA,-,-)
    break;

case 97:
    /*! Production::    regex_base : "." */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = '.';
    break;

case 98:
    /*! Production::    regex_base : "^" */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = '^';
    break;

case 99:
    /*! Production::    regex_base : "$" */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = '$';
    break;

case 102:
    /*! Production::    regex_base : ESCAPED_CHAR */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = encodeRegexLiteralStr(encodeUnicodeCodepoint(yyvstack[yysp]));
    break;

case 104:
    /*! Production::    any_group_regex : REGEX_SET_START regex_set REGEX_SET_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp - 2] + yyvstack[yysp - 1] + yyvstack[yysp];
    break;

case 105:
    /*! Production::    any_group_regex : REGEX_SET_START REGEX_SET_END */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,-,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,-,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Empty lex rule regex set '[]' is not legal.
    
        If you want to match ANY character (including CR/LF characters) you may
        write '[^]' or '[\s\S]', which are standard idioms for this in JavaScript.
    
          Erroneous regex set:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
    `);
    $ = null;
    break;

case 106:
    /*! Production::    any_group_regex : REGEX_SET_START any_group_regex_option UNTERMINATED_REGEX_SET */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,-,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,-,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Seems you did not correctly bracket a lex rule regex set in '[...]' brackets.
    
          Unterminated regex set:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    `);
    $ = null;
    break;

case 107:
    /*! Production::    any_group_regex : REGEX_SET_START error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,-,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,-,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        Seems you did not correctly bracket a lex rule regex set in '[...]' brackets.
    
          Unterminated regex set:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    break;

case 111:
    /*! Production::    regex_set_atom : name_expansion */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    if (XRegExp__default['default']._getUnicodeProperty(yyvstack[yysp].replace(/[{}]/g, ''))
        && yyvstack[yysp].toUpperCase() !== yyvstack[yysp]
    ) {
        // treat this as part of an XRegExp `\p{...}` Unicode 'General Category' Property cf. http://unicode.org/reports/tr18/#Categories
        this.$ = yyvstack[yysp];
    } else {
        this.$ = yyvstack[yysp];
    }
    //yyparser.log("name expansion for: ", { name: $name_expansion, redux: $name_expansion.replace(/[{}]/g, ''), output: $$ })
    break;

case 113:
    /*! Production::    literal_string : STRING_LIT */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let src = yyvstack[yysp];
    let s = src.substring(1, src.length - 1);
    let edge = src[0];
    this.$ = encodeRegexLiteralStr(s, edge);
    }
    break;

case 114:
    /*! Production::    literal_string : CHARACTER_LIT */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let s = yyvstack[yysp];
    this.$ = encodeRegexLiteralStr(s);
    }
    break;

case 115:
    /*! Production::    option_list : option_list "," option */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    // validate that this is legal behaviour under the given circumstances, i.e. parser context:
    if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_MULTIPLE_OPTIONS) {
        yyparser.yyError(rmCommonWS$2`
            You may only specify one name/argument in a ${yy.__options_category_description__} statement.
    
              Erroneous area:
            ${yylexer.prettyPrintRange(yylexer.deriveLocationInfo(yylstack[yysp - 1], yylstack[yysp]), yylstack[yysp - 3])}
        `);
    }
    if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_COMMA_SEPARATED_OPTIONS) {
        let optlist = yyvstack[yysp - 2].map(function (opt) {
            return opt[0];
        });
        optlist.push(yyvstack[yysp][0]);
    
        yyparser.yyError(rmCommonWS$2`
            You may not separate entries in a ${yy.__options_category_description__} statement using commas.
            Use whitespace instead, e.g.:
    
                ${yyvstack[yysp - 4]} ${optlist.join(' ')} ...
    
              Erroneous area:
            ${yylexer.prettyPrintRange(yylexer.deriveLocationInfo(yylstack[yysp - 1], yylstack[yysp - 2]), yylstack[yysp - 3])}
        `);
    }
    this.$ = yyvstack[yysp - 2];
    if (yyvstack[yysp]) {
        this.$.push(yyvstack[yysp]);
    }
    }
    break;

case 116:
    /*! Production::    option_list : option_list option */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    // validate that this is legal behaviour under the given circumstances, i.e. parser context:
    if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_MULTIPLE_OPTIONS) {
        yyparser.yyError(rmCommonWS$2`
            You may only specify one name/argument in a ${yy.__options_category_description__} statement.
    
              Erroneous area:
            ${yylexer.prettyPrintRange(yylexer.deriveLocationInfo(yylstack[yysp]), yylstack[yysp - 2])}
        `);
    }
    this.$ = yyvstack[yysp - 1];
    if (yyvstack[yysp]) {
        this.$.push(yyvstack[yysp]);
    }
    break;

case 117:
    /*! Production::    option_list : option */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = [];
    if (yyvstack[yysp]) {
        this.$.push(yyvstack[yysp]);
    }
    break;

case 118:
    /*! Production::    option_list : option_list "," err "=" any_option_value */

    // default action (generated by JISON mode skip/merge :: 5/5,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 4, yysp);
    // END of default action (generated by JISON mode skip/merge :: 5/5,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let with_value_msg = ' (with optional value assignment)';
    if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_VALUE) {
        with_value_msg = '';
    }
    yyparser.yyError(rmCommonWS$2`
        Expected a valid option name${with_value_msg} in a ${yy.__options_category_description__} statement.
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp - 2], yylstack[yysp - 3])}
    
          Technical error report:
        ${yyvstack[yysp - 2] ? yyvstack[yysp - 2].errStr : '---'}
    `);
    
    this.$ = yyvstack[yysp - 4];
    }
    break;

case 119:
    /*! Production::    option : option_name */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = [yyvstack[yysp], true];
    break;

case 120:
    /*! Production::    option : option_name "=" any_option_value */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    // validate that this is legal behaviour under the given circumstances, i.e. parser context:
    if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_VALUE) {
        yyparser.yyError(rmCommonWS$2`
            The entries in a ${yy.__options_category_description__} statement MUST NOT be assigned values, such as '${$option_name}=${$any_option_value}'.
    
              Erroneous area:
            ${yylexer.prettyPrintRange(yylexer.deriveLocationInfo(yylstack[yysp], yylstack[yysp - 2]), yylstack[yysp - 4])}
        `);
    }
    this.$ = [yyvstack[yysp - 2], yyvstack[yysp]];
    break;

case 121:
    /*! Production::    option : option_name "=" error */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    // TODO ...
    yyparser.yyError(rmCommonWS$2`
        Internal error: option "${$option}" value assignment failure in a ${yy.__options_category_description__} statement.
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 4])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    this.$ = null;
    break;

case 122:
    /*! Production::    option_name : nonnumeric_option_value */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    // validate that this is legal input under the given circumstances, i.e. parser context:
    if (yy.__options_flags__ & OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES) {
        let name = yyvstack[yysp];
        let identifier = mkIdentifier$1(name);
        // check if the transformation is obvious & trivial to humans;
        // if not, report an error as we don't want confusion due to
        // typos and/or garbage input here producing something that
        // is usable from a machine perspective.
        if (!isLegalIdentifierInput$1(name)) {
            name = name.replace(/\d/g, '');
            if (!isLegalIdentifierInput$1(name) || !(yy.__options_flags__ & OPTION_ACCEPTS_000_IDENTIFIER_NAMES)) {
                let with_value_msg = ' (with optional value assignment)';
                if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_VALUE) {
                    with_value_msg = '';
                }
                yyparser.yyError(rmCommonWS$2`
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
                    ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
                `);
            }
        }
        this.$ = identifier;
    } else {
        this.$ = yyvstack[yysp];
    }
    }
    break;

case 123:
    /*! Production::    option_name : "*" */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    // validate that this is legal input under the given circumstances, i.e. parser context:
    if (!(yy.__options_flags__ & OPTION_EXPECTS_ONLY_IDENTIFIER_NAMES) || (yy.__options_flags__ & OPTION_ALSO_ACCEPTS_STAR_AS_IDENTIFIER_NAME)) {
        this.$ = yyvstack[yysp];
    } else {
        let with_value_msg = ' (with optional value assignment)';
        if (yy.__options_flags__ & OPTION_DOES_NOT_ACCEPT_VALUE) {
            with_value_msg = '';
        }
        yyparser.yyError(rmCommonWS$2`
            Expected a valid name/argument${with_value_msg} in a ${yy.__options_category_description__} statement.
            Entries (names) must look like regular programming language
            identifiers, with the addition that option names MAY contain
            '-' dashes, e.g. 'example-option-1'
    
              Erroneous area:
            ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
        `);
    }
    }
    break;

case 124:
    /*! Production::    nonnumeric_option_value : OPTION_STRING */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = JSON5__default['default'].parse(yyvstack[yysp]);
    break;

case 125:
    /*! Production::    nonnumeric_option_value : OPTION_VALUE */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = parseValue(yyvstack[yysp]);
    break;

case 129:
    /*! Production::    epilogue : start_epilogue_marker */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yy.popContext('Line 1876');
    
    this.$ = '';
    break;

case 130:
    /*! Production::    epilogue : start_epilogue_marker epilogue_chunks */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let srcCode = trimActionCode$1(yyvstack[yysp]);
    if (srcCode) {
        let rv = checkActionBlock$1(srcCode, yylstack[yysp], yy);
        if (rv) {
            yyparser.yyError(rmCommonWS$2`
                The '%%' lexer epilogue code section does not compile: ${rv}
    
                  Erroneous area:
                ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
            `);
        }
    }
    
    yy.popContext('Line 1895');
    
    this.$ = srcCode;
    }
    break;

case 133:
    /*! Production::    epilogue_chunk : ACTION_START_AT_SOL action ACTION_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let srcCode = trimActionCode$1(yyvstack[yysp - 1] + yyvstack[yysp], {
        startMarker: yyvstack[yysp - 2]
    });
    if (srcCode) {
        let rv = checkActionBlock$1(srcCode, yylstack[yysp - 1], yy);
        if (rv) {
            yyparser.yyError(rmCommonWS$2`
                The '%{...%}' lexer epilogue code chunk does not compile: ${rv}
    
                  Erroneous area:
                ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2])}
            `);
        }
    }
    // Since the epilogue is concatenated as-is (see the `epilogue_chunks` rule above)
    // we append those protective double newlines right now, as the calling site
    // won't do it for us:
    this.$ = '\n\n' + srcCode + '\n\n';
    }
    break;

case 134:
    /*! Production::    epilogue_chunk : ACTION_START_AT_SOL error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    {
    let start_marker = yyvstack[yysp - 1].trim();
    yyparser.yyError(rmCommonWS$2`
        There's very probably a problem with this '%{...%}' lexer setup action code section.
    
          Erroneous area:
        ${yylexer.prettyPrintRange(yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    this.$ = '';
    }
    break;

case 135:
    /*! Production::    epilogue_chunk : UNTERMINATED_ACTION_BLOCK */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    // The issue has already been reported by the lexer. No need to repeat
    // ourselves with another error report from here.
    this.$ = '';
    break;

case 136:
    /*! Production::    epilogue_chunk : TRAILING_CODE_CHUNK */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    // these code chunks are very probably incomplete, hence compile-testing
    // for these should be deferred until we've collected the entire epilogue.
    this.$ = yyvstack[yysp];
    break;

case 137:
    /*! Production::    epilogue_chunk : error */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        There's an error in your lexer epilogue code block.
    
          Erroneous code:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 2])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    this.$ = '';
    break;

case 138:
    /*! Production::    include_macro_code : include_keyword option_list OPTIONS_END */

    // default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,LU,LUbA):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 2, yysp);
    // END of default action (generated by JISON mode skip/merge :: 3/3,VT,VA,VU,-,LT,LA,LU,LUbA)
    
    
    {
    // check if there is only 1 unvalued options: 'path'
    let lst = yyvstack[yysp - 1];
    let len = lst.length;
    let include_path;
    if (len === 1 && lst[0][1] === true) {
        // `path`:
        include_path = lst[0][0];
    } else if (len <= 1) {
        yyparser.yyError(rmCommonWS$2`
            You did not specify a legal file path for the '%include' statement, which must have the format:
                %include file_path
    
              Erroneous code:
            ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2])}
        `);
    } else {
        yyparser.yyError(rmCommonWS$2`
            You did specify too many attributes for the '%include' statement, which must have the format:
                %include file_path
    
              Erroneous code:
            ${yylexer.prettyPrintRange(yylstack[yysp - 1], yylstack[yysp - 2])}
        `);
    }
    
    if (!fs__default['default'].existsSync(include_path)) {
        yyparser.yyError(rmCommonWS$2`
            Cannot %include "${include_path}":
            The file does not exist.
    
            The current working directory (set up by JISON) is:
    
              ${process.cwd()}
    
            hence the full path to the given %include file is:
    
              ${path__default['default'].resolve(include_path)}
    
              Erroneous area:
            ${yylexer.prettyPrintRange(this._$)}
        `);
        this.$ = '\n\n\n\n';
    } else {
        // **Aside**: And no, we don't support nested '%include'!
        let fileContent = fs__default['default'].readFileSync(include_path, { encoding: 'utf-8' });
    
        let srcCode = trimActionCode$1(fileContent);
        if (srcCode) {
            let rv = checkActionBlock$1(srcCode, this._$, yy);
            if (rv) {
                yyparser.yyError(rmCommonWS$2`
                    The source code included from file '${include_path}' does not compile: ${rv}
    
                      Erroneous area:
                    ${yylexer.prettyPrintRange(this._$)}
                `);
            }
        }
    
        // And no, we don't support nested '%include':
        this.$ = '\n// Included by Jison: ' + include_path + ':\n\n' + srcCode + '\n\n// End Of Include by Jison: ' + include_path + '\n\n';
    }
    
    yy.popContext('Line 2058');
    }
    break;

case 139:
    /*! Production::    include_macro_code : include_keyword error */

    // default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(yysp - 1, yysp);
    // END of default action (generated by JISON mode skip/merge :: 2/2,VT,VA,VU,-,LT,LA,-,-)
    
    
    yyparser.yyError(rmCommonWS$2`
        %include MUST be followed by a valid file path.
    
          Erroneous path:
        ${yylexer.prettyPrintRange(yylstack[yysp], yylstack[yysp - 1])}
    
          Technical error report:
        ${yyvstack[yysp].errStr}
    `);
    yy.popContext('Line 2071');
    this.$ = null;
    break;

case 140:
    /*! Production::    any_group_regex_option : %epsilon */
case 142:
    /*! Production::    err : %epsilon */

    // default action (generated by JISON mode skip/merge :: 0/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yyparser.yyMergeLocationInfo(null, null, null, null, true);
    // END of default action (generated by JISON mode skip/merge :: 0/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = undefined;
    break;

case 141:
    /*! Production::    any_group_regex_option : regex_set */
case 143:
    /*! Production::    err : error */

    // default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-):
    this._$ = yylstack[yysp];
    // END of default action (generated by JISON mode skip/merge :: 1/1,VT,VA,VU,-,LT,LA,-,-)
    
    
    this.$ = yyvstack[yysp];
    break;
            
}
},
table: bt({
  len: u([
  15,
  1,
  14,
  21,
  1,
  13,
  29,
  22,
  8,
  8,
  9,
  13,
  1,
  8,
  13,
  8,
  8,
  13,
  28,
  s,
  [31, 5],
  1,
  44,
  4,
  1,
  1,
  13,
  6,
  25,
  24,
  25,
  23,
  23,
  17,
  17,
  s,
  [24, 8],
  27,
  9,
  24,
  24,
  8,
  13,
  7,
  s,
  [8, 6],
  13,
  9,
  13,
  13,
  8,
  14,
  8,
  1,
  8,
  2,
  1,
  26,
  26,
  7,
  38,
  4,
  9,
  27,
  1,
  s,
  [27, 6],
  5,
  7,
  3,
  c,
  [60, 3],
  c,
  [59, 3],
  s,
  [24, 5],
  2,
  3,
  2,
  25,
  25,
  6,
  24,
  1,
  24,
  s,
  [4, 3],
  13,
  9,
  7,
  6,
  13,
  13,
  s,
  [7, 6],
  8,
  4,
  s,
  [13, 4],
  9,
  c,
  [101, 3],
  5,
  9,
  s,
  [5, 3],
  26,
  26,
  1,
  s,
  [9, 3],
  27,
  9,
  27,
  c,
  [100, 4],
  s,
  [24, 4],
  4,
  24,
  7,
  1,
  1,
  c,
  [41, 5],
  7,
  9,
  1,
  1,
  c,
  [36, 3],
  37,
  27,
  26,
  c,
  [32, 4],
  c,
  [34, 3],
  1,
  25,
  5,
  7,
  1,
  13,
  13,
  5,
  26,
  24,
  26,
  s,
  [27, 3],
  25,
  7,
  13
]),
  symbol: u([
  1,
  2,
  20,
  23,
  s,
  [25, 6, 1],
  32,
  33,
  34,
  57,
  59,
  1,
  c,
  [16, 13],
  60,
  c,
  [14, 13],
  58,
  s,
  [61, 4, 1],
  66,
  67,
  69,
  c,
  [36, 14],
  1,
  2,
  3,
  7,
  8,
  s,
  [13, 4, 1],
  19,
  c,
  [20, 10],
  s,
  [41, 6, 1],
  51,
  52,
  71,
  2,
  c,
  [27, 6],
  c,
  [16, 8],
  77,
  s,
  [79, 5, 1],
  87,
  2,
  11,
  53,
  54,
  s,
  [88, 4, 1],
  c,
  [8, 9],
  24,
  31,
  s,
  [36, 5, 1],
  75,
  c,
  [89, 13],
  2,
  c,
  [31, 8],
  c,
  [22, 14],
  c,
  [60, 15],
  c,
  [140, 41],
  c,
  [28, 3],
  5,
  7,
  8,
  11,
  c,
  [30, 4],
  c,
  [29, 18],
  53,
  54,
  c,
  [31, 125],
  1,
  c,
  [183, 7],
  c,
  [29, 18],
  c,
  [370, 5],
  s,
  [68, 5, 2],
  c,
  [316, 7],
  93,
  1,
  34,
  70,
  93,
  2,
  21,
  c,
  [276, 14],
  7,
  21,
  23,
  26,
  35,
  c,
  [364, 3],
  9,
  c,
  [69, 4],
  c,
  [12, 4],
  c,
  [63, 8],
  c,
  [367, 6],
  c,
  [25, 19],
  c,
  [24, 8],
  s,
  [10, 7, 1],
  c,
  [27, 10],
  50,
  51,
  52,
  86,
  c,
  [49, 8],
  c,
  [45, 8],
  s,
  [78, 6, 1],
  c,
  [72, 9],
  c,
  [23, 15],
  c,
  [482, 13],
  c,
  [17, 21],
  c,
  [105, 24],
  c,
  [24, 189],
  s,
  [47, 6, 1],
  2,
  45,
  c,
  [8, 3],
  82,
  84,
  85,
  97,
  c,
  [84, 48],
  11,
  17,
  22,
  53,
  54,
  c,
  [733, 18],
  17,
  22,
  26,
  53,
  54,
  c,
  [7, 3],
  18,
  c,
  [8, 36],
  c,
  [68, 21],
  c,
  [844, 7],
  65,
  96,
  c,
  [794, 15],
  c,
  [13, 11],
  c,
  [56, 11],
  22,
  c,
  [22, 18],
  22,
  11,
  17,
  c,
  [92, 3],
  c,
  [9, 4],
  26,
  c,
  [665, 27],
  c,
  [26, 27],
  2,
  23,
  25,
  56,
  94,
  95,
  2,
  4,
  c,
  [33, 15],
  c,
  [723, 13],
  74,
  c,
  [1035, 8],
  c,
  [697, 4],
  c,
  [1023, 9],
  c,
  [806, 4],
  c,
  [85, 22],
  2,
  c,
  [28, 27],
  c,
  [27, 136],
  c,
  [248, 4],
  c,
  [1174, 7],
  c,
  [7, 3],
  s,
  [1, 3],
  c,
  [932, 14],
  c,
  [926, 76],
  c,
  [774, 117],
  9,
  2,
  7,
  9,
  c,
  [5, 4],
  c,
  [152, 47],
  86,
  c,
  [803, 5],
  85,
  c,
  [31, 24],
  48,
  c,
  [25, 24],
  c,
  [55, 4],
  c,
  [4, 8],
  c,
  [806, 15],
  18,
  c,
  [672, 5],
  98,
  c,
  [815, 8],
  53,
  54,
  55,
  91,
  92,
  c,
  [751, 26],
  c,
  [607, 7],
  c,
  [7, 35],
  c,
  [1629, 12],
  c,
  [80, 26],
  c,
  [13, 26],
  c,
  [714, 9],
  2,
  c,
  [36, 15],
  c,
  [538, 3],
  95,
  c,
  [6, 5],
  c,
  [1771, 11],
  c,
  [14, 3],
  c,
  [5, 11],
  c,
  [847, 25],
  2,
  c,
  [625, 16],
  c,
  [25, 8],
  73,
  5,
  c,
  [111, 10],
  c,
  [9, 17],
  c,
  [680, 27],
  c,
  [1057, 10],
  c,
  [743, 53],
  c,
  [373, 4],
  c,
  [383, 5],
  c,
  [697, 48],
  c,
  [24, 96],
  c,
  [552, 4],
  c,
  [52, 25],
  c,
  [554, 6],
  18,
  18,
  c,
  [1378, 10],
  c,
  [7, 18],
  c,
  [217, 8],
  c,
  [532, 14],
  65,
  96,
  22,
  22,
  c,
  [419, 5],
  c,
  [1369, 11],
  c,
  [14, 3],
  c,
  [406, 24],
  c,
  [1246, 13],
  c,
  [354, 29],
  c,
  [416, 60],
  c,
  [36, 72],
  c,
  [27, 27],
  6,
  c,
  [1473, 25],
  c,
  [879, 5],
  c,
  [94, 7],
  c,
  [283, 3],
  c,
  [794, 26],
  c,
  [728, 29],
  c,
  [321, 24],
  c,
  [1651, 28],
  c,
  [1458, 79],
  c,
  [226, 25],
  c,
  [529, 7],
  c,
  [207, 13]
]),
  type: u([
  s,
  [2, 13],
  0,
  0,
  1,
  c,
  [16, 14],
  c,
  [30, 15],
  s,
  [0, 6],
  s,
  [2, 42],
  c,
  [43, 16],
  c,
  [65, 11],
  c,
  [8, 16],
  c,
  [47, 20],
  c,
  [31, 15],
  c,
  [21, 17],
  c,
  [141, 46],
  s,
  [2, 181],
  s,
  [0, 18],
  c,
  [20, 4],
  c,
  [63, 46],
  c,
  [25, 24],
  c,
  [438, 40],
  c,
  [439, 12],
  c,
  [23, 32],
  c,
  [17, 34],
  c,
  [421, 215],
  c,
  [57, 56],
  c,
  [125, 68],
  c,
  [23, 22],
  c,
  [56, 53],
  c,
  [22, 9],
  c,
  [155, 63],
  c,
  [62, 27],
  c,
  [718, 15],
  c,
  [632, 27],
  c,
  [526, 224],
  c,
  [926, 70],
  c,
  [247, 136],
  c,
  [25, 29],
  c,
  [1029, 81],
  c,
  [291, 15],
  c,
  [96, 74],
  c,
  [1201, 68],
  c,
  [858, 21],
  c,
  [454, 80],
  c,
  [67, 10],
  c,
  [1857, 18],
  c,
  [95, 35],
  c,
  [992, 64],
  c,
  [697, 49],
  c,
  [958, 169],
  c,
  [296, 30],
  c,
  [225, 31],
  c,
  [1246, 25],
  c,
  [1346, 75],
  c,
  [36, 81],
  c,
  [157, 85],
  s,
  [2, 207]
]),
  state: u([
  s,
  [1, 5, 1],
  13,
  15,
  16,
  8,
  9,
  6,
  25,
  28,
  30,
  32,
  33,
  38,
  39,
  44,
  50,
  52,
  53,
  54,
  58,
  c,
  [4, 3],
  60,
  63,
  c,
  [5, 3],
  65,
  c,
  [4, 3],
  67,
  c,
  [4, 3],
  80,
  82,
  83,
  78,
  79,
  85,
  72,
  70,
  71,
  73,
  74,
  c,
  [38, 6],
  69,
  72,
  87,
  91,
  c,
  [8, 4],
  92,
  c,
  [4, 3],
  96,
  98,
  99,
  c,
  [20, 5],
  100,
  c,
  [7, 6],
  101,
  c,
  [4, 3],
  102,
  c,
  [4, 3],
  109,
  103,
  107,
  105,
  112,
  53,
  54,
  c,
  [3, 3],
  122,
  117,
  c,
  [8, 6],
  c,
  [3, 3],
  131,
  132,
  c,
  [75, 5],
  137,
  c,
  [71, 7],
  144,
  147,
  c,
  [93, 3],
  148,
  c,
  [73, 9],
  96,
  96,
  109,
  154,
  156,
  53,
  54,
  157,
  161,
  159,
  163,
  c,
  [24, 3],
  165,
  168,
  169,
  171,
  174,
  176,
  178,
  c,
  [62, 5],
  c,
  [31, 4],
  c,
  [74, 5],
  122,
  117,
  c,
  [65, 5],
  190,
  c,
  [65, 7],
  c,
  [17, 4],
  122,
  117,
  161,
  196
]),
  mode: u([
  s,
  [2, 27],
  s,
  [1, 13],
  c,
  [27, 15],
  c,
  [8, 15],
  c,
  [54, 24],
  c,
  [65, 25],
  c,
  [44, 11],
  c,
  [62, 21],
  s,
  [2, 198],
  s,
  [1, 25],
  c,
  [26, 4],
  c,
  [338, 21],
  c,
  [26, 5],
  c,
  [12, 5],
  c,
  [266, 10],
  c,
  [20, 20],
  c,
  [12, 5],
  c,
  [66, 18],
  c,
  [90, 6],
  c,
  [103, 12],
  c,
  [132, 26],
  c,
  [414, 33],
  s,
  [2, 199],
  c,
  [264, 5],
  c,
  [442, 53],
  c,
  [28, 24],
  c,
  [65, 54],
  c,
  [362, 33],
  c,
  [31, 8],
  c,
  [35, 11],
  c,
  [420, 67],
  c,
  [508, 68],
  c,
  [543, 168],
  c,
  [1127, 24],
  c,
  [853, 62],
  c,
  [205, 121],
  c,
  [165, 5],
  c,
  [151, 28],
  c,
  [24, 20],
  c,
  [750, 28],
  c,
  [206, 50],
  c,
  [1092, 6],
  c,
  [586, 10],
  c,
  [1302, 72],
  c,
  [60, 57],
  c,
  [202, 22],
  c,
  [83, 9],
  c,
  [1001, 50],
  c,
  [250, 27],
  c,
  [1772, 33],
  c,
  [876, 23],
  c,
  [937, 60],
  c,
  [666, 24],
  c,
  [882, 152],
  c,
  [1285, 41],
  c,
  [1135, 14],
  c,
  [12, 19],
  c,
  [1176, 19],
  c,
  [250, 51],
  c,
  [307, 34],
  c,
  [34, 68],
  c,
  [274, 53],
  c,
  [268, 11],
  s,
  [2, 233]
]),
  goto: u([
  s,
  [6, 13],
  s,
  [8, 13],
  5,
  17,
  7,
  10,
  11,
  12,
  14,
  21,
  22,
  23,
  19,
  20,
  18,
  24,
  s,
  [7, 13],
  41,
  26,
  s,
  [41, 7],
  27,
  s,
  [41, 18],
  29,
  31,
  34,
  36,
  40,
  41,
  42,
  35,
  37,
  43,
  s,
  [45, 5, 1],
  51,
  55,
  56,
  57,
  59,
  c,
  [4, 3],
  61,
  s,
  [72, 7],
  s,
  [16, 13],
  62,
  64,
  c,
  [26, 3],
  s,
  [22, 13],
  66,
  c,
  [17, 3],
  68,
  c,
  [4, 3],
  s,
  [29, 13],
  s,
  [37, 28],
  s,
  [34, 31],
  s,
  [35, 31],
  s,
  [30, 31],
  s,
  [31, 31],
  s,
  [32, 31],
  1,
  128,
  86,
  c,
  [268, 6],
  75,
  76,
  77,
  81,
  c,
  [327, 5],
  84,
  c,
  [278, 8],
  128,
  84,
  88,
  89,
  s,
  [10, 13],
  75,
  90,
  s,
  [75, 4],
  81,
  81,
  34,
  81,
  c,
  [49, 4],
  s,
  [81, 4],
  c,
  [43, 8],
  82,
  82,
  34,
  82,
  c,
  [20, 4],
  s,
  [82, 4],
  c,
  [20, 8],
  s,
  [84, 4],
  93,
  94,
  95,
  s,
  [84, 14],
  97,
  84,
  84,
  77,
  31,
  34,
  77,
  c,
  [381, 12],
  c,
  [16, 16],
  c,
  [410, 13],
  c,
  [13, 13],
  s,
  [94, 24],
  s,
  [96, 24],
  s,
  [97, 24],
  s,
  [98, 24],
  s,
  [99, 24],
  s,
  [100, 24],
  s,
  [101, 24],
  s,
  [102, 24],
  s,
  [103, 27],
  106,
  46,
  104,
  140,
  108,
  s,
  [113, 24],
  s,
  [114, 24],
  55,
  111,
  110,
  56,
  57,
  s,
  [12, 13],
  s,
  [117, 7],
  s,
  [119, 3],
  113,
  s,
  [119, 4],
  s,
  [122, 8],
  s,
  [123, 8],
  s,
  [124, 8],
  s,
  [125, 8],
  55,
  111,
  114,
  56,
  57,
  s,
  [14, 13],
  115,
  123,
  116,
  s,
  [118, 4, 1],
  s,
  [17, 13],
  s,
  [18, 13],
  55,
  111,
  124,
  56,
  57,
  s,
  [21, 3],
  125,
  s,
  [21, 10],
  55,
  111,
  126,
  56,
  57,
  127,
  55,
  111,
  128,
  56,
  57,
  130,
  129,
  2,
  s,
  [39, 26],
  s,
  [40, 26],
  129,
  136,
  133,
  134,
  135,
  139,
  138,
  c,
  [649, 15],
  c,
  [503, 8],
  143,
  141,
  140,
  142,
  145,
  s,
  [72, 7],
  s,
  [57, 27],
  146,
  s,
  [60, 27],
  s,
  [61, 27],
  s,
  [62, 27],
  s,
  [63, 27],
  s,
  [64, 27],
  s,
  [65, 27],
  s,
  [38, 5],
  c,
  [1081, 3],
  s,
  [36, 3],
  3,
  4,
  s,
  [9, 13],
  79,
  79,
  34,
  79,
  c,
  [253, 4],
  s,
  [79, 4],
  c,
  [248, 8],
  80,
  80,
  34,
  80,
  c,
  [20, 4],
  s,
  [80, 4],
  c,
  [20, 8],
  s,
  [83, 4],
  c,
  [853, 3],
  s,
  [83, 14],
  97,
  83,
  83,
  s,
  [89, 24],
  s,
  [90, 24],
  s,
  [91, 24],
  s,
  [95, 24],
  s,
  [112, 24],
  150,
  149,
  76,
  90,
  76,
  152,
  151,
  s,
  [92, 4],
  c,
  [151, 3],
  s,
  [92, 14],
  97,
  c,
  [20, 3],
  s,
  [93, 4],
  94,
  95,
  s,
  [93, 14],
  97,
  93,
  93,
  46,
  153,
  141,
  108,
  s,
  [105, 24],
  155,
  s,
  [107, 24],
  s,
  [109, 4],
  s,
  [110, 4],
  s,
  [111, 4],
  s,
  [11, 13],
  158,
  55,
  142,
  56,
  57,
  s,
  [116, 7],
  160,
  56,
  57,
  162,
  s,
  [13, 13],
  s,
  [15, 13],
  s,
  [66, 7],
  s,
  [67, 7],
  s,
  [68, 7],
  s,
  [69, 7],
  s,
  [70, 7],
  s,
  [71, 7],
  164,
  c,
  [423, 3],
  s,
  [33, 4],
  s,
  [19, 13],
  s,
  [20, 13],
  s,
  [23, 13],
  s,
  [24, 13],
  166,
  s,
  [72, 7],
  167,
  s,
  [28, 13],
  130,
  c,
  [741, 4],
  s,
  [132, 5],
  170,
  s,
  [72, 7],
  s,
  [135, 5],
  s,
  [136, 5],
  s,
  [137, 5],
  s,
  [42, 26],
  172,
  s,
  [48, 24],
  173,
  175,
  s,
  [72, 7],
  177,
  s,
  [72, 7],
  179,
  s,
  [72, 7],
  s,
  [55, 27],
  180,
  c,
  [995, 6],
  s,
  [58, 27],
  s,
  [59, 27],
  182,
  55,
  111,
  181,
  56,
  57,
  78,
  78,
  34,
  78,
  c,
  [666, 4],
  s,
  [78, 4],
  c,
  [666, 8],
  s,
  [85, 24],
  s,
  [87, 24],
  s,
  [86, 24],
  s,
  [88, 24],
  s,
  [104, 24],
  s,
  [108, 4],
  s,
  [106, 24],
  s,
  [115, 7],
  183,
  143,
  s,
  [120, 7],
  s,
  [121, 7],
  s,
  [126, 7],
  s,
  [127, 7],
  55,
  111,
  184,
  56,
  57,
  s,
  [139, 7],
  185,
  c,
  [284, 6],
  186,
  187,
  s,
  [131, 5],
  188,
  c,
  [14, 6],
  s,
  [134, 5],
  189,
  c,
  [1181, 23],
  45,
  45,
  191,
  s,
  [45, 24],
  s,
  [46, 26],
  192,
  c,
  [89, 6],
  s,
  [53, 27],
  193,
  c,
  [34, 6],
  s,
  [54, 27],
  194,
  c,
  [34, 6],
  s,
  [52, 27],
  s,
  [56, 27],
  195,
  s,
  [74, 25],
  c,
  [831, 3],
  s,
  [138, 7],
  197,
  s,
  [26, 13],
  s,
  [27, 13],
  s,
  [133, 5],
  s,
  [43, 26],
  s,
  [47, 24],
  s,
  [44, 26],
  s,
  [49, 27],
  s,
  [50, 27],
  s,
  [51, 27],
  s,
  [73, 25],
  s,
  [118, 7],
  s,
  [25, 13]
])
}),
defaultActions: bda({
  idx: u([
  0,
  2,
  5,
  11,
  14,
  s,
  [17, 8, 1],
  29,
  s,
  [38, 9, 1],
  48,
  49,
  51,
  52,
  s,
  [54, 4, 1],
  59,
  61,
  62,
  69,
  70,
  71,
  76,
  s,
  [78, 7, 1],
  s,
  [86, 4, 1],
  s,
  [93, 5, 1],
  104,
  s,
  [106, 5, 1],
  112,
  s,
  [114, 8, 1],
  s,
  [123, 5, 1],
  130,
  132,
  s,
  [134, 4, 1],
  143,
  145,
  146,
  s,
  [149, 8, 1],
  s,
  [158, 5, 1],
  164,
  168,
  170,
  s,
  [173, 4, 2],
  s,
  [180, 4, 2],
  s,
  [187, 11, 1]
]),
  goto: u([
  6,
  8,
  7,
  16,
  22,
  29,
  37,
  34,
  35,
  30,
  31,
  32,
  1,
  10,
  94,
  s,
  [96, 8, 1],
  113,
  114,
  12,
  117,
  s,
  [122, 4, 1],
  14,
  17,
  18,
  2,
  39,
  40,
  57,
  s,
  [60, 6, 1],
  38,
  36,
  3,
  4,
  9,
  89,
  90,
  91,
  95,
  112,
  105,
  107,
  109,
  110,
  111,
  11,
  116,
  13,
  15,
  s,
  [66, 6, 1],
  33,
  19,
  20,
  23,
  24,
  28,
  132,
  135,
  136,
  137,
  42,
  55,
  58,
  59,
  85,
  87,
  86,
  88,
  104,
  108,
  106,
  115,
  143,
  120,
  121,
  126,
  127,
  139,
  131,
  134,
  46,
  53,
  54,
  52,
  56,
  74,
  138,
  26,
  27,
  133,
  43,
  47,
  44,
  49,
  50,
  51,
  73,
  118,
  25
])
}),
parseError: function parseError(str, hash, ExceptionClass) {
    if (hash.recoverable) {
        if (typeof this.trace === 'function') {
            this.trace(str);
        }
        hash.destroy();             // destroy... well, *almost*!
    } else {
        if (typeof this.trace === 'function') {
            this.trace(str);
        }
        if (!ExceptionClass) {
            ExceptionClass = this.JisonParserError;
        }
        throw new ExceptionClass(str, hash);
    }
},
parse: function parse(input) {
    let self = this;
    let stack = new Array(128);         // token stack: stores token which leads to state at the same index (column storage)
    let sstack = new Array(128);        // state stack: stores states (column storage)

    let vstack = new Array(128);        // semantic value stack
    let lstack = new Array(128);        // location stack
    let table = this.table;
    let sp = 0;                         // 'stack pointer': index into the stacks
    let yyloc;

    let symbol = 0;
    let preErrorSymbol = 0;
    let lastEofErrorStateDepth = Infinity;
    let recoveringErrorInfo = null;
    let recovering = 0;                 // (only used when the grammar contains error recovery rules)
    const TERROR = this.TERROR;
    const EOF = this.EOF;
    const ERROR_RECOVERY_TOKEN_DISCARD_COUNT = (this.options.errorRecoveryTokenDiscardCount | 0) || 3;
    const NO_ACTION = [ 0, 198 /* === table.length :: ensures that anyone using this new state will fail dramatically! */];

    let lexer;
    if (this.__lexer__) {
        lexer = this.__lexer__;
    } else {
        lexer = this.__lexer__ = Object.create(this.lexer);
    }

    // reset closure-dependent callback(s) which will be set up further down:
    this.cleanupAfterParse = null;

    this.__error_infos = [];                      // INTERNAL USE ONLY: the set of parseErrorInfo objects created since the last cleanup

    this.__error_recovery_infos = [];             // INTERNAL USE ONLY: the set of parseErrorInfo objects created since the last cleanup

    let sharedState_yy = {
        parseError: undefined,
        quoteName: undefined,
        lexer: undefined,
        parser: undefined,
        pre_parse: undefined,
        post_parse: undefined,
        pre_lex: undefined,
        post_lex: undefined      // WARNING: must be written this way for the code expanders to work correctly!
    };

    const ASSERT = (
        typeof assert !== 'function' ?
            function JisonAssert(cond, msg) {
                if (!cond) {
                    throw new Error('assertion failed: ' + (msg || '***'));
                }
            } :
            assert
    );

    this.yyGetSharedState = function yyGetSharedState() {
        return sharedState_yy;
    };


    this.yyGetErrorInfoTrack = function yyGetErrorInfoTrack() {
        return recoveringErrorInfo;
    };


    // shallow clone objects & arrays, straight copy of simple `src` values
    // e.g. `lexer.yytext` MAY be a complex value object,
    // rather than a simple string/value.
    //
    // https://jsperf.com/new-array-vs-splice-vs-slice/72
    // https://jsperf.com/instanceof-vs-typeof/20
    // benchmark:: http://127.0.0.1:8080/example/jsperf/#testfile=test0020-typeof-instanceof-isArray.json5
    // benchmark:: http://127.0.0.1:8080/example/jsperf/?333#testfile=test0021-shallow-clones.json5
    //
    function shallow_copy(src) {
        if (src && typeof src === 'object') {
            // non-Object-type objects, e.g. RegExp, Date, etc., can usually be shallow cloned
            // using their constructor:
            if (src.constructor !== Object) {
                if (Array.isArray(src)) {
                    return src.slice();
                }
                let dst = new src.constructor(src);

                // and make sure all custom attributes are added to the clone:
                shallow_copy_noclobber(dst, src);
                return dst;
            }
            // native objects must be cloned a different way:
            {
                //return Object.assign({}, src);
                let dst = {};
                shallow_copy_noclobber(dst, src);
                return dst;
            }
        }
        return src;
    }
    // add elements from `src` to `dst` when:
    // - either the element does not yet exist in `src`
    // - or exists in `src` but is NULL or UNDEFINED there, while its value is non-NULL in `dst`
    function shallow_copy_noclobber(dst, src) {
        const chk = Object.prototype.hasOwnProperty;
        for (let k in src) {
            if (!(k in dst)) {
                if (chk.call(src, k)) {
                    dst[k] = src[k];
                }
            } else if (src[k] != null && dst[k] == null && chk.call(src, k)) {
                dst[k] = src[k];
            }
        }
    }
    function copy_yylloc_native(loc) {
        let rv = shallow_copy(loc);
        // shallow copy the yylloc ranges info to prevent us from modifying the original arguments' entries:
        if (rv) {
            rv.range = rv.range.slice();
        }
        return rv;
    }

    // copy state
    shallow_copy_noclobber(sharedState_yy, this.yy);

    sharedState_yy.lexer = lexer;
    sharedState_yy.parser = this;

    // allow userland code to override the yytext and yylloc copy/clone functions:
    this.copy_yytext = this.options.copy_yytext || sharedState_yy.copy_yytext || shallow_copy;
    this.copy_yylloc = this.options.copy_yylloc || sharedState_yy.copy_yylloc || copy_yylloc_native;





    // *Always* setup `yyError`, `YYRECOVERING`, `yyErrOk` and `yyClearIn` functions as it is paramount
    // to have *their* closure match ours -- if we only set them up once,
    // any subsequent `parse()` runs will fail in very obscure ways when
    // these functions are invoked in the user action code block(s) as
    // their closure will still refer to the `parse()` instance which set
    // them up. Hence we MUST set them up at the start of every `parse()` run!
    if (this.yyError) {
        this.yyError = function yyError(str /*, ...args */) {








let error_rule_depth = (this.options.parserErrorsAreRecoverable ? locateNearestErrorRecoveryRule(state) : -1);
            let expected = this.collect_expected_token_set(state);
            let hash = this.constructParseErrorInfo(str, null, expected, (error_rule_depth >= 0));
            // append to the old one?
            if (recoveringErrorInfo) {
                let esp = recoveringErrorInfo.info_stack_pointer;

                recoveringErrorInfo.symbol_stack[esp] = symbol;
                let v = this.shallowCopyErrorInfo(hash);
                v.yyError = true;
                v.errorRuleDepth = error_rule_depth;
                v.recovering = recovering;
                // v.stackSampleLength = error_rule_depth + EXTRA_STACK_SAMPLE_DEPTH;

                recoveringErrorInfo.value_stack[esp] = v;
                recoveringErrorInfo.location_stack[esp] = this.copy_yylloc(lexer.yylloc);
                recoveringErrorInfo.state_stack[esp] = newState || NO_ACTION[1];

                ++esp;
                recoveringErrorInfo.info_stack_pointer = esp;
            } else {
                recoveringErrorInfo = this.shallowCopyErrorInfo(hash);
                recoveringErrorInfo.yyError = true;
                recoveringErrorInfo.errorRuleDepth = error_rule_depth;
                recoveringErrorInfo.recovering = recovering;
            }


            // Add any extra args to the hash under the name `extra_error_attributes`:
            let args = Array.prototype.slice.call(arguments, 1);
            if (args.length) {
                hash.extra_error_attributes = args;
            }

            return this.parseError(str, hash, this.JisonParserError);
        };
    }







    // Does the shared state override the default `parseError` that already comes with this instance?
    if (typeof sharedState_yy.parseError === 'function') {
        this.parseError = function parseErrorAlt(str, hash, ExceptionClass) {
            if (!ExceptionClass) {
                ExceptionClass = this.JisonParserError;
            }
            return sharedState_yy.parseError.call(this, str, hash, ExceptionClass);
        };
    } else {
        this.parseError = this.originalParseError;
    }

    // Does the shared state override the default `quoteName` that already comes with this instance?
    if (typeof sharedState_yy.quoteName === 'function') {
        this.quoteName = function quoteNameAlt(id_str) {
            return sharedState_yy.quoteName.call(this, id_str);
        };
    } else {
        this.quoteName = this.originalQuoteName;
    }

    // set up the cleanup function; make it an API so that external code can re-use this one in case of
    // calamities or when the `%options no-try-catch` option has been specified for the grammar, in which
    // case this parse() API method doesn't come with a `finally { ... }` block any more!
    //
    // NOTE: as this API uses parse() as a closure, it MUST be set again on every parse() invocation,
    //       or else your `sharedState`, etc. references will be *wrong*!
    this.cleanupAfterParse = function parser_cleanupAfterParse(resultValue, invoke_post_methods, do_not_nuke_errorinfos) {
        let rv;

        if (invoke_post_methods) {
            let hash;

            if (sharedState_yy.post_parse || this.post_parse) {
                // create an error hash info instance: we re-use this API in a **non-error situation**
                // as this one delivers all parser internals ready for access by userland code.
                hash = this.constructParseErrorInfo(null /* no error! */, null /* no exception! */, null, false);
            }

            if (sharedState_yy.post_parse) {
                rv = sharedState_yy.post_parse.call(this, sharedState_yy, resultValue, hash);
                if (typeof rv !== 'undefined') resultValue = rv;
            }
            if (this.post_parse) {
                rv = this.post_parse.call(this, sharedState_yy, resultValue, hash);
                if (typeof rv !== 'undefined') resultValue = rv;
            }

            // cleanup:
            if (hash && hash.destroy) {
                hash.destroy();
            }
        }

        if (this.__reentrant_call_depth > 1) return resultValue;        // do not (yet) kill the sharedState when this is a reentrant run.

        // clean up the lingering lexer structures as well:
        if (lexer.cleanupAfterLex) {
            lexer.cleanupAfterLex(do_not_nuke_errorinfos);
        }

        // prevent lingering circular references from causing memory leaks:
        if (sharedState_yy) {
            sharedState_yy.lexer = undefined;
            sharedState_yy.parser = undefined;
            if (lexer.yy === sharedState_yy) {
                lexer.yy = undefined;
            }
        }
        sharedState_yy = undefined;
        this.parseError = this.originalParseError;
        this.quoteName = this.originalQuoteName;

        // nuke the vstack[] array at least as that one will still reference obsoleted user values.
        // To be safe, we nuke the other internal stack columns as well...
        stack.length = 0;               // fastest way to nuke an array without overly bothering the GC
        sstack.length = 0;
        lstack.length = 0;
        vstack.length = 0;
        sp = 0;

        // nuke the error hash info instances created during this run.
        // Userland code must COPY any data/references
        // in the error hash instance(s) it is more permanently interested in.
        if (!do_not_nuke_errorinfos) {
            for (let i = this.__error_infos.length - 1; i >= 0; i--) {
                let el = this.__error_infos[i];
                if (el && typeof el.destroy === 'function') {
                    el.destroy();
                }
            }
            this.__error_infos.length = 0;


            for (let i = this.__error_recovery_infos.length - 1; i >= 0; i--) {
                let el = this.__error_recovery_infos[i];
                if (el && typeof el.destroy === 'function') {
                    el.destroy();
                }
            }
            this.__error_recovery_infos.length = 0;

            // `recoveringErrorInfo` is also part of the `__error_recovery_infos` array,
            // hence has been destroyed already: no need to do that *twice*.
            if (recoveringErrorInfo) {
                recoveringErrorInfo = undefined;
            }


        }

        return resultValue;
    };

    // merge yylloc info into a new yylloc instance.
    //
    // `first_index` and `last_index` MAY be UNDEFINED/NULL or these are indexes into the `lstack[]` location stack array.
    //
    // `first_yylloc` and `last_yylloc` MAY be UNDEFINED/NULL or explicit (custom or regular) `yylloc` instances, in which
    // case these override the corresponding first/last indexes.
    //
    // `dont_look_back` is an optional flag (default: FALSE), which instructs this merge operation NOT to search
    // through the parse location stack for a location, which would otherwise be used to construct the new (epsilon!)
    // yylloc info.
    //
    // Note: epsilon rule's yylloc situation is detected by passing both `first_index` and `first_yylloc` as UNDEFINED/NULL.
    this.yyMergeLocationInfo = function parser_yyMergeLocationInfo(first_index, last_index, first_yylloc, last_yylloc, dont_look_back) {
        let i1 = first_index | 0;
        let i2 = last_index | 0;
        let l1 = first_yylloc;
        let l2 = last_yylloc;
        let rv;

        // rules:
        // - first/last yylloc entries override first/last indexes

        if (!l1) {
            if (first_index != null) {
                for (let i = i1; i <= i2; i++) {
                    l1 = lstack[i];
                    if (l1) {
                        break;
                    }
                }
            }
        }

        if (!l2) {
            if (last_index != null) {
                for (let i = i2; i >= i1; i--) {
                    l2 = lstack[i];
                    if (l2) {
                        break;
                    }
                }
            }
        }

        // - detect if an epsilon rule is being processed and act accordingly:
        if (!l1 && first_index == null) {
            // epsilon rule span merger. With optional look-ahead in l2.
            if (!dont_look_back) {
                for (let i = (i1 || sp) - 1; i >= 0; i--) {
                    l1 = lstack[i];
                    if (l1) {
                        break;
                    }
                }
            }
            if (!l1) {
                if (!l2) {
                    // when we still don't have any valid yylloc info, we're looking at an epsilon rule
                    // without look-ahead and no preceding terms and/or `dont_look_back` set:
                    // in that case we ca do nothing but return NULL/UNDEFINED:
                    return null;
                }
                // shallow-copy L2: after all, we MAY be looking
                // at unconventional yylloc info objects...
                rv = this.copy_yylloc(l2);
                return rv;
            }
            // shallow-copy L1, then adjust first col/row 1 column past the end.
            rv = this.copy_yylloc(l1);
            rv.first_line = rv.last_line;
            rv.first_column = rv.last_column;
            rv.range[0] = rv.range[1];

            if (l2) {
                // shallow-mixin L2, then adjust last col/row accordingly.
                shallow_copy_noclobber(rv, l2);
                rv.last_line = l2.last_line;
                rv.last_column = l2.last_column;
                rv.range[1] = l2.range[1];
            }
            return rv;
        }

        if (!l1) {
            l1 = l2;
            l2 = null;
        }
        if (!l1) {
            return null;
        }

        // shallow-copy L1|L2, before we try to adjust the yylloc values: after all, we MAY be looking
        // at unconventional yylloc info objects...
        rv = this.copy_yylloc(l1);

        if (l2) {
            shallow_copy_noclobber(rv, l2);
            rv.last_line = l2.last_line;
            rv.last_column = l2.last_column;
            rv.range[1] = l2.range[1];
        }

        return rv;
    };

    // NOTE: as this API uses parse() as a closure, it MUST be set again on every parse() invocation,
    //       or else your `lexer`, `sharedState`, etc. references will be *wrong*!
    this.constructParseErrorInfo = function parser_constructParseErrorInfo(msg, ex, expected, recoverable) {
        const pei = {
            errStr: msg,
            exception: ex,
            text: lexer.match,
            value: this.copy_yytext(lexer.yytext),
            token: this.describeSymbol(symbol) || symbol,
            token_id: symbol,
            line: lexer.yylineno,
            loc: this.copy_yylloc(lexer.yylloc),
            expected,
            recoverable,
            state,
            action,
            new_state: newState,
            symbol_stack: stack,
            state_stack: sstack,
            value_stack: vstack,
            location_stack: lstack,
            stack_pointer: sp,
            yy: sharedState_yy,
            lexer,
            parser: this,

            // and make sure the error info doesn't stay due to potential
            // ref cycle via userland code manipulations.
            // These would otherwise all be memory leak opportunities!
            //
            // Note that only array and object references are nuked as those
            // constitute the set of elements which can produce a cyclic ref.
            // The rest of the members is kept intact as they are harmless.
            destroy: function destructParseErrorInfo() {
                // remove cyclic references added to error info:
                // info.yy = null;
                // info.lexer = null;
                // info.value = null;
                // info.value_stack = null;
                // ...
                const rec = !!this.recoverable;
                for (let key in this) {
                    if (this[key] && this.hasOwnProperty(key) && typeof this[key] === 'object') {
                        this[key] = undefined;
                    }
                }
                this.recoverable = rec;
            }
        };
        // track this instance so we can `destroy()` it once we deem it superfluous and ready for garbage collection!
        this.__error_infos.push(pei);
        return pei;
    };

    // clone some parts of the (possibly enhanced!) errorInfo object
    // to give them some persistence.
    this.shallowCopyErrorInfo = function parser_shallowCopyErrorInfo(p) {
        let rv = shallow_copy(p);

        // remove the large parts which can only cause cyclic references
        // and are otherwise available from the parser kernel anyway.
        delete rv.sharedState_yy;
        delete rv.parser;
        delete rv.lexer;

        // lexer.yytext MAY be a complex value object, rather than a simple string/value:
        rv.value = this.copy_yytext(rv.value);

        // yylloc info:
        rv.loc = this.copy_yylloc(rv.loc);

        // the 'expected' set won't be modified, so no need to clone it:
        //rv.expected = rv.expected.slice();

        // symbol stack is a simple array:
        rv.symbol_stack = rv.symbol_stack.slice();
        // ditto for state stack:
        rv.state_stack = rv.state_stack.slice();
        // clone the yylloc's in the location stack?:
        rv.location_stack = rv.location_stack.map(this.copy_yylloc);
        // and the value stack may carry both simple and complex values:
        // shallow-copy the latter.
        rv.value_stack = rv.value_stack.map(this.copy_yytext);

        // and we don't bother with the sharedState_yy reference:
        //delete rv.yy;

        // now we prepare for tracking the COMBINE actions
        // in the error recovery code path:
        //
        // as we want to keep the maximum error info context, we
        // *scan* the state stack to find the first *empty* slot.
        // This position will surely be AT OR ABOVE the current
        // stack pointer, but we want to keep the 'used but discarded'
        // part of the parse stacks *intact* as those slots carry
        // error context that may be useful when you want to produce
        // very detailed error diagnostic reports.
        //
        // ### Purpose of each stack pointer:
        //
        // - stack_pointer: points at the top of the parse stack
        //                  **as it existed at the time of the error
        //                  occurrence, i.e. at the time the stack
        //                  snapshot was taken and copied into the
        //                  errorInfo object.**
        // - base_pointer:  the bottom of the **empty part** of the
        //                  stack, i.e. **the start of the rest of
        //                  the stack space /above/ the existing
        //                  parse stack. This section will be filled
        //                  by the error recovery process as it
        //                  travels the parse state machine to
        //                  arrive at the resolving error recovery rule.**
        // - info_stack_pointer:
        //                  this stack pointer points to the **top of
        //                  the error recovery tracking stack space**, i.e.
        //                  this stack pointer takes up the role of
        //                  the `stack_pointer` for the error recovery
        //                  process. Any mutations in the **parse stack**
        //                  are **copy-appended** to this part of the
        //                  stack space, keeping the bottom part of the
        //                  stack (the 'snapshot' part where the parse
        //                  state at the time of error occurrence was kept)
        //                  intact.
        // - root_failure_pointer:
        //                  copy of the `stack_pointer`...
        //
        {
            let i;
            for (i = rv.stack_pointer; rv.state_stack[i] != null; i++) {
                // empty
            }
            rv.base_pointer = i;
            rv.info_stack_pointer = i;
        }

        rv.root_failure_pointer = rv.stack_pointer;

        // track this instance so we can `destroy()` it once we deem it superfluous and ready for garbage collection!
        this.__error_recovery_infos.push(rv);

        return rv;
    };

    function getNonTerminalFromCode(symbol) {
        let tokenName = self.getSymbolName(symbol);
        if (!tokenName) {
            tokenName = symbol;
        }
        return tokenName;
    }


    function stdLex() {
        let token = lexer.lex();
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }

        if (typeof Jison !== 'undefined' && Jison.lexDebugger) {
            let tokenName = self.getSymbolName(token || EOF);
            if (!tokenName) {
                tokenName = token;
            }

            Jison.lexDebugger.push({
                tokenName,
                tokenText: lexer.match,
                tokenValue: lexer.yytext
            });
        }

        return token || EOF;
    }

    function fastLex() {
        let token = lexer.fastLex();
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }

        if (typeof Jison !== 'undefined' && Jison.lexDebugger) {
            let tokenName = self.getSymbolName(token || EOF);
            if (!tokenName) {
                tokenName = token;
            }

            Jison.lexDebugger.push({
                tokenName,
                tokenText: lexer.match,
                tokenValue: lexer.yytext
            });
        }

        return token || EOF;
    }

    let lex = stdLex;


    let state, action, r, t;
    let yyval = {
        $: true,
        _$: undefined,
        yy: sharedState_yy
    };
    let p;
    let yyrulelen;
    let this_production;
    let newState;
    let retval = false;


    // Return the rule stack depth where the nearest error rule can be found.
    // Return -1 when no error recovery rule was found.
    function locateNearestErrorRecoveryRule(state) {
        let stack_probe = sp - 1;
        let depth = 0;

        // try to recover from error
        while (stack_probe >= 0) {
            // check for error recovery rule in this state








const t = (table[state] && table[state][TERROR]) || NO_ACTION;
            if (t[0]) {
                // We need to make sure we're not cycling forever:
                // once we hit EOF, even when we `yyerrok()` an error, we must
                // prevent the core from running forever,
                // e.g. when parent rules are still expecting certain input to
                // follow after this, for example when you handle an error inside a set
                // of braces which are matched by a parent rule in your grammar.
                //
                // Hence we require that every error handling/recovery attempt
                // *after we've hit EOF* has a diminishing state stack: this means
                // we will ultimately have unwound the state stack entirely and thus
                // terminate the parse in a controlled fashion even when we have
                // very complex error/recovery code interplay in the core + user
                // action code blocks:








if (symbol === EOF) {
                    if (lastEofErrorStateDepth > sp - 1 - depth) {
                        lastEofErrorStateDepth = sp - 1 - depth;
                    } else {








--stack_probe; // popStack(1): [symbol, action]
                        state = sstack[stack_probe];
                        ++depth;
                        continue;
                    }
                }
                return depth;
            }
            if (state === 0 /* $accept rule */ || stack_probe < 1) {








return -1; // No suitable error recovery rule available.
            }
            --stack_probe; // popStack(1): [symbol, action]
            state = sstack[stack_probe];
            ++depth;
        }








return -1; // No suitable error recovery rule available.
    }


    try {
        this.__reentrant_call_depth++;

        lexer.setInput(input, sharedState_yy);

        // NOTE: we *assume* no lexer pre/post handlers are set up *after*
        // this initial `setInput()` call: hence we can now check and decide
        // whether we'll go with the standard, slower, lex() API or the
        // `fast_lex()` one:
        if (typeof lexer.canIUse === 'function') {
            let lexerInfo = lexer.canIUse();
            if (lexerInfo.fastLex && typeof fastLex === 'function') {
                lex = fastLex;
            }
        }

        yyloc = this.copy_yylloc(lexer.yylloc);
        lstack[sp] = yyloc;
        vstack[sp] = null;
        sstack[sp] = 0;
        stack[sp] = 0;
        ++sp;





        if (this.pre_parse) {
            this.pre_parse.call(this, sharedState_yy);
        }
        if (sharedState_yy.pre_parse) {
            sharedState_yy.pre_parse.call(this, sharedState_yy);
        }

        newState = sstack[sp - 1];
        for (;;) {
            // retrieve state number from top of stack
            state = newState;               // sstack[sp - 1];

            // use default actions if available
            if (this.defaultActions[state]) {
                action = 2;
                newState = this.defaultActions[state];
            } else {
                // The single `==` condition below covers both these `===` comparisons in a single
                // operation:
                //
                //     if (symbol === null || typeof symbol === 'undefined') ...
                if (!symbol) {
                    symbol = lex();
                }
                // read action for current state and first input
                t = (table[state] && table[state][symbol]) || NO_ACTION;
                newState = t[1];
                action = t[0];








// handle parse error
                if (!action) {
                    // first see if there's any chance at hitting an error recovery rule:
                    let error_rule_depth = locateNearestErrorRecoveryRule(state);
                    let errStr = null;
                    let errSymbolDescr = (this.describeSymbol(symbol) || symbol);
                    let expected = this.collect_expected_token_set(state);

                    if (!recovering) {
                        // Report error
                        errStr = 'Parse error';
                        if (typeof lexer.yylineno === 'number') {
                            errStr += ' on line ' + (lexer.yylineno + 1);
                        }

                        if (typeof lexer.showPosition === 'function') {
                            errStr += ':\n' + lexer.showPosition(79 - 10, 10) + '\n';
                        } else {
                            errStr += ': ';
                        }
                        if (expected.length) {
                            errStr += 'Expecting ' + expected.join(', ') + ', got unexpected ' + errSymbolDescr;
                        } else {
                            errStr += 'Unexpected ' + errSymbolDescr;
                        }

                        p = this.constructParseErrorInfo(errStr, null, expected, (error_rule_depth >= 0));

                        // DO NOT cleanup the old one before we start the new error info track:
                        // the old one will *linger* on the error stack and stay alive until we
                        // invoke the parser's cleanup API!
                        recoveringErrorInfo = this.shallowCopyErrorInfo(p);








r = this.parseError(p.errStr, p, this.JisonParserError);
                        if (typeof r !== 'undefined') {
                            retval = r;
                            break;
                        }

                        // Protect against overly blunt userland `parseError` code which *sets*
                        // the `recoverable` flag without properly checking first:
                        // we always terminate the parse when there's no recovery rule available anyhow!
                        if (!p.recoverable || error_rule_depth < 0) {
                            break;
                        } else {
                            // TODO: allow parseError callback to edit symbol and or state at the start of the error recovery process...
                        }
                    }








let esp = recoveringErrorInfo.info_stack_pointer;

                    // just recovered from another error
                    if (recovering === ERROR_RECOVERY_TOKEN_DISCARD_COUNT && error_rule_depth >= 0) {
                        // Pick up the lexer details for the current symbol as that one is not 'look-ahead' any more:



                        yyloc = this.copy_yylloc(lexer.yylloc);

                        // SHIFT current lookahead and grab another
                        recoveringErrorInfo.symbol_stack[esp] = symbol;

                        recoveringErrorInfo.location_stack[esp] = yyloc;
                        recoveringErrorInfo.state_stack[esp] = newState; // push state
                        ++esp;

                        preErrorSymbol = 0;
                        symbol = lex();








}

                    // try to recover from error
                    if (error_rule_depth < 0) {
                        ASSERT(recovering > 0, 'Line 1048');
                        recoveringErrorInfo.info_stack_pointer = esp;

                        // barf a fatal hairball when we're out of look-ahead symbols and none hit a match
                        // while we are still busy recovering from another error:
                        let po = this.__error_infos[this.__error_infos.length - 1];

                        // Report error
                        if (typeof lexer.yylineno === 'number') {
                            errStr = 'Parsing halted on line ' + (lexer.yylineno + 1) + ' while starting to recover from another error';
                        } else {
                            errStr = 'Parsing halted while starting to recover from another error';
                        }

                        if (po) {
                            errStr += ' -- previous error which resulted in this fatal result: ' + po.errStr;
                        } else {
                            errStr += ': ';
                        }

                        if (typeof lexer.showPosition === 'function') {
                            errStr += '\n' + lexer.showPosition(79 - 10, 10) + '\n';
                        }
                        if (expected.length) {
                            errStr += 'Expecting ' + expected.join(', ') + ', got unexpected ' + errSymbolDescr;
                        } else {
                            errStr += 'Unexpected ' + errSymbolDescr;
                        }

                        p = this.constructParseErrorInfo(errStr, null, expected, false);
                        if (po) {
                            p.extra_error_attributes = po;
                        }

                        r = this.parseError(p.errStr, p, this.JisonParserError);
                        if (typeof r !== 'undefined') {
                            retval = r;
                        }
                        break;
                    }

                    preErrorSymbol = (symbol === TERROR ? 0 : symbol); // save the lookahead token
                    symbol = TERROR;            // insert generic error symbol as new lookahead

                    const EXTRA_STACK_SAMPLE_DEPTH = 3;

                    // REDUCE/COMBINE the pushed terms/tokens to a new ERROR token:
                    recoveringErrorInfo.symbol_stack[esp] = preErrorSymbol;
                    if (errStr) {
                        recoveringErrorInfo.value_stack[esp] = {
                            yytext: this.copy_yytext(lexer.yytext),
                            errorRuleDepth: error_rule_depth,
                            errStr,
                            errSymbolDescr,
                            expectedStr: expected,
                            stackSampleLength: error_rule_depth + EXTRA_STACK_SAMPLE_DEPTH
                        };








} else {
                        recoveringErrorInfo.value_stack[esp] = {
                            yytext: this.copy_yytext(lexer.yytext),
                            errorRuleDepth: error_rule_depth,
                            stackSampleLength: error_rule_depth + EXTRA_STACK_SAMPLE_DEPTH
                        };
                    }
                    recoveringErrorInfo.location_stack[esp] = this.copy_yylloc(lexer.yylloc);
                    recoveringErrorInfo.state_stack[esp] = newState || NO_ACTION[1];

                    ++esp;
                    recoveringErrorInfo.info_stack_pointer = esp;

                    yyval.$ = recoveringErrorInfo;
                    yyval._$ = undefined;

                    yyrulelen = error_rule_depth;

                    let combineState = NO_ACTION[1];








r = this.performAction.call(yyval, yyloc, combineState, sp - 1, vstack, lstack);

                    if (typeof r !== 'undefined') {
                        retval = r;
                        break;
                    }

                    // pop off stack
                    sp -= yyrulelen;

                    // and move the top entries + discarded part of the parse stacks onto the error info stack:
                    for (let idx = sp - EXTRA_STACK_SAMPLE_DEPTH, top = idx + yyrulelen; idx < top; idx++, esp++) {
                        recoveringErrorInfo.symbol_stack[esp] = stack[idx];
                        recoveringErrorInfo.value_stack[esp] = vstack[idx];
                        recoveringErrorInfo.location_stack[esp] = lstack[idx];
                        recoveringErrorInfo.state_stack[esp] = sstack[idx];
                    }

                    recoveringErrorInfo.symbol_stack[esp] = TERROR;
                    recoveringErrorInfo.value_stack[esp] = this.copy_yytext(yyval.$);
                    recoveringErrorInfo.location_stack[esp] = this.copy_yylloc(yyval._$);

                    // goto new state = table[STATE][NONTERMINAL]
                    newState = sstack[sp - 1];

                    if (this.defaultActions[newState]) {
                        recoveringErrorInfo.state_stack[esp] = this.defaultActions[newState];
                    } else {
                        t = (table[newState] && table[newState][symbol]) || NO_ACTION;
                        recoveringErrorInfo.state_stack[esp] = t[1];
                    }

                    ++esp;
                    recoveringErrorInfo.info_stack_pointer = esp;

                    // allow N (default: 3) real symbols to be shifted before reporting a new error
                    recovering = ERROR_RECOVERY_TOKEN_DISCARD_COUNT;










                    // Now duplicate the standard parse machine here, at least its initial
                    // couple of rounds until the TERROR symbol is **pushed onto the parse stack**,
                    // as we wish to push something special then!
                    //
                    // Run the state machine in this copy of the parser state machine
                    // until we *either* consume the error symbol (and its related information)
                    // *or* we run into another error while recovering from this one
                    // *or* we execute a `reduce` action which outputs a final parse
                    // result (yes, that MAY happen!).
                    //
                    // We stay in this secondary parse loop until we have completed
                    // the *error recovery phase* as the main parse loop (further below)
                    // is optimized for regular parse operation and DOES NOT cope with
                    // error recovery *at all*.
                    //
                    // We call the secondary parse loop just below the "slow parse loop",
                    // while the main parse loop, which is an almost-duplicate of this one,
                    // yet optimized for regular parse operation, is called the "fast
                    // parse loop".
                    //
                    // Compare this to `bison` & (vanilla) `jison`, both of which have
                    // only a single parse loop, which handles everything. Our goal is
                    // to eke out every drop of performance in the main parse loop...

                    ASSERT(recoveringErrorInfo, 'Line 1204');
                    ASSERT(symbol === TERROR, 'Line 1205');
                    ASSERT(!action, 'Line 1206');
                    let errorSymbolFromParser = true;
                    for (;;) {
                        // retrieve state number from top of stack
                        state = newState;               // sstack[sp - 1];

                        // use default actions if available
                        if (this.defaultActions[state]) {
                            action = 2;
                            newState = this.defaultActions[state];
                        } else {
                            // The single `==` condition below covers both these `===` comparisons in a single
                            // operation:
                            //
                            //     if (symbol === null || typeof symbol === 'undefined') ...
                            if (!symbol) {
                                symbol = lex();
                                // **Warning: Edge Case**: the *lexer* may produce
                                // TERROR tokens of its own volition: *those* TERROR
                                // tokens should be treated like *regular tokens*
                                // i.e. tokens which have a lexer-provided `yyvalue`
                                // and `yylloc`:
                                errorSymbolFromParser = false;
                            }
                            // read action for current state and first input
                            t = (table[state] && table[state][symbol]) || NO_ACTION;
                            newState = t[1];
                            action = t[0];








// encountered another parse error? If so, break out to main loop
                            // and take it from there!
                            if (!action) {










                                ASSERT(recoveringErrorInfo, 'Line 1248');

                                // Prep state variables so that upon breaking out of
                                // this "slow parse loop" and hitting the `continue;`
                                // statement in the outer "fast parse loop" we redo
                                // the exact same state table lookup as the one above
                                // so that the outer=main loop will also correctly
                                // detect the 'parse error' state (`!action`) we have
                                // just encountered above.
                                newState = state;
                                break;
                            }
                        }








switch (action) {
                        // catch misc. parse failures:
                        default:
                            // this shouldn't happen, unless resolve defaults are off
                            //
                            // SILENTLY SIGNAL that the outer "fast parse loop" should
                            // take care of this internal error condition:
                            // prevent useless code duplication now/here.
                            break;

                        // shift:
                        case 1:
                            stack[sp] = symbol;
                            // ### Note/Warning ###
                            //
                            // The *lexer* may also produce TERROR tokens on its own,
                            // so we specifically test for the TERROR we did set up
                            // in the error recovery logic further above!
                            if (symbol === TERROR && errorSymbolFromParser) {
                                // Push a special value onto the stack when we're
                                // shifting the `error` symbol that is related to the
                                // error we're recovering from.
                                ASSERT(recoveringErrorInfo, 'Line 1305');
                                vstack[sp] = recoveringErrorInfo;
                                lstack[sp] = this.yyMergeLocationInfo(null, null, recoveringErrorInfo.loc, lexer.yylloc, true);
                            } else {
                                ASSERT(symbol !== 0, 'Line 1309');
                                ASSERT(preErrorSymbol === 0, 'Line 1310');
                                vstack[sp] = lexer.yytext;
                                lstack[sp] = this.copy_yylloc(lexer.yylloc);
                            }
                            sstack[sp] = newState; // push state

                            ++sp;

                            if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
                                let tokenName = this.getSymbolName(symbol || EOF);
                                if (!tokenName) {
                                    tokenName = symbol;
                                }

                                Jison.parserDebugger.push({
                                    action: 'shift',
                                    text: lexer.yytext,
                                    terminal: tokenName,
                                    terminal_id: symbol
                                });
                            }

                            symbol = 0;
                            // **Warning: Edge Case**: the *lexer* may have produced
                            // TERROR tokens of its own volition: *those* TERROR
                            // tokens should be treated like *regular tokens*
                            // i.e. tokens which have a lexer-provided `yyvalue`
                            // and `yylloc`:
                            errorSymbolFromParser = false;
                            if (!preErrorSymbol) { // normal execution / no error
                                // Pick up the lexer details for the current symbol as that one is not 'look-ahead' any more:



                                yyloc = this.copy_yylloc(lexer.yylloc);

                                if (recovering > 0) {
                                    recovering--;









                                }
                            } else {
                                // error just occurred, resume old lookahead f/ before error, *unless* that drops us straight back into error mode:
                                ASSERT(recovering > 0, 'Line 1352');
                                symbol = preErrorSymbol;
                                preErrorSymbol = 0;









                                // read action for current state and first input
                                t = (table[newState] && table[newState][symbol]) || NO_ACTION;
                                if (!t[0] || symbol === TERROR) {
                                    // forget about that symbol and move forward: this wasn't a 'forgot to insert' error type where
                                    // (simple) stuff might have been missing before the token which caused the error we're
                                    // recovering from now...
                                    //
                                    // Also check if the LookAhead symbol isn't the ERROR token we set as part of the error
                                    // recovery, for then this we would we idling (cycling) on the error forever.
                                    // Yes, this does not take into account the possibility that the *lexer* may have
                                    // produced a *new* TERROR token all by itself, but that would be a very peculiar grammar!









                                    symbol = 0;
                                }
                            }

                            // once we have pushed the special ERROR token value,
                            // we REMAIN in this inner, "slow parse loop" until
                            // the entire error recovery phase has completed.
                            //
                            // ### Note About Edge Case ###
                            //
                            // Userland action code MAY already have 'reset' the
                            // error recovery phase marker `recovering` to ZERO(0)
                            // while the error symbol hasn't been shifted onto
                            // the stack yet. Hence we only exit this "slow parse loop"
                            // when *both* conditions are met!
                            ASSERT(preErrorSymbol === 0, 'Line 1383');
                            if (recovering === 0) {
                                break;
                            }
                            continue;

                        // reduce:
                        case 2:
                            this_production = this.productions_[newState - 1];  // `this.productions_[]` is zero-based indexed while states start from 1 upwards...
                            yyrulelen = this_production[1];








r = this.performAction.call(yyval, yyloc, newState, sp - 1, vstack, lstack);

                            if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
                                let prereduceValue = vstack.slice(sp - yyrulelen, sp);
                                let debuggableProductions = [];
                                for (let debugIdx = yyrulelen - 1; debugIdx >= 0; debugIdx--) {
                                    let debuggableProduction = getNonTerminalFromCode(stack[sp - debugIdx]);
                                    debuggableProductions.push(debuggableProduction);
                                }

                                // find the current nonterminal name (- nolan)
                                let currentNonterminalCode = this_production[0];     // WARNING: nolan's original code takes this one instead:   this.productions_[newState][0];
                                let currentNonterminal = getNonTerminalFromCode(currentNonterminalCode);

                                Jison.parserDebugger.push({
                                    action: 'reduce',
                                    nonterminal: currentNonterminal,
                                    nonterminal_id: currentNonterminalCode,
                                    prereduce: prereduceValue,
                                    result: r,
                                    productions: debuggableProductions,
                                    text: yyval.$
                                });
                            }

                            if (typeof r !== 'undefined') {
                                // signal end of error recovery loop AND end of outer parse loop
                                action = 3;
                                retval = r;

                                if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
                                    Jison.parserDebugger.push({
                                        action: 'accept',
                                        text: retval
                                    });
                                    console.log(Jison.parserDebugger[Jison.parserDebugger.length - 1]);
                                }

                                sp = -2;      // magic number: signal outer "fast parse loop" ACCEPT state that we already have a properly set up `retval` parser return value.
                                break;
                            }

                            // pop off stack
                            sp -= yyrulelen;

                            // don't overwrite the `symbol` variable: use a local var to speed things up:
                            {
                                let ntsymbol = this_production[0];    // push nonterminal (reduce)
                                stack[sp] = ntsymbol;
                                vstack[sp] = yyval.$;
                                lstack[sp] = yyval._$;
                                // goto new state = table[STATE][NONTERMINAL]
                                newState = table[sstack[sp - 1]][ntsymbol];
                                sstack[sp] = newState;
                                ++sp;









                            }
                            continue;

                        // accept:
                        case 3:
                            retval = true;
                            // Return the `$accept` rule's `$$` result, if available.
                            //
                            // Also note that JISON always adds this top-most `$accept` rule (with implicit,
                            // default, action):
                            //
                            //     $accept: <startSymbol> $end
                            //                  %{ $$ = $1; @$ = @1; %}
                            //
                            // which, combined with the parse kernel's `$accept` state behaviour coded below,
                            // will produce the `$$` value output of the <startSymbol> rule as the parse result,
                            // IFF that result is *not* `undefined`. (See also the parser kernel code.)
                            //
                            // In code:
                            //
                            //                  %{
                            //                      @$ = @1;            // if location tracking support is included
                            //                      if (typeof $1 !== 'undefined')
                            //                          return $1;
                            //                      else
                            //                          return true;           // the default parse result if the rule actions don't produce anything
                            //                  %}
                            sp--;
                            if (sp >= 0 && typeof vstack[sp] !== 'undefined') {
                                retval = vstack[sp];
                            }

                            if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
                                Jison.parserDebugger.push({
                                    action: 'accept',
                                    text: retval
                                });
                                console.log(Jison.parserDebugger[Jison.parserDebugger.length - 1]);
                            }

                            sp = -2;      // magic number: signal outer "fast parse loop" ACCEPT state that we already have a properly set up `retval` parser return value.
                            break;
                        }

                        // break out of loop: we accept or fail with error
                        break;
                    }

                    // should we also break out of the regular/outer parse loop,
                    // i.e. did the parser already produce a parse result in here?!
                    // *or* did we hit an unsupported parse state, to be handled
                    // in the `switch/default` code further below?
                    ASSERT(action !== 2, 'Line 1509');
                    if (!action || action === 1) {
                        continue;
                    }
                }


            }








switch (action) {
            // catch misc. parse failures:
            default:
                // this shouldn't happen, unless resolve defaults are off
                if (action instanceof Array) {
                    p = this.constructParseErrorInfo('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol, null, null, false);
                    r = this.parseError(p.errStr, p, this.JisonParserError);
                    if (typeof r !== 'undefined') {
                        retval = r;
                    }
                    break;
                }
                // Another case of better safe than sorry: in case state transitions come out of another error recovery process
                // or a buggy LUT (LookUp Table):
                p = this.constructParseErrorInfo('Parsing halted. No viable error recovery approach available due to internal system failure.', null, null, false);
                r = this.parseError(p.errStr, p, this.JisonParserError);
                if (typeof r !== 'undefined') {
                    retval = r;
                }
                break;

            // shift:
            case 1:
                stack[sp] = symbol;
                vstack[sp] = lexer.yytext;
                lstack[sp] = this.copy_yylloc(lexer.yylloc);
                sstack[sp] = newState; // push state

                if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
                    let tokenName = this.getSymbolName(symbol || EOF);
                    if (!tokenName) {
                        tokenName = symbol;
                    }

                    Jison.parserDebugger.push({
                        action: 'shift',
                        text: lexer.yytext,
                        terminal: tokenName,
                        terminal_id: symbol
                    });
                }

                ++sp;

                symbol = 0;

                ASSERT(preErrorSymbol === 0, 'Line 1619');         // normal execution / no error
                ASSERT(recovering === 0, 'Line 1620');             // normal execution / no error

                // Pick up the lexer details for the current symbol as that one is not 'look-ahead' any more:



                yyloc = this.copy_yylloc(lexer.yylloc);
                continue;

            // reduce:
            case 2:
                ASSERT(preErrorSymbol === 0, 'Line 1631');         // normal execution / no error
                ASSERT(recovering === 0, 'Line 1632');             // normal execution / no error

                this_production = this.productions_[newState - 1];  // `this.productions_[]` is zero-based indexed while states start from 1 upwards...
                yyrulelen = this_production[1];








r = this.performAction.call(yyval, yyloc, newState, sp - 1, vstack, lstack);

                if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
                    let prereduceValue = vstack.slice(sp - yyrulelen, sp);
                    let debuggableProductions = [];
                    for (let debugIdx = yyrulelen - 1; debugIdx >= 0; debugIdx--) {
                        let debuggableProduction = getNonTerminalFromCode(stack[sp - debugIdx]);
                        debuggableProductions.push(debuggableProduction);
                    }

                    // find the current nonterminal name (- nolan)
                    let currentNonterminalCode = this_production[0];     // WARNING: nolan's original code takes this one instead:   this.productions_[newState][0];
                    let currentNonterminal = getNonTerminalFromCode(currentNonterminalCode);

                    Jison.parserDebugger.push({
                        action: 'reduce',
                        nonterminal: currentNonterminal,
                        nonterminal_id: currentNonterminalCode,
                        prereduce: prereduceValue,
                        result: r,
                        productions: debuggableProductions,
                        text: yyval.$
                    });
                }

                if (typeof r !== 'undefined') {
                    retval = r;

                    if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
                        Jison.parserDebugger.push({
                            action: 'accept',
                            text: retval
                        });
                        console.log(Jison.parserDebugger[Jison.parserDebugger.length - 1]);
                    }

                    break;
                }

                // pop off stack
                sp -= yyrulelen;

                // don't overwrite the `symbol` variable: use a local var to speed things up:
                {
                    let ntsymbol = this_production[0];    // push nonterminal (reduce)
                    stack[sp] = ntsymbol;
                    vstack[sp] = yyval.$;
                    lstack[sp] = yyval._$;
                    // goto new state = table[STATE][NONTERMINAL]
                    newState = table[sstack[sp - 1]][ntsymbol];
                    sstack[sp] = newState;
                    ++sp;









                }
                continue;

            // accept:
            case 3:
                if (sp !== -2) {
                    retval = true;
                    // Return the `$accept` rule's `$$` result, if available.
                    //
                    // Also note that JISON always adds this top-most `$accept` rule (with implicit,
                    // default, action):
                    //
                    //     $accept: <startSymbol> $end
                    //                  %{ $$ = $1; @$ = @1; %}
                    //
                    // which, combined with the parse kernel's `$accept` state behaviour coded below,
                    // will produce the `$$` value output of the <startSymbol> rule as the parse result,
                    // IFF that result is *not* `undefined`. (See also the parser kernel code.)
                    //
                    // In code:
                    //
                    //                  %{
                    //                      @$ = @1;            // if location tracking support is included
                    //                      if (typeof $1 !== 'undefined')
                    //                          return $1;
                    //                      else
                    //                          return true;           // the default parse result if the rule actions don't produce anything
                    //                  %}
                    sp--;
                    if (typeof vstack[sp] !== 'undefined') {
                        retval = vstack[sp];
                    }
                }

                if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
                    Jison.parserDebugger.push({
                        action: 'accept',
                        text: retval
                    });
                    console.log(Jison.parserDebugger[Jison.parserDebugger.length - 1]);
                }

                break;
            }

            // break out of loop: we accept or fail with error
            break;
        }
    } catch (ex) {
        // report exceptions through the parseError callback too, but keep the exception intact
        // if it is a known parser or lexer error which has been thrown by parseError() already:
        if (ex instanceof this.JisonParserError) {
            throw ex;
        } else if (lexer && typeof lexer.JisonLexerError === 'function' && ex instanceof lexer.JisonLexerError) {
            throw ex;
        }

        p = this.constructParseErrorInfo('Parsing aborted due to exception.', ex, null, false);
        retval = false;
        r = this.parseError(p.errStr, p, this.JisonParserError);
        if (typeof r !== 'undefined') {
            retval = r;
        }
    } finally {
        retval = this.cleanupAfterParse(retval, true, false);
        this.__reentrant_call_depth--;

        if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
            Jison.parserDebugger.push({
                action: 'return',
                text: retval
            });
            console.log(Jison.parserDebugger[Jison.parserDebugger.length - 1]);
        }
    }   // /finally

    return retval;
},
yyError: 1
};
parser.originalParseError = parser.parseError;
parser.originalQuoteName = parser.quoteName;
/* lexer generated by jison-lex 0.6.2-220 */

/*
 * Returns a Lexer object of the following structure:
 *
 *  Lexer: {
 *    yy: {}     The so-called "shared state" or rather the *source* of it;
 *               the real "shared state" `yy` passed around to
 *               the rule actions, etc. is a direct reference!
 *
 *               This "shared context" object was passed to the lexer by way of
 *               the `lexer.setInput(str, yy)` API before you may use it.
 *
 *               This "shared context" object is passed to the lexer action code in `performAction()`
 *               so userland code in the lexer actions may communicate with the outside world
 *               and/or other lexer rules' actions in more or less complex ways.
 *
 *  }
 *
 *  Lexer.prototype: {
 *    EOF: 1,
 *    ERROR: 2,
 *
 *    yy:        The overall "shared context" object reference.
 *
 *    JisonLexerError: function(msg, hash),
 *
 *    performAction: function lexer__performAction(yy, yyrulenumber, YY_START),
 *
 *               The function parameters and `this` have the following value/meaning:
 *               - `this`    : reference to the `lexer` instance.
 *                               `yy_` is an alias for `this` lexer instance reference used internally.
 *
 *               - `yy`      : a reference to the `yy` "shared state" object which was passed to the lexer
 *                             by way of the `lexer.setInput(str, yy)` API before.
 *
 *                             Note:
 *                             The extra arguments you specified in the `%parse-param` statement in your
 *                             **parser** grammar definition file are passed to the lexer via this object
 *                             reference as member variables.
 *
 *               - `yyrulenumber`   : index of the matched lexer rule (regex), used internally.
 *
 *               - `YY_START`: the current lexer "start condition" state.
 *
 *    parseError: function(str, hash, ExceptionClass),
 *
 *    constructLexErrorInfo: function(error_message, is_recoverable),
 *               Helper function.
 *               Produces a new errorInfo 'hash object' which can be passed into `parseError()`.
 *               See it's use in this lexer kernel in many places; example usage:
 *
 *                   var infoObj = lexer.constructParseErrorInfo('fail!', true);
 *                   var retVal = lexer.parseError(infoObj.errStr, infoObj, lexer.JisonLexerError);
 *
 *    options: { ... lexer %options ... },
 *
 *    lex: function(),
 *               Produce one token of lexed input, which was passed in earlier via the `lexer.setInput()` API.
 *               You MAY use the additional `args...` parameters as per `%parse-param` spec of the **lexer** grammar:
 *               these extra `args...` are added verbatim to the `yy` object reference as member variables.
 *
 *               WARNING:
 *               Lexer's additional `args...` parameters (via lexer's `%parse-param`) MAY conflict with
 *               any attributes already added to `yy` by the **parser** or the jison run-time;
 *               when such a collision is detected an exception is thrown to prevent the generated run-time
 *               from silently accepting this confusing and potentially hazardous situation!
 *
 *    cleanupAfterLex: function(do_not_nuke_errorinfos),
 *               Helper function.
 *
 *               This helper API is invoked when the **parse process** has completed: it is the responsibility
 *               of the **parser** (or the calling userland code) to invoke this method once cleanup is desired.
 *
 *               This helper may be invoked by user code to ensure the internal lexer gets properly garbage collected.
 *
 *    setInput: function(input, [yy]),
 *
 *
 *    input: function(),
 *
 *
 *    unput: function(str),
 *
 *
 *    more: function(),
 *
 *
 *    reject: function(),
 *
 *
 *    less: function(n),
 *
 *
 *    pastInput: function(n),
 *
 *
 *    upcomingInput: function(n),
 *
 *
 *    showPosition: function(),
 *
 *
 *    test_match: function(regex_match_array, rule_index),
 *
 *
 *    next: function(),
 *
 *
 *    begin: function(condition),
 *
 *
 *    pushState: function(condition),
 *
 *
 *    popState: function(),
 *
 *
 *    topState: function(),
 *
 *
 *    _currentRules: function(),
 *
 *
 *    stateStackSize: function(),
 *
 *
 *    performAction: function(yy, yy_, yyrulenumber, YY_START),
 *
 *
 *    rules: [...],
 *
 *
 *    conditions: {associative list: name ==> set},
 *  }
 *
 *
 *  token location info (`yylloc`): {
 *    first_line: n,
 *    last_line: n,
 *    first_column: n,
 *    last_column: n,
 *    range: [start_number, end_number]
 *               (where the numbers are indexes into the input string, zero-based)
 *  }
 *
 * ---
 *
 * The `parseError` function receives a 'hash' object with these members for lexer errors:
 *
 *  {
 *    text:        (matched text)
 *    token:       (the produced terminal token, if any)
 *    token_id:    (the produced terminal token numeric ID, if any)
 *    line:        (yylineno)
 *    loc:         (yylloc)
 *    recoverable: (boolean: TRUE when the parser MAY have an error recovery rule
 *                  available for this particular error)
 *    yy:          (object: the current parser internal "shared state" `yy`
 *                  as is also available in the rule actions; this can be used,
 *                  for instance, for advanced error analysis and reporting)
 *    lexer:       (reference to the current lexer instance used by the parser)
 *  }
 *
 * while `this` will reference the current lexer instance.
 *
 * When `parseError` is invoked by the lexer, the default implementation will
 * attempt to invoke `yy.parser.parseError()`; when this callback is not provided
 * it will try to invoke `yy.parseError()` instead. When that callback is also not
 * provided, a `JisonLexerError` exception will be thrown containing the error
 * message and `hash`, as constructed by the `constructLexErrorInfo()` API.
 *
 * Note that the lexer's `JisonLexerError` error class is passed via the
 * `ExceptionClass` argument, which is invoked to construct the exception
 * instance to be thrown, so technically `parseError` will throw the object
 * produced by the `new ExceptionClass(str, hash)` JavaScript expression.
 *
 * ---
 *
 * You can specify lexer options by setting / modifying the `.options` object of your Lexer instance.
 * These options are available:
 *
 * (Options are permanent.)
 *
 *  yy: {
 *      parseError: function(str, hash, ExceptionClass)
 *                 optional: overrides the default `parseError` function.
 *  }
 *
 *  lexer.options: {
 *      pre_lex:  function()
 *                 optional: is invoked before the lexer is invoked to produce another token.
 *                 `this` refers to the Lexer object.
 *      post_lex: function(token) { return token; }
 *                 optional: is invoked when the lexer has produced a token `token`;
 *                 this function can override the returned token value by returning another.
 *                 When it does not return any (truthy) value, the lexer will return
 *                 the original `token`.
 *                 `this` refers to the Lexer object.
 *
 * WARNING: the next set of options are not meant to be changed. They echo the abilities of
 * the lexer as per when it was compiled!
 *
 *      ranges: boolean
 *                 optional: `true` ==> token location info will include a .range[] member.
 *      flex: boolean
 *                 optional: `true` ==> flex-like lexing behaviour where the rules are tested
 *                 exhaustively to find the longest match.
 *      backtrack_lexer: boolean
 *                 optional: `true` ==> lexer regexes are tested in order and for invoked;
 *                 the lexer terminates the scan when a token is returned by the action code.
 *      xregexp: boolean
 *                 optional: `true` ==> lexer rule regexes are "extended regex format" requiring the
 *                 `XRegExp` library. When this %option has not been specified at compile time, all lexer
 *                 rule regexes have been written as standard JavaScript RegExp expressions.
 *  }
 */


var lexer = function() {

  /**
   * See also:
   * http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript/#35881508
   * but we keep the prototype.constructor and prototype.name assignment lines too for compatibility
   * with userland code which might access the derived class in a 'classic' way.
   *
   * @public
   * @constructor
   * @nocollapse
   */
  function JisonLexerError(msg, hash) {
    Object.defineProperty(this, 'name', {
      enumerable: false,
      writable: false,
      value: 'JisonLexerError'
    });

    if (msg == null)
      msg = '???';

    Object.defineProperty(this, 'message', {
      enumerable: false,
      writable: true,
      value: msg
    });

    this.hash = hash;
    let stacktrace;

    if (hash && hash.exception instanceof Error) {
      const ex2 = hash.exception;
      this.message = ex2.message || msg;
      stacktrace = ex2.stack;
    }

    if (!stacktrace) {
      if (Error.hasOwnProperty('captureStackTrace')) {
        // V8
        Error.captureStackTrace(this, this.constructor);
      } else {
        stacktrace = new Error(msg).stack;
      }
    }

    if (stacktrace) {
      Object.defineProperty(this, 'stack', {
        enumerable: false,
        writable: false,
        value: stacktrace
      });
    }
  }

  if (typeof Object.setPrototypeOf === 'function') {
    Object.setPrototypeOf(JisonLexerError.prototype, Error.prototype);
  } else {
    JisonLexerError.prototype = Object.create(Error.prototype);
  }

  JisonLexerError.prototype.constructor = JisonLexerError;
  JisonLexerError.prototype.name = 'JisonLexerError';

  const lexer = {
    
// Code Generator Information Report
// ---------------------------------
//
// Options:
//
//   backtracking: .................... false
//   location.ranges: ................. true
//   location line+column tracking: ... true
//
//
// Forwarded Parser Analysis flags:
//
//   uses yyleng: ..................... false
//   uses yylineno: ................... false
//   uses yytext: ..................... false
//   uses yylloc: ..................... false
//   uses lexer values: ............... true / true
//   location tracking: ............... true
//   location assignment: ............. true
//
//
// Lexer Analysis flags:
//
//   uses yyleng: ..................... ???
//   uses yylineno: ................... ???
//   uses yytext: ..................... ???
//   uses yylloc: ..................... ???
//   uses ParseError API: ............. ???
//   uses yyerror: .................... ???
//   uses location tracking & editing:  ???
//   uses more() API: ................. ???
//   uses unput() API: ................ ???
//   uses reject() API: ............... ???
//   uses less() API: ................. ???
//   uses display APIs pastInput(), upcomingInput(), showPosition():
//        ............................. ???
//   uses describeYYLLOC() API: ....... ???
//
// --------- END OF REPORT -----------


    EOF: 1,

    ERROR: 2,

    // JisonLexerError: JisonLexerError,        /// <-- injected by the code generator

    // options: {},                             /// <-- injected by the code generator

    // yy: ...,                                 /// <-- injected by setInput()

    /// INTERNAL USE ONLY: internal rule set cache for the current lexer state
    __currentRuleSet__: null,

    /// INTERNAL USE ONLY: the set of lexErrorInfo objects created since the last cleanup
    __error_infos: [],

    /// INTERNAL USE ONLY: mark whether the lexer instance has been 'unfolded' completely and is now ready for use
    __decompressed: false,

    /// INTERNAL USE ONLY
    done: false,

    /// INTERNAL USE ONLY
    _backtrack: false,

    /// INTERNAL USE ONLY
    _input: '',

    /// INTERNAL USE ONLY
    _more: false,

    /// INTERNAL USE ONLY
    _signaled_error_token: false,

    /// INTERNAL USE ONLY; 0: clear to do, 1: clear done for lex()/next(); -1: clear done for inut()/unput()/...
    _clear_state: 0,

    /// INTERNAL USE ONLY; managed via `pushState()`, `popState()`, `topState()` and `stateStackSize()`
    conditionStack: [],

    /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks input which has been matched so far for the lexer token under construction. `match` is identical to `yytext` except that this one still contains the matched input string after `lexer.performAction()` has been invoked, where userland code MAY have changed/replaced the `yytext` value entirely!
    match: '',

    /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks entire input which has been matched so far
    matched: '',

    /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks RE match result for last (successful) match attempt
    matches: false,

    /// ADVANCED USE ONLY: tracks input which has been matched so far for the lexer token under construction; this value is transferred to the parser as the 'token value' when the parser consumes the lexer token produced through a call to the `lex()` API.
    yytext: '',

    /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks the 'cursor position' in the input string, i.e. the number of characters matched so far. (**WARNING:** this value MAY be negative if you `unput()` more text than you have already lexed. This type of behaviour is generally observed for one kind of 'lexer/parser hack' where custom token-illiciting characters are pushed in front of the input stream to help simulate multiple-START-points in the parser. When this happens, `base_position` will be adjusted to help track the original input's starting point in the `_input` buffer.)
    offset: 0,

    /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: index to the original starting point of the input; always ZERO(0) unless `unput()` has pushed content before the input: see the `offset` **WARNING** just above.
    base_position: 0,

    /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: length of matched input for the token under construction (`yytext`)
    yyleng: 0,

    /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: 'line number' at which the token under construction is located
    yylineno: 0,

    /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks location info (lines + columns) for the token under construction
    yylloc: null,

    /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: regex used to split lines while tracking the lexer cursor position.
    CRLF_Re: /\r\n?|\n/,

    /**
         * INTERNAL USE: construct a suitable error info hash object instance for `parseError`.
         *
         * @public
         * @this {RegExpLexer}
         */
    constructLexErrorInfo: function lexer_constructLexErrorInfo(msg, recoverable, show_input_position) {
      msg = '' + msg;

      // heuristic to determine if the error message already contains a (partial) source code dump
      // as produced by either `showPosition()` or `prettyPrintRange()`:
      if (show_input_position == undefined) {
        show_input_position = !(msg.indexOf('\n') > 0 && msg.indexOf('^') > 0);
      }

      if (this.yylloc && show_input_position) {
        if (typeof this.prettyPrintRange === 'function') {
          const pretty_src = this.prettyPrintRange(this.yylloc);

          if (!/\n\s*$/.test(msg)) {
            msg += '\n';
          }

          msg += '\n  Erroneous area:\n' + this.prettyPrintRange(this.yylloc);
        } else if (typeof this.showPosition === 'function') {
          const pos_str = this.showPosition();

          if (pos_str) {
            if (msg.length && msg[msg.length - 1] !== '\n' && pos_str[0] !== '\n') {
              msg += '\n' + pos_str;
            } else {
              msg += pos_str;
            }
          }
        }
      }

      /** @constructor */
      const pei = {
        errStr: msg,
        recoverable: !!recoverable,

        // This one MAY be empty; userland code should use the `upcomingInput` API to obtain more text which follows the 'lexer cursor position'...
        text: this.match,

        token: null,
        line: this.yylineno,
        loc: this.yylloc,
        yy: this.yy,
        lexer: this,

        /**
                     * and make sure the error info doesn't stay due to potential
                     * ref cycle via userland code manipulations.
                     * These would otherwise all be memory leak opportunities!
                     *
                     * Note that only array and object references are nuked as those
                     * constitute the set of elements which can produce a cyclic ref.
                     * The rest of the members is kept intact as they are harmless.
                     *
                     * @public
                     * @this {LexErrorInfo}
                     */
        destroy: function destructLexErrorInfo() {
          // remove cyclic references added to error info:
          // info.yy = null;
          // info.lexer = null;
          // ...
          const rec = !!this.recoverable;

          for (let key in this) {
            if (this[key] && this.hasOwnProperty(key) && typeof this[key] === 'object') {
              this[key] = undefined;
            }
          }

          this.recoverable = rec;
        }
      };

      // track this instance so we can `destroy()` it once we deem it superfluous and ready for garbage collection!
      this.__error_infos.push(pei);

      return pei;
    },

    /**
         * handler which is invoked when a lexer error occurs.
         *
         * @public
         * @this {RegExpLexer}
         */
    parseError: function lexer_parseError(str, hash, ExceptionClass) {
      if (!ExceptionClass) {
        ExceptionClass = this.JisonLexerError;
      }

      if (this.yy) {
        if (this.yy.parser && typeof this.yy.parser.parseError === 'function') {
          return this.yy.parser.parseError.call(this, str, hash, ExceptionClass) || this.ERROR;
        } else if (typeof this.yy.parseError === 'function') {
          return this.yy.parseError.call(this, str, hash, ExceptionClass) || this.ERROR;
        }
      }

      throw new ExceptionClass(str, hash);
    },

    /**
         * method which implements `yyerror(str, ...args)` functionality for use inside lexer actions.
         *
         * @public
         * @this {RegExpLexer}
         */
    yyerror: function yyError(str /*, ...args */) {
      let lineno_msg = 'Lexical error';

      if (this.yylloc) {
        lineno_msg += ' on line ' + (this.yylineno + 1);
      }

      const p = this.constructLexErrorInfo(lineno_msg + ': ' + str, this.options.lexerErrorsAreRecoverable);

      // Add any extra args to the hash under the name `extra_error_attributes`:
      let args = Array.prototype.slice.call(arguments, 1);

      if (args.length) {
        p.extra_error_attributes = args;
      }

      return this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR;
    },

    /**
         * final cleanup function for when we have completed lexing the input;
         * make it an API so that external code can use this one once userland
         * code has decided it's time to destroy any lingering lexer error
         * hash object instances and the like: this function helps to clean
         * up these constructs, which *may* carry cyclic references which would
         * otherwise prevent the instances from being properly and timely
         * garbage-collected, i.e. this function helps prevent memory leaks!
         *
         * @public
         * @this {RegExpLexer}
         */
    cleanupAfterLex: function lexer_cleanupAfterLex(do_not_nuke_errorinfos) {
      // prevent lingering circular references from causing memory leaks:
      this.setInput('', {});

      // nuke the error hash info instances created during this run.
      // Userland code must COPY any data/references
      // in the error hash instance(s) it is more permanently interested in.
      if (!do_not_nuke_errorinfos) {
        for (let i = this.__error_infos.length - 1; i >= 0; i--) {
          let el = this.__error_infos[i];

          if (el && typeof el.destroy === 'function') {
            el.destroy();
          }
        }

        this.__error_infos.length = 0;
      }

      return this;
    },

    /**
         * clear the lexer token context; intended for internal use only
         *
         * @public
         * @this {RegExpLexer}
         */
    clear: function lexer_clear() {
      this.yytext = '';
      this.yyleng = 0;
      this.match = '';

      // - DO NOT reset `this.matched`
      this.matches = false;

      this._more = false;
      this._backtrack = false;
      const col = this.yylloc.last_column;

      this.yylloc = {
        first_line: this.yylineno + 1,
        first_column: col,
        last_line: this.yylineno + 1,
        last_column: col,
        range: [this.offset, this.offset]
      };
    },

    /**
         * resets the lexer, sets new input
         *
         * @public
         * @this {RegExpLexer}
         */
    setInput: function lexer_setInput(input, yy) {
      this.yy = yy || this.yy || {};

      // also check if we've fully initialized the lexer instance,
      // including expansion work to be done to go from a loaded
      // lexer to a usable lexer:
      if (!this.__decompressed) {
        // step 1: decompress the regex list:
        let rules = this.rules;

        for (var i = 0, len = rules.length; i < len; i++) {
          var rule_re = rules[i];

          // compression: is the RE an xref to another RE slot in the rules[] table?
          if (typeof rule_re === 'number') {
            rules[i] = rules[rule_re];
          }
        }

        // step 2: unfold the conditions[] set to make these ready for use:
        let conditions = this.conditions;

        for (let k in conditions) {
          let spec = conditions[k];
          let rule_ids = spec.rules;
          var len = rule_ids.length;
          let rule_regexes = new Array(len + 1);            // slot 0 is unused; we use a 1-based index approach here to keep the hottest code in `lexer_next()` fast and simple!
          let rule_new_ids = new Array(len + 1);

          for (var i = 0; i < len; i++) {
            let idx = rule_ids[i];
            var rule_re = rules[idx];
            rule_regexes[i + 1] = rule_re;
            rule_new_ids[i + 1] = idx;
          }

          spec.rules = rule_new_ids;
          spec.__rule_regexes = rule_regexes;
          spec.__rule_count = len;
        }

        this.__decompressed = true;
      }

      if (input && typeof input !== 'string') {
        input = '' + input;
      }

      this._input = input || '';
      this._clear_state = -1;
      this._signaled_error_token = false;
      this.done = false;
      this.yylineno = 0;
      this.matched = '';
      this.conditionStack = ['INITIAL'];
      this.__currentRuleSet__ = null;

      this.yylloc = {
        first_line: 1,
        first_column: 0,
        last_line: 1,
        last_column: 0,
        range: [0, 0]
      };

      this.offset = 0;
      this.base_position = 0;

      // apply these bits of `this.clear()` as well:
      this.yytext = '';

      this.yyleng = 0;
      this.match = '';
      this.matches = false;
      this._more = false;
      this._backtrack = false;
      return this;
    },

    /**
         * edit the remaining input via user-specified callback.
         * This can be used to forward-adjust the input-to-parse,
         * e.g. inserting macro expansions and alike in the
         * input which has yet to be lexed.
         * The behaviour of this API contrasts the `unput()` et al
         * APIs as those act on the *consumed* input, while this
         * one allows one to manipulate the future, without impacting
         * the current `yyloc` cursor location or any history.
         *
         * Use this API to help implement C-preprocessor-like
         * `#include` statements, etc.
         *
         * The provided callback must be synchronous and is
         * expected to return the edited input (string).
         *
         * The `cpsArg` argument value is passed to the callback
         * as-is.
         *
         * `callback` interface:
         * `function callback(input, cpsArg)`
         *
         * - `input` will carry the remaining-input-to-lex string
         *   from the lexer.
         * - `cpsArg` is `cpsArg` passed into this API.
         *
         * The `this` reference for the callback will be set to
         * reference this lexer instance so that userland code
         * in the callback can easily and quickly access any lexer
         * API.
         *
         * When the callback returns a non-string-type falsey value,
         * we assume the callback did not edit the input and we
         * will using the input as-is.
         *
         * When the callback returns a non-string-type value, it
         * is converted to a string for lexing via the `"" + retval`
         * operation. (See also why: http://2ality.com/2012/03/converting-to-string.html
         * -- that way any returned object's `toValue()` and `toString()`
         * methods will be invoked in a proper/desirable order.)
         *
         * @public
         * @this {RegExpLexer}
         */
    editRemainingInput: function lexer_editRemainingInput(callback, cpsArg) {
      const rv = callback.call(this, this._input, cpsArg);

      if (typeof rv !== 'string') {
        if (rv) {
          this._input = '' + rv;
        }
        // else: keep `this._input` as is.
      } else {
        this._input = rv;
      }

      return this;
    },

    /**
         * consumes and returns one char from the input
         *
         * @public
         * @this {RegExpLexer}
         */
    input: function lexer_input() {
      if (!this._input) {
        //this.done = true;    -- don't set `done` as we want the lex()/next() API to be able to produce one custom EOF token match after this anyhow. (lexer can match special <<EOF>> tokens and perform user action code for a <<EOF>> match, but only does so *once*)
        return null;
      }

      if (!this._clear_state && !this._more) {
        this._clear_state = -1;
        this.clear();
      }

      let ch = this._input[0];
      this.yytext += ch;
      this.yyleng++;
      this.offset++;
      this.match += ch;
      this.matched += ch;

      // Count the linenumber up when we hit the LF (or a stand-alone CR).
      // On CRLF, the linenumber is incremented when you fetch the CR or the CRLF combo
      // and we advance immediately past the LF as well, returning both together as if
      // it was all a single 'character' only.
      let slice_len = 1;

      let lines = false;

      if (ch === '\n') {
        lines = true;
      } else if (ch === '\r') {
        lines = true;
        const ch2 = this._input[1];

        if (ch2 === '\n') {
          slice_len++;
          ch += ch2;
          this.yytext += ch2;
          this.yyleng++;
          this.offset++;
          this.match += ch2;
          this.matched += ch2;
          this.yylloc.range[1]++;
        }
      }

      if (lines) {
        this.yylineno++;
        this.yylloc.last_line++;
        this.yylloc.last_column = 0;
      } else {
        this.yylloc.last_column++;
      }

      this.yylloc.range[1]++;
      this._input = this._input.slice(slice_len);
      return ch;
    },

    /**
         * unshifts one char (or an entire string) into the input
         *
         * @public
         * @this {RegExpLexer}
         */
    unput: function lexer_unput(ch) {
      let len = ch.length;
      let lines = ch.split(this.CRLF_Re);

      if (!this._clear_state && !this._more) {
        this._clear_state = -1;
        this.clear();
      }

      this._input = ch + this._input;
      this.yytext = this.yytext.substr(0, this.yytext.length - len);
      this.yyleng = this.yytext.length;
      this.offset -= len;

      // **WARNING:**
      // The `offset` value MAY be negative if you `unput()` more text than you have already lexed.
      // This type of behaviour is generally observed for one kind of 'lexer/parser hack'
      // where custom token-illiciting characters are pushed in front of the input stream to help
      // simulate multiple-START-points in the parser.
      // When this happens, `base_position` will be adjusted to help track the original input's
      // starting point in the `_input` buffer.
      if (-this.offset > this.base_position) {
        this.base_position = -this.offset;
      }

      this.match = this.match.substr(0, this.match.length - len);
      this.matched = this.matched.substr(0, this.matched.length - len);

      if (lines.length > 1) {
        this.yylineno -= lines.length - 1;
        this.yylloc.last_line = this.yylineno + 1;

        // Get last entirely matched line into the `pre_lines[]` array's
        // last index slot; we don't mind when other previously
        // matched lines end up in the array too.
        let pre = this.match;

        let pre_lines = pre.split(this.CRLF_Re);

        if (pre_lines.length === 1) {
          pre = this.matched;
          pre_lines = pre.split(this.CRLF_Re);
        }

        this.yylloc.last_column = pre_lines[pre_lines.length - 1].length;
      } else {
        this.yylloc.last_column -= len;
      }

      this.yylloc.range[1] = this.yylloc.range[0] + this.yyleng;
      this.done = false;
      return this;
    },

    /**
         * return the upcoming input *which has not been lexed yet*.
         * This can, for example, be used for custom look-ahead inspection code
         * in your lexer.
         *
         * The entire pending input string is returned.
         *
         * > ### NOTE ###
         * >
         * > When augmenting error reports and alike, you might want to
         * > look at the `upcomingInput()` API instead, which offers more
         * > features for limited input extraction and which includes the
         * > part of the input which has been lexed by the last token a.k.a.
         * > the *currently lexed* input.
         * >
         *
         * @public
         * @this {RegExpLexer}
         */
    lookAhead: function lexer_lookAhead() {
      return this._input || '';
    },

    /**
         * cache matched text and append it on next action
         *
         * @public
         * @this {RegExpLexer}
         */
    more: function lexer_more() {
      this._more = true;
      return this;
    },

    /**
         * signal the lexer that this rule fails to match the input, so the
         * next matching rule (regex) should be tested instead.
         *
         * @public
         * @this {RegExpLexer}
         */
    reject: function lexer_reject() {
      if (this.options.backtrack_lexer) {
        this._backtrack = true;
      } else {
        // when the `parseError()` call returns, we MUST ensure that the error is registered.
        // We accomplish this by signaling an 'error' token to be produced for the current
        // `.lex()` run.
        let lineno_msg = 'Lexical error';

        if (this.yylloc) {
          lineno_msg += ' on line ' + (this.yylineno + 1);
        }

        const p = this.constructLexErrorInfo(
          lineno_msg + ': You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).',
          false
        );

        this._signaled_error_token = this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR;
      }

      return this;
    },

    /**
         * retain first n characters of the match
         *
         * @public
         * @this {RegExpLexer}
         */
    less: function lexer_less(n) {
      return this.unput(this.match.slice(n));
    },

    /**
         * return (part of the) already matched input, i.e. for error
         * messages.
         *
         * Limit the returned string length to `maxSize` (default: 20).
         *
         * Limit the returned string to the `maxLines` number of lines of
         * input (default: 1).
         *
         * A negative `maxSize` limit value equals *unlimited*, i.e.
         * produce the entire input that has already been lexed.
         *
         * A negative `maxLines` limit value equals *unlimited*, i.e. limit the result
         * to the `maxSize` specified number of characters *only*.
         *
         * @public
         * @this {RegExpLexer}
         */
    pastInput: function lexer_pastInput(maxSize, maxLines) {
      let past = this.matched.substring(0, this.matched.length - this.match.length);

      if (maxSize < 0) {
        maxSize = Infinity;
      } else if (!maxSize) {
        maxSize = 20;
      }

      if (maxLines < 0) {
        maxLines = Infinity;          // can't ever have more input lines than this!
      } else if (!maxLines) {
        maxLines = 1;
      }

      // `substr` anticipation: treat \r\n as a single character and take a little
      // more than necessary so that we can still properly check against maxSize
      // after we've transformed and limited the newLines in here:
      past = past.substr(-maxSize * 2 - 2);

      // now that we have a significantly reduced string to process, transform the newlines
      // and chop them, then limit them:
      let a = past.split(this.CRLF_Re);

      a = a.slice(-maxLines);
      past = a.join('\n');

      // When, after limiting to maxLines, we still have too much to return,
      // do add an ellipsis prefix...
      if (past.length > maxSize) {
        past = '...' + past.substr(-maxSize);
      }

      return past;
    },

    /**
         * return (part of the) upcoming input *including* the input
         * matched by the last token (see also the NOTE below).
         * This can be used to augment error messages, for example.
         *
         * Limit the returned string length to `maxSize` (default: 20).
         *
         * Limit the returned string to the `maxLines` number of lines of input (default: 1).
         *
         * A negative `maxSize` limit value equals *unlimited*, i.e.
         * produce the entire input that is yet to be lexed.
         *
         * A negative `maxLines` limit value equals *unlimited*, i.e. limit the result
         * to the `maxSize` specified number of characters *only*.
         *
         * > ### NOTE ###
         * >
         * > *"upcoming input"* is defined as the whole of the both
         * > the *currently lexed* input, together with any remaining input
         * > following that. *"currently lexed"* input is the input
         * > already recognized by the lexer but not yet returned with
         * > the lexer token. This happens when you are invoking this API
         * > from inside any lexer rule action code block.
         * >
         * > When you want access to the 'upcoming input' in that you want access
         * > to the input *which has not been lexed yet* for look-ahead
         * > inspection or likewise purposes, please consider using the
         * > `lookAhead()` API instead.
         * >
         *
         * @public
         * @this {RegExpLexer}
         */
    upcomingInput: function lexer_upcomingInput(maxSize, maxLines) {
      let next = this.match;
      let source = this._input || '';

      if (maxSize < 0) {
        maxSize = next.length + source.length;
      } else if (!maxSize) {
        maxSize = 20;
      }

      if (maxLines < 0) {
        maxLines = maxSize;          // can't ever have more input lines than this!
      } else if (!maxLines) {
        maxLines = 1;
      }

      // `substring` anticipation: treat \r\n as a single character and take a little
      // more than necessary so that we can still properly check against maxSize
      // after we've transformed and limited the newLines in here:
      if (next.length < maxSize * 2 + 2) {
        next += source.substring(0, maxSize * 2 + 2 - next.length);  // substring is faster on Chrome/V8
      }

      // now that we have a significantly reduced string to process, transform the newlines
      // and chop them, then limit them:
      let a = next.split(this.CRLF_Re, maxLines + 1);     // stop splitting once we have reached just beyond the reuired number of lines.

      a = a.slice(0, maxLines);
      next = a.join('\n');

      // When, after limiting to maxLines, we still have too much to return,
      // do add an ellipsis postfix...
      if (next.length > maxSize) {
        next = next.substring(0, maxSize) + '...';
      }

      return next;
    },

    /**
         * return a string which displays the character position where the
         * lexing error occurred, i.e. for error messages
         *
         * @public
         * @this {RegExpLexer}
         */
    showPosition: function lexer_showPosition(maxPrefix, maxPostfix) {
      const pre = this.pastInput(maxPrefix).replace(/\s/g, ' ');
      let c = new Array(pre.length + 1).join('-');
      return pre + this.upcomingInput(maxPostfix).replace(/\s/g, ' ') + '\n' + c + '^';
    },

    /**
         * return an YYLLOC info object derived off the given context (actual, preceding, following, current).
         * Use this method when the given `actual` location is not guaranteed to exist (i.e. when
         * it MAY be NULL) and you MUST have a valid location info object anyway:
         * then we take the given context of the `preceding` and `following` locations, IFF those are available,
         * and reconstruct the `actual` location info from those.
         * If this fails, the heuristic is to take the `current` location, IFF available.
         * If this fails as well, we assume the sought location is at/around the current lexer position
         * and then produce that one as a response. DO NOTE that these heuristic/derived location info
         * values MAY be inaccurate!
         *
         * NOTE: `deriveLocationInfo()` ALWAYS produces a location info object *copy* of `actual`, not just
         * a *reference* hence all input location objects can be assumed to be 'constant' (function has no side-effects).
         *
         * @public
         * @this {RegExpLexer}
         */
    deriveLocationInfo: function lexer_deriveYYLLOC(actual, preceding, following, current) {
      let loc = {
        first_line: 1,
        first_column: 0,
        last_line: 1,
        last_column: 0,
        range: [0, 0]
      };

      if (actual) {
        loc.first_line = actual.first_line | 0;
        loc.last_line = actual.last_line | 0;
        loc.first_column = actual.first_column | 0;
        loc.last_column = actual.last_column | 0;

        if (actual.range) {
          loc.range[0] = actual.range[0] | 0;
          loc.range[1] = actual.range[1] | 0;
        }
      }

      if (loc.first_line <= 0 || loc.last_line < loc.first_line) {
        // plan B: heuristic using preceding and following:
        if (loc.first_line <= 0 && preceding) {
          loc.first_line = preceding.last_line | 0;
          loc.first_column = preceding.last_column | 0;

          if (preceding.range) {
            loc.range[0] = actual.range[1] | 0;
          }
        }

        if ((loc.last_line <= 0 || loc.last_line < loc.first_line) && following) {
          loc.last_line = following.first_line | 0;
          loc.last_column = following.first_column | 0;

          if (following.range) {
            loc.range[1] = actual.range[0] | 0;
          }
        }

        // plan C?: see if the 'current' location is useful/sane too:
        if (loc.first_line <= 0 && current && (loc.last_line <= 0 || current.last_line <= loc.last_line)) {
          loc.first_line = current.first_line | 0;
          loc.first_column = current.first_column | 0;

          if (current.range) {
            loc.range[0] = current.range[0] | 0;
          }
        }

        if (loc.last_line <= 0 && current && (loc.first_line <= 0 || current.first_line >= loc.first_line)) {
          loc.last_line = current.last_line | 0;
          loc.last_column = current.last_column | 0;

          if (current.range) {
            loc.range[1] = current.range[1] | 0;
          }
        }
      }

      // sanitize: fix last_line BEFORE we fix first_line as we use the 'raw' value of the latter
      // or plan D heuristics to produce a 'sensible' last_line value:
      if (loc.last_line <= 0) {
        if (loc.first_line <= 0) {
          loc.first_line = this.yylloc.first_line;
          loc.last_line = this.yylloc.last_line;
          loc.first_column = this.yylloc.first_column;
          loc.last_column = this.yylloc.last_column;
          loc.range[0] = this.yylloc.range[0];
          loc.range[1] = this.yylloc.range[1];
        } else {
          loc.last_line = this.yylloc.last_line;
          loc.last_column = this.yylloc.last_column;
          loc.range[1] = this.yylloc.range[1];
        }
      }

      if (loc.first_line <= 0) {
        loc.first_line = loc.last_line;
        loc.first_column = 0; // loc.last_column;
        loc.range[1] = loc.range[0];
      }

      if (loc.first_column < 0) {
        loc.first_column = 0;
      }

      if (loc.last_column < 0) {
        loc.last_column = loc.first_column > 0 ? loc.first_column : 80;
      }

      return loc;
    },

    /**
         * return a string which displays the lines & columns of input which are referenced
         * by the given location info range, plus a few lines of context.
         *
         * This function pretty-prints the indicated section of the input, with line numbers
         * and everything!
         *
         * This function is very useful to provide highly readable error reports, while
         * the location range may be specified in various flexible ways:
         *
         * - `loc` is the location info object which references the area which should be
         *   displayed and 'marked up': these lines & columns of text are marked up by `^`
         *   characters below each character in the entire input range.
         *
         * - `context_loc` is the *optional* location info object which instructs this
         *   pretty-printer how much *leading* context should be displayed alongside
         *   the area referenced by `loc`. This can help provide context for the displayed
         *   error, etc.
         *
         *   When this location info is not provided, a default context of 3 lines is
         *   used.
         *
         * - `context_loc2` is another *optional* location info object, which serves
         *   a similar purpose to `context_loc`: it specifies the amount of *trailing*
         *   context lines to display in the pretty-print output.
         *
         *   When this location info is not provided, a default context of 1 line only is
         *   used.
         *
         * Special Notes:
         *
         * - when the `loc`-indicated range is very large (about 5 lines or more), then
         *   only the first and last few lines of this block are printed while a
         *   `...continued...` message will be printed between them.
         *
         *   This serves the purpose of not printing a huge amount of text when the `loc`
         *   range happens to be huge: this way a manageable & readable output results
         *   for arbitrary large ranges.
         *
         * - this function can display lines of input which whave not yet been lexed.
         *   `prettyPrintRange()` can access the entire input!
         *
         * @public
         * @this {RegExpLexer}
         */
    prettyPrintRange: function lexer_prettyPrintRange(loc, context_loc, context_loc2) {
      loc = this.deriveLocationInfo(loc, context_loc, context_loc2);
      const CONTEXT = 3;
      const CONTEXT_TAIL = 1;
      const MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT = 2;
      let input = this.matched + (this._input || '');
      let lines = input.split('\n');
      let l0 = Math.max(1, context_loc ? context_loc.first_line : loc.first_line - CONTEXT);
      let l1 = Math.max(1, context_loc2 ? context_loc2.last_line : loc.last_line + CONTEXT_TAIL);
      let lineno_display_width = 1 + Math.log10(l1 | 1) | 0;
      let ws_prefix = new Array(lineno_display_width).join(' ');
      let nonempty_line_indexes = [[], [], []];

      let rv = lines.slice(l0 - 1, l1 + 1).map(function injectLineNumber(line, index) {
        let lno = index + l0;
        let lno_pfx = (ws_prefix + lno).substr(-lineno_display_width);
        let rv = lno_pfx + ': ' + line;
        let errpfx = new Array(lineno_display_width + 1).join('^');
        let offset = 2 + 1;
        let len = 0;

        if (lno === loc.first_line) {
          offset += loc.first_column;

          len = Math.max(
            2,
            (lno === loc.last_line ? loc.last_column : line.length) - loc.first_column + 1
          );
        } else if (lno === loc.last_line) {
          len = Math.max(2, loc.last_column + 1);
        } else if (lno > loc.first_line && lno < loc.last_line) {
          len = Math.max(2, line.length + 1);
        }

        let nli;

        if (len) {
          let lead = new Array(offset).join('.');
          let mark = new Array(len).join('^');
          rv += '\n' + errpfx + lead + mark;
          nli = 1;
        } else if (lno < loc.first_line) {
          nli = 0;
        } else if (lno > loc.last_line) {
          nli = 2;
        }

        if (line.trim().length > 0) {
          nonempty_line_indexes[nli].push(index);
        }

        rv = rv.replace(/\t/g, ' ');
        return rv;
      });

      // now make sure we don't print an overly large amount of lead/error/tail area: limit it
      // to the top and bottom line count:
      for (let i = 0; i <= 2; i++) {
        let line_arr = nonempty_line_indexes[i];

        if (line_arr.length > 2 * MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT) {
          let clip_start = line_arr[MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT - 1] + 1;
          let clip_end = line_arr[line_arr.length - MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT] - 1;
          let intermediate_line = new Array(lineno_display_width + 1).join(' ') + '  (...continued...)';

          if (i === 1) {
            intermediate_line += '\n' + new Array(lineno_display_width + 1).join('-') + '  (---------------)';
          }

          rv.splice(clip_start, clip_end - clip_start + 1, intermediate_line);
        }
      }

      return rv.join('\n');
    },

    /**
         * helper function, used to produce a human readable description as a string, given
         * the input `yylloc` location object.
         *
         * Set `display_range_too` to TRUE to include the string character index position(s)
         * in the description if the `yylloc.range` is available.
         *
         * @public
         * @this {RegExpLexer}
         */
    describeYYLLOC: function lexer_describe_yylloc(yylloc, display_range_too) {
      let l1 = yylloc.first_line;
      let l2 = yylloc.last_line;
      let c1 = yylloc.first_column;
      let c2 = yylloc.last_column;
      let dl = l2 - l1;
      let dc = c2 - c1;
      let rv;

      if (dl === 0) {
        rv = 'line ' + l1 + ', ';

        if (dc <= 1) {
          rv += 'column ' + c1;
        } else {
          rv += 'columns ' + c1 + ' .. ' + c2;
        }
      } else {
        rv = 'lines ' + l1 + '(column ' + c1 + ') .. ' + l2 + '(column ' + c2 + ')';
      }

      if (yylloc.range && display_range_too) {
        let r1 = yylloc.range[0];
        let r2 = yylloc.range[1] - 1;

        if (r2 <= r1) {
          rv += ' {String Offset: ' + r1 + '}';
        } else {
          rv += ' {String Offset range: ' + r1 + ' .. ' + r2 + '}';
        }
      }

      return rv;
    },

    /**
         * test the lexed token: return FALSE when not a match, otherwise return token.
         *
         * `match` is supposed to be an array coming out of a regex match, i.e. `match[0]`
         * contains the actually matched text string.
         *
         * Also move the input cursor forward and update the match collectors:
         *
         * - `yytext`
         * - `yyleng`
         * - `match`
         * - `matches`
         * - `yylloc`
         * - `offset`
         *
         * @public
         * @this {RegExpLexer}
         */
    test_match: function lexer_test_match(match, indexed_rule) {
      let backup;

      if (this.options.backtrack_lexer) {
        // save context
        backup = {
          yylineno: this.yylineno,

          yylloc: {
            first_line: this.yylloc.first_line,
            last_line: this.yylloc.last_line,
            first_column: this.yylloc.first_column,
            last_column: this.yylloc.last_column,
            range: this.yylloc.range.slice()
          },

          yytext: this.yytext,
          match: this.match,
          matches: this.matches,
          matched: this.matched,
          yyleng: this.yyleng,
          offset: this.offset,
          _more: this._more,
          _input: this._input,

          //_signaled_error_token: this._signaled_error_token,
          yy: this.yy,

          conditionStack: this.conditionStack.slice(),
          done: this.done
        };
      }

      let match_str = match[0];
      let match_str_len = match_str.length;
      let lines = match_str.split(this.CRLF_Re);

      if (lines.length > 1) {
        this.yylineno += lines.length - 1;
        this.yylloc.last_line = this.yylineno + 1;
        this.yylloc.last_column = lines[lines.length - 1].length;
      } else {
        this.yylloc.last_column += match_str_len;
      }

      this.yytext += match_str;
      this.match += match_str;
      this.matched += match_str;
      this.matches = match;
      this.yyleng = this.yytext.length;
      this.yylloc.range[1] += match_str_len;

      // previous lex rules MAY have invoked the `more()` API rather than producing a token:
      // those rules will already have moved this `offset` forward matching their match lengths,
      // hence we must only add our own match length now:
      this.offset += match_str_len;

      this._more = false;
      this._backtrack = false;
      this._input = this._input.slice(match_str_len);

      // calling this method:
      //
      //   function lexer__performAction(yy, yyrulenumber, YY_START) {...}
      let token = this.performAction.call(
        this,
        this.yy,
        indexed_rule,
        this.conditionStack[this.conditionStack.length - 1] /* = YY_START */
      );

      // otherwise, when the action codes are all simple return token statements:
      //token = this.simpleCaseActionClusters[indexed_rule];

      if (this.done && this._input) {
        this.done = false;
      }

      if (token) {
        return token;
      } else if (this._backtrack) {
        // recover context
        for (let k in backup) {
          this[k] = backup[k];
        }

        this.__currentRuleSet__ = null;
        return false; // rule action called reject() implying the next rule should be tested instead.
      } else if (this._signaled_error_token) {
        // produce one 'error' token as `.parseError()` in `reject()`
        // did not guarantee a failure signal by throwing an exception!
        token = this._signaled_error_token;

        this._signaled_error_token = false;
        return token;
      }

      return false;
    },

    /**
         * return next match in input
         *
         * @public
         * @this {RegExpLexer}
         */
    next: function lexer_next() {
      if (this.done) {
        this.clear();
        return this.EOF;
      }

      if (!this._input) {
        this.done = true;
      }

      if (!this._more) {
        if (!this._clear_state) {
          this._clear_state = 1;
        }

        this.clear();
      }

      let spec = this.__currentRuleSet__;

      if (!spec) {
        // Update the ruleset cache as we apparently encountered a state change or just started lexing.
        // The cache is set up for fast lookup -- we assume a lexer will switch states much less often than it will
        // invoke the `lex()` token-producing API and related APIs, hence caching the set for direct access helps
        // speed up those activities a tiny bit.
        spec = this.__currentRuleSet__ = this._currentRules();

        // Check whether a *sane* condition has been pushed before: this makes the lexer robust against
        // user-programmer bugs such as https://github.com/zaach/jison-lex/issues/19
        if (!spec || !spec.rules) {
          let lineno_msg = '';

          if (this.yylloc) {
            lineno_msg = ' on line ' + (this.yylineno + 1);
          }

          const p = this.constructLexErrorInfo(
            'Internal lexer engine error' + lineno_msg + ': The lex grammar programmer pushed a non-existing condition name "' + this.topState() + '"; this is a fatal error and should be reported to the application programmer team!',
            false
          );

          // produce one 'error' token until this situation has been resolved, most probably by parse termination!
          return this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR;
        }
      }

      {
        let rule_ids = spec.rules;
        let regexes = spec.__rule_regexes;
        let len = spec.__rule_count;
        let match;
        let index;

        // Note: the arrays are 1-based, while `len` itself is a valid index,
        // hence the non-standard less-or-equal check in the next loop condition!
        for (let i = 1; i <= len; i++) {
          let tempMatch = this._input.match(regexes[i]);

          if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
            match = tempMatch;
            index = i;

            if (this.options.backtrack_lexer) {
              let token = this.test_match(tempMatch, rule_ids[i]);

              if (token !== false) {
                return token;
              } else if (this._backtrack) {
                match = undefined;
                continue; // rule action called reject() implying a rule MISmatch.
              } else {
                // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                return false;
              }
            } else if (!this.options.flex) {
              break;
            }
          }
        }

        if (match) {
          let token = this.test_match(match, rule_ids[index]);

          if (token !== false) {
            return token;
          }

          // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
          return false;
        }
      }

      if (!this._input) {
        this.done = true;
        this.clear();
        return this.EOF;
      }

      {
        let lineno_msg = 'Lexical error';

        if (this.yylloc) {
          lineno_msg += ' on line ' + (this.yylineno + 1);
        }

        const p = this.constructLexErrorInfo(
          lineno_msg + ': Unrecognized text.',
          this.options.lexerErrorsAreRecoverable
        );

        let pendingInput = this._input;
        let activeCondition = this.topState();
        let conditionStackDepth = this.conditionStack.length;
        let token = this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR;

        //if (token === this.ERROR) {
        // we can try to recover from a lexer error that `parseError()` did not 'recover' for us
        // by moving forward at least one character at a time IFF the (user-specified?) `parseError()`
        // has not consumed/modified any pending input or changed state in the error handler:
        if (!this.matches && // and make sure the input has been modified/consumed ...
        pendingInput === this._input && // ...or the lexer state has been modified significantly enough
        // to merit a non-consuming error handling action right now.
        activeCondition === this.topState() && conditionStackDepth === this.conditionStack.length) {
          this.input();
        }

        //}
        return token;
      }
    },

    /**
         * return next match that has a token
         *
         * @public
         * @this {RegExpLexer}
         */
    lex: function lexer_lex() {
      let r;

      //this._clear_state = 0;

      if (!this._more) {
        if (!this._clear_state) {
          this._clear_state = 1;
        }

        this.clear();
      }

      // allow the PRE/POST handlers set/modify the return token for maximum flexibility of the generated lexer:
      if (typeof this.pre_lex === 'function') {
        r = this.pre_lex.call(this, 0);
      }

      if (typeof this.options.pre_lex === 'function') {
        // (also account for a userdef function which does not return any value: keep the token as is)
        r = this.options.pre_lex.call(this, r) || r;
      }

      if (this.yy && typeof this.yy.pre_lex === 'function') {
        // (also account for a userdef function which does not return any value: keep the token as is)
        r = this.yy.pre_lex.call(this, r) || r;
      }

      while (!r) {
        r = this.next();
      }

      if (this.yy && typeof this.yy.post_lex === 'function') {
        // (also account for a userdef function which does not return any value: keep the token as is)
        r = this.yy.post_lex.call(this, r) || r;
      }

      if (typeof this.options.post_lex === 'function') {
        // (also account for a userdef function which does not return any value: keep the token as is)
        r = this.options.post_lex.call(this, r) || r;
      }

      if (typeof this.post_lex === 'function') {
        // (also account for a userdef function which does not return any value: keep the token as is)
        r = this.post_lex.call(this, r) || r;
      }

      if (!this._more) {
        //
        // 1) make sure any outside interference is detected ASAP:
        //    these attributes are to be treated as 'const' values
        //    once the lexer has produced them with the token (return value `r`).
        // 2) make sure any subsequent `lex()` API invocation CANNOT
        //    edit the `yytext`, etc. token attributes for the *current*
        //    token, i.e. provide a degree of 'closure safety' so that
        //    code like this:
        //
        //        t1 = lexer.lex();
        //        v = lexer.yytext;
        //        l = lexer.yylloc;
        //        t2 = lexer.lex();
        //        assert(lexer.yytext !== v);
        //        assert(lexer.yylloc !== l);
        //
        //    succeeds. Older (pre-v0.6.5) jison versions did not *guarantee*
        //    these conditions.
        //
        this.yytext = Object.freeze(this.yytext);

        this.matches = Object.freeze(this.matches);
        this.yylloc.range = Object.freeze(this.yylloc.range);
        this.yylloc = Object.freeze(this.yylloc);
        this._clear_state = 0;
      }

      return r;
    },

    /**
         * return next match that has a token. Identical to the `lex()` API but does not invoke any of the
         * `pre_lex()` nor any of the `post_lex()` callbacks.
         *
         * @public
         * @this {RegExpLexer}
         */
    fastLex: function lexer_fastLex() {
      let r;

      //this._clear_state = 0;

      while (!r) {
        r = this.next();
      }

      if (!this._more) {
        //
        // 1) make sure any outside interference is detected ASAP:
        //    these attributes are to be treated as 'const' values
        //    once the lexer has produced them with the token (return value `r`).
        // 2) make sure any subsequent `lex()` API invocation CANNOT
        //    edit the `yytext`, etc. token attributes for the *current*
        //    token, i.e. provide a degree of 'closure safety' so that
        //    code like this:
        //
        //        t1 = lexer.lex();
        //        v = lexer.yytext;
        //        l = lexer.yylloc;
        //        t2 = lexer.lex();
        //        assert(lexer.yytext !== v);
        //        assert(lexer.yylloc !== l);
        //
        //    succeeds. Older (pre-v0.6.5) jison versions did not *guarantee*
        //    these conditions.
        //
        this.yytext = Object.freeze(this.yytext);

        this.matches = Object.freeze(this.matches);
        this.yylloc.range = Object.freeze(this.yylloc.range);
        this.yylloc = Object.freeze(this.yylloc);
        this._clear_state = 0;
      }

      return r;
    },

    /**
         * return info about the lexer state that can help a parser or other lexer API user to use the
         * most efficient means available. This API is provided to aid run-time performance for larger
         * systems which employ this lexer.
         *
         * @public
         * @this {RegExpLexer}
         */
    canIUse: function lexer_canIUse() {
      const rv = {
        fastLex: !(typeof this.pre_lex === 'function' || typeof this.options.pre_lex === 'function' || this.yy && typeof this.yy.pre_lex === 'function' || this.yy && typeof this.yy.post_lex === 'function' || typeof this.options.post_lex === 'function' || typeof this.post_lex === 'function') && typeof this.fastLex === 'function'
      };

      return rv;
    },

    /**
         * backwards compatible alias for `pushState()`;
         * the latter is symmetrical with `popState()` and we advise to use
         * those APIs in any modern lexer code, rather than `begin()`.
         *
         * @public
         * @this {RegExpLexer}
         */
    begin: function lexer_begin(condition) {
      return this.pushState(condition);
    },

    /**
         * activates a new lexer condition state (pushes the new lexer
         * condition state onto the condition stack)
         *
         * @public
         * @this {RegExpLexer}
         */
    pushState: function lexer_pushState(condition) {
      this.conditionStack.push(condition);
      this.__currentRuleSet__ = null;
      return this;
    },

    /**
         * pop the previously active lexer condition state off the condition
         * stack
         *
         * @public
         * @this {RegExpLexer}
         */
    popState: function lexer_popState() {
      const n = this.conditionStack.length - 1;

      if (n > 0) {
        this.__currentRuleSet__ = null;
        return this.conditionStack.pop();
      }

      return this.conditionStack[0];
    },

    /**
         * return the currently active lexer condition state; when an index
         * argument is provided it produces the N-th previous condition state,
         * if available
         *
         * @public
         * @this {RegExpLexer}
         */
    topState: function lexer_topState(n) {
      n = this.conditionStack.length - 1 - Math.abs(n || 0);

      if (n >= 0) {
        return this.conditionStack[n];
      }

      return 'INITIAL';
    },

    /**
         * (internal) determine the lexer rule set which is active for the
         * currently active lexer condition state
         *
         * @public
         * @this {RegExpLexer}
         */
    _currentRules: function lexer__currentRules() {
      const n = this.conditionStack.length - 1;
      let state;

      if (n >= 0) {
        state = this.conditionStack[n];
      } else {
        state = 'INITIAL';
      }

      return this.conditions[state] || this.conditions.INITIAL;
    },

    /**
         * return the number of states currently on the stack
         *
         * @public
         * @this {RegExpLexer}
         */
    stateStackSize: function lexer_stateStackSize() {
      return this.conditionStack.length;
    },

    options: {
      xregexp: true,
      ranges: true,
      trackPosition: true,
      easy_keyword_rules: true
    },

    JisonLexerError: JisonLexerError,

    performAction: function lexer__performAction(yy, yyrulenumber, YY_START) {
      var yy_ = this;

      switch (yyrulenumber) {
      case 0:
        /*! Conditions:: INITIAL macro options rules */
        /*! Rule::       \/\/[^\r\n]* */
        /* skip single-line comment */
        break;
      case 1:
        /*! Conditions:: INITIAL macro options rules */
        /*! Rule::       \/\*[^]*?\*\/ */
        /* skip multi-line comment */
        break;
      case 2:
        /*! Conditions:: action */
        /*! Rule::       %\{([^]*?)%\}(?!\}) */
        yy_.yytext = this.matches[1];

        yy.include_command_allowed = false;
        return 36;
      case 3:
        /*! Conditions:: action */
        /*! Rule::       %include\b */
        if (yy.include_command_allowed) {
          // This is an include instruction in place of (part of) an action:
          this.pushState('options');

          return 31;
        } else {
          // TODO
          yy_.yyerror(rmCommonWS`
                                                %include statements must occur on a line on their own and cannot occur inside an action code block.
                                                Its use is not permitted at this position.

                                                  Erroneous area:
                                                ${this.prettyPrintRange(yy_.yylloc)}
                                            `);

          return 37;
        }
      case 4:
        /*! Conditions:: action */
        /*! Rule::       \/\*[^]*?\*\/ */
        //yy.include_command_allowed = false; -- doesn't impact include-allowed state
        return 36;
      case 5:
        /*! Conditions:: action */
        /*! Rule::       \/\/.* */
        yy.include_command_allowed = false;

        return 36;
      case 6:
        /*! Conditions:: action */
        /*! Rule::       \| */
        if (yy.depth === 0) {
          this.popState();
          this.unput(yy_.yytext);

          // yy_.yytext = '';    --- ommitted as this is the side-effect of .unput(yy_.yytext) already!
          return 24;
        } else {
          return 36;
        }
      case 7:
        /*! Conditions:: action */
        /*! Rule::       %% */
        if (yy.depth === 0) {
          this.popState();
          this.unput(yy_.yytext);

          // yy_.yytext = '';    --- ommitted as this is the side-effect of .unput(yy_.yytext) already!
          return 24;
        } else {
          return 36;
        }
      case 8:
        /*! Conditions:: action */
        /*! Rule::       \/(?=\s) */
        return 36;       // most probably a `/` divide operator. 
      case 9:
        /*! Conditions:: action */
        /*! Rule::       \/.* */
        {
          yy.include_command_allowed = false;
          let l = scanRegExp(yy_.yytext);

          if (l > 0) {
            this.unput(yy_.yytext.substring(l));
            yy_.yytext = yy_.yytext.substring(0, l);
          } else {
            // assume it's a division operator:
            this.unput(yy_.yytext.substring(1));

            yy_.yytext = yy_.yytext[0];
          }

          return 36;
        }
      case 10:
        /*! Conditions:: action */
        /*! Rule::       "{DOUBLEQUOTED_STRING_CONTENT}"|'{QUOTED_STRING_CONTENT}'|`{ES2017_STRING_CONTENT}` */
        yy.include_command_allowed = false;

        return 36;
      case 11:
        /*! Conditions:: action */
        /*! Rule::       [^/"'`%\{\}\/{BR}]+ */
        yy.include_command_allowed = false;

        return 36;
      case 12:
        /*! Conditions:: action */
        /*! Rule::       % */
        yy.include_command_allowed = false;

        return 36;
      case 13:
        /*! Conditions:: action */
        /*! Rule::       \{ */
        yy.depth++;

        yy.include_command_allowed = false;
        return 36;
      case 14:
        /*! Conditions:: action */
        /*! Rule::       \} */
        yy.include_command_allowed = false;

        if (yy.depth <= 0) {
          yy_.yyerror(rmCommonWS`
                                                too many closing curly braces in lexer rule action block.

                                                Note: the action code chunk may be too complex for jison to parse
                                                easily; we suggest you wrap the action code chunk in '%{...%}'
                                                to help jison grok more or less complex action code chunks.

                                                  Erroneous area:
                                                ${this.prettyPrintRange(yy_.yylloc)}
                                            `);

          return 39;
        } else {
          yy.depth--;
        }

        return 36;
      case 15:
        /*! Conditions:: action */
        /*! Rule::       (?:[\s\r\n]*?){BR}+{WS}+ */
        yy.include_command_allowed = true;

        return 36;           // keep empty lines as-is inside action code blocks. 
      case 17:
        /*! Conditions:: action */
        /*! Rule::       {BR} */
        if (yy.depth > 0) {
          yy.include_command_allowed = true;
          return 36;       // keep empty lines as-is inside action code blocks.
        } else {
          // end of action code chunk; allow parent mode to see this mode-terminating linebreak too.
          this.popState();

          this.unput(yy_.yytext);

          // yy_.yytext = '';    --- ommitted as this is the side-effect of .unput(yy_.yytext) already!
          return 24;
        }
      case 18:
        /*! Conditions:: action */
        /*! Rule::       $ */
        yy.include_command_allowed = false;

        if (yy.depth !== 0) {
          yy_.yyerror(rmCommonWS`
                                                missing ${yy.depth} closing curly braces in lexer rule action block.

                                                Note: the action code chunk may be too complex for jison to parse
                                                easily; we suggest you wrap the action code chunk in '%{...%}'
                                                to help jison grok more or less complex action code chunks.

                                                  Erroneous area:
                                                ${this.prettyPrintRange(yy_.yylloc)}
                                            `);

          return 38;
        }

        this.popState();
        yy_.yytext = '';
        return 24;
      case 19:
        /*! Conditions:: INITIAL rules code options */
        /*! Rule::       [%\{]\{+ */
        {
          yy.depth = 0;
          yy.include_command_allowed = false;
          this.pushState('action');

          // keep matched string in local variable as the `unput()` call at the end will also 'unput' `yy_.yytext`,
          // which for our purposes here is highly undesirable (see trimActionCode() use in the BNF parser spec).
          let marker = yy_.yytext;

          // check whether this `%{` marker was located at the start of the line:
          // if it is, we treat it as a different token to signal the grammar we've
          // got an action which stands on its own, i.e. is not a rule action, %code
          // section, etc...
          //let precedingStr = this.pastInput(1,2).replace(/[\r\n]/g, '\n');
          //let precedingStr = this.matched.substr(-this.match.length - 1, 1);
          let precedingStr = this.matched[this.matched.length - this.match.length - 1];

          let atSOL = !precedingStr /* @ Start Of File */ || precedingStr === '\n';

          // Make sure we've got the proper lexer rule regex active for any possible `%{...%}`, `{{...}}` or what have we here?
          let endMarker = this.setupDelimitedActionChunkLexerRegex(marker);

          // Early sanity check for better error reporting:
          // we'd better make sure that end marker indeed does exist in the
          // remainder of the input! When it's not, we'll have the `action`
          // lexer state running past its due date as it'll then go and spit
          // out a 'too may closing braces' error report at some spot way
          // beyond the intended end of the action code chunk.
          //
          // Writing the wrong end marker is a common user mistake, we can
          // easily look ahead and check for it now and report a proper hint
          // to cover this failure mode in a more helpful manner.
          let remaining = this.lookAhead();

          let prevEnd = 0;
          let endMarkerIndex;

          for (; ; ) {
            endMarkerIndex = remaining.indexOf(endMarker, prevEnd);

            // check for both simple non-existence *and* non-match due to trailing braces,
            // e.g. in this input: `%{{...%}}}` -- note the 3rd curly closing brace.
            if (endMarkerIndex >= 0 && remaining[endMarkerIndex + endMarker.length] === '}') {
              prevEnd = endMarkerIndex + endMarker.length;
              continue;
            }

            if (endMarkerIndex < 0) {
              yy_.yyerror(rmCommonWS`
                                                    Incorrectly terminated action code block. We're expecting the
                                                    '${endMarker}' end marker to go with the given start marker.
                                                    Regrettably, it does not exist in the remainder of the input.

                                                      Erroneous area:
                                                    ${this.prettyPrintRange(yy_.yylloc)}
                                                `);

              return 25;
            }

            break;
          }

          // Allow the start marker to be re-matched by the generated lexer rule regex:
          this.unput(marker);

          // Now RESET `yy_.yytext` to what it was originally, i.e. un-unput that lexer variable explicitly:
          yy_.yytext = marker;

          // and allow the next lexer round to match and execute the suitable lexer rule(s) to parse this incoming action code block.
          if (atSOL) {
            return 23;
          }

          return 26;
        }
      case 20:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       -> */
        yy.depth = 0;

        yy.include_command_allowed = false;
        this.pushState('action');
        return 35;
      case 21:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       → */
        yy.depth = 0;

        yy.include_command_allowed = false;
        this.pushState('action');
        return 35;
      case 22:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       => */
        yy.depth = 0;

        yy.include_command_allowed = false;
        this.pushState('action');
        return 35;
      case 23:
        /*! Conditions:: rules */
        /*! Rule::       {WS}+(?!(?:\{\{|\||%|->|=>|→|{WS}|{BR})) */
        {
          yy.depth = 0;
          yy.include_command_allowed = true;

          //console.error('*** ACTION start @ 355:', yy_.yytext);
          this.pushState('action');

          // Do a bit of magic that's useful for the parser when we
          // call `trimActionCode()` in there to perform a bit of
          // rough initial action code chunk cleanup:
          // when we start the action block -- hence *delimit* the
          // action block -- with a plain old '{' brace, we can
          // throw that one and its counterpart out safely without
          // damaging the action code in any way.
          //
          // In order to be able to detect that, we look ahead
          // now and see whether or rule's regex with the fancy
          // '/!' postcondition check actually hit a '{', which
          // is the only action code block starter we cannot
          // detect explicitly using any of the '%{.*?%}' lexer
          // rules you've seen further above.
          //
          // Thanks to this rule's regex, we DO know that the
          // first look-ahead character will be a non-whitespace
          // character, which would either be an action code block
          // delimiter *or* a comment starter. In the latter case
          // we just throw up our hands and leave code trimming
          // and analysis to the more advanced systems which
          // follow after `trimActionCode()` has passed once we
          // get to the parser productions which process this
          // upcoming action code block.
          let la = this.lookAhead();

          if (la[0] === '{') {
            yy_.yytext = '{';           // hint the parser
          }

          return 26;
        }
      case 24:
        /*! Conditions:: rules */
        /*! Rule::       %% */
        this.popState();

        this.pushState('code');
        return 34;
      case 25:
        /*! Conditions:: rules */
        /*! Rule::       $ */
        this.popState();

        this.pushState('code');
        return 34;
      case 30:
        /*! Conditions:: options */
        /*! Rule::       %%|\||; */
        this.popState();

        this.unput(yy_.yytext);
        return 22;
      case 31:
        /*! Conditions:: options */
        /*! Rule::       $ */
        this.popState();

        return 22;
      case 32:
        /*! Conditions:: options */
        /*! Rule::       %include\b */
        yy.depth = 0;

        yy.include_command_allowed = true;
        this.pushState('action');

        // push the parsed '%include' back into the input-to-parse
        // to trigger the `<action>` state to re-parse it
        // and issue the desired follow-up token: 'INCLUDE':
        this.unput(yy_.yytext);

        return 26;
      case 33:
        /*! Conditions:: options */
        /*! Rule::       > */
        this.popState();

        this.unput(yy_.yytext);
        return 22;
      case 36:
        /*! Conditions:: options */
        /*! Rule::       <{ID}> */
        yy_.yytext = this.matches[1];

        return 'TOKEN_TYPE';
      case 37:
        /*! Conditions:: options */
        /*! Rule::       {HEX_NUMBER}(?![{ANY_LITERAL_CHAR}]) */
        yy_.yytext = parseInt(yy_.yytext, 16);

        return 55;
      case 38:
        /*! Conditions:: options */
        /*! Rule::       -?{DECIMAL_NUMBER}(?![{ANY_LITERAL_CHAR}]) */
        yy_.yytext = parseInt(yy_.yytext, 10);

        return 55;
      case 40:
        /*! Conditions:: options */
        /*! Rule::       {BR}{WS}+(?=\S) */
        /* ignore */
        break;
      case 41:
        /*! Conditions:: options */
        /*! Rule::       {BR} */
        this.popState();

        this.unput(yy_.yytext);
        return 22;
      case 42:
        /*! Conditions:: options */
        /*! Rule::       {WS}+ */
        /* skip whitespace */
        break;
      case 43:
        /*! Conditions:: INITIAL */
        /*! Rule::       {ID} */
        this.pushState('macro');

        return 20;
      case 44:
        /*! Conditions:: macro */
        /*! Rule::       {BR}+ */
        this.popState();

        this.unput(yy_.yytext);
        return 21;
      case 45:
        /*! Conditions:: macro */
        /*! Rule::       $ */
        this.popState();

        this.unput(yy_.yytext);
        return 21;
      case 46:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       {BR}+ */
        /* skip newlines */
        break;
      case 47:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       {WS}+ */
        /* skip whitespace */
        break;
      case 51:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       {ANY_LITERAL_CHAR}+ */
        // accept any non-regex, non-lex, non-string-delim,
        // non-escape-starter, non-space character as-is
        return 52;
      case 52:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       \[ */
        this.pushState('set');

        return 46;
      case 67:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       < */
        this.pushState('options');

        return 3;
      case 69:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       \/! */
        return 42;                    // treated as `(?!atom)` 
      case 70:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       \/ */
        return 13;                     // treated as `(?=atom)` 
      case 72:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       \\(?:([0-7]{1,3})|c([A-Z])|x([0-9a-fA-F]{2})|u([0-9a-fA-F]{4})|u\{([0-9a-fA-F]{1,8})\}) */
        {
          let m = this.matches;
          yy_.yytext = NaN;

          if (m[1]) {
            // [1]: octal char: `\012` --> \x0A
            let v = parseInt(m[1], 8);

            yy_.yytext = v;
          } else if (m[2]) {
            // [2]: CONTROL char: `\cA` --> \u0001
            let v = m[2].charCodeAt(0) - 64;

            yy_.yytext = v;
          } else if (m[3]) {
            // [3]: hex char: `\x41` --> A
            let v = parseInt(m[3], 16);

            yy_.yytext = v;
          } else if (m[4]) {
            // [4]: unicode/UTS2 char: `\u03c0` --> PI
            let v = parseInt(m[4], 16);

            yy_.yytext = v;
          } else if (m[5]) {
            // [5]: unicode code point: `\u{00003c0}` --> PI
            let v = parseInt(m[5], 16);

            yy_.yytext = v;
          }

          return 44;
        }
      case 73:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       \\. */
        yy_.yytext = yy_.yytext.substring(1);

        return 52;
      case 76:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       %option[s]? */
        this.pushState('options');

        return 28;
      case 77:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       %s\b */
        this.pushState('options');

        return 32;
      case 78:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       %x\b */
        this.pushState('options');

        return 33;
      case 79:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       %code\b */
        this.pushState('options');

        return 30;
      case 80:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       %import\b */
        this.pushState('options');

        return 29;
      case 83:
        /*! Conditions:: INITIAL rules code */
        /*! Rule::       %include\b */
        {
          yy.depth = 0;
          yy.include_command_allowed = true;

          // check whether this `%include` command was located at the start of the line:
          // if it is, we treat it as a different token to signal the grammar we've
          // got an action which stands on its own.
          let precedingStr = this.matched[this.matched.length - this.match.length - 1];

          let atSOL = !precedingStr /* @ Start Of File */ || precedingStr === '\n';
          this.pushState('action');

          // push the parsed '%include' back into the input-to-parse
          // to trigger the `<action>` state to re-parse it
          // and issue the desired follow-up token: 'INCLUDE':
          this.unput(yy_.yytext);

          // and allow the next lexer round to match and execute the suitable lexer rule(s) to parse this incoming action code block.
          if (atSOL) {
            return 23;
          }

          return 26;
        }
      case 84:
        /*! Conditions:: INITIAL rules code */
        /*! Rule::       %{NAME}([^\r\n]*) */
        /* ignore unrecognized decl */
        this.warn(rmCommonWS`
                                                ignoring unsupported lexer option ${dquote(yy_.yytext)}
                                                while lexing in ${dquote(this.topState())} state.

                                                  Erroneous area:
                                                ${this.prettyPrintRange(yy_.yylloc)}
                                            `);

        yy_.yytext = {
          // {NAME}
          name: this.matches[1],

          // optional value/parameters
          value: this.matches[2].trim()
        };

        return 27;
      case 85:
        /*! Conditions:: rules macro INITIAL */
        /*! Rule::       %% */
        this.pushState('rules');

        return 34;
      case 93:
        /*! Conditions:: set */
        /*! Rule::       \] */
        this.popState();

        return 47;
      case 94:
        /*! Conditions:: set */
        /*! Rule::       {BR} */
        this.popState();

        this.unput(yy_.yytext);

        yy_.yyerror(rmCommonWS`
                                                regex [...] sets cannot span multiple lines.

                                                If you want a CR/LF to be part of a regex set, you can simply
                                                specify those as character escapes '\\r' and '\\n'.

                                                  Erroneous area:
                                                ${this.prettyPrintRange(yy_.yylloc)}
                                            `);

        return 48;
      case 95:
        /*! Conditions:: set */
        /*! Rule::       $ */
        this.popState();

        yy_.yyerror(rmCommonWS`
                                            The regex [...] set has not been properly terminated by ']'.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

        return 48;
      case 96:
        /*! Conditions:: code */
        /*! Rule::       (?:[^%{BR}][^{BR}]*{BR}+)+ */
        return 56;      // shortcut to grab a large bite at once when we're sure not to encounter any `%include` in there at start-of-line. 
      case 98:
        /*! Conditions:: code */
        /*! Rule::       [^{BR}]+ */
        return 56;      // the bit of CODE just before EOF... 
      case 99:
        /*! Conditions:: action */
        /*! Rule::       " */
        yy_.yyerror(rmCommonWS`
                                            unterminated string constant in lexer rule action block.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

        return 40;
      case 100:
        /*! Conditions:: action */
        /*! Rule::       ' */
        yy_.yyerror(rmCommonWS`
                                            unterminated string constant in lexer rule action block.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

        return 40;
      case 101:
        /*! Conditions:: action */
        /*! Rule::       ` */
        yy_.yyerror(rmCommonWS`
                                            unterminated string constant in lexer rule action block.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

        return 40;
      case 102:
        /*! Conditions:: options */
        /*! Rule::       " */
        yy_.yyerror(rmCommonWS`
                                            unterminated string constant in %options entry.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

        return 40;
      case 103:
        /*! Conditions:: options */
        /*! Rule::       ' */
        yy_.yyerror(rmCommonWS`
                                            unterminated string constant in %options entry.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

        return 40;
      case 104:
        /*! Conditions:: options */
        /*! Rule::       ` */
        yy_.yyerror(rmCommonWS`
                                            unterminated string constant in %options entry.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

        return 40;
      case 105:
        /*! Conditions:: * */
        /*! Rule::       " */
        {
          let rules = this.topState() === 'macro' ? 'macro\'s' : this.topState();

          yy_.yyerror(rmCommonWS`
                                            unterminated string constant encountered while lexing
                                            ${rules}.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

          return 40;
        }
      case 106:
        /*! Conditions:: * */
        /*! Rule::       ' */
        {
          let rules = this.topState() === 'macro' ? 'macro\'s' : this.topState();

          yy_.yyerror(rmCommonWS`
                                            unterminated string constant encountered while lexing
                                            ${rules}.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

          return 40;
        }
      case 107:
        /*! Conditions:: * */
        /*! Rule::       ` */
        {
          let rules = this.topState() === 'macro' ? 'macro\'s' : this.topState();

          yy_.yyerror(rmCommonWS`
                                            unterminated string constant encountered while lexing
                                            ${rules}.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

          return 40;
        }
      case 108:
        /*! Conditions:: macro rules */
        /*! Rule::       . */
        {
          /* b0rk on bad characters */
          let rules = this.topState() === 'macro' ? 'macro\'s' : this.topState();

          yy_.yyerror(rmCommonWS`
                                            unsupported lexer input encountered while lexing
                                            ${rules} (i.e. jison lex regexes) in ${dquote(this.topState())} state.

                                                NOTE: When you want this input to be interpreted as a LITERAL part
                                                      of a lex rule regex, you MUST enclose it in double or
                                                      single quotes.

                                                      If not, then know that this input is not accepted as a valid
                                                      regex expression here in jison-lex ${rules}.

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

          return 2;
        }
      case 109:
        /*! Conditions:: options */
        /*! Rule::       . */
        yy_.yyerror(rmCommonWS`
                                            unsupported lexer input: ${dquote(yy_.yytext)}
                                            while lexing in ${dquote(this.topState())} state.

                                            If this input was intentional, you might want to put quotes around
                                            it; any JavaScript string quoting style is accepted (single quotes,
                                            double quotes *or* backtick quotes a la ES6 string templates).

                                              Erroneous area:
                                            ${this.prettyPrintRange(yy_.yylloc)}
                                        `);

        return 2;
      case 110:
        /*! Conditions:: * */
        /*! Rule::       . */
        /* b0rk on bad characters */
        yy_.yyerror(rmCommonWS`
                                                unsupported lexer input: ${dquote(yy_.yytext)}
                                                while lexing in ${dquote(this.topState())} state.

                                                  Erroneous area:
                                                ${this.prettyPrintRange(yy_.yylloc)}
                                            `);

        return 2;
      default:
        return this.simpleCaseActionClusters[yyrulenumber];
      }
    },

    simpleCaseActionClusters: {
      /*! Conditions:: action */
      /*! Rule::       {WS}+ */
      16: 36,

      /*! Conditions:: options */
      /*! Rule::       = */
      26: 18,

      /*! Conditions:: options */
      /*! Rule::       "{DOUBLEQUOTED_STRING_CONTENT}" */
      27: 53,

      /*! Conditions:: options */
      /*! Rule::       '{QUOTED_STRING_CONTENT}' */
      28: 53,

      /*! Conditions:: options */
      /*! Rule::       `{ES2017_STRING_CONTENT}` */
      29: 53,

      /*! Conditions:: options */
      /*! Rule::       , */
      34: 17,

      /*! Conditions:: options */
      /*! Rule::       \* */
      35: 11,

      /*! Conditions:: options */
      /*! Rule::       {ANY_LITERAL_CHAR}+ */
      39: 54,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       "{DOUBLEQUOTED_STRING_CONTENT}" */
      48: 51,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       '{QUOTED_STRING_CONTENT}' */
      49: 51,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       `{ES2017_STRING_CONTENT}` */
      50: 51,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \| */
      53: 7,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \(\?: */
      54: 41,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \(\?= */
      55: 41,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \(\?! */
      56: 41,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \(\?<= */
      57: 41,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \(\?<! */
      58: 41,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \( */
      59: 8,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \) */
      60: 9,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \+ */
      61: 10,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \* */
      62: 11,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \? */
      63: 12,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \^ */
      64: 15,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       , */
      65: 17,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       <<EOF>> */
      66: 16,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       > */
      68: 6,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \\(?:[sSbBwWdDpP]|[rfntv\\*+()${}|[\]\/.^?]) */
      71: 43,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \$ */
      74: 16,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \. */
      75: 14,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       %pointer\b */
      81: 'FLEX_POINTER_MODE',

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       %array\b */
      82: 'FLEX_ARRAY_MODE',

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \{\d+(,\s*\d+|,)?\} */
      86: 50,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \{{ID}\} */
      87: 45,

      /*! Conditions:: set options */
      /*! Rule::       \{{ID}\} */
      88: 45,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \{ */
      89: 4,

      /*! Conditions:: rules macro INITIAL */
      /*! Rule::       \} */
      90: 5,

      /*! Conditions:: set */
      /*! Rule::       (?:\\[^{BR}]|[^\]\{{BR}])+ */
      91: 49,

      /*! Conditions:: set */
      /*! Rule::       \{ */
      92: 49,

      /*! Conditions:: code */
      /*! Rule::       [^{BR}]*{BR}+ */
      97: 56,

      /*! Conditions:: * */
      /*! Rule::       $ */
      111: 1
    },

    rules: [
      /*   0: */  /^(?:\/\/[^\r\n]*)/,
      /*   1: */  /^(?:\/\*[\s\S]*?\*\/)/,
      /*   2: */  /^(?:%\{([\s\S]*?)%\}(?!\}))/,
      /*   3: */  /^(?:%include\b)/,
      /*   4: */  /^(?:\/\*[\s\S]*?\*\/)/,
      /*   5: */  /^(?:\/\/.*)/,
      /*   6: */  /^(?:\|)/,
      /*   7: */  /^(?:%%)/,
      /*   8: */  /^(?:\/(?=\s))/,
      /*   9: */  /^(?:\/.*)/,
      /*  10: */  /^(?:"((?:\\"|\\[^"]|[^\n\r"\\])*)"|'((?:\\'|\\[^']|[^\n\r'\\])*)'|`((?:\\`|\\[^`]|[^\\`])*)`)/,
      /*  11: */  /^(?:[^\n\r"%'/`{}]+)/,
      /*  12: */  /^(?:%)/,
      /*  13: */  /^(?:\{)/,
      /*  14: */  /^(?:\})/,
      /*  15: */  /^(?:(?:\s*?)(\r\n|\n|\r)+([^\S\n\r])+)/,
      /*  16: */  /^(?:([^\S\n\r])+)/,
      /*  17: */  /^(?:(\r\n|\n|\r))/,
      /*  18: */  /^(?:$)/,
      /*  19: */  /^(?:[%{]\{+)/,
      /*  20: */  /^(?:->)/,
      /*  21: */  /^(?:→)/,
      /*  22: */  /^(?:=>)/,
      /*  23: */  /^(?:([^\S\n\r])+(?!(?:\{\{|\||%|->|=>|→|([^\S\n\r])|(\r\n|\n|\r))))/,
      /*  24: */  /^(?:%%)/,
      /*  25: */  /^(?:$)/,
      /*  26: */  /^(?:=)/,
      /*  27: */  /^(?:"((?:\\"|\\[^"]|[^\n\r"\\])*)")/,
      /*  28: */  /^(?:'((?:\\'|\\[^']|[^\n\r'\\])*)')/,
      /*  29: */  /^(?:`((?:\\`|\\[^`]|[^\\`])*)`)/,
      /*  30: */  /^(?:%%|\||;)/,
      /*  31: */  /^(?:$)/,
      /*  32: */  /^(?:%include\b)/,
      /*  33: */  /^(?:>)/,
      /*  34: */  /^(?:,)/,
      /*  35: */  /^(?:\*)/,
      /*  36: */  new XRegExp__default['default']('^(?:<([\\p{Alphabetic}_](?:[\\p{Alphabetic}\\p{Number}_])*)>)', ''),
      /*  37: */  /^(?:(0[Xx][\dA-Fa-f]+)(?![^\s!"$%'-,./:-?\[-\^`{-}]))/,
      /*  38: */  /^(?:-?([1-9]\d*)(?![^\s!"$%'-,./:-?\[-\^`{-}]))/,
      /*  39: */  /^(?:([^\s!"$%'-,./:-?\[-\^`{-}])+)/,
      /*  40: */  /^(?:(\r\n|\n|\r)([^\S\n\r])+(?=\S))/,
      /*  41: */  /^(?:(\r\n|\n|\r))/,
      /*  42: */  /^(?:([^\S\n\r])+)/,
      /*  43: */  new XRegExp__default['default']('^(?:([\\p{Alphabetic}_](?:[\\p{Alphabetic}\\p{Number}_])*))', ''),
      /*  44: */  /^(?:(\r\n|\n|\r)+)/,
      /*  45: */  /^(?:$)/,
      /*  46: */  /^(?:(\r\n|\n|\r)+)/,
      /*  47: */  /^(?:([^\S\n\r])+)/,
      /*  48: */  /^(?:"((?:\\"|\\[^"]|[^\n\r"\\])*)")/,
      /*  49: */  /^(?:'((?:\\'|\\[^']|[^\n\r'\\])*)')/,
      /*  50: */  /^(?:`((?:\\`|\\[^`]|[^\\`])*)`)/,
      /*  51: */  /^(?:([^\s!"$%'-,./:-?\[-\^`{-}])+)/,
      /*  52: */  /^(?:\[)/,
      /*  53: */  /^(?:\|)/,
      /*  54: */  /^(?:\(\?:)/,
      /*  55: */  /^(?:\(\?=)/,
      /*  56: */  /^(?:\(\?!)/,
      /*  57: */  /^(?:\(\?<=)/,
      /*  58: */  /^(?:\(\?<!)/,
      /*  59: */  /^(?:\()/,
      /*  60: */  /^(?:\))/,
      /*  61: */  /^(?:\+)/,
      /*  62: */  /^(?:\*)/,
      /*  63: */  /^(?:\?)/,
      /*  64: */  /^(?:\^)/,
      /*  65: */  /^(?:,)/,
      /*  66: */  /^(?:<<EOF>>)/,
      /*  67: */  /^(?:<)/,
      /*  68: */  /^(?:>)/,
      /*  69: */  /^(?:\/!)/,
      /*  70: */  /^(?:\/)/,
      /*  71: */  /^(?:\\(?:[BDPSWbdpsw]|[$(-+./?\[-\^fnrtv{-}]))/,
      /*  72: */  /^(?:\\(?:([0-7]{1,3})|c([A-Z])|x([\dA-Fa-f]{2})|u([\dA-Fa-f]{4})|u\{([\dA-Fa-f]{1,8})\}))/,
      /*  73: */  /^(?:\\.)/,
      /*  74: */  /^(?:\$)/,
      /*  75: */  /^(?:\.)/,
      /*  76: */  /^(?:%option[s]?)/,
      /*  77: */  /^(?:%s\b)/,
      /*  78: */  /^(?:%x\b)/,
      /*  79: */  /^(?:%code\b)/,
      /*  80: */  /^(?:%import\b)/,
      /*  81: */  /^(?:%pointer\b)/,
      /*  82: */  /^(?:%array\b)/,
      /*  83: */  /^(?:%include\b)/,
      /*  84: */  new XRegExp__default['default'](
        '^(?:%([\\p{Alphabetic}_](?:[\\p{Alphabetic}\\p{Number}\\-_]*(?:[\\p{Alphabetic}\\p{Number}_]))?)([^\\n\\r]*))',
        ''
      ),
      /*  85: */  /^(?:%%)/,
      /*  86: */  /^(?:\{\d+(,\s*\d+|,)?\})/,
      /*  87: */  new XRegExp__default['default']('^(?:\\{([\\p{Alphabetic}_](?:[\\p{Alphabetic}\\p{Number}_])*)\\})', ''),
      /*  88: */  new XRegExp__default['default']('^(?:\\{([\\p{Alphabetic}_](?:[\\p{Alphabetic}\\p{Number}_])*)\\})', ''),
      /*  89: */  /^(?:\{)/,
      /*  90: */  /^(?:\})/,
      /*  91: */  /^(?:(?:\\[^\n\r]|[^\n\r\]{])+)/,
      /*  92: */  /^(?:\{)/,
      /*  93: */  /^(?:\])/,
      /*  94: */  /^(?:(\r\n|\n|\r))/,
      /*  95: */  /^(?:$)/,
      /*  96: */  /^(?:(?:[^\n\r%][^\n\r]*(\r\n|\n|\r)+)+)/,
      /*  97: */  /^(?:[^\n\r]*(\r\n|\n|\r)+)/,
      /*  98: */  /^(?:[^\n\r]+)/,
      /*  99: */  /^(?:")/,
      /* 100: */  /^(?:')/,
      /* 101: */  /^(?:`)/,
      /* 102: */  /^(?:")/,
      /* 103: */  /^(?:')/,
      /* 104: */  /^(?:`)/,
      /* 105: */  /^(?:")/,
      /* 106: */  /^(?:')/,
      /* 107: */  /^(?:`)/,
      /* 108: */  /^(?:.)/,
      /* 109: */  /^(?:.)/,
      /* 110: */  /^(?:.)/,
      /* 111: */  /^(?:$)/
    ],

    conditions: {
      'rules': {
        rules: [
          0,
          1,
          19,
          20,
          21,
          22,
          23,
          24,
          25,
          46,
          47,
          48,
          49,
          50,
          51,
          52,
          53,
          54,
          55,
          56,
          57,
          58,
          59,
          60,
          61,
          62,
          63,
          64,
          65,
          66,
          67,
          68,
          69,
          70,
          71,
          72,
          73,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          82,
          83,
          84,
          85,
          86,
          87,
          89,
          90,
          105,
          106,
          107,
          108,
          110,
          111
        ],

        inclusive: true
      },

      'macro': {
        rules: [
          0,
          1,
          20,
          21,
          22,
          44,
          45,
          46,
          47,
          48,
          49,
          50,
          51,
          52,
          53,
          54,
          55,
          56,
          57,
          58,
          59,
          60,
          61,
          62,
          63,
          64,
          65,
          66,
          67,
          68,
          69,
          70,
          71,
          72,
          73,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          82,
          85,
          86,
          87,
          89,
          90,
          105,
          106,
          107,
          108,
          110,
          111
        ],

        inclusive: true
      },

      'code': {
        rules: [19, 83, 84, 96, 97, 98, 105, 106, 107, 110, 111],
        inclusive: false
      },

      'options': {
        rules: [
          0,
          1,
          19,
          26,
          27,
          28,
          29,
          30,
          31,
          32,
          33,
          34,
          35,
          36,
          37,
          38,
          39,
          40,
          41,
          42,
          88,
          102,
          103,
          104,
          105,
          106,
          107,
          109,
          110,
          111
        ],

        inclusive: false
      },

      'action': {
        rules: [
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18,
          99,
          100,
          101,
          105,
          106,
          107,
          110,
          111
        ],

        inclusive: false
      },

      'set': {
        rules: [88, 91, 92, 93, 94, 95, 105, 106, 107, 110, 111],
        inclusive: false
      },

      'INITIAL': {
        rules: [
          0,
          1,
          19,
          20,
          21,
          22,
          43,
          46,
          47,
          48,
          49,
          50,
          51,
          52,
          53,
          54,
          55,
          56,
          57,
          58,
          59,
          60,
          61,
          62,
          63,
          64,
          65,
          66,
          67,
          68,
          69,
          70,
          71,
          72,
          73,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          82,
          83,
          84,
          85,
          86,
          87,
          89,
          90,
          105,
          106,
          107,
          110,
          111
        ],

        inclusive: true
      }
    }
  };

  const rmCommonWS = helpers.rmCommonWS;
  const dquote = helpers.dquote;
  const scanRegExp = helpers.scanRegExp;

  // Calculate the end marker to match and produce a
  // lexer rule to match when the need arrises:
  lexer.setupDelimitedActionChunkLexerRegex = function lexer__setupDelimitedActionChunkLexerRegex(marker) {
    // Special: when we encounter `{` as the start of the action code block,
    // we DO NOT patch the `%{...%}` lexer rule as we will handle `{...}`
    // elsewhere in the lexer anyway: we cannot use a simple regex like
    // `/{[^]*?}/` to match an entire action code block after all!
    let doNotPatch = marker === '{';

    let action_end_marker = marker.replace(/\{/g, '}');

    if (!doNotPatch) {
      // Note: this bit comes straight from the lexer kernel!
      //
      // Get us the currently active set of lexer rules.
      // (This is why we push the 'action' lexer condition state above *before*
      // we commence and work on the ruleset itself.)
      let spec = this.__currentRuleSet__;

      if (!spec) {
        // Update the ruleset cache as we apparently encountered a state change or just started lexing.
        // The cache is set up for fast lookup -- we assume a lexer will switch states much less often than it will
        // invoke the `lex()` token-producing API and related APIs, hence caching the set for direct access helps
        // speed up those activities a tiny bit.
        spec = this.__currentRuleSet__ = this._currentRules();
      }

      let regexes = spec.__rule_regexes;
      let len = spec.__rule_count;
      let rules = spec.rules;
      let i;
      let action_chunk_regex;

      // Must we still locate the rule to patch or have we done
      // that already during a previous encounter?
      //
      // WARNING: our cache/patch must live beyond the current lexer+parser invocation:
      // our patching must remain detected indefinitely to ensure subsequent invocations
      // of the parser will still work as expected!
      // This implies that we CANNOT store anything in the `yy` context as that one
      // is short-lived: `yy` dies once the current parser.parse() has completed!
      // Hence we store our patch data in the lexer instance itself: in `spec`.
      //
      if (!spec.__action_chunk_rule_idx) {
        // **WARNING**: *(this bit, like so much else in here, comes straight from the lexer kernel)*
        //
        // slot 0 is unused; we use a 1-based index approach here to keep the hottest code in `lexer_next()` fast and simple!
        let orig_re_str1 = '/^(?:%\\{([^]*?)%\\}(?!\\}))/';

        let orig_re_str2 = '/^(?:%\\{([\\s\\S]*?)%\\}(?!\\}))/';   // the XRegExp 'cross-platform' version of the same.

        // Note: the arrays are 1-based, while `len` itself is a valid index,
        // hence the non-standard less-or-equal check in the next loop condition!
        for (i = 1; i <= len; i++) {
          let rule_re = regexes[i];
          let re_str = rule_re.toString();

          //console.error('test regexes:', {i, len, re1: re_str, match1: rule_re.toString() === orig_re_str1, match1: rule_re.toString() === orig_re_str2});
          if (re_str === orig_re_str1 || re_str === orig_re_str2) {
            spec.__action_chunk_rule_idx = i;
            break;
          }
        }

        if (!spec.__action_chunk_rule_idx) {
          //console.error('ruleset dump:', spec);
          throw new Error('INTERNAL DEV ERROR: cannot locate %{...%} rule regex!');
        }

        // As we haven't initialized yet, we're sure the rule cache doesn't exist either.
        // Make it happen:
        spec.__cached_action_chunk_rule = {};   // set up empty cache
      }

      i = spec.__action_chunk_rule_idx;

      // Must we build the lexer rule or did we already run this variant
      // through this lexer before? When the latter, fetch the cached version!
      action_chunk_regex = spec.__cached_action_chunk_rule[marker];

      if (!action_chunk_regex) {
        action_chunk_regex = spec.__cached_action_chunk_rule[marker] = new RegExp(
          '^(?:' + marker.replace(/\{/g, '\\{') + '([^]*?)' + action_end_marker.replace(/\}/g, '\\}') + '(?!\\}))'
        );
        //console.warn('encode new action block regex:', action_chunk_regex);
      }

      //console.error('new ACTION REGEX:', { i, action_chunk_regex });
      // and patch the lexer regex table for the current lexer condition state:
      regexes[i] = action_chunk_regex;
    }

    return action_end_marker;
  };

  lexer.warn = function l_warn() {
    if (this.yy && this.yy.parser && typeof this.yy.parser.warn === 'function') {
      return this.yy.parser.warn.apply(this, arguments);
    } else {
      console.warn.apply(console, arguments);
    }
  };

  lexer.log = function l_log() {
    if (this.yy && this.yy.parser && typeof this.yy.parser.log === 'function') {
      return this.yy.parser.log.apply(this, arguments);
    } else {
      console.log.apply(console, arguments);
    }
  };

  return lexer;
}();
parser.lexer = lexer;

const rmCommonWS$2 = helpers.rmCommonWS;
const checkActionBlock$1 = helpers.checkActionBlock;
const mkIdentifier$1 = helpers.mkIdentifier;
const isLegalIdentifierInput$1 = helpers.isLegalIdentifierInput;
const trimActionCode$1 = helpers.trimActionCode;
const braceArrowActionCode$1 = helpers.braceArrowActionCode;


// see also:
// - https://en.wikipedia.org/wiki/C0_and_C1_control_codes
// - https://docs.microsoft.com/en-us/dotnet/standard/base-types/character-escapes-in-regular-expressions
// - https://kangax.github.io/compat-table/es6/#test-RegExp_y_and_u_flags
// - http://2ality.com/2015/07/regexp-es6.html
// - http://www.regular-expressions.info/quickstart.html

const charCvtTable = {
    // "\a": "\x07",
    // "\e": "\x1B",
    // "\b": "\x08",
    "\f": "\\f",
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t",
    "\v": "\\v",
};
const escCvtTable = {
    "a": "\\x07",
    "e": "\\x1B",
    "b": "\\x08",
    "f": "\\f",
    "n": "\\n",
    "r": "\\r",
    "t": "\\t",
    "v": "\\v",
};
const codeCvtTable = {
    12: "\\f",
    10: "\\n",
    13: "\\r",
    9:  "\\t",
    11: "\\v",
};

// Note about 'b' in the regex below:
// when inside a literal string, it's BACKSPACE, otherwise it's
// the regex word edge condition `\b`. Here it's BACKSPACE.
const codedCharRe = /(?:([sSBwWdDpP])|([*+()${}|[\]\/.^?])|([aberfntv])|([0-7]{1,3})|c([@A-Z])|x([0-9a-fA-F]{2})|u([0-9a-fA-F]{4})|u\{([0-9a-fA-F]{1,8})\}|())/g;

function encodeCharCode(v) {
    if (v < 32) {
        let rv = codeCvtTable[v];
        if (rv) return rv;
        return '\\u' + ('0000' + v.toString(16)).substr(-4);
    } else {
        return String.fromCharCode(v);
    }
}

function encodeUnicodeCodepoint(v) {
    if (v < 32) {
        let rv = codeCvtTable[v];
        if (rv) return rv;
        return '\\u' + ('0000' + v.toString(16)).substr(-4);
    } else {
        return String.fromCodePoint(v);
    }
}

function encodeRegexLiteralStr(s, edge) {
    let rv = '';
    //console.warn("encodeRegexLiteralStr INPUT:", {s, edge});
    for (let i = 0, l = s.length; i < l; i++) {
        let c = s[i];
        switch (c) {
        case '\\':
            i++;
            if (i < l) {
                c = s[i];
                if (c === edge) {
                    rv += c;
                    continue;
                }
                let pos = '\'"`'.indexOf(c);
                if (pos >= 0) {
                    rv += '\\\\' + c;
                    continue;
                }
                if (c === '\\') {
                    rv += '\\\\';
                    continue;
                }
                codedCharRe.lastIndex = i;
                // we 'fake' the RegExp 'y'=sticky feature cross-platform by using 'g' flag instead
                // plus an empty capture group at the end of the regex: when that one matches,
                // we know we did not get a hit.
                let m = codedCharRe.exec(s);
                if (m && m[0]) {
                    if (m[1]) {
                        // [1]: regex operators, which occur in a literal string: `\s` --> \\s
                        rv += '\\\\' + m[1];
                        i += m[1].length - 1;
                        continue;
                    }
                    if (m[2]) {
                        // [2]: regex special characters, which occur in a literal string: `\[` --> \\\[
                        rv += '\\\\\\' + m[2];
                        i += m[2].length - 1;
                        continue;
                    }
                    if (m[3]) {
                        // [3]: special escape characters, which occur in a literal string: `\a` --> BELL
                        rv += escCvtTable[m[3]];
                        i += m[3].length - 1;
                        continue;
                    }
                    if (m[4]) {
                        // [4]: octal char: `\012` --> \x0A
                        let v = parseInt(m[4], 8);
                        rv += encodeCharCode(v);
                        i += m[4].length - 1;
                        continue;
                    }
                    if (m[5]) {
                        // [5]: CONTROL char: `\cA` --> \u0001
                        let v = m[5].charCodeAt(0) - 64;
                        rv += encodeCharCode(v);
                        i++;
                        continue;
                    }
                    if (m[6]) {
                        // [6]: hex char: `\x41` --> A
                        let v = parseInt(m[6], 16);
                        rv += encodeCharCode(v);
                        i += m[6].length;
                        continue;
                    }
                    if (m[7]) {
                        // [7]: unicode/UTS2 char: `\u03c0` --> PI
                        let v = parseInt(m[7], 16);
                        rv += encodeCharCode(v);
                        i += m[7].length;
                        continue;
                    }
                    if (m[8]) {
                        // [8]: unicode code point: `\u{00003c0}` --> PI
                        let v = parseInt(m[8], 16);
                        rv += encodeUnicodeCodepoint(v);
                        i += m[8].length;
                        continue;
                    }
                }
            }
            // all the rest: simply treat the `\\` escape as a character on its own:
            rv += '\\\\';
            i--;
            continue;

        default:
            // escape regex operators:
            let pos = ".*+?^${}()|[]/\\".indexOf(c);
            if (pos >= 0) {
                rv += '\\' + c;
                continue;
            }
            let cc = charCvtTable[c];
            if (cc) {
                rv += cc;
                continue;
            }
            cc = c.charCodeAt(0);
            if (cc < 32) {
                let rvp = codeCvtTable[v];
                if (rvp) {
                    rv += rvp;
                } else {
                    rv += '\\u' + ('0000' + cc.toString(16)).substr(-4);
                }
            } else {
                rv += c;
            }
            continue;
        }
    }
    s = rv;
    //console.warn("encodeRegexLiteralStr ROUND 3:", {s});
    return s;
}


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


function Parser() {
    this.yy = {};
}
Parser.prototype = parser;
parser.Parser = Parser;

function yyparse() {
    return parser.parse.apply(parser, arguments);
}



var lexParser = {
    parser,
    Parser,
    parse: yyparse,
    
};

//




const XREGEXP_UNICODE_ESCAPE_RE = /^\{[A-Za-z0-9 \-\._]+\}/;              // Matches the XRegExp Unicode escape braced part, e.g. `{Number}`
const CHR_RE = /^(?:[^\\]|\\[^cxu0-9]|\\[0-9]{1,3}|\\c[A-Z]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})/;
const SET_PART_RE = /^(?:[^\\\]]|\\[^cxu0-9]|\\[0-9]{1,3}|\\c[A-Z]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})+/;
const NOTHING_SPECIAL_RE = /^(?:[^\\\[\]\(\)\|^\{\}]|\\[^cxu0-9]|\\[0-9]{1,3}|\\c[A-Z]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})+/;
const SET_IS_SINGLE_PCODE_RE = /^\\[dDwWsS]$|^\\p\{[A-Za-z0-9 \-\._]+\}$/;

const UNICODE_BASE_PLANE_MAX_CP = 65535;

// The expanded regex sets which are equivalent to the given `\\{c}` escapes:
//
// `/\s/`:
const WHITESPACE_SETSTR = ' \f\n\r\t\v\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';
// `/\d/`:
const DIGIT_SETSTR = '0-9';
// `/\w/`:
const WORDCHAR_SETSTR = 'A-Za-z0-9_';





// Helper for `bitarray2set()`: convert character code to a representation string suitable for use in a regex
function i2c(i) {
    let c, x;

    switch (i) {
    case 10:
        return '\\n';

    case 13:
        return '\\r';

    case 9:
        return '\\t';

    case 8:
        return '\\b';

    case 12:
        return '\\f';

    case 11:
        return '\\v';

    case 45:        // ASCII/Unicode for '-' dash
        return '\\-';

    case 91:        // '['
        return '\\[';

    case 92:        // '\\'
        return '\\\\';

    case 93:        // ']'
        return '\\]';

    case 94:        // ']'
        return '\\^';
    }
    if (i < 32
            || i > 0xFFF0 /* Unicode Specials, also in UTF16 */
            || (i >= 0xD800 && i <= 0xDFFF) /* Unicode Supplementary Planes; we're TOAST in JavaScript as we're NOT UTF-16 but UCS-2! */
            || String.fromCharCode(i).match(/[\u2028\u2029]/) /* Code compilation via `new Function()` does not like to see these, or rather: treats them as just another form of CRLF, which breaks your generated regex code! */
    ) {
        // Detail about a detail:
        // U+2028 and U+2029 are part of the `\s` regex escape code (`\s` and `[\s]` match either of these) and when placed in a JavaScript
        // source file verbatim (without escaping it as a `\uNNNN` item) then JavaScript will interpret it as such and consequently report
        // a b0rked generated parser, as the generated code would include this regex right here.
        // Hence we MUST escape these buggers everywhere we go...
        x = i.toString(16);
        if (x.length >= 1 && i <= 0xFFFF) {
            c = '0000' + x;
            return '\\u' + c.substr(c.length - 4);
        }
        return '\\u{' + x + '}';
    }
    return String.fromCharCode(i);
}


// Helper collection for `bitarray2set()`: we have expanded all these cached `\\p{NAME}` regex sets when creating
// this bitarray and now we should look at these expansions again to see if `bitarray2set()` can produce a
// `\\p{NAME}` shorthand to represent [part of] the bitarray:
let Pcodes_bitarray_cache = {};
let Pcodes_bitarray_cache_test_order = [];

// Helper collection for `bitarray2set()` for minifying special cases of result sets which can be represented by
// a single regex 'escape', e.g. `\d` for digits 0-9.
let EscCode_bitarray_output_refs;

// now initialize the EscCodes_... table above:
init_EscCode_lookup_table();

function init_EscCode_lookup_table() {
    let s, bitarr, set2esc = {}, esc2bitarr = {};

    // patch global lookup tables for the time being, while we calculate their *real* content in this function:
    EscCode_bitarray_output_refs = {
        esc2bitarr: {},
        set2esc: {}
    };
    Pcodes_bitarray_cache_test_order = [];

    // `/\S':
    bitarr = [];
    set2bitarray(bitarr, '^' + WHITESPACE_SETSTR);
    s = bitarray2set(bitarr);
    esc2bitarr['S'] = bitarr;
    set2esc[s] = 'S';
    // set2esc['^' + s] = 's';
    Pcodes_bitarray_cache['\\S'] = bitarr;

    // `/\s':
    bitarr = [];
    set2bitarray(bitarr, WHITESPACE_SETSTR);
    s = bitarray2set(bitarr);
    esc2bitarr['s'] = bitarr;
    set2esc[s] = 's';
    // set2esc['^' + s] = 'S';
    Pcodes_bitarray_cache['\\s'] = bitarr;

    // `/\D':
    bitarr = [];
    set2bitarray(bitarr, '^' + DIGIT_SETSTR);
    s = bitarray2set(bitarr);
    esc2bitarr['D'] = bitarr;
    set2esc[s] = 'D';
    // set2esc['^' + s] = 'd';
    Pcodes_bitarray_cache['\\D'] = bitarr;

    // `/\d':
    bitarr = [];
    set2bitarray(bitarr, DIGIT_SETSTR);
    s = bitarray2set(bitarr);
    esc2bitarr['d'] = bitarr;
    set2esc[s] = 'd';
    // set2esc['^' + s] = 'D';
    Pcodes_bitarray_cache['\\d'] = bitarr;

    // `/\W':
    bitarr = [];
    set2bitarray(bitarr, '^' + WORDCHAR_SETSTR);
    s = bitarray2set(bitarr);
    esc2bitarr['W'] = bitarr;
    set2esc[s] = 'W';
    // set2esc['^' + s] = 'w';
    Pcodes_bitarray_cache['\\W'] = bitarr;

    // `/\w':
    bitarr = [];
    set2bitarray(bitarr, WORDCHAR_SETSTR);
    s = bitarray2set(bitarr);
    esc2bitarr['w'] = bitarr;
    set2esc[s] = 'w';
    // set2esc['^' + s] = 'W';
    Pcodes_bitarray_cache['\\w'] = bitarr;

    EscCode_bitarray_output_refs = {
        esc2bitarr: esc2bitarr,
        set2esc: set2esc
    };

    updatePcodesBitarrayCacheTestOrder();
}

function updatePcodesBitarrayCacheTestOrder(opts) {
    let t = new Array(UNICODE_BASE_PLANE_MAX_CP + 1);
    let l = {};
    let user_has_xregexp = opts && opts.options && opts.options.xregexp;
    let i, j, k, ba;

    // mark every character with which regex pcodes they are part of:
    for (k in Pcodes_bitarray_cache) {
        ba = Pcodes_bitarray_cache[k];

        if (!user_has_xregexp && k.indexOf('\\p{') >= 0) {
            continue;
        }

        let cnt = 0;
        for (i = 0; i <= UNICODE_BASE_PLANE_MAX_CP; i++) {
            if (ba[i]) {
                cnt++;
                if (!t[i]) {
                    t[i] = [ k ];
                } else {
                    t[i].push(k);
                }
            }
        }
        l[k] = cnt;
    }

    // now dig out the unique ones: only need one per pcode.
    //
    // We ASSUME every \\p{NAME} 'pcode' has at least ONE character
    // in it that is ONLY matched by that particular pcode.
    // If this assumption fails, nothing is lost, but our 'regex set
    // optimized representation' will be sub-optimal as than this pcode
    // won't be tested during optimization.
    //
    // Now that would be a pity, so the assumption better holds...
    // Turns out the assumption doesn't hold already for /\S/ + /\D/
    // as the second one (\D) is a pure subset of \S. So we have to
    // look for markers which match multiple escapes/pcodes for those
    // ones where a unique item isn't available...
    let lut = [];
    let done = {};
    let keys = Object.keys(Pcodes_bitarray_cache);

    for (i = 0; i <= UNICODE_BASE_PLANE_MAX_CP; i++) {
        k = t[i][0];
        if (t[i].length === 1 && !done[k]) {
            assert__default['default'](l[k] > 0);
            lut.push([ i, k ]);
            done[k] = true;
        }
    }

    for (j = 0; keys[j]; j++) {
        k = keys[j];

        if (!user_has_xregexp && k.indexOf('\\p{') >= 0) {
            continue;
        }

        if (!done[k]) {
            assert__default['default'](l[k] > 0);
            // find a minimum span character to mark this one:
            let w = Infinity;
            var rv;
            ba = Pcodes_bitarray_cache[k];
            for (i = 0; i <= UNICODE_BASE_PLANE_MAX_CP; i++) {
                if (ba[i]) {
                    let tl = t[i].length;
                    if (tl > 1 && tl < w) {
                        assert__default['default'](l[k] > 0);
                        rv = [ i, k ];
                        w = tl;
                    }
                }
            }
            if (rv) {
                done[k] = true;
                lut.push(rv);
            }
        }
    }

    // order from large set to small set so that small sets don't gobble
    // characters also represented by overlapping larger set pcodes.
    //
    // Again we assume something: that finding the large regex pcode sets
    // before the smaller, more specialized ones, will produce a more
    // optimal minification of the regex set expression.
    //
    // This is a guestimate/heuristic only!
    lut.sort(function (a, b) {
        let k1 = a[1];
        let k2 = b[1];
        let ld = l[k2] - l[k1];
        if (ld) {
            return ld;
        }
        // and for same-size sets, order from high to low unique identifier.
        return b[0] - a[0];
    });

    Pcodes_bitarray_cache_test_order = lut;
}






// 'Join' a regex set `[...]` into a Unicode range spanning logic array, flagging every character in the given set.
function set2bitarray(bitarr, s, opts) {
    let orig = s;
    let set_is_inverted = false;
    let bitarr_orig;

    function mark(d1, d2) {
        if (d2 == null) d2 = d1;
        for (let i = d1; i <= d2; i++) {
            bitarr[i] = true;
        }
    }

    function add2bitarray(dst, src) {
        for (let i = 0; i <= UNICODE_BASE_PLANE_MAX_CP; i++) {
            if (src[i]) {
                dst[i] = true;
            }
        }
    }

    function eval_escaped_code(s) {
        let c;
        // decode escaped code? If none, just take the character as-is
        if (s.indexOf('\\') === 0) {
            let l = s.substr(0, 2);
            switch (l) {
            case '\\c':
                c = s.charCodeAt(2) - 'A'.charCodeAt(0) + 1;
                return String.fromCharCode(c);

            case '\\x':
                s = s.substr(2);
                c = parseInt(s, 16);
                return String.fromCharCode(c);

            case '\\u':
                s = s.substr(2);
                if (s[0] === '{') {
                    s = s.substr(1, s.length - 2);
                }
                c = parseInt(s, 16);
                if (c >= 0x10000) {
                    return new Error('We do NOT support Extended Plane Unicode Codepoints (i.e. CodePoints beyond U:FFFF) in regex set expressions, e.g. \\u{' + s + '}');
                }
                return String.fromCharCode(c);

            case '\\0':
            case '\\1':
            case '\\2':
            case '\\3':
            case '\\4':
            case '\\5':
            case '\\6':
            case '\\7':
                s = s.substr(1);
                c = parseInt(s, 8);
                return String.fromCharCode(c);

            case '\\r':
                return '\r';

            case '\\n':
                return '\n';

            case '\\v':
                return '\v';

            case '\\f':
                return '\f';

            case '\\t':
                return '\t';

            case '\\b':
                return '\b';

            default:
                // just the character itself:
                return s.substr(1);
            }
        } else {
            return s;
        }
    }

    if (s && s.length) {
        let c1, c2;

        // inverted set?
        if (s[0] === '^') {
            set_is_inverted = true;
            s = s.substr(1);
            bitarr_orig = bitarr;
            bitarr = new Array(UNICODE_BASE_PLANE_MAX_CP + 1);
        }

        // BITARR collects flags for characters set. Inversion means the complement set of character is st instead.
        // This results in an OR operations when sets are joined/chained.

        while (s.length) {
            c1 = s.match(CHR_RE);
            if (!c1) {
                // hit an illegal escape sequence? cope anyway!
                c1 = s[0];
            } else {
                c1 = c1[0];
                // Quick hack for XRegExp escapes inside a regex `[...]` set definition: we *could* try to keep those
                // intact but it's easier to unfold them here; this is not nice for when the grammar specifies explicit
                // XRegExp support, but alas, we'll get there when we get there... ;-)
                switch (c1) {
                case '\\p':
                    s = s.substr(c1.length);
                    c2 = s.match(XREGEXP_UNICODE_ESCAPE_RE);
                    if (c2) {
                        c2 = c2[0];
                        s = s.substr(c2.length);
                        // do we have this one cached already?
                        let pex = c1 + c2;
                        let ba4p = Pcodes_bitarray_cache[pex];
                        if (!ba4p) {
                            // expand escape:
                            let xr = new XRegExp__default['default']('[' + pex + ']');           // TODO: case-insensitive grammar???
                            // rewrite to a standard `[...]` regex set: XRegExp will do this for us via `XRegExp.toString()`:
                            let xs = '' + xr;
                            // remove the wrapping `/.../` to get at the (possibly *combined* series of) `[...]` sets inside:
                            xs = xs.substr(1, xs.length - 2);

                            ba4p = reduceRegexToSetBitArray(xs, pex, opts);

                            Pcodes_bitarray_cache[pex] = ba4p;
                            updatePcodesBitarrayCacheTestOrder(opts);
                        }
                        // merge bitarrays:
                        add2bitarray(bitarr, ba4p);
                        continue;
                    }
                    break;

                case '\\S':
                case '\\s':
                case '\\W':
                case '\\w':
                case '\\d':
                case '\\D':
                    // these can't participate in a range, but need to be treated special:
                    s = s.substr(c1.length);
                    // check for \S, \s, \D, \d, \W, \w and expand them:
                    var ba4e = EscCode_bitarray_output_refs.esc2bitarr[c1[1]];
                    assert__default['default'](ba4e);
                    add2bitarray(bitarr, ba4e);
                    continue;

                case '\\b':
                    // matches a backspace: https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#special-backspace
                    c1 = '\u0008';
                    break;
                }
            }
            let v1 = eval_escaped_code(c1);
            // propagate deferred exceptions = error reports.
            if (v1 instanceof Error) {
                return v1;
            }
            v1 = v1.charCodeAt(0);
            s = s.substr(c1.length);

            if (s[0] === '-' && s.length >= 2) {
                // we can expect a range like 'a-z':
                s = s.substr(1);
                c2 = s.match(CHR_RE);
                if (!c2) {
                    // hit an illegal escape sequence? cope anyway!
                    c2 = s[0];
                } else {
                    c2 = c2[0];
                }
                let v2 = eval_escaped_code(c2);
                // propagate deferred exceptions = error reports.
                if (v2 instanceof Error) {
                    return v1;
                }
                v2 = v2.charCodeAt(0);
                s = s.substr(c2.length);

                // legal ranges go UP, not /DOWN!
                if (v1 <= v2) {
                    mark(v1, v2);
                } else {
                    console.warn('INVALID CHARACTER RANGE found in regex: ', { re: orig, start: c1, start_n: v1, end: c2, end_n: v2 });
                    mark(v1);
                    mark('-'.charCodeAt(0));
                    mark(v2);
                }
                continue;
            }
            mark(v1);
        }

        // When we have marked all slots, '^' NEGATES the set, hence we flip all slots.
        //
        // Since a regex like `[^]` should match everything(?really?), we don't need to check if the MARK
        // phase actually marked anything at all: the `^` negation will correctly flip=mark the entire
        // range then.
        if (set_is_inverted) {
            for (let i = 0; i <= UNICODE_BASE_PLANE_MAX_CP; i++) {
                if (!bitarr[i]) {
                    bitarr_orig[i] = true;
                }
            }
        }
    }
    return false;
}


// convert a simple bitarray back into a regex set `[...]` content:
function bitarray2set(l, output_inverted_variant, output_minimized) {
    // construct the inverse(?) set from the mark-set:
    //
    // Before we do that, we inject a sentinel so that our inner loops
    // below can be simple and fast:
    l[UNICODE_BASE_PLANE_MAX_CP + 1] = 1;
    // now reconstruct the regex set:
    let rv = [];
    let i, j, cnt, lut, tn, tspec, match, pcode, ba4pcode, l2;
    let bitarr_is_cloned = false;
    let l_orig = l;

    if (output_inverted_variant) {
        // generate the inverted set, hence all unmarked slots are part of the output range:
        cnt = 0;
        for (i = 0; i <= UNICODE_BASE_PLANE_MAX_CP; i++) {
            if (!l[i]) {
                cnt++;
            }
        }
        if (cnt === UNICODE_BASE_PLANE_MAX_CP + 1) {
            // When there's nothing in the output we output a special 'match-nothing' regex: `[^\S\s]`.
            // BUT... since we output the INVERTED set, we output the match-all set instead:
            return '\\S\\s';
        } else if (cnt === 0) {
            // When we find the entire Unicode range is in the output match set, we replace this with
            // a shorthand regex: `[\S\s]`
            // BUT... since we output the INVERTED set, we output the match-nothing set instead:
            return '^\\S\\s';
        }

        // Now see if we can replace several bits by an escape / pcode:
        if (output_minimized) {
            lut = Pcodes_bitarray_cache_test_order;
            for (tn = 0; lut[tn]; tn++) {
                tspec = lut[tn];
                // check if the uniquely identifying char is in the inverted set:
                if (!l[tspec[0]]) {
                    // check if the pcode is covered by the inverted set:
                    pcode = tspec[1];
                    ba4pcode = Pcodes_bitarray_cache[pcode];
                    match = 0;
                    for (j = 0; j <= UNICODE_BASE_PLANE_MAX_CP; j++) {
                        if (ba4pcode[j]) {
                            if (!l[j]) {
                                // match in current inverted bitset, i.e. there's at
                                // least one 'new' bit covered by this pcode/escape:
                                match++;
                            } else if (l_orig[j]) {
                                // mismatch!
                                match = false;
                                break;
                            }
                        }
                    }

                    // We're only interested in matches which actually cover some
                    // yet uncovered bits: `match !== 0 && match !== false`.
                    //
                    // Apply the heuristic that the pcode/escape is only going to be used
                    // when it covers *more* characters than its own identifier's length:
                    if (match && match > pcode.length) {
                        rv.push(pcode);

                        // and nuke the bits in the array which match the given pcode:
                        // make sure these edits are visible outside this function as
                        // `l` is an INPUT parameter (~ not modified)!
                        if (!bitarr_is_cloned) {
                            l2 = new Array(UNICODE_BASE_PLANE_MAX_CP + 1);
                            for (j = 0; j <= UNICODE_BASE_PLANE_MAX_CP; j++) {
                                l2[j] = l[j] || ba4pcode[j];    // `!(!l[j] && !ba4pcode[j])`
                            }
                            // recreate sentinel
                            l2[UNICODE_BASE_PLANE_MAX_CP + 1] = 1;
                            l = l2;
                            bitarr_is_cloned = true;
                        } else {
                            for (j = 0; j <= UNICODE_BASE_PLANE_MAX_CP; j++) {
                                l[j] = l[j] || ba4pcode[j];
                            }
                        }
                    }
                }
            }
        }

        i = 0;
        while (i <= UNICODE_BASE_PLANE_MAX_CP) {
            // find first character not in original set:
            while (l[i]) {
                i++;
            }
            if (i >= UNICODE_BASE_PLANE_MAX_CP + 1) {
                break;
            }
            // find next character not in original set:
            for (j = i + 1; !l[j]; j++) {} /* empty loop */
            // generate subset:
            rv.push(i2c(i));
            if (j - 1 > i) {
                rv.push((j - 2 > i ? '-' : '') + i2c(j - 1));
            }
            i = j;
        }
    } else {
        // generate the non-inverted set, hence all logic checks are inverted here...
        cnt = 0;
        for (i = 0; i <= UNICODE_BASE_PLANE_MAX_CP; i++) {
            if (l[i]) {
                cnt++;
            }
        }
        if (cnt === UNICODE_BASE_PLANE_MAX_CP + 1) {
            // When we find the entire Unicode range is in the output match set, we replace this with
            // a shorthand regex: `[\S\s]`
            return '\\S\\s';
        } else if (cnt === 0) {
            // When there's nothing in the output we output a special 'match-nothing' regex: `[^\S\s]`.
            return '^\\S\\s';
        }

        // Now see if we can replace several bits by an escape / pcode:
        if (output_minimized) {
            lut = Pcodes_bitarray_cache_test_order;
            for (tn = 0; lut[tn]; tn++) {
                tspec = lut[tn];
                // check if the uniquely identifying char is in the set:
                if (l[tspec[0]]) {
                    // check if the pcode is covered by the set:
                    pcode = tspec[1];
                    ba4pcode = Pcodes_bitarray_cache[pcode];
                    match = 0;
                    for (j = 0; j <= UNICODE_BASE_PLANE_MAX_CP; j++) {
                        if (ba4pcode[j]) {
                            if (l[j]) {
                                // match in current bitset, i.e. there's at
                                // least one 'new' bit covered by this pcode/escape:
                                match++;
                            } else if (!l_orig[j]) {
                                // mismatch!
                                match = false;
                                break;
                            }
                        }
                    }

                    // We're only interested in matches which actually cover some
                    // yet uncovered bits: `match !== 0 && match !== false`.
                    //
                    // Apply the heuristic that the pcode/escape is only going to be used
                    // when it covers *more* characters than its own identifier's length:
                    if (match && match > pcode.length) {
                        rv.push(pcode);

                        // and nuke the bits in the array which match the given pcode:
                        // make sure these edits are visible outside this function as
                        // `l` is an INPUT parameter (~ not modified)!
                        if (!bitarr_is_cloned) {
                            l2 = new Array(UNICODE_BASE_PLANE_MAX_CP + 1);
                            for (j = 0; j <= UNICODE_BASE_PLANE_MAX_CP; j++) {
                                l2[j] = l[j] && !ba4pcode[j];
                            }
                            // recreate sentinel
                            l2[UNICODE_BASE_PLANE_MAX_CP + 1] = 1;
                            l = l2;
                            bitarr_is_cloned = true;
                        } else {
                            for (j = 0; j <= UNICODE_BASE_PLANE_MAX_CP; j++) {
                                l[j] = l[j] && !ba4pcode[j];
                            }
                        }
                    }
                }
            }
        }

        i = 0;
        while (i <= UNICODE_BASE_PLANE_MAX_CP) {
            // find first character not in original set:
            while (!l[i]) {
                i++;
            }
            if (i >= UNICODE_BASE_PLANE_MAX_CP + 1) {
                break;
            }
            // find next character not in original set:
            for (j = i + 1; l[j]; j++) {} /* empty loop */
            if (j > UNICODE_BASE_PLANE_MAX_CP + 1) {
                j = UNICODE_BASE_PLANE_MAX_CP + 1;
            }
            // generate subset:
            rv.push(i2c(i));
            if (j - 1 > i) {
                rv.push((j - 2 > i ? '-' : '') + i2c(j - 1));
            }
            i = j;
        }
    }

    assert__default['default'](rv.length);
    let s = rv.join('');
    assert__default['default'](s);

    // Check if the set is better represented by one of the regex escapes:
    let esc4s = EscCode_bitarray_output_refs.set2esc[s];
    if (esc4s) {
        // When we hit a special case like this, it is always the shortest notation, hence wins on the spot!
        return '\\' + esc4s;
    }
    return s;
}





// Pretty brutal conversion of 'regex' `s` back to raw regex set content: strip outer [...] when they're there;
// ditto for inner combos of sets, i.e. `]|[` as in `[0-9]|[a-z]`.
function reduceRegexToSetBitArray(s, name, opts) {
    let orig = s;

    // propagate deferred exceptions = error reports.
    if (s instanceof Error) {
        return s;
    }

    let l = new Array(UNICODE_BASE_PLANE_MAX_CP + 1);
    let internal_state = 0;
    let derr;

    while (s.length) {
        let c1 = s.match(CHR_RE);
        if (!c1) {
            // cope with illegal escape sequences too!
            return new Error('illegal escape sequence at start of regex part: "' + s + '" of regex "' + orig + '"');
        }
        c1 = c1[0];
        s = s.substr(c1.length);

        switch (c1) {
        case '[':
            // this is starting a set within the regex: scan until end of set!
            var set_content = [];
            while (s.length) {
                let inner = s.match(SET_PART_RE);
                if (!inner) {
                    inner = s.match(CHR_RE);
                    if (!inner) {
                        // cope with illegal escape sequences too!
                        return new Error('illegal escape sequence at start of regex part: ' + s + '" of regex "' + orig + '"');
                    }
                    inner = inner[0];
                    if (inner === ']') break;
                } else {
                    inner = inner[0];
                }
                set_content.push(inner);
                s = s.substr(inner.length);
            }

            // ensure that we hit the terminating ']':
            var c2 = s.match(CHR_RE);
            if (!c2) {
                // cope with illegal escape sequences too!
                return new Error('regex set expression is broken in regex: "' + orig + '" --> "' + s + '"');
            }
            c2 = c2[0];
            if (c2 !== ']') {
                return new Error('regex set expression is broken in regex: ' + orig);
            }
            s = s.substr(c2.length);

            var se = set_content.join('');
            if (!internal_state) {
                derr = set2bitarray(l, se, opts);
                // propagate deferred exceptions = error reports.
                if (derr instanceof Error) {
                    return derr;
                }

                // a set is to use like a single character in a longer literal phrase, hence input `[abc]word[def]` would thus produce output `[abc]`:
                internal_state = 1;
            }
            break;

        // Strip unescaped pipes to catch constructs like `\\r|\\n` and turn them into
        // something ready for use inside a regex set, e.g. `\\r\\n`.
        //
        // > Of course, we realize that converting more complex piped constructs this way
        // > will produce something you might not expect, e.g. `A|WORD2` which
        // > would end up as the set `[AW]` which is something else than the input
        // > entirely.
        // >
        // > However, we can only depend on the user (grammar writer) to realize this and
        // > prevent this from happening by not creating such oddities in the input grammar.
        case '|':
            // a|b --> [ab]
            internal_state = 0;
            break;

        case '(':
            // (a) --> a
            //
            // TODO - right now we treat this as 'too complex':

            // Strip off some possible outer wrappers which we know how to remove.
            // We don't worry about 'damaging' the regex as any too-complex regex will be caught
            // in the validation check at the end; our 'strippers' here would not damage useful
            // regexes anyway and them damaging the unacceptable ones is fine.
            s = s.replace(/^\((?:\?:)?(.*?)\)$/, '$1');         // (?:...) -> ...  and  (...) -> ...
            s = s.replace(/^\^?(.*?)\$?$/, '$1');               // ^...$ --> ...  (catch these both inside and outside the outer grouping, hence do the ungrouping twice: one before, once after this)
            s = s.replace(/^\((?:\?:)?(.*?)\)$/, '$1');         // (?:...) -> ...  and  (...) -> ...

            return new Error('[macro [' + name + '] is unsuitable for use inside regex set expressions: "[' + orig + ']"]');

        case '.':
        case '*':
        case '+':
        case '?':
            // wildcard
            //
            // TODO - right now we treat this as 'too complex':
            return new Error('[macro [' + name + '] is unsuitable for use inside regex set expressions: "[' + orig + ']"]');

        case '{':                        // range, e.g. `x{1,3}`, or macro?
            // TODO - right now we treat this as 'too complex':
            return new Error('[macro [' + name + '] is unsuitable for use inside regex set expressions: "[' + orig + ']"]');

        default:
            // literal character or word: take the first character only and ignore the rest, so that
            // the constructed set for `word|noun` would be `[wb]`:
            if (!internal_state) {
                derr = set2bitarray(l, c1, opts);
                // propagate deferred exceptions = error reports.
                if (derr instanceof Error) {
                    return derr;
                }

                internal_state = 2;
            }
            break;
        }
    }

    s = bitarray2set(l);

    // When this result is suitable for use in a set, than we should be able to compile
    // it in a regex; that way we can easily validate whether macro X is fit to be used
    // inside a regex set:
    try {
        assert__default['default'](s);
        assert__default['default'](!(s instanceof Error));
        let re = new XRegExp__default['default']('[' + s + ']');
        re.test(s[0]);

        // One thing is apparently *not* caught by the RegExp compile action above: `[a[b]c]`
        // so we check for lingering UNESCAPED brackets in here as those cannot be:
        if (/[^\\][\[\]]/.exec(s)) {
            throw new Error('unescaped brackets in set data');
        }
    } catch (ex) {
        // make sure we produce a set range expression which will fail badly when it is used
        // in actual code:
        s = new Error('[macro [' + name + '] is unsuitable for use inside regex set expressions: "[' + s + ']"]: ' + ex.message);
    }

    assert__default['default'](s);
    // propagate deferred exceptions = error reports.
    if (s instanceof Error) {
        return s;
    }
    return l;
}




// Convert bitarray representing, for example, `'0-9'` to regex string `[0-9]`
// -- or in this example it can be further optimized to only `\d`!
function produceOptimizedRegex4Set(bitarr) {
    // First try to produce a minimum regex from the bitarray directly:
    let s1 = bitarray2set(bitarr, false, true);

    // and when the regex set turns out to match a single pcode/escape, then
    // use that one as-is:
    if (s1.match(SET_IS_SINGLE_PCODE_RE)) {
        // When we hit a special case like this, it is always the shortest notation, hence wins on the spot!
        return s1;
    }
    s1 = '[' + s1 + ']';

    // Now try to produce a minimum regex from the *inverted* bitarray via negation:
    // Because we look at a negated bitset, there's no use looking for matches with
    // special cases here.
    let s2 = bitarray2set(bitarr, true, true);

    if (s2[0] === '^') {
        s2 = s2.substr(1);
        if (s2.match(SET_IS_SINGLE_PCODE_RE)) {
            // When we hit a special case like this, it is always the shortest notation, hence wins on the spot!
            return s2;
        }
    } else {
        s2 = '^' + s2;
    }
    s2 = '[' + s2 + ']';

    // Then, as some pcode/escapes still happen to deliver a LARGER regex string in the end,
    // we also check against the plain, unadulterated regex set expressions:
    //
    // First try to produce a minimum regex from the bitarray directly:
    let s3 = bitarray2set(bitarr, false, false);

    // and when the regex set turns out to match a single pcode/escape, then
    // use that one as-is:
    if (s3.match(SET_IS_SINGLE_PCODE_RE)) {
        // When we hit a special case like this, it is always the shortest notation, hence wins on the spot!
        return s3;
    }
    s3 = '[' + s3 + ']';

    // Now try to produce a minimum regex from the *inverted* bitarray via negation:
    // Because we look at a negated bitset, there's no use looking for matches with
    // special cases here.
    let s4 = bitarray2set(bitarr, true, false);

    if (s4[0] === '^') {
        s4 = s4.substr(1);
        if (s4.match(SET_IS_SINGLE_PCODE_RE)) {
            // When we hit a special case like this, it is always the shortest notation, hence wins on the spot!
            return s4;
        }
    } else {
        s4 = '^' + s4;
    }
    s4 = '[' + s4 + ']';

    if (s2.length < s1.length) {
        s1 = s2;
    }
    if (s3.length < s1.length) {
        s1 = s3;
    }
    if (s4.length < s1.length) {
        s1 = s4;
    }

    return s1;
}






var setmgmt = {
    XREGEXP_UNICODE_ESCAPE_RE,
    CHR_RE,
    SET_PART_RE,
    NOTHING_SPECIAL_RE,
    SET_IS_SINGLE_PCODE_RE,

    UNICODE_BASE_PLANE_MAX_CP,

    WHITESPACE_SETSTR,
    DIGIT_SETSTR,
    WORDCHAR_SETSTR,

    set2bitarray,
    bitarray2set,
    produceOptimizedRegex4Set,
    reduceRegexToSetBitArray
};

// Basic Lexer implemented using JavaScript regular expressions
const rmCommonWS$3 = helpers.rmCommonWS;
const mkIdentifier$2 = helpers.mkIdentifier;
const code_exec = helpers.exec;

const version = '0.7.0-220';                              // require('./package.json').version;



function chkBugger$2(src) {
    src = '' + src;
    if (src.match(/\bcov_\w+/)) {
        console.error('### ISTANBUL COVERAGE CODE DETECTED ###\n', src);
    }
}



const XREGEXP_UNICODE_ESCAPE_RE$1 = setmgmt.XREGEXP_UNICODE_ESCAPE_RE;              // Matches the XRegExp Unicode escape braced part, e.g. `{Number}`
const CHR_RE$1 = setmgmt.CHR_RE;
const SET_PART_RE$1 = setmgmt.SET_PART_RE;
const NOTHING_SPECIAL_RE$1 = setmgmt.NOTHING_SPECIAL_RE;
const UNICODE_BASE_PLANE_MAX_CP$1 = setmgmt.UNICODE_BASE_PLANE_MAX_CP;

// WARNING: this regex MUST match the regex for `ID` in ebnf-parser::bnf.l jison language lexer spec! (`ID = [{ALPHA}]{ALNUM}*`)
//
// This is the base XRegExp ID regex used in many places; this should match the ID macro definition in the EBNF/BNF parser et al as well!
const ID_REGEX_BASE$1 = '[\\p{Alphabetic}_][\\p{Alphabetic}_\\p{Number}]*';




// see also ./lib/cli.js
/**
@public
@nocollapse
*/
const defaultJisonLexOptions = {
    moduleType: 'commonjs',
    debug: false,
    enableDebugLogs: false,
    json: false,
    noMain: true,                   // CLI: not:(--main option)
    moduleMain: null,               // `main()` function source code if `!noMain` is true
    moduleMainImports: null,        // require()/import statements required by the `moduleMain` function source code if `!noMain` is true
    dumpSourceCodeOnFailure: true,
    throwErrorOnCompileFailure: true,
    doNotTestCompile: false,

    moduleName: undefined,
    defaultModuleName: 'lexer',
    file: undefined,
    outfile: undefined,
    inputPath: undefined,
    inputFilename: undefined,
    warn_cb: undefined,             // function(msg) | true (= use Jison.Print) | false (= throw Exception)

    xregexp: false,
    lexerErrorsAreRecoverable: false,
    flex: false,
    backtrack_lexer: false,
    ranges: false,                  // track position range, i.e. start+end indexes in the input string
    trackPosition: true,            // track line+column position in the input string
    caseInsensitive: false,
    showSource: false,
    exportSourceCode: false,
    exportAST: false,
    prettyCfg: true,                // use `prettier` (or not) to (re)format the generated parser code.
    pre_lex: undefined,
    post_lex: undefined,
};


// Merge sets of options.
//
// Convert alternative jison option names to their base option.
//
// The *last* option set which overrides the default wins, where 'override' is
// defined as specifying a not-undefined value which is not equal to the
// default value.
//
// When the FIRST argument is STRING "NODEFAULT", then we MUST NOT mix the
// default values available in Jison.defaultJisonOptions.
//
// Return a fresh set of options.
/** @public */
function mkStdOptions(/*...args*/) {
    let h = Object.prototype.hasOwnProperty;

    let opts = {};
    let args = [].concat.apply([], arguments);
    // clone defaults, so we do not modify those constants?
    if (args[0] !== 'NODEFAULT') {
        args.unshift(defaultJisonLexOptions);
    } else {
        args.shift();
    }

    for (let i = 0, len = args.length; i < len; i++) {
        let o = args[i];
        if (!o) continue;

        // clone input (while camel-casing the options), so we do not modify those either.
        let o2 = {};

        for (let p in o) {
            if (typeof o[p] !== 'undefined' && h.call(o, p)) {
                o2[mkIdentifier$2(p)] = o[p];
            }
        }

        if (typeof o2.moduleType !== 'undefined') {
            switch (o2.moduleType) {
            case 'js':
            case 'amd':
            case 'es':
            case 'commonjs':
                break;

            // aliases a la `rollup` c.s.:
            case 'cjs':
                o2.moduleType = 'commonjs';
                break;

            case 'iife':
                o2.moduleType = 'js';
                break;

            case 'umd':
                o2.moduleType = 'amd';
                break;

            default:
                throw new Error('unsupported moduleType: ' + dquote(o2.moduleType));
            }
        }

        // now clean them options up:export
        if (typeof o2.main !== 'undefined') {
            o2.noMain = !o2.main;
        }

        delete o2.main;

        // special check for `moduleName` to ensure we detect the 'default' moduleName entering from the CLI
        // NOT overriding the moduleName set in the grammar definition file via an `%options` entry:
        if (o2.moduleName === o2.defaultModuleName) {
            delete o2.moduleName;
        }

        // now see if we have an overriding option here:
        for (let p in o2) {
            if (h.call(o2, p)) {
                if (typeof o2[p] !== 'undefined') {
                    opts[p] = o2[p];
                }
            }
        }
    }

    return opts;
}

// set up export/output attributes of the `options` object instance
function prepExportStructures(options) {
    // set up the 'option' `exportSourceCode` as a hash object for returning
    // all generated source code chunks to the caller
    let exportSourceCode = options.exportSourceCode;
    if (!exportSourceCode || typeof exportSourceCode !== 'object') {
        exportSourceCode = {
            enabled: !!exportSourceCode
        };
    } else if (typeof exportSourceCode.enabled !== 'boolean') {
        exportSourceCode.enabled = true;
    }
    options.exportSourceCode = exportSourceCode;
}

// Autodetect if the input lexer spec is in JSON or JISON
// format when the `options.json` flag is `true`.
//
// Produce the JSON lexer spec result when these are JSON formatted already as that
// would save us the trouble of doing this again, anywhere else in the JISON
// compiler/generator.
//
// Otherwise return the *parsed* lexer spec as it has
// been processed through LexParser.
function autodetectAndConvertToJSONformat(lexerSpec, options) {
    let chk_l = null;
    let ex1, err;

    if (typeof lexerSpec === 'string') {
        if (options.json) {
            try {
                chk_l = JSON5__default['default'].parse(lexerSpec);

                // When JSON5-based parsing of the lexer spec succeeds, this implies the lexer spec is specified in `JSON mode`
                // *OR* there's a JSON/JSON5 format error in the input:
            } catch (e) {
                ex1 = e;
            }
        }
        if (!chk_l) {
            // // WARNING: the lexer may receive options specified in the **grammar spec file**,
            // //          hence we should mix the options to ensure the lexParser always
            // //          receives the full set!
            // //
            // // make sure all options are 'standardized' before we go and mix them together:
            // options = mkStdOptions(grammar.options, options);
            try {
                chk_l = lexParser.parse(lexerSpec);
            } catch (e) {
                if (options.json) {
                    // When both JSON5 and JISON input modes barf a hairball, assume the most important
                    // error is the JISON one (show that one first!), while it MAY be a JSON5 format
                    // error that triggered it (show that one last!).
                    //
                    // Also check for common JISON errors which are obviously never triggered by any
                    // odd JSON5 input format error: when we encounter such an error here, we don't
                    // confuse matters and forget about the JSON5 fail as it's irrelevant:
                    const commonErrors = [
                        /does not compile/,
                        /you did not correctly separate trailing code/,
                        /You did not specify/,
                        /You cannot specify/,
                        /must be qualified/,
                        /%start/,
                        /%token/,
                        /%import/,
                        /%include/,
                        /%options/,
                        /%parse-params/,
                        /%parser-type/,
                        /%epsilon/,
                        /definition list error/,
                        /token list error/,
                        /declaration error/,
                        /should be followed/,
                        /should be separated/,
                        /an error in one or more of your lexer regex rules/,
                        /an error in your lexer epilogue/,
                        /unsupported definition type/
                    ];
                    let cmnerr = commonErrors.filter(function check(re) {
                        return e.message.match(re);
                    });
                    if (cmnerr.length > 0) {
                        err = e;
                    } else {
                        err = new Error('Could not parse jison lexer spec in JSON AUTODETECT mode:\nin JISON Mode we get Error: ' + e.message + '\n\nwhile JSON5 Mode produces Error: ' + ex1.message);
                        err.secondary_exception = e;
                        err.stack = ex1.stack;
                    }
                } else {
                    err = new Error('Could not parse lexer spec\nError: ' + e.message);
                    err.stack = e.stack;
                }
                throw err;
            }
        }
    } else {
        chk_l = lexerSpec;
    }

    // Save time! Don't reparse the entire lexer spec *again* inside the code generators when that's not necessary:

    return chk_l;
}


// expand macros and convert matchers to RegExp's
function prepareRules(dict, actions, caseHelper, tokens, startConditions, grammarSpec) {
    let m, i, k, rule, action, conditions;
    let active_conditions;
    assert__default['default'](Array.isArray(dict.rules));
    let rules = dict.rules.slice(0);    // shallow copy of the rules array as we MAY modify it in here!
    let newRules = [];
    let macros = {};
    let regular_rule_count = 0;
    let simple_rule_count = 0;

    // Assure all options are camelCased:
    assert__default['default'](typeof grammarSpec.options['case-insensitive'] === 'undefined');

    if (!tokens) {
        tokens = {};
    }

    if (grammarSpec.options.flex && rules.length > 0) {
        rules.push([ '.', 'console.log("", yytext); /* `flex` lexing mode: the last resort rule! */' ]);
    }

    // Depending on the location within the regex we need different expansions of the macros:
    // one expansion for when a macro is *inside* a `[...]` and another expansion when a macro
    // is anywhere else in a regex:
    if (dict.macros) {
        macros = prepareMacros(dict.macros, grammarSpec);
    }

    function tokenNumberReplacement(str, token) {
        return 'return ' + (tokens[token] || '\'' + token.replace(/'/g, '\\\'') + '\'');
    }

    // Make sure a comment does not contain any embedded '*/' end-of-comment marker
    // as that would break the generated code
    function postprocessComment(str) {
        if (Array.isArray(str)) {
            str = str.join(' ');
        }
        str = str.replace(/\*\//g, '*\\/');         // destroy any inner `*/` comment terminator sequence.
        return str;
    }

    let routingCode = [ 'switch(yyrulenumber) {' ];

    for (i = 0; i < rules.length; i++) {
        rule = rules[i].slice(0);           // shallow copy: do not modify input rules
        m = rule[0];

        active_conditions = [];
        if (!Array.isArray(m)) {
            // implicit add to all inclusive start conditions
            for (k in startConditions) {
                if (startConditions[k].inclusive) {
                    active_conditions.push(k);
                    startConditions[k].rules.push(i);
                }
            }
        } else if (m[0] === '*') {
            // Add to ALL start conditions
            active_conditions.push('*');
            for (k in startConditions) {
                startConditions[k].rules.push(i);
            }
            rule.shift();
            m = rule[0];
        } else {
            // Add to explicit start conditions
            conditions = rule.shift();
            m = rule[0];
            for (k = 0; k < conditions.length; k++) {
                if (!startConditions.hasOwnProperty(conditions[k])) {
                    startConditions[conditions[k]] = {
                        rules: [],
                        inclusive: false
                    };
                    console.warn('Lexer Warning:', '"' + conditions[k] + '" start condition should be defined as %s or %x; assuming %x now.');
                }
                active_conditions.push(conditions[k]);
                startConditions[conditions[k]].rules.push(i);
            }
        }

        if (typeof m === 'string') {
            m = expandMacros(m, macros, grammarSpec);
            m = new XRegExp__default['default']('^(?:' + m + ')', grammarSpec.options.caseInsensitive ? 'i' : '');
        }
        newRules.push(m);
        action = rule[1];
        if (typeof action === 'function') {
            // Also cope with Arrow Functions (and inline those as well?).
            // See also https://github.com/zaach/jison-lex/issues/23
            action = helpers.printFunctionSourceCodeContainer(action).code;
        }
        action = action.replace(/return\s*\(?'((?:\\'|[^']+)+)'\)?/g, tokenNumberReplacement);
        action = action.replace(/return\s*\(?"((?:\\"|[^"]+)+)"\)?/g, tokenNumberReplacement);

        let code = [ '\n/*! Conditions::' ];
        code.push(postprocessComment(active_conditions));
        code.push('*/', '\n/*! Rule::      ');
        code.push(postprocessComment(rule[0]));
        code.push('*/', '\n');

        // When the action is *only* a simple `return TOKEN` statement, then add it to the caseHelpers;
        // otherwise add the additional `break;` at the end.
        //
        // Note: we do NOT analyze the action block any more to see if the *last* line is a simple
        // `return NNN;` statement as there are too many shoddy idioms, e.g.
        //
        // ```
        // %{ if (cond)
        //      return TOKEN;
        // %}
        // ```
        //
        // which would then cause havoc when our action code analysis (using regexes or otherwise) was 'too simple'
        // to catch these culprits; hence we resort and stick with the most fundamental approach here:
        // always append `break;` even when it would be obvious to a human that such would be 'unreachable code'.
        let match_nr = /^return[\s\r\n]+((?:'(?:\\'|[^']+)+')|(?:"(?:\\"|[^"]+)+")|\d+)[\s\r\n]*;?$/.exec(action.trim());
        if (match_nr) {
            simple_rule_count++;
            caseHelper.push([].concat(code, i, ':', match_nr[1]).join(' ').replace(/[\n]/g, '\n  '));
        } else {
            regular_rule_count++;
            // If action includes the keyword `let` or `const`, then it's ES6 code
            // which must be scoped to prevent collisions with other action code chunks
            // in the same large generated switch/case statement:
            if (/\blet\b/.test(action) || /\bconst\b/.test(action)) {
                action = '{\n' + action + '\n}';
            }
            routingCode.push([].concat('case', i, ':', code, action, '\nbreak;').join(' '));
        }
    }
    if (simple_rule_count) {
        routingCode.push('default:');
        routingCode.push('  return this.simpleCaseActionClusters[yyrulenumber];');
    }
    routingCode.push('}');

    // only inject the big switch/case chunk when there's any `switch` or `default` branch to switch to:
    if (simple_rule_count + regular_rule_count > 0) {
        actions.push.apply(actions, routingCode);
    } else {
        actions.push('/* no rules ==> no rule SWITCH! */');
    }

    return {
        rules: newRules,                // array listing only the lexer spec regexes
        macros: macros,

        regular_rule_count: regular_rule_count,
        simple_rule_count: simple_rule_count
    };
}







// expand all macros (with maybe one exception) in the given regex: the macros may exist inside `[...]` regex sets or
// elsewhere, which requires two different treatments to expand these macros.
function reduceRegex(s, name, opts, expandAllMacrosInSet_cb, expandAllMacrosElsewhere_cb) {
    let orig = s;

    function errinfo() {
        if (name) {
            return 'macro [[' + name + ']]';
        }
        return 'regex [[' + orig + ']]';
    }

    // propagate deferred exceptions = error reports.
    if (s instanceof Error) {
        return s;
    }

    let c1, c2;
    let rv = [];
    let derr;
    let se;

    while (s.length) {
        c1 = s.match(CHR_RE$1);
        if (!c1) {
            // cope with illegal escape sequences too!
            return new Error(errinfo() + ': illegal escape sequence at start of regex part: ' + s);
        }
        c1 = c1[0];
        s = s.substr(c1.length);

        switch (c1) {
        case '[':
            // this is starting a set within the regex: scan until end of set!
            let set_content = [];
            let l = new Array(UNICODE_BASE_PLANE_MAX_CP$1 + 1);

            while (s.length) {
                let inner = s.match(SET_PART_RE$1);
                if (!inner) {
                    inner = s.match(CHR_RE$1);
                    if (!inner) {
                        // cope with illegal escape sequences too!
                        return new Error(errinfo() + ': illegal escape sequence at start of regex part: ' + s);
                    }
                    inner = inner[0];
                    if (inner === ']') break;
                } else {
                    inner = inner[0];
                }
                set_content.push(inner);
                s = s.substr(inner.length);
            }

            // ensure that we hit the terminating ']':
            c2 = s.match(CHR_RE$1);
            if (!c2) {
                // cope with illegal escape sequences too!
                return new Error(errinfo() + ': regex set expression is broken: "' + s + '"');
            }
            c2 = c2[0];
            if (c2 !== ']') {
                return new Error(errinfo() + ': regex set expression is broken: apparently unterminated');
            }
            s = s.substr(c2.length);

            se = set_content.join('');

            // expand any macros in here:
            if (expandAllMacrosInSet_cb) {
                se = expandAllMacrosInSet_cb(se);
                assert__default['default'](se);
                if (se instanceof Error) {
                    return new Error(errinfo() + ': ' + se.message);
                }
            }

            derr = setmgmt.set2bitarray(l, se, opts);
            if (derr instanceof Error) {
                return new Error(errinfo() + ': ' + derr.message);
            }

            // find out which set expression is optimal in size:
            let s1 = setmgmt.produceOptimizedRegex4Set(l);

            // check if the source regex set potentially has any expansions (guestimate!)
            //
            // The indexOf('{') picks both XRegExp Unicode escapes and JISON lexer macros, which is perfect for us here.
            let has_expansions = (se.indexOf('{') >= 0);

            se = '[' + se + ']';

            if (!has_expansions && se.length < s1.length) {
                s1 = se;
            }
            rv.push(s1);
            break;

        // XRegExp Unicode escape, e.g. `\\p{Number}`:
        case '\\p':
            c2 = s.match(XREGEXP_UNICODE_ESCAPE_RE$1);
            if (c2) {
                c2 = c2[0];
                s = s.substr(c2.length);

                // nothing to expand.
                rv.push(c1 + c2);
            } else {
                // nothing to stretch this match, hence nothing to expand.
                rv.push(c1);
            }
            break;

        // Either a range expression or the start of a macro reference: `.{1,3}` or `{NAME}`.
        // Treat it as a macro reference and see if it will expand to anything:
        case '{':
            c2 = s.match(NOTHING_SPECIAL_RE$1);
            if (c2) {
                c2 = c2[0];
                s = s.substr(c2.length);

                let c3 = s[0];
                s = s.substr(c3.length);
                if (c3 === '}') {
                    // possibly a macro name in there... Expand if possible:
                    c2 = c1 + c2 + c3;
                    if (expandAllMacrosElsewhere_cb) {
                        c2 = expandAllMacrosElsewhere_cb(c2);
                        assert__default['default'](c2);
                        if (c2 instanceof Error) {
                            return new Error(errinfo() + ': ' + c2.message);
                        }
                    }
                } else {
                    // not a well-terminated macro reference or something completely different:
                    // we do not even attempt to expand this as there's guaranteed nothing to expand
                    // in this bit.
                    c2 = c1 + c2 + c3;
                }
                rv.push(c2);
            } else {
                // nothing to stretch this match, hence nothing to expand.
                rv.push(c1);
            }
            break;

        // Recognize some other regex elements, but there's no need to understand them all.
        //
        // We are merely interested in any chunks now which do *not* include yet another regex set `[...]`
        // nor any `{MACRO}` reference:
        default:
            // non-set character or word: see how much of this there is for us and then see if there
            // are any macros still lurking inside there:
            c2 = s.match(NOTHING_SPECIAL_RE$1);
            if (c2) {
                c2 = c2[0];
                s = s.substr(c2.length);

                // nothing to expand.
                rv.push(c1 + c2);
            } else {
                // nothing to stretch this match, hence nothing to expand.
                rv.push(c1);
            }
            break;
        }
    }

    s = rv.join('');

    // When this result is suitable for use in a set, than we should be able to compile
    // it in a regex; that way we can easily validate whether macro X is fit to be used
    // inside a regex set:
    try {
        let re;
        re = new XRegExp__default['default'](s);
        re.test(s[0]);
    } catch (ex) {
        // make sure we produce a regex expression which will fail badly when it is used
        // in actual code:
        return new Error(errinfo() + ': expands to an invalid regex: /' + s + '/');
    }

    assert__default['default'](s);
    return s;
}


// expand macros within macros and cache the result
function prepareMacros(dict_macros, grammarSpec) {
    let macros = {};

    // expand a `{NAME}` macro which exists inside a `[...]` set:
    function expandMacroInSet(i) {
        let k, a, m;
        if (!macros[i]) {
            m = dict_macros[i];

            if (m.indexOf('{') >= 0) {
                // set up our own record so we can detect definition loops:
                macros[i] = {
                    in_set: false,
                    elsewhere: null,
                    raw: dict_macros[i]
                };

                for (k in dict_macros) {
                    if (dict_macros.hasOwnProperty(k) && i !== k) {
                        // it doesn't matter if the lexer recognized that the inner macro(s)
                        // were sitting inside a `[...]` set or not: the fact that they are used
                        // here in macro `i` which itself sits in a set, makes them *all* live in
                        // a set so all of them get the same treatment: set expansion style.
                        //
                        // Note: make sure we don't try to expand any XRegExp `\p{...}` or `\P{...}`
                        // macros here:
                        if (XRegExp__default['default']._getUnicodeProperty(k)) {
                            // Work-around so that you can use `\p{ascii}` for a XRegExp slug, a.k.a.
                            // Unicode 'General Category' Property cf. http://unicode.org/reports/tr18/#Categories,
                            // while using `\p{ASCII}` as a *macro expansion* of the `ASCII`
                            // macro:
                            if (k.toUpperCase() !== k) {
                                m = new Error('Cannot use name "' + k + '" as a macro name as it clashes with the same XRegExp "\\p{..}" Unicode \'General Category\' Property name. Use all-uppercase macro names, e.g. name your macro "' + k.toUpperCase() + '" to work around this issue or give your offending macro a different name.');
                                break;
                            }
                        }

                        a = m.split('{' + k + '}');
                        if (a.length > 1) {
                            let x = expandMacroInSet(k);
                            assert__default['default'](x);
                            if (x instanceof Error) {
                                m = x;
                                break;
                            }
                            m = a.join(x);
                        }
                    }
                }
            }

            let mba = setmgmt.reduceRegexToSetBitArray(m, i, grammarSpec);

            let s1;

            // propagate deferred exceptions = error reports.
            if (mba instanceof Error) {
                s1 = mba;
            } else {
                s1 = setmgmt.bitarray2set(mba, false);

                m = s1;
            }

            macros[i] = {
                in_set: s1,
                elsewhere: null,
                raw: dict_macros[i]
            };
        } else {
            m = macros[i].in_set;

            if (m instanceof Error) {
                // this turns out to be an macro with 'issues' and it is used, so the 'issues' do matter: bombs away!
                return new Error(m.message);
            }

            // detect definition loop:
            if (m === false) {
                return new Error('Macro name "' + i + '" has an illegal, looping, definition, i.e. it\'s definition references itself, either directly or indirectly, via other macros.');
            }
        }

        return m;
    }

    function expandMacroElsewhere(i) {
        let m;

        if (macros[i].elsewhere == null) {
            m = dict_macros[i];

            // set up our own record so we can detect definition loops:
            macros[i].elsewhere = false;

            // the macro MAY contain other macros which MAY be inside a `[...]` set in this
            // macro or elsewhere, hence we must parse the regex:
            m = reduceRegex(m, i, grammarSpec, expandAllMacrosInSet, expandAllMacrosElsewhere);
            // propagate deferred exceptions = error reports.
            if (m instanceof Error) {
                return m;
            }

            macros[i].elsewhere = m;
        } else {
            m = macros[i].elsewhere;

            if (m instanceof Error) {
                // this turns out to be an macro with 'issues' and it is used, so the 'issues' do matter: bombs away!
                return m;
            }

            // detect definition loop:
            if (m === false) {
                return new Error('Macro name "' + i + '" has an illegal, looping, definition, i.e. it\'s definition references itself, either directly or indirectly, via other macros.');
            }
        }

        return m;
    }

    function expandAllMacrosInSet(s) {
        let i, x;

        // process *all* the macros inside [...] set:
        if (s.indexOf('{') >= 0) {
            for (i in macros) {
                if (macros.hasOwnProperty(i)) {
                    let a = s.split('{' + i + '}');
                    if (a.length > 1) {
                        x = expandMacroInSet(i);
                        assert__default['default'](x);
                        if (x instanceof Error) {
                            return new Error('failure to expand the macro [' + i + '] in set [' + s + ']: ' + x.message);
                        }
                        s = a.join(x);
                    }

                    // stop the brute-force expansion attempt when we done 'em all:
                    if (s.indexOf('{') === -1) {
                        break;
                    }
                }
            }
        }

        return s;
    }

    function expandAllMacrosElsewhere(s) {
        let i, x;

        // When we process the remaining macro occurrences in the regex
        // every macro used in a lexer rule will become its own capture group.
        //
        // Meanwhile the cached expansion will expand any submacros into
        // *NON*-capturing groups so that the backreference indexes remain as you'ld
        // expect and using macros doesn't require you to know exactly what your
        // used macro will expand into, i.e. which and how many submacros it has.
        //
        // This is a BREAKING CHANGE from vanilla jison 0.4.15!
        if (s.indexOf('{') >= 0) {
            for (i in macros) {
                if (macros.hasOwnProperty(i)) {
                    // These are all submacro expansions, hence non-capturing grouping is applied:
                    let a = s.split('{' + i + '}');
                    if (a.length > 1) {
                        x = expandMacroElsewhere(i);
                        assert__default['default'](x);
                        if (x instanceof Error) {
                            return new Error('failure to expand the macro [' + i + '] in regex /' + s + '/: ' + x.message);
                        }
                        s = a.join('(?:' + x + ')');
                    }

                    // stop the brute-force expansion attempt when we done 'em all:
                    if (s.indexOf('{') === -1) {
                        break;
                    }
                }
            }
        }

        return s;
    }


    let i;

    if (grammarSpec.debug) console.log('\n############## RAW macros: ', dict_macros);

    // first we create the part of the dictionary which is targeting the use of macros
    // *inside* `[...]` sets; once we have completed that half of the expansions work,
    // we then go and expand the macros for when they are used elsewhere in a regex:
    // iff we encounter submacros then which are used *inside* a set, we can use that
    // first half dictionary to speed things up a bit as we can use those expansions
    // straight away!
    for (i in dict_macros) {
        if (dict_macros.hasOwnProperty(i)) {
            expandMacroInSet(i);
        }
    }

    for (i in dict_macros) {
        if (dict_macros.hasOwnProperty(i)) {
            expandMacroElsewhere(i);
        }
    }

    if (grammarSpec.debug) console.log('\n############### expanded macros: ', macros);

    return macros;
}



// expand macros in a regex; expands them recursively
function expandMacros(src, macros, grammarSpec) {
    let expansion_count = 0;

    // By the time we call this function `expandMacros` we MUST have expanded and cached all macros already!
    // Hence things should be easy in there:

    function expandAllMacrosInSet(s) {
        let i, m, x;

        // process *all* the macros inside [...] set:
        if (s.indexOf('{') >= 0) {
            for (i in macros) {
                if (macros.hasOwnProperty(i)) {
                    m = macros[i];

                    let a = s.split('{' + i + '}');
                    if (a.length > 1) {
                        x = m.in_set;

                        assert__default['default'](x);
                        if (x instanceof Error) {
                            // this turns out to be an macro with 'issues' and it is used, so the 'issues' do matter: bombs away!
                            throw x;
                        }

                        // detect definition loop:
                        if (x === false) {
                            return new Error('Macro name "' + i + '" has an illegal, looping, definition, i.e. it\'s definition references itself, either directly or indirectly, via other macros.');
                        }

                        s = a.join(x);
                        expansion_count++;
                    }

                    // stop the brute-force expansion attempt when we done 'em all:
                    if (s.indexOf('{') === -1) {
                        break;
                    }
                }
            }
        }

        return s;
    }

    function expandAllMacrosElsewhere(s) {
        let i, m, x;

        // When we process the main macro occurrences in the regex
        // every macro used in a lexer rule will become its own capture group.
        //
        // Meanwhile the cached expansion will expand any submacros into
        // *NON*-capturing groups so that the backreference indexes remain as you'ld
        // expect and using macros doesn't require you to know exactly what your
        // used macro will expand into, i.e. which and how many submacros it has.
        //
        // This is a BREAKING CHANGE from vanilla jison 0.4.15!
        if (s.indexOf('{') >= 0) {
            for (i in macros) {
                if (macros.hasOwnProperty(i)) {
                    m = macros[i];

                    let a = s.split('{' + i + '}');
                    if (a.length > 1) {
                        // These are all main macro expansions, hence CAPTURING grouping is applied:
                        x = m.elsewhere;
                        assert__default['default'](x);

                        // detect definition loop:
                        if (x === false) {
                            return new Error('Macro name "' + i + '" has an illegal, looping, definition, i.e. it\'s definition references itself, either directly or indirectly, via other macros.');
                        }

                        s = a.join('(' + x + ')');
                        expansion_count++;
                    }

                    // stop the brute-force expansion attempt when we done 'em all:
                    if (s.indexOf('{') === -1) {
                        break;
                    }
                }
            }
        }

        return s;
    }


    // When we process the macro occurrences in the regex
    // every macro used in a lexer rule will become its own capture group.
    //
    // Meanwhile the cached expansion will have expanded any submacros into
    // *NON*-capturing groups so that the backreference indexes remain as you'ld
    // expect and using macros doesn't require you to know exactly what your
    // used macro will expand into, i.e. which and how many submacros it has.
    //
    // This is a BREAKING CHANGE from vanilla jison 0.4.15!
    let s2 = reduceRegex(src, null, grammarSpec, expandAllMacrosInSet, expandAllMacrosElsewhere);
    // propagate deferred exceptions = error reports.
    if (s2 instanceof Error) {
        throw s2;
    }

    // only when we did expand some actual macros do we take the re-interpreted/optimized/regenerated regex from reduceRegex()
    // in order to keep our test cases simple and rules recognizable. This assumes the user can code good regexes on his own,
    // as long as no macros are involved...
    //
    // Also pick the reduced regex when there (potentially) are XRegExp extensions in the original, e.g. `\\p{Number}`,
    // unless the `xregexp` output option has been enabled.
    if (expansion_count > 0 || (src.indexOf('\\p{') >= 0 && !grammarSpec.options.xregexp)) {
        src = s2;
    } else {
        // Check if the reduced regex is smaller in size; when it is, we still go with the new one!
        if (s2.length < src.length) {
            src = s2;
        }
    }

    return src;
}

function prepareStartConditions(conditions) {
    let sc;
    let hash = {};

    for (sc in conditions) {
        if (conditions.hasOwnProperty(sc)) {
            hash[sc] = {
                rules: [],
                inclusive: !conditions[sc]
            };
        }
    }
    return hash;
}

function buildActions(dict, tokens, grammarSpec) {
    let actions = [ dict.actionInclude || '', 'const YYSTATE = YY_START;' ];
    let toks = {};
    let caseHelper = [];

    // tokens: map/array of token numbers to token names
    for (let tok in tokens) {
        let idx = parseInt(tok);
        if (idx && idx > 0) {
            toks[tokens[tok]] = idx;
        }
    }

    let gen = prepareRules(dict, actions, caseHelper, tokens && toks, grammarSpec.conditions, grammarSpec);

    let code = actions.join('\n');
    'yytext yyleng yylineno yylloc yyerror'.split(' ').forEach(function (yy) {
        code = code.replace(new RegExp('\\b(' + yy + ')\\b', 'g'), 'yy_.$1');
    });

    return {
        caseHelperInclude: '{\n' + caseHelper.join(',') + '\n}',

        actions: `function lexer__performAction(yy, yyrulenumber, YY_START) {
            const yy_ = this;

            ${code}
        }`,

        rules: gen.rules,
        macros: gen.macros,                   // propagate these for debugging/diagnostic purposes

        regular_rule_count: gen.regular_rule_count,
        simple_rule_count: gen.simple_rule_count
    };
}

function getInitCodeSection(set, section) {
    let rv = [];

    for (let i = 0, len = set.length; i < len; i++) {
        let m = set[i];
        if (m.qualifier === section) {
            if (m.include.trim()) {
                rv.push(m.include);
            }
            if (!set.__consumedInitCodeSlots__) {
                set.__consumedInitCodeSlots__ = [];
            }
            set.__consumedInitCodeSlots__[i] = true;
        }
    }

    if (rv.length > 0) {
        let s = rv.join('\n\n\n');
        return rmCommonWS$3`

            // START code section "${section}"
            ${s}
            // END code section "${section}"

        `;
    }
    return '';
}

function getRemainingInitCodeSections(set, grammarSpec) {
    let rv = [];
    let sections_encountered = {};

    if (!set.__consumedInitCodeSlots__) {
        set.__consumedInitCodeSlots__ = [];
    }
    for (let i = 0, len = set.length; i < len; i++) {
        let m = set[i];
        if (!set.__consumedInitCodeSlots__[i]) {
            // first check if the section qualifier has been reported already:
            if (!sections_encountered[m.qualifier]) {
                sections_encountered[m.qualifier] = true;

                const msg = rmCommonWS$3`
                    Warning: processing unknown   %code '${m.qualifier}'

                    Appending remaining %code '${m.qualifier}' chunks at end of generated output.
                    Make sure this is as intended -- this also happens when '${m.qualifier}' is 
                    a MISTYPED %code section identifier!
                `;
                if (typeof grammarSpec.warn_cb === 'function') {
                    grammarSpec.warn_cb(msg);
                } else if (grammarSpec.warn_cb) {
                    console.error(msg);
                } else {
                    // do not treat as warning; barf hairball instead so that this oddity gets noticed right away!
                    throw new Error(msg.trim());
                }
            }

            rv.push(rmCommonWS$3`

                // START code section "${m.qualifier}"
                ${m.include}
                // END code section "${m.qualifier}"

            `);
            set.__consumedInitCodeSlots__[i] = true;
        }
    }

    if (rv.length > 0) {
        let s = rv.join('\n\n\n');
        return s;
    }
    return '';
}


//
// NOTE: this is *almost* a copy of the JisonParserError producing code in
//       jison/lib/jison.js @ line 2304:lrGeneratorMixin.generateErrorClass
//
function generateErrorClass() {
    // --- START lexer error class ---

const prelude = `/**
 * See also:
 * 
 * - https://github.com/onury/custom-error-test
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 * 
 * We now provide an ES6 derived Error class. An updated ES5-compatible class
 * is available too, for those who might need it, as this is complex stuff to
 * get right (see first link above).
 *
 * @public
 * @constructor
 * @nocollapse
 */


/*---ES5---

//
// JS CustomError implementation — The One (Adapted for JISON)
// This is the closest we can get to ES2015 \`extends Error\` implementation.
// @version 2017-01-05
// @author
//     Onur Yıldırım (https://github.com/onury)
//     Matt Browne (https://github.com/mbrowne)
// @see
//     https://github.com/onury/custom-error-test
//     http://stackoverflow.com/a/35881508/112731
//     https://gist.github.com/mbrowne/4af54767dcb3d529648f5a8aa11d6348
//     http://stackoverflow.com/a/41338601/112731
//
function JisonLexerError(message, hash) {
    if (message == null) message = '???';

    let stacktrace;
    if (hash && hash.exception instanceof Error) {
        const ex2 = hash.exception;
        message = message + ' :: ' + ex2.message;
        stacktrace = ex2.stack;
    }

    let err;
    if (Object.setPrototypeOf) {
        err = new Error(message);
        Object.setPrototypeOf(err, CustomError.prototype);
    } else {
        err = this;
    }

    Object.defineProperty(err, 'name', {
        enumerable: false,
        writable: false,
        value: 'JisonLexerError'
    });

    err.hash = hash;

    if (!Object.setPrototypeOf) {
        Object.defineProperty(err, 'message', {
            enumerable: false,
            writable: true,
            value: message
        });
        if (!stacktrace) {
            if (typeof Error.captureStackTrace === 'function') { // V8
                Error.captureStackTrace(this, JisonLexerError);
            } else {
                stacktrace = (new Error(message)).stack;
            }
        }
    }

    if (stacktrace) {
        Object.defineProperty(err, 'stack', {
            enumerable: false,
            writable: false,
            value: stacktrace
        });
    }

    return err;
}
if (Object.setPrototypeOf) {
    Object.setPrototypeOf(JisonLexerError.prototype, Error.prototype);
} else {
    JisonLexerError.prototype = Object.create(Error.prototype, {
        constructor: { value: JisonLexerError }
    });
}

---ES5---*/

//---ES6---//

class JisonLexerError extends Error {
  constructor(message, hash, ...params) {
    if (message == null) message = '???';

    let stacktrace;
    if (hash && hash.exception instanceof Error) {
        const ex2 = hash.exception;
        message = message + ' :: ' + ex2.message;
        stacktrace = ex2.stack;
    }

    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...params);

    if (!stacktrace) {
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (typeof Error.captureStackTrace === 'function') { // V8
            Error.captureStackTrace(this, JisonLexerError);
        } else {
            stacktrace = (new Error(message)).stack;
        }
    }
    if (stacktrace) {
        Object.defineProperty(this, 'stack', {
            enumerable: false,
            writable: false,
            value: stacktrace
        });
    }

    this.name = 'JisonLexerError';
    this.hash = hash;
  }
}

//---ES6---//`;

    // --- END lexer error class ---

    return prelude;
}


const jisonLexerErrorDefinition = generateErrorClass();


function generateFakeXRegExpClassSrcCode() {
    return rmCommonWS$3`
        var __hacky_counter__ = 0;

        /**
         * @constructor
         * @nocollapse
         */
        function XRegExp(re, f) {
            this.re = re;
            this.flags = f;
            this._getUnicodeProperty = function (k) {};
            var fake = /./;    // WARNING: this exact 'fake' is also depended upon by the xregexp unit test!
            __hacky_counter__++;
            fake.__hacky_backy__ = __hacky_counter__;
            return fake;
        }
    `;
}



/** @constructor */
function RegExpLexer(dict, input, tokens, build_options, yy) {
    let grammarSpec;
    let dump = false;

    function test_me(tweak_cb, description, src_exception, ex_callback) {
        grammarSpec = processGrammar(dict, tokens, build_options);
        grammarSpec.__in_rules_failure_analysis_mode__ = false;
        prepExportStructures(grammarSpec.options);
        assert__default['default'](grammarSpec.options);
        if (tweak_cb) {
            tweak_cb();
        }
        let source = generateModuleBody(grammarSpec);
        try {
            // The generated code will always have the `lexer` variable declared at local scope
            // as `eval()` will use the local scope.
            //
            // The compiled code will look something like this:
            //
            // ```
            // let lexer;
            // bla bla...
            // ```
            //
            // or
            //
            // ```
            // const lexer = { bla... };
            // ```
            let testcode = [
                '// provide a local version for test purposes:',
                jisonLexerErrorDefinition,
                '',
                generateFakeXRegExpClassSrcCode(),
                '',
                source,
                '',
                rmCommonWS$3`
                    // JISON INJECTED VALIDATION CODE
                    // which attempts to ascertain you have defined a minimal viable lexer at least:
                    if (typeof lexer === "undefined") {
                        throw new SyntaxError("user-defined lexer does not define the required 'lexer' instance.");
                    }
                    if (!lexer) {
                        throw new SyntaxError("user-defined lexer does not define a non-NULL 'lexer' instance.");
                    }
                    if (typeof lexer.setInput !== 'function') {
                        throw new SyntaxError("user-defined lexer does not provide the mandatory 'lexer.setInput()' API function.");
                    }
                    if (typeof lexer.lex !== 'function') {
                        throw new SyntaxError("user-defined lexer does not provide the mandatory 'lexer.lex()' API function.");
                    }
                    // END OF JISON INJECTED VALIDATION CODE
                `,
                'return lexer;'
            ].join('\n');
            let lexer = code_exec(testcode, function generated_code_exec_wrapper_regexp_lexer(sourcecode) {
                //console.log("===============================LEXER TEST CODE\n", sourcecode, "\n=====================END====================\n");
                chkBugger$2(sourcecode);
                let lexer_f = new Function('', sourcecode);
                return lexer_f();
            }, Object.assign({}, grammarSpec.options, {
                throwErrorOnCompileFailure: true 
            }), 'lexer');

            if (!lexer) {
                throw new Error('no lexer defined *at all*?!');
            }
            if (typeof lexer.options !== 'object' || lexer.options == null) {
                throw new Error('your lexer class MUST have an .options member object or it won\'t fly!');
            }
            if (typeof lexer.setInput !== 'function') {
                throw new Error('your lexer class MUST have a .setInput function member or it won\'t fly!');
            }
            if (lexer.EOF !== 1 && lexer.ERROR !== 2) {
                throw new Error('your lexer class MUST have these constants defined: lexer.EOF = 1 and lexer.ERROR = 2 or it won\'t fly!');
            }

            // When we do NOT crash, we found/killed the problem area just before this call!
            if (src_exception && description) {
                let msg = description;
                if (typeof description === 'function') {
                    msg = description();
                }
                src_exception.message += '\n        (' + msg + ')';
            }

            // patch the pre and post handlers in there, now that we have some live code to work with:
            if (grammarSpec.options) {
                let pre = grammarSpec.options.pre_lex;
                let post = grammarSpec.options.post_lex;
                // since JSON cannot encode functions, we'll have to do it manually now:
                if (typeof pre === 'function') {
                    lexer.options.pre_lex = pre;
                }
                if (typeof post === 'function') {
                    lexer.options.post_lex = post;
                }
            }

            if (grammarSpec.options.showSource) {
                if (typeof grammarSpec.options.showSource === 'function') {
                    grammarSpec.options.showSource(lexer, source, grammarSpec, RegExpLexer);
                } else {
                    console.log('\nGenerated lexer sourcecode:\n----------------------------------------\n', source, '\n----------------------------------------\n');
                }
            }
            return lexer;
        } catch (ex) {
            // if (src_exception) {
            //     src_exception.message += '\n        (' + description + ': ' + ex.message + ')';
            // }

            if (ex_callback) {
                ex_callback(ex);
            } else if (dump) {
                console.log('source code:\n', source);
            }
            return false;
        }
    }

    /** @constructor */
    let lexer = test_me(null, null, null, function (ex) {
        // When we get an exception here, it means some part of the user-specified lexer is botched.
        //
        // Now we go and try to narrow down the problem area/category:
        assert__default['default'](grammarSpec.options);
        assert__default['default'](grammarSpec.options.xregexp !== undefined);
        let orig_xregexp_opt = !!grammarSpec.options.xregexp;
        if (!test_me(function () {
            assert__default['default'](grammarSpec.options.xregexp !== undefined);
            grammarSpec.options.xregexp = false;
            grammarSpec.showSource = false;
        }, 'When you have specified %option xregexp, you must also properly IMPORT the XRegExp library in the generated lexer.', ex, null)) {
            if (!test_me(function () {
                // restore xregexp option setting: the trouble wasn't caused by the xregexp flag i.c.w. incorrect XRegExp library importing!
                grammarSpec.options.xregexp = orig_xregexp_opt;

                grammarSpec.conditions = [];
                grammarSpec.showSource = false;
            }, function () {
                assert__default['default'](Array.isArray(grammarSpec.rules));
                return (grammarSpec.rules.length > 0 ?
                    'One or more of your lexer state names are possibly botched?' :
                    'Your custom lexer is somehow botched.'
                );
            }, ex, null)) {
                let rulesSpecSize;
                if (!test_me(function () {
                    // store the parsed rule set size so we can use that info in case
                    // this attempt also fails:
                    assert__default['default'](Array.isArray(grammarSpec.rules));
                    rulesSpecSize = grammarSpec.rules.length;

                    // grammarSpec.conditions = [];
                    grammarSpec.rules = [];
                    grammarSpec.showSource = false;
                    grammarSpec.__in_rules_failure_analysis_mode__ = true;
                }, 'One or more of your lexer rules are possibly botched?', ex, null)) {
                    // kill each rule action block, one at a time and test again after each 'edit':
                    let rv = false;
                    for (let i = 0, len = rulesSpecSize; i < len; i++) {
                        let lastEditedRuleSpec;
                        rv = test_me(function () {
                            assert__default['default'](Array.isArray(grammarSpec.rules));
                            assert__default['default'](grammarSpec.rules.length === rulesSpecSize);

                            // grammarSpec.conditions = [];
                            // grammarSpec.rules = [];
                            // grammarSpec.__in_rules_failure_analysis_mode__ = true;

                            // nuke all rules' actions up to and including rule numero `i`:
                            for (let j = 0; j <= i; j++) {
                                // rules, when parsed, have 2 or 3 elements: [conditions, handle, action];
                                // now we want to edit the *action* part:
                                let rule = grammarSpec.rules[j];
                                assert__default['default'](Array.isArray(rule));
                                assert__default['default'](rule.length === 2 || rule.length === 3);
                                rule.pop();
                                rule.push('{ /* nada */ }');
                                lastEditedRuleSpec = rule;
                            }
                        }, function () {
                            return 'Your lexer rule "' + lastEditedRuleSpec[0] + '" action code block is botched?';
                        }, ex, null);
                        if (rv) {
                            break;
                        }
                    }
                    if (!rv) {
                        test_me(function () {
                            grammarSpec.conditions = [];
                            grammarSpec.rules = [];
                            grammarSpec.performAction = 'null';
                            // grammarSpec.options = {};
                            // grammarSpec.caseHelperInclude = '{}';
                            grammarSpec.showSource = false;
                            grammarSpec.__in_rules_failure_analysis_mode__ = true;

                            dump = false;
                        }, 'One or more of your lexer rule action code block(s) are possibly botched?', ex, null);
                    }
                }
            }
        }
        throw ex;
    });

    lexer.setInput(input, yy);

    /** @public */
    lexer.generate = function () {
        return generateFromOpts(grammarSpec);
    };
    /** @public */
    lexer.generateModule = function () {
        return generateModule(grammarSpec);
    };
    /** @public */
    lexer.generateCommonJSModule = function () {
        return generateCommonJSModule(grammarSpec);
    };
    /** @public */
    lexer.generateESModule = function () {
        return generateESModule(grammarSpec);
    };
    /** @public */
    lexer.generateAMDModule = function () {
        return generateAMDModule(grammarSpec);
    };

    // internal APIs to aid testing:
    /** @public */
    lexer.getExpandedMacros = function () {
        return grammarSpec.macros;
    };
    lexer.getActiveOptions = function () {
        return grammarSpec;
    };

    return lexer;
}

// code stripping performance test for very simple grammar:
//
// - removing backtracking parser code branches:                    730K -> 750K rounds
// - removing all location info tracking: yylineno, yylloc, etc.:   750K -> 900K rounds
// - no `yyleng`:                                                   900K -> 905K rounds
// - no `this.done` as we cannot have a NULL `_input` anymore:      905K -> 930K rounds
// - `simpleCaseActionClusters` as array instead of hash object:    930K -> 940K rounds
// - lexers which have only return stmts, i.e. only a
//   `simpleCaseActionClusters` lookup table to produce
//   lexer tokens: *inline* the `performAction` call:               940K -> 950K rounds
// - given all the above, you can *inline* what's left of
//   `lexer_next()`:                                                950K -> 955K rounds (? this stuff becomes hard to measure; inaccuracy abounds!)
//
// Total gain when we forget about very minor (and tough to nail) *inlining* `lexer_next()` gains:
//
//     730 -> 950  ~ 30% performance gain.
//

// As a function can be reproduced in source-code form by any JavaScript engine, we're going to wrap this chunk
// of code in a function so that we can easily get it including it comments, etc.:
/**
@public
@nocollapse
*/
function getRegExpLexerPrototype() {
    // --- START lexer kernel ---
return `EOF: 1,
    ERROR: 2,

    // JisonLexerError: JisonLexerError,        /// <-- injected by the code generator

    // options: {},                             /// <-- injected by the code generator

    // yy: ...,                                 /// <-- injected by setInput()

    __currentRuleSet__: null,                   /// INTERNAL USE ONLY: internal rule set cache for the current lexer state

    __error_infos: [],                          /// INTERNAL USE ONLY: the set of lexErrorInfo objects created since the last cleanup

    __decompressed: false,                      /// INTERNAL USE ONLY: mark whether the lexer instance has been 'unfolded' completely and is now ready for use

    done: false,                                /// INTERNAL USE ONLY
    _backtrack: false,                          /// INTERNAL USE ONLY
    _input: '',                                 /// INTERNAL USE ONLY
    _more: false,                               /// INTERNAL USE ONLY
    _signaled_error_token: false,               /// INTERNAL USE ONLY
    _clear_state: 0,                            /// INTERNAL USE ONLY; 0: clear to do, 1: clear done for lex()/next(); -1: clear done for inut()/unput()/...

    conditionStack: [],                         /// INTERNAL USE ONLY; managed via \`pushState()\`, \`popState()\`, \`topState()\` and \`stateStackSize()\`

    match: '',                                  /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks input which has been matched so far for the lexer token under construction. \`match\` is identical to \`yytext\` except that this one still contains the matched input string after \`lexer.performAction()\` has been invoked, where userland code MAY have changed/replaced the \`yytext\` value entirely!
    matched: '',                                /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks entire input which has been matched so far
    matches: false,                             /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks RE match result for last (successful) match attempt
    yytext: '',                                 /// ADVANCED USE ONLY: tracks input which has been matched so far for the lexer token under construction; this value is transferred to the parser as the 'token value' when the parser consumes the lexer token produced through a call to the \`lex()\` API.
    offset: 0,                                  /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks the 'cursor position' in the input string, i.e. the number of characters matched so far. (**WARNING:** this value MAY be negative if you \`unput()\` more text than you have already lexed. This type of behaviour is generally observed for one kind of 'lexer/parser hack' where custom token-illiciting characters are pushed in front of the input stream to help simulate multiple-START-points in the parser. When this happens, \`base_position\` will be adjusted to help track the original input's starting point in the \`_input\` buffer.)
    base_position: 0,                           /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: index to the original starting point of the input; always ZERO(0) unless \`unput()\` has pushed content before the input: see the \`offset\` **WARNING** just above.
    yyleng: 0,                                  /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: length of matched input for the token under construction (\`yytext\`)
    yylineno: 0,                                /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: 'line number' at which the token under construction is located
    yylloc: null,                               /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks location info (lines + columns) for the token under construction
    CRLF_Re: /\\r\\n?|\\n/,                        /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: regex used to split lines while tracking the lexer cursor position.

    /**
     * INTERNAL USE: construct a suitable error info hash object instance for \`parseError\`.
     *
     * @public
     * @this {RegExpLexer}
     */
    constructLexErrorInfo: function lexer_constructLexErrorInfo(msg, recoverable, show_input_position) {
        msg = '' + msg;

        // heuristic to determine if the error message already contains a (partial) source code dump
        // as produced by either \`showPosition()\` or \`prettyPrintRange()\`:
        if (show_input_position == undefined) {
            show_input_position = !(msg.indexOf('\\n') > 0 && msg.indexOf('^') > 0);
        }
        if (this.yylloc && show_input_position) {
            if (typeof this.prettyPrintRange === 'function') {
                const pretty_src = this.prettyPrintRange(this.yylloc);

                if (!/\\n\\s*$/.test(msg)) {
                    msg += '\\n';
                }
                msg += '\\n  Erroneous area:\\n' + this.prettyPrintRange(this.yylloc);
            } else if (typeof this.showPosition === 'function') {
                const pos_str = this.showPosition();
                if (pos_str) {
                    if (msg.length && msg[msg.length - 1] !== '\\n' && pos_str[0] !== '\\n') {
                        msg += '\\n' + pos_str;
                    } else {
                        msg += pos_str;
                    }
                }
            }
        }
        
        /** @constructor */
        const pei = {
            errStr: msg,
            recoverable: !!recoverable,
            text: this.match,           // This one MAY be empty; userland code should use the \`upcomingInput\` API to obtain more text which follows the 'lexer cursor position'...
            token: null,
            line: this.yylineno,
            loc: this.yylloc,
            yy: this.yy,
            // lexer: this,             // OBSOLETED member since 0.7.0: will cause reference cycles if not treated very carefully, hence has memory leak risks!

            // flags to help userland code to easily recognize what sort of error they're getting fed this time:
            isLexerError: true,                // identifies this as a *lexer* error (contrasting with a *parser* error, which would have \`isParserError: true\`)

            yyErrorInvoked: false,             // \`true\` when error is caused by call to \`yyerror()\`
            isLexerBacktrackingNotSupportedError: false,
            isLexerInternalError: false,

            // additional attributes which will be set up in various error scenarios:
            extra_error_attributes: null,      // array of extra arguments passed to parseError = args;
            lexerHasAlreadyForwardedCursorBy1: false,

            // OBSOLETED since 0.7.0: parser and lexer error \`hash\` and \`yy\` objects are no longer carrying cyclic references, hence no more memory leak risks here.
            // 
            // /**
            //  * and make sure the error info doesn't stay due to potential
            //  * ref cycle via userland code manipulations.
            //  * These would otherwise all be memory leak opportunities!
            //  *
            //  * Note that only array and object references are nuked as those
            //  * constitute the set of elements which can produce a cyclic ref.
            //  * The rest of the members is kept intact as they are harmless.
            //  *
            //  * @public
            //  * @this {LexErrorInfo}
            //  */
            // destroy: function destructLexErrorInfo() {
            //     // remove cyclic references added to error info:
            //     // info.yy = null;
            //     // info.lexer = null;
            //     // ...
            //     const rec = !!this.recoverable;
            //     for (let key in this) {
            //         if (this[key] && this.hasOwnProperty(key) && typeof this[key] === 'object') {
            //             this[key] = undefined;
            //         }
            //     }
            //     this.recoverable = rec;
            // }
        };
        // track this instance so we can \`destroy()\` it once we deem it superfluous and ready for garbage collection!
        this.__error_infos.push(pei);
        return pei;
    },

    /**
     * handler which is invoked when a lexer error occurs.
     *
     * @public
     * @this {RegExpLexer}
     */
    parseError: function lexer_parseError(str, hash, ExceptionClass) {
        if (!ExceptionClass) {
            ExceptionClass = this.JisonLexerError;
        }
        if (this.yy) {
            if (this.yy.parser && typeof this.yy.parser.parseError === 'function') {
                return this.yy.parser.parseError.call(this, str, hash, ExceptionClass) || this.ERROR;
            } else if (typeof this.yy.parseError === 'function') {
                return this.yy.parseError.call(this, str, hash, ExceptionClass) || this.ERROR;
            }
        }
        throw new ExceptionClass(str, hash);
    },

    /**
     * method which implements \`yyerror(str, ...args)\` functionality for use inside lexer actions.
     *
     * @public
     * @this {RegExpLexer}
     */
    yyerror: function yyError(str, ...args) {
        let lineno_msg = 'Lexical error';
        if (this.yylloc) {
            lineno_msg += ' on line ' + (this.yylineno + 1);
        }
        const p = this.constructLexErrorInfo(lineno_msg + ': ' + str, this.options.lexerErrorsAreRecoverable);

        // Add any extra args to the hash under the name \`extra_error_attributes\`:
        if (args.length) {
            p.extra_error_attributes = args;
        }
        p.yyErrorInvoked = true;   // so parseError() user code can easily recognize it is invoked from any yyerror() in the spec action code chunks

        return (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
    },

    /**
     * final cleanup function for when we have completed lexing the input;
     * make it an API so that external code can use this one once userland
     * code has decided it's time to destroy any lingering lexer error
     * hash object instances and the like: this function helps to clean
     * up these constructs, which *may* carry cyclic references which would
     * otherwise prevent the instances from being properly and timely
     * garbage-collected, i.e. this function helps prevent memory leaks!
     *
     * @public
     * @this {RegExpLexer}
     */
    cleanupAfterLex: function lexer_cleanupAfterLex() {
        // prevent lingering circular references from causing memory leaks:
        this.setInput('', {});

        // nuke the error hash info instances created during this run.
        // Userland code must COPY any data/references
        // in the error hash instance(s) it is more permanently interested in.
        for (let i = this.__error_infos.length - 1; i >= 0; i--) {
            let el = this.__error_infos[i];
            if (el && typeof el.destroy === 'function') {
                el.destroy();
            }
        }
        this.__error_infos.length = 0;

        return this;
    },

    /**
     * clear the lexer token context; intended for internal use only
     *
     * @public
     * @this {RegExpLexer}
     */
    clear: function lexer_clear() {
        this.yytext = '';
        this.yyleng = 0;
        this.match = '';
        // - DO NOT reset \`this.matched\`
        this.matches = false;

        this._more = false;
        this._backtrack = false;

        const col = this.yylloc.last_column;
        this.yylloc = {
            first_line: this.yylineno + 1,
            first_column: col,
            last_line: this.yylineno + 1,
            last_column: col,

            range: [ this.offset, this.offset ]
        };
    },

    /**
     * resets the lexer, sets new input
     *
     * @public
     * @this {RegExpLexer}
     */
    setInput: function lexer_setInput(input, yy) {
        this.yy = yy || this.yy || {};

        // also check if we've fully initialized the lexer instance,
        // including expansion work to be done to go from a loaded
        // lexer to a usable lexer:
        if (!this.__decompressed) {
            // step 1: decompress the regex list:
            let rules = this.rules;
            for (let i = 0, len = rules.length; i < len; i++) {
                let rule_re = rules[i];

                // compression: is the RE an xref to another RE slot in the rules[] table?
                if (typeof rule_re === 'number') {
                    rules[i] = rules[rule_re];
                }
            }

            // step 2: unfold the conditions[] set to make these ready for use:
            let conditions = this.conditions;
            for (let k in conditions) {
                let spec = conditions[k];

                let rule_ids = spec.rules;

                let len = rule_ids.length;
                let rule_regexes = new Array(len + 1);            // slot 0 is unused; we use a 1-based index approach here to keep the hottest code in \`lexer_next()\` fast and simple!
                let rule_new_ids = new Array(len + 1);

                for (let i = 0; i < len; i++) {
                    let idx = rule_ids[i];
                    let rule_re = rules[idx];
                    rule_regexes[i + 1] = rule_re;
                    rule_new_ids[i + 1] = idx;
                }

                spec.rules = rule_new_ids;
                spec.__rule_regexes = rule_regexes;
                spec.__rule_count = len;
            }

            this.__decompressed = true;
        }

        if (input && typeof input !== 'string') {
            input = '' + input;
        }
        this._input = input || '';
        this._clear_state = -1;
        this._signaled_error_token = false;
        this.done = false;
        this.yylineno = 0;
        this.matched = '';
        this.conditionStack = [ 'INITIAL' ];
        this.__currentRuleSet__ = null;
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0,

            range: [ 0, 0 ]
        };
        this.offset = 0;
        this.base_position = 0;
        // apply these bits of \`this.clear()\` as well:
        this.yytext = '';
        this.yyleng = 0;
        this.match = '';
        this.matches = false;

        this._more = false;
        this._backtrack = false;

        return this;
    },

    /**
     * edit the remaining input via user-specified callback.
     * This can be used to forward-adjust the input-to-parse,
     * e.g. inserting macro expansions and alike in the
     * input which has yet to be lexed.
     * The behaviour of this API contrasts the \`unput()\` et al
     * APIs as those act on the *consumed* input, while this
     * one allows one to manipulate the future, without impacting
     * the current \`yyloc\` cursor location or any history.
     *
     * Use this API to help implement C-preprocessor-like
     * \`#include\` statements, etc.
     *
     * The provided callback must be synchronous and is
     * expected to return the edited input (string).
     *
     * The \`cpsArg\` argument value is passed to the callback
     * as-is.
     *
     * \`callback\` interface:
     * \`function callback(input, cpsArg)\`
     *
     * - \`input\` will carry the remaining-input-to-lex string
     *   from the lexer.
     * - \`cpsArg\` is \`cpsArg\` passed into this API.
     *
     * The \`this\` reference for the callback will be set to
     * reference this lexer instance so that userland code
     * in the callback can easily and quickly access any lexer
     * API.
     *
     * When the callback returns a non-string-type falsey value,
     * we assume the callback did not edit the input and we
     * will using the input as-is.
     *
     * When the callback returns a non-string-type value, it
     * is converted to a string for lexing via the \`"" + retval\`
     * operation. (See also why: http://2ality.com/2012/03/converting-to-string.html
     * -- that way any returned object's \`toValue()\` and \`toString()\`
     * methods will be invoked in a proper/desirable order.)
     *
     * @public
     * @this {RegExpLexer}
     */
    editRemainingInput: function lexer_editRemainingInput(callback, cpsArg) {
        const rv = callback.call(this, this._input, cpsArg);
        if (typeof rv !== 'string') {
            if (rv) {
                this._input = '' + rv;
            }
            // else: keep \`this._input\` as is.
        } else {
            this._input = rv;
        }
        return this;
    },

    /**
     * consumes and returns one char from the input
     *
     * @public
     * @this {RegExpLexer}
     */
    input: function lexer_input() {
        if (!this._input) {
            //this.done = true;    -- don't set \`done\` as we want the lex()/next() API to be able to produce one custom EOF token match after this anyhow. (lexer can match special <<EOF>> tokens and perform user action code for a <<EOF>> match, but only does so *once*)
            return null;
        }
        if (!this._clear_state && !this._more) {
            this._clear_state = -1;
            this.clear();
        }
        let ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        // Count the linenumber up when we hit the LF (or a stand-alone CR).
        // On CRLF, the linenumber is incremented when you fetch the CR or the CRLF combo
        // and we advance immediately past the LF as well, returning both together as if
        // it was all a single 'character' only.
        let slice_len = 1;
        let lines = false;
        if (ch === '\\n') {
            lines = true;
        } else if (ch === '\\r') {
            lines = true;
            const ch2 = this._input[1];
            if (ch2 === '\\n') {
                slice_len++;
                ch += ch2;
                this.yytext += ch2;
                this.yyleng++;
                this.offset++;
                this.match += ch2;
                this.matched += ch2;
                this.yylloc.range[1]++;
            }
        }
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
            this.yylloc.last_column = 0;
        } else {
            this.yylloc.last_column++;
        }
        this.yylloc.range[1]++;

        this._input = this._input.slice(slice_len);
        return ch;
    },

    /**
     * unshifts one char (or an entire string) into the input
     *
     * @public
     * @this {RegExpLexer}
     */
    unput: function lexer_unput(ch) {
        let len = ch.length;
        let lines = ch.split(this.CRLF_Re);

        if (!this._clear_state && !this._more) {
            this._clear_state = -1;
            this.clear();
        }

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        this.yyleng = this.yytext.length;
        this.offset -= len;
        // **WARNING:**
        // The \`offset\` value MAY be negative if you \`unput()\` more text than you have already lexed.
        // This type of behaviour is generally observed for one kind of 'lexer/parser hack'
        // where custom token-illiciting characters are pushed in front of the input stream to help
        // simulate multiple-START-points in the parser.
        // When this happens, \`base_position\` will be adjusted to help track the original input's
        // starting point in the \`_input\` buffer.
        if (-this.offset > this.base_position) {
            this.base_position = -this.offset;
        }
        this.match = this.match.substr(0, this.match.length - len);
        this.matched = this.matched.substr(0, this.matched.length - len);

        if (lines.length > 1) {
            this.yylineno -= lines.length - 1;

            this.yylloc.last_line = this.yylineno + 1;

            // Get last entirely matched line into the \`pre_lines[]\` array's
            // last index slot; we don't mind when other previously
            // matched lines end up in the array too.
            let pre = this.match;
            let pre_lines = pre.split(this.CRLF_Re);
            if (pre_lines.length === 1) {
                pre = this.matched;
                pre_lines = pre.split(this.CRLF_Re);
            }
            this.yylloc.last_column = pre_lines[pre_lines.length - 1].length;
        } else {
            this.yylloc.last_column -= len;
        }

        this.yylloc.range[1] = this.yylloc.range[0] + this.yyleng;

        this.done = false;
        return this;
    },

    /**
     * return the upcoming input *which has not been lexed yet*.
     * This can, for example, be used for custom look-ahead inspection code
     * in your lexer.
     *
     * The entire pending input string is returned.
     *
     * > ### NOTE ###
     * >
     * > When augmenting error reports and alike, you might want to
     * > look at the \`upcomingInput()\` API instead, which offers more
     * > features for limited input extraction and which includes the
     * > part of the input which has been lexed by the last token a.k.a.
     * > the *currently lexed* input.
     * >
     *
     * @public
     * @this {RegExpLexer}
     */
    lookAhead: function lexer_lookAhead() {
        return this._input || '';
    },

    /**
     * cache matched text and append it on next action
     *
     * @public
     * @this {RegExpLexer}
     */
    more: function lexer_more() {
        this._more = true;
        return this;
    },

    /**
     * signal the lexer that this rule fails to match the input, so the
     * next matching rule (regex) should be tested instead.
     *
     * @public
     * @this {RegExpLexer}
     */
    reject: function lexer_reject() {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            // when the \`parseError()\` call returns, we MUST ensure that the error is registered.
            // We accomplish this by signaling an 'error' token to be produced for the current
            // \`.lex()\` run.
            let lineno_msg = 'Lexical error';
            if (this.yylloc) {
                lineno_msg += ' on line ' + (this.yylineno + 1);
            }
            const p = this.constructLexErrorInfo(lineno_msg + ': You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).', false);
            p.isLexerBacktrackingNotSupportedError = true;            // when this is true, you 'know' the produced error token will be queued.
            this._signaled_error_token = (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
        }
        return this;
    },

    /**
     * retain first n characters of the match
     *
     * @public
     * @this {RegExpLexer}
     */
    less: function lexer_less(n) {
        return this.unput(this.match.slice(n));
    },

    /**
     * return (part of the) already matched input, i.e. for error
     * messages.
     *
     * Limit the returned string length to \`maxSize\` (default: 20).
     *
     * Limit the returned string to the \`maxLines\` number of lines of
     * input (default: 1).
     *
     * A negative \`maxSize\` limit value equals *unlimited*, i.e.
     * produce the entire input that has already been lexed.
     *
     * A negative \`maxLines\` limit value equals *unlimited*, i.e. limit the result
     * to the \`maxSize\` specified number of characters *only*.
     *
     * @public
     * @this {RegExpLexer}
     */
    pastInput: function lexer_pastInput(maxSize, maxLines) {
        let past = this.matched.substring(0, this.matched.length - this.match.length);
        if (maxSize < 0) {
            maxSize = Infinity;
        } else if (!maxSize) {
            maxSize = 20;
        }
        if (maxLines < 0) {
            maxLines = Infinity;          // can't ever have more input lines than this!
        } else if (!maxLines) {
            maxLines = 1;
        }
        // \`substr\` anticipation: treat \\r\\n as a single character and take a little
        // more than necessary so that we can still properly check against maxSize
        // after we've transformed and limited the newLines in here:
        past = past.substr(-maxSize * 2 - 2);
        // now that we have a significantly reduced string to process, transform the newlines
        // and chop them, then limit them:
        let a = past.split(this.CRLF_Re);
        a = a.slice(-maxLines);
        past = a.join('\\n');
        // When, after limiting to maxLines, we still have too much to return,
        // do add an ellipsis prefix...
        if (past.length > maxSize) {
            past = '...' + past.substr(-maxSize);
        }
        return past;
    },

    /**
     * return (part of the) upcoming input *including* the input
     * matched by the last token (see also the NOTE below).
     * This can be used to augment error messages, for example.
     *
     * Limit the returned string length to \`maxSize\` (default: 20).
     *
     * Limit the returned string to the \`maxLines\` number of lines of input (default: 1).
     *
     * A negative \`maxSize\` limit value equals *unlimited*, i.e.
     * produce the entire input that is yet to be lexed.
     *
     * A negative \`maxLines\` limit value equals *unlimited*, i.e. limit the result
     * to the \`maxSize\` specified number of characters *only*.
     *
     * > ### NOTE ###
     * >
     * > *"upcoming input"* is defined as the whole of the both
     * > the *currently lexed* input, together with any remaining input
     * > following that. *"currently lexed"* input is the input
     * > already recognized by the lexer but not yet returned with
     * > the lexer token. This happens when you are invoking this API
     * > from inside any lexer rule action code block.
     * >
     * > When you want access to the 'upcoming input' in that you want access
     * > to the input *which has not been lexed yet* for look-ahead
     * > inspection or likewise purposes, please consider using the
     * > \`lookAhead()\` API instead.
     * >
     *
     * @public
     * @this {RegExpLexer}
     */
    upcomingInput: function lexer_upcomingInput(maxSize, maxLines) {
        let next = this.match;
        let source = this._input || '';
        if (maxSize < 0) {
            maxSize = next.length + source.length;
        } else if (!maxSize) {
            maxSize = 20;
        }

        if (maxLines < 0) {
            maxLines = maxSize;          // can't ever have more input lines than this!
        } else if (!maxLines) {
            maxLines = 1;
        }
        // \`substring\` anticipation: treat \\r\\n as a single character and take a little
        // more than necessary so that we can still properly check against maxSize
        // after we've transformed and limited the newLines in here:
        if (next.length < maxSize * 2 + 2) {
            next += source.substring(0, maxSize * 2 + 2 - next.length);  // substring is faster on Chrome/V8
        }
        // now that we have a significantly reduced string to process, transform the newlines
        // and chop them, then limit them:
        let a = next.split(this.CRLF_Re, maxLines + 1);     // stop splitting once we have reached just beyond the reuired number of lines.
        a = a.slice(0, maxLines);
        next = a.join('\\n');
        // When, after limiting to maxLines, we still have too much to return,
        // do add an ellipsis postfix...
        if (next.length > maxSize) {
            next = next.substring(0, maxSize) + '...';
        }
        return next;
    },

    /**
     * return a string which displays the character position where the
     * lexing error occurred, i.e. for error messages
     *
     * @public
     * @this {RegExpLexer}
     */
    showPosition: function lexer_showPosition(maxPrefix, maxPostfix) {
        const pre = this.pastInput(maxPrefix).replace(/\\s/g, ' ');
        let c = new Array(pre.length + 1).join('-');
        return pre + this.upcomingInput(maxPostfix).replace(/\\s/g, ' ') + '\\n' + c + '^';
    },

    /**
     * return an YYLLOC info object derived off the given context (actual, preceding, following, current).
     * Use this method when the given \`actual\` location is not guaranteed to exist (i.e. when
     * it MAY be NULL) and you MUST have a valid location info object anyway:
     * then we take the given context of the \`preceding\` and \`following\` locations, IFF those are available,
     * and reconstruct the \`actual\` location info from those.
     * If this fails, the heuristic is to take the \`current\` location, IFF available.
     * If this fails as well, we assume the sought location is at/around the current lexer position
     * and then produce that one as a response. DO NOTE that these heuristic/derived location info
     * values MAY be inaccurate!
     *
     * NOTE: \`deriveLocationInfo()\` ALWAYS produces a location info object *copy* of \`actual\`, not just
     * a *reference* hence all input location objects can be assumed to be 'constant' (function has no side-effects).
     *
     * @public
     * @this {RegExpLexer}
     */
    deriveLocationInfo: function lexer_deriveYYLLOC(actual, preceding, following, current) {
        let loc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0,

            range: [ 0, 0 ]
        };
        if (actual) {
            loc.first_line = actual.first_line | 0;
            loc.last_line = actual.last_line | 0;
            loc.first_column = actual.first_column | 0;
            loc.last_column = actual.last_column | 0;

            if (actual.range) {
                loc.range[0] = actual.range[0] | 0;
                loc.range[1] = actual.range[1] | 0;
            }
        }
        if (loc.first_line <= 0 || loc.last_line < loc.first_line) {
            // plan B: heuristic using preceding and following:
            if (loc.first_line <= 0 && preceding) {
                loc.first_line = preceding.last_line | 0;
                loc.first_column = preceding.last_column | 0;

                if (preceding.range) {
                    loc.range[0] = actual.range[1] | 0;
                }
            }

            if ((loc.last_line <= 0 || loc.last_line < loc.first_line) && following) {
                loc.last_line = following.first_line | 0;
                loc.last_column = following.first_column | 0;

                if (following.range) {
                    loc.range[1] = actual.range[0] | 0;
                }
            }

            // plan C?: see if the 'current' location is useful/sane too:
            if (loc.first_line <= 0 && current && (loc.last_line <= 0 || current.last_line <= loc.last_line)) {
                loc.first_line = current.first_line | 0;
                loc.first_column = current.first_column | 0;

                if (current.range) {
                    loc.range[0] = current.range[0] | 0;
                }
            }

            if (loc.last_line <= 0 && current && (loc.first_line <= 0 || current.first_line >= loc.first_line)) {
                loc.last_line = current.last_line | 0;
                loc.last_column = current.last_column | 0;

                if (current.range) {
                    loc.range[1] = current.range[1] | 0;
                }
            }
        }
        // sanitize: fix last_line BEFORE we fix first_line as we use the 'raw' value of the latter
        // or plan D heuristics to produce a 'sensible' last_line value:
        if (loc.last_line <= 0) {
            if (loc.first_line <= 0) {
                loc.first_line = this.yylloc.first_line;
                loc.last_line = this.yylloc.last_line;
                loc.first_column = this.yylloc.first_column;
                loc.last_column = this.yylloc.last_column;

                loc.range[0] = this.yylloc.range[0];
                loc.range[1] = this.yylloc.range[1];
            } else {
                loc.last_line = this.yylloc.last_line;
                loc.last_column = this.yylloc.last_column;

                loc.range[1] = this.yylloc.range[1];
            }
        }
        if (loc.first_line <= 0) {
            loc.first_line = loc.last_line;
            loc.first_column = 0; // loc.last_column;

            loc.range[1] = loc.range[0];
        }
        if (loc.first_column < 0) {
            loc.first_column = 0;
        }
        if (loc.last_column < 0) {
            loc.last_column = (loc.first_column > 0 ? loc.first_column : 80);
        }
        return loc;
    },

    /**
     * return a string which displays the lines & columns of input which are referenced
     * by the given location info range, plus a few lines of context.
     *
     * This function pretty-prints the indicated section of the input, with line numbers
     * and everything!
     *
     * This function is very useful to provide highly readable error reports, while
     * the location range may be specified in various flexible ways:
     *
     * - \`loc\` is the location info object which references the area which should be
     *   displayed and 'marked up': these lines & columns of text are marked up by \`^\`
     *   characters below each character in the entire input range.
     *
     * - \`context_loc\` is the *optional* location info object which instructs this
     *   pretty-printer how much *leading* context should be displayed alongside
     *   the area referenced by \`loc\`. This can help provide context for the displayed
     *   error, etc.
     *
     *   When this location info is not provided, a default context of 3 lines is
     *   used.
     *
     * - \`context_loc2\` is another *optional* location info object, which serves
     *   a similar purpose to \`context_loc\`: it specifies the amount of *trailing*
     *   context lines to display in the pretty-print output.
     *
     *   When this location info is not provided, a default context of 1 line only is
     *   used.
     *
     * Special Notes:
     *
     * - when the \`loc\`-indicated range is very large (about 5 lines or more), then
     *   only the first and last few lines of this block are printed while a
     *   \`...continued...\` message will be printed between them.
     *
     *   This serves the purpose of not printing a huge amount of text when the \`loc\`
     *   range happens to be huge: this way a manageable & readable output results
     *   for arbitrary large ranges.
     *
     * - this function can display lines of input which whave not yet been lexed.
     *   \`prettyPrintRange()\` can access the entire input!
     *
     * @public
     * @this {RegExpLexer}
     */
    prettyPrintRange: function lexer_prettyPrintRange(loc, context_loc, context_loc2) {
        loc = this.deriveLocationInfo(loc, context_loc, context_loc2);

        const CONTEXT = 3;
        const CONTEXT_TAIL = 1;
        const MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT = 2;
        let input = this.matched + (this._input || '');
        let lines = input.split('\\n');
        let l0 = Math.max(1, (context_loc ? context_loc.first_line : loc.first_line - CONTEXT));
        let l1 = Math.max(1, (context_loc2 ? context_loc2.last_line : loc.last_line + CONTEXT_TAIL));
        let lineno_display_width = (1 + Math.log10(l1 | 1) | 0);
        let ws_prefix = new Array(lineno_display_width).join(' ');
        let nonempty_line_indexes = [ [], [], [] ];
        let rv = lines.slice(l0 - 1, l1 + 1).map(function injectLineNumber(line, index) {
            let lno = index + l0;
            let lno_pfx = (ws_prefix + lno).substr(-lineno_display_width);
            let rv = lno_pfx + ': ' + line;
            let errpfx = (new Array(lineno_display_width + 1)).join('^');
            let offset = 2 + 1;
            let len = 0;

            if (lno === loc.first_line) {
                offset += loc.first_column;

                len = Math.max(
                    2,
                    ((lno === loc.last_line ? loc.last_column : line.length)) - loc.first_column + 1
                );
            } else if (lno === loc.last_line) {
                len = Math.max(2, loc.last_column + 1);
            } else if (lno > loc.first_line && lno < loc.last_line) {
                len = Math.max(2, line.length + 1);
            }

            let nli;
            if (len) {
                let lead = new Array(offset).join('.');
                let mark = new Array(len).join('^');
                rv += '\\n' + errpfx + lead + mark;

                nli = 1;
            } else if (lno < loc.first_line) {
                nli = 0;
            } else if (lno > loc.last_line) {
                nli = 2;
            }

            if (line.trim().length > 0) {
                nonempty_line_indexes[nli].push(index);
            }

            rv = rv.replace(/\\t/g, ' ');
            return rv;
        });

        // now make sure we don't print an overly large amount of lead/error/tail area: limit it
        // to the top and bottom line count:
        for (let i = 0; i <= 2; i++) {
            let line_arr = nonempty_line_indexes[i];
            if (line_arr.length > 2 * MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT) {
                let clip_start = line_arr[MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT - 1] + 1;
                let clip_end = line_arr[line_arr.length - MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT] - 1;

                let intermediate_line = (new Array(lineno_display_width + 1)).join(' ') +     '  (...continued...)';
                if (i === 1) {
                    intermediate_line += '\\n' + (new Array(lineno_display_width + 1)).join('-') + '  (---------------)';
                }
                rv.splice(clip_start, clip_end - clip_start + 1, intermediate_line);
            }
        }

        return rv.join('\\n');
    },

    /**
     * helper function, used to produce a human readable description as a string, given
     * the input \`yylloc\` location object.
     *
     * Set \`display_range_too\` to TRUE to include the string character index position(s)
     * in the description if the \`yylloc.range\` is available.
     *
     * @public
     * @this {RegExpLexer}
     */
    describeYYLLOC: function lexer_describe_yylloc(yylloc, display_range_too) {
        let l1 = yylloc.first_line;
        let l2 = yylloc.last_line;
        let c1 = yylloc.first_column;
        let c2 = yylloc.last_column;
        let dl = l2 - l1;
        let dc = c2 - c1;
        let rv;
        if (dl === 0) {
            rv = 'line ' + l1 + ', ';
            if (dc <= 1) {
                rv += 'column ' + c1;
            } else {
                rv += 'columns ' + c1 + ' .. ' + c2;
            }
        } else {
            rv = 'lines ' + l1 + '(column ' + c1 + ') .. ' + l2 + '(column ' + c2 + ')';
        }
        if (yylloc.range && display_range_too) {
            let r1 = yylloc.range[0];
            let r2 = yylloc.range[1] - 1;
            if (r2 <= r1) {
                rv += ' {String Offset: ' + r1 + '}';
            } else {
                rv += ' {String Offset range: ' + r1 + ' .. ' + r2 + '}';
            }
        }
        return rv;
    },

    /**
     * test the lexed token: return FALSE when not a match, otherwise return token.
     *
     * \`match\` is supposed to be an array coming out of a regex match, i.e. \`match[0]\`
     * contains the actually matched text string.
     *
     * Also move the input cursor forward and update the match collectors:
     *
     * - \`yytext\`
     * - \`yyleng\`
     * - \`match\`
     * - \`matches\`
     * - \`yylloc\`
     * - \`offset\`
     *
     * @public
     * @this {RegExpLexer}
     */
    test_match: function lexer_test_match(match, indexed_rule) {
        let backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.yylloc.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column,

                    range: this.yylloc.range.slice()
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                //_signaled_error_token: this._signaled_error_token,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(),
                done: this.done
            };
        }

        let match_str = match[0];
        let match_str_len = match_str.length;

        let lines = match_str.split(this.CRLF_Re);
        if (lines.length > 1) {
            this.yylineno += lines.length - 1;

            this.yylloc.last_line = this.yylineno + 1;
            this.yylloc.last_column = lines[lines.length - 1].length;
        } else {
            this.yylloc.last_column += match_str_len;
        }

        this.yytext += match_str;
        this.match += match_str;
        this.matched += match_str;
        this.matches = match;
        this.yyleng = this.yytext.length;
        this.yylloc.range[1] += match_str_len;

        // previous lex rules MAY have invoked the \`more()\` API rather than producing a token:
        // those rules will already have moved this \`offset\` forward matching their match lengths,
        // hence we must only add our own match length now:
        this.offset += match_str_len;
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match_str_len);

        // calling this method:
        //
        //   function lexer__performAction(yy, yyrulenumber, YY_START) {...}
        let token = this.performAction.call(this, this.yy, indexed_rule, this.conditionStack[this.conditionStack.length - 1] /* = YY_START */);
        // otherwise, when the action codes are all simple return token statements:
        //token = this.simpleCaseActionClusters[indexed_rule];

        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (let k in backup) {
                this[k] = backup[k];
            }
            this.__currentRuleSet__ = null;
            return false; // rule action called reject() implying the next rule should be tested instead.
        } else if (this._signaled_error_token) {
            // produce one 'error' token as \`.parseError()\` in \`reject()\`
            // did not guarantee a failure signal by throwing an exception!
            token = this._signaled_error_token;
            this._signaled_error_token = false;
            return token;
        }
        return false;
    },

    /**
     * return next match in input
     *
     * @public
     * @this {RegExpLexer}
     */
    next: function lexer_next() {
        if (this.done) {
            this.clear();
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        if (!this._more) {
            if (!this._clear_state) {
                this._clear_state = 1;
            }
            this.clear();
        }
        let spec = this.__currentRuleSet__;
        if (!spec) {
            // Update the ruleset cache as we apparently encountered a state change or just started lexing.
            // The cache is set up for fast lookup -- we assume a lexer will switch states much less often than it will
            // invoke the \`lex()\` token-producing API and related APIs, hence caching the set for direct access helps
            // speed up those activities a tiny bit.
            spec = this.__currentRuleSet__ = this._currentRules();
            // Check whether a *sane* condition has been pushed before: this makes the lexer robust against
            // user-programmer bugs such as https://github.com/zaach/jison-lex/issues/19
            if (!spec || !spec.rules) {
                let lineno_msg = '';
                if (this.yylloc) {
                    lineno_msg = ' on line ' + (this.yylineno + 1);
                }
                const p = this.constructLexErrorInfo('Internal lexer engine error' + lineno_msg + ': The lex grammar programmer pushed a non-existing condition name "' + this.topState() + '"; this is a fatal error and should be reported to the application programmer team!', false);
                p.isLexerInternalError = true;
                // produce one 'error' token until this situation has been resolved, most probably by parse termination!
                return (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
            }
        }

        {
            let rule_ids = spec.rules;
            let regexes = spec.__rule_regexes;
            let len = spec.__rule_count;
            let match;
            let index;

            // Note: the arrays are 1-based, while \`len\` itself is a valid index,
            // hence the non-standard less-or-equal check in the next loop condition!
            for (let i = 1; i <= len; i++) {
                let tempMatch = this._input.match(regexes[i]);
                if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                    match = tempMatch;
                    index = i;
                    if (this.options.backtrack_lexer) {
                        let token = this.test_match(tempMatch, rule_ids[i]);
                        if (token !== false) {
                            return token;
                        } else if (this._backtrack) {
                            match = undefined;
                            continue; // rule action called reject() implying a rule MISmatch.
                        } else {
                            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                            return false;
                        }
                    } else if (!this.options.flex) {
                        break;
                    }
                }
            }

            if (match) {
                let token = this.test_match(match, rule_ids[index]);
                if (token !== false) {
                    return token;
                }
                // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                return false;
            }
        }

        if (!this._input) {
            this.done = true;
            this.clear();
            return this.EOF;
        }

        {
            let lineno_msg = 'Lexical error';
            if (this.yylloc) {
                lineno_msg += ' on line ' + (this.yylineno + 1);
            }
            const p = this.constructLexErrorInfo(lineno_msg + ': Unrecognized text.', this.options.lexerErrorsAreRecoverable);

            let pendingInput = this._input;
            let activeCondition = this.topState();
            let conditionStackDepth = this.conditionStack.length;

            // when this flag is set in your parseError() \`hash\`, you 'know' you cannot manipute \`yytext\` to be anything but 
            // a string value, unless
            // - you either get to experience a lexer crash once it invokes .input() with your manipulated \`yytext\` object,
            // - or you must forward the lex cursor yourself by invoking \`yy.input()\` or equivalent, *before* you go and
            //   tweak that \`yytext\`.
            p.lexerHasAlreadyForwardedCursorBy1 = (!this.matches);

            // Simplify use of (advanced) custom parseError() handlers: every time we encounter an error,
            // which HAS NOT consumed any input yet (thus causing an infinite lexer loop unless we take special action),
            // we FIRST consume ONE character of input, BEFORE we call parseError().
            // 
            // This implies that the parseError() now can call \`unput(this.yytext)\` if it wants to only change lexer
            // state via popState/pushState, but otherwise this would make for a cleaner parseError() implementation
            // as there's no conditional check for \`hash.lexerHasAlreadyForwardedCursorBy1\` needed in there any more.
            // 
            // Since that flag is new as of jison-gho 0.7.0, as is this new consume1+parseError() behaviour, only
            // sophisticated userland parseError() methods will need to be reviewed.
            // Haven't found any of those in the (Open Source) wild today, so this should be safe to change...

            // *** CONSUME 1 ***:
                        
            //if (token === this.ERROR) {
            //    ^^^^^^^^^^^^^^^^^^^^ WARNING: no matter what token the error handler produced, 
            //                         it MUST move the cursor forward or you'ld end up in 
            //                         an infinite lex loop, unless one or more of the following 
            //                         conditions was changed, so as to change the internal lexer 
            //                         state and thus enable it to produce a different token:
            //                         
                // we can try to recover from a lexer error that \`parseError()\` did not 'recover' for us
                // by moving forward at least one character at a time IFF the (user-specified?) \`parseError()\`
                // has not consumed/modified any pending input or changed state in the error handler:
                if (!this.matches &&
                    // and make sure the input has been modified/consumed ...
                    pendingInput === this._input &&
                    // ...or the lexer state has been modified significantly enough
                    // to merit a non-consuming error handling action right now.
                    activeCondition === this.topState() &&
                    conditionStackDepth === this.conditionStack.length
                ) {
                    this.input();
                }
            //}

            // *** PARSE-ERROR ***:
            // 
            // Note:
            // userland code in there may \`unput()\` what was done, after checking the \`hash.lexerHasAlreadyForwardedCursorBy1\` flag.
            // Caveat emptor! :: When you simply \`unput()\` the \`yytext\` without at least changing the lexer condition state 
            // via popState/pushState, you WILL end up with an infinite lexer loop. 
            // 
            // This kernel code has been coded to prevent this dangerous situation unless you specifically seek it out
            // in your custom parseError handler.
                        
            return (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
        }
    },

    /**
     * return next match that has a token
     *
     * @public
     * @this {RegExpLexer}
     */
    lex: function lexer_lex() {
        let r;

        //this._clear_state = 0;

        if (!this._more) {
            if (!this._clear_state) {
                this._clear_state = 1;
            }
            this.clear();
        }

        // allow the PRE/POST handlers set/modify the return token for maximum flexibility of the generated lexer:
        if (typeof this.pre_lex === 'function') {
            r = this.pre_lex.call(this, 0);
        }
        if (typeof this.options.pre_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.options.pre_lex.call(this, r) || r;
        }
        if (this.yy && typeof this.yy.pre_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.yy.pre_lex.call(this, r) || r;
        }

        while (!r) {
            r = this.next();
        }

        if (this.yy && typeof this.yy.post_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.yy.post_lex.call(this, r) || r;
        }
        if (typeof this.options.post_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.options.post_lex.call(this, r) || r;
        }
        if (typeof this.post_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.post_lex.call(this, r) || r;
        }

        if (!this._more) {
            //
            // 1) make sure any outside interference is detected ASAP:
            //    these attributes are to be treated as 'const' values
            //    once the lexer has produced them with the token (return value \`r\`).
            // 2) make sure any subsequent \`lex()\` API invocation CANNOT
            //    edit the \`yytext\`, etc. token attributes for the *current*
            //    token, i.e. provide a degree of 'closure safety' so that
            //    code like this:
            //
            //        t1 = lexer.lex();
            //        v = lexer.yytext;
            //        l = lexer.yylloc;
            //        t2 = lexer.lex();
            //        assert(lexer.yytext !== v);
            //        assert(lexer.yylloc !== l);
            //
            //    succeeds. Older (pre-v0.6.5) jison versions did not *guarantee*
            //    these conditions.
            //
            this.yytext = Object.freeze(this.yytext);
            this.matches = Object.freeze(this.matches);
            this.yylloc.range = Object.freeze(this.yylloc.range);
            this.yylloc = Object.freeze(this.yylloc);

            this._clear_state = 0;
        }

        return r;
    },

    /**
     * return next match that has a token. Identical to the \`lex()\` API but does not invoke any of the
     * \`pre_lex()\` nor any of the \`post_lex()\` callbacks.
     *
     * @public
     * @this {RegExpLexer}
     */
    fastLex: function lexer_fastLex() {
        let r;

        //this._clear_state = 0;

        while (!r) {
            r = this.next();
        }

        if (!this._more) {
            //
            // 1) make sure any outside interference is detected ASAP:
            //    these attributes are to be treated as 'const' values
            //    once the lexer has produced them with the token (return value \`r\`).
            // 2) make sure any subsequent \`lex()\` API invocation CANNOT
            //    edit the \`yytext\`, etc. token attributes for the *current*
            //    token, i.e. provide a degree of 'closure safety' so that
            //    code like this:
            //
            //        t1 = lexer.lex();
            //        v = lexer.yytext;
            //        l = lexer.yylloc;
            //        t2 = lexer.lex();
            //        assert(lexer.yytext !== v);
            //        assert(lexer.yylloc !== l);
            //
            //    succeeds. Older (pre-v0.6.5) jison versions did not *guarantee*
            //    these conditions.
            //
            this.yytext = Object.freeze(this.yytext);
            this.matches = Object.freeze(this.matches);
            this.yylloc.range = Object.freeze(this.yylloc.range);
            this.yylloc = Object.freeze(this.yylloc);

            this._clear_state = 0;
        }

        return r;
    },

    /**
     * return info about the lexer state that can help a parser or other lexer API user to use the
     * most efficient means available. This API is provided to aid run-time performance for larger
     * systems which employ this lexer.
     *
     * @public
     * @this {RegExpLexer}
     */
    canIUse: function lexer_canIUse() {
        const rv = {
            fastLex: !(
                typeof this.pre_lex === 'function' ||
                typeof this.options.pre_lex === 'function' ||
                (this.yy && typeof this.yy.pre_lex === 'function') ||
                (this.yy && typeof this.yy.post_lex === 'function') ||
                typeof this.options.post_lex === 'function' ||
                typeof this.post_lex === 'function'
            ) && typeof this.fastLex === 'function'
        };
        return rv;
    },


    /**
     * backwards compatible alias for \`pushState()\`;
     * the latter is symmetrical with \`popState()\` and we advise to use
     * those APIs in any modern lexer code, rather than \`begin()\`.
     *
     * @public
     * @this {RegExpLexer}
     */
    begin: function lexer_begin(condition) {
        return this.pushState(condition);
    },

    /**
     * activates a new lexer condition state (pushes the new lexer
     * condition state onto the condition stack)
     *
     * @public
     * @this {RegExpLexer}
     */
    pushState: function lexer_pushState(condition) {
        this.conditionStack.push(condition);
        this.__currentRuleSet__ = null;
        return this;
    },

    /**
     * pop the previously active lexer condition state off the condition
     * stack
     *
     * @public
     * @this {RegExpLexer}
     */
    popState: function lexer_popState() {
        const n = this.conditionStack.length - 1;
        if (n > 0) {
            this.__currentRuleSet__ = null;
            return this.conditionStack.pop();
        }
        return this.conditionStack[0];
    },

    /**
     * return the currently active lexer condition state; when an index
     * argument is provided it produces the N-th previous condition state,
     * if available
     *
     * @public
     * @this {RegExpLexer}
     */
    topState: function lexer_topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        }
        return 'INITIAL';
    },

    /**
     * (internal) determine the lexer rule set which is active for the
     * currently active lexer condition state
     *
     * @public
     * @this {RegExpLexer}
     */
    _currentRules: function lexer__currentRules() {
        const n = this.conditionStack.length - 1;
        let state;
        if (n >= 0) {
            state = this.conditionStack[n];
        } else {
            state = 'INITIAL';
        }
        return this.conditions[state] || this.conditions.INITIAL;
    },

    /**
     * return the number of states currently on the stack
     *
     * @public
     * @this {RegExpLexer}
     */
    stateStackSize: function lexer_stateStackSize() {
        return this.conditionStack.length;
    }`;
    // --- END lexer kernel ---
}


// --- START of commonJsMain chunk ---
//
// default main method for generated commonjs modules
const commonJsMain = `
// Note: this function will be invoked with argv[0] being the app JS, i.e.
//
//         __jison_default_main__(process.argv.slice(1));
//
// which is the same convention as for C programs, shell scripts, etc.
// NodeJS differs from those in that the first argument *always* is the
// node executable itself, even when this script was invoked *without*
// the node prefix, e.g.
//
//         ./lexer.js --help
//
function __jisonlexer_default_main__(argv) {
    // When the lexer comes with its own \`main\` function, then use that one:
    if (typeof exports.lexer.main === 'function') {
        return exports.lexer.main(argv);
    }

    // don't dump more than 4 EOF tokens at the end of the stream:
    const maxEOFTokenCount = 4;
    // don't dump more than 20 error tokens in the output stream:
    const maxERRORTokenCount = 20;
    // maximum number of tokens in the output stream:
    const maxTokenCount = 10000;

    if (!argv[1] || argv[1] == '--help' || argv[1] == '-h') {
        console.log(\`
Usage:
  $\{path.basename(argv[0])} INFILE [OUTFILE]

Input
-----

Reads input from INFILE (which may be specified as '-' to specify STDIN for
use in piped commands, e.g.

  cat "example input" | $\{path.basename(argv[0])} -

The input is lexed into a token stream, which is written to the OUTFILE as
an array of JSON nodes.

Output
------

When the OUTFILE is not specified, its path & name are derived off the INFILE,
appending the '.lexed.json' suffix. Hence

  $\{path.basename(argv[0])} path/foo.bar

will have its token stream written to the 'path/foo.bar.lexed.json' file.

Errors
------

A (fatal) failure during lexing (i.e. an exception thrown) will be logged as
a special fatal error token:

  {
      id: -1,  // this signals a fatal failure
      token: null,
      fail: 1,
      msg: <the extended error exception type, message and stacktrace as STRING>
  }

Application Exit Codes
----------------------

This particular error situation will produce the same exit code as a successful
lexing: exitcode 0 (zero: SUCCESS)

However, any failure to read/write the files will be reported as errors with
exitcode 1 (one: FAILURE)

Limits
------

- The lexer output (token stream) is limited to $\{maxTokenCount} tokens.
- The token stream will end with at most $\{maxEOFTokenCount} EOF tokens.
- The token stream will end when at most $\{maxERRORTokenCount} ERROR tokens have been
  produced by the lexer.
\`);
        process.exit(1);
    }

    function customMainParseError(str, hash, ExceptionClass) {
        console.error("parseError: ", str);
        return this.ERROR;
    }

    function main_work_function(input) {
        const lexer = exports.lexer;

        let yy = {
            // if a custom parseError has already been defined, we DO NOT override that one:
            parseError: (lexer.yy && lexer.yy.parseError) || (lexer.yy && lexer.yy.parser && lexer.yy.parser.parseError) || customMainParseError
        };

        let tokens = [];
        
        let countEOFs = 0;
        let countERRORs = 0;
        let countFATALs = 0;

        try {
            lexer.setInput(input, yy);

            for (i = 0; i < maxTokenCount; i++) {
                let tok = lexer.lex();
                tokens.push({
                    id: tok,
                    token: (tok === 1 ? 'EOF' : tok),    // lexer.describeSymbol(tok),
                    yytext: lexer.yytext,
                    yylloc: lexer.yylloc
                });
                if (tok === lexer.EOF) {
                    // and make sure EOF stays EOF, i.e. continued invocation of \`lex()\` will only
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
            }
        } catch (ex) {
            countFATALs++;
            // save the error:
            let stk = '' + ex.stack;
            stk = stk.replace(/\\t/g, '  ')
            .replace(/  at (.+?)\\(.*?[\\\\/]([^\\\\/\\s]+)\\)/g, '  at $1($2)');
            let msg = 'ERROR:' + ex.name + '::' + ex.message + '::' + stk;
            tokens.push({
                id: -1,
                token: null,
                fail: 1,
                err: msg,
            });
        }

        // write a summary node at the end of the stream:
        tokens.push({
            id: -2,
            token: null,
            summary: {
                totalTokenCount: tokens.length,
                EOFTokenCount: countEOFs,
                ERRORTokenCount: countERRORs,
                fatalExceptionCount: countFATALs
            }
        });
        return tokens;
    }

    //const [ , ...args ] = argv;
    let must_read_from_stdin = (argv[1] === '-');
    let input_path = (!must_read_from_stdin ? path.normalize(argv[1]) : '(stdin)');
    let must_write_to_stdout = (argv[2] === '-');
    let output_path = (!must_write_to_stdout ? (path.normalize(argv[2] || (must_read_from_stdin ? input_path : 'stdin') + '.lexed.json')) : '(stdout)');
    const print_summary_and_write_to_output = (tokens) => {
        let summary = tokens[tokens.length - 1].summary;

        console.log(\`
////////////////////////////////////////////////////////////////////////////                    
// Lexer output: 
//
// - total # tokens read:                         $\{summary.totalTokenCount} 
// - # of EOF totkens:                            $\{summary.EOFTokenCount} 
// - # of ERROR tokens produced by the lexer:     $\{summary.ERRORTokenCount}
// - # of fatal crashes, i.e. lexer exceptions:   $\{summary.fatalExceptionCount}
////////////////////////////////////////////////////////////////////////////
\`);

        let dst = JSON.stringify(tokens, null, 2);
        if (!must_write_to_stdout) {
            fs.writeFileSync(output_path, dst, 'utf8');
        } else {
            console.log(dst);                
        }
    };

    if (!must_read_from_stdin) {
        try {
            const input = fs.readFileSync(input_path, 'utf8');
            let tokens = main_work_function(input);

            print_summary_and_write_to_output(tokens);

            process.exit(0); // SUCCESS!
        } catch (ex2) {
            console.error("Failure:\\n", ex2, \`

Input filepath:  $\{input_path}
Output filepath: $\{output_path}               
            \`);
            process.exit(1);   // FAIL
        }
    } else {
        if (process.stdin.isTTY) {
            console.error(\`
Error: 
You specified to read from STDIN without piping anything into the application.

Manual entry from the console is not supported.
            \`);
            process.exit(1);
        } else {
            // Accepting piped content. E.g.:
            // echo "pass in this string as input" | ./example-script
            const stdin = process.openStdin();
            let data = '';
            stdin.setEncoding(encoding);

            stdin.on('readable', function () {
                let chunk;
                while (chunk = stdin.read()) {
                    data += chunk;
                }
            });

            stdin.on('end', function () {
                // There MAY be a trailing \\n from the user hitting enter. Send it along.
                //data = data.replace(/\\n$/, '')
                try {
                    let tokens = main_work_function(data);

                    print_summary_and_write_to_output(tokens);

                    process.exit(0);   // SUCCESS!
                } catch (ex2) {
                    console.error("Failure:\\n", ex2, \`

Input filepath:  $\{input_path}
Output filepath: $\{output_path}               
                    \`);
                    process.exit(1);   // FAIL
                }
            });
        }
    }
}
`;
// --- END of commonJsMain chunk ---

const commonJsMainImports = `
const fs = require('fs');
const path = require('path');
`;

const commonES6MainImports = `
const fs = require('fs');
const path = require('path');
//import fs from 'fs';
//import path from 'path';
`;


chkBugger$2(getRegExpLexerPrototype());
RegExpLexer.prototype = (new Function(rmCommonWS$3`
    "use strict";

    return {
        ${getRegExpLexerPrototype()}
    };
`))();


// The lexer code stripper, driven by optimization analysis settings and
// lexer options, which cannot be changed at run-time.
function stripUnusedLexerCode(src, grammarSpec) {
    //   uses yyleng: ..................... ${grammarSpec.lexerActionsUseYYLENG}
    //   uses yylineno: ................... ${grammarSpec.lexerActionsUseYYLINENO}
    //   uses yytext: ..................... ${grammarSpec.lexerActionsUseYYTEXT}
    //   uses yylloc: ..................... ${grammarSpec.lexerActionsUseYYLOC}
    //   uses ParseError API: ............. ${grammarSpec.lexerActionsUseParseError}
    //   uses location tracking & editing:  ${grammarSpec.lexerActionsUseLocationTracking}
    //   uses more() API: ................. ${grammarSpec.lexerActionsUseMore}
    //   uses unput() API: ................ ${grammarSpec.lexerActionsUseUnput}
    //   uses reject() API: ............... ${grammarSpec.lexerActionsUseReject}
    //   uses less() API: ................. ${grammarSpec.lexerActionsUseLess}
    //   uses display APIs pastInput(), upcomingInput(), showPosition():
    //        ............................. ${grammarSpec.lexerActionsUseDisplayAPIs}
    //   uses describeYYLLOC() API: ....... ${grammarSpec.lexerActionsUseDescribeYYLOC}

    let new_src;
    try {
        if (grammarSpec.options.doNotTestCompile) {
            new_src = src;
        } else {
            let ast = helpers.parseCodeChunkToAST(src, grammarSpec.options);
            new_src = helpers.prettyPrintAST(ast, grammarSpec.options.prettyCfg);
        }
    } catch (ex) {
        let line = ex.lineNumber || 0;
        let a = src.split(/\r?\n/g);
        let len = a.length;
        let minl = Math.max(0, line - 10);
        let b = a.slice(minl, line + 10);
        let c = b.splice(line - minl, 0, '', '^^^^^^^^^^^ source line above is reported as erroneous ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^', '');
        let offendingChunk = '        ' + b.join('\n        ');
        console.error(rmCommonWS$3`
            stripUnusedLexerCode WARNING: 

                JISON failed to reformat the generated lexer.
                Using the generated code as-is instead and pray it works in your final output!

                Internal error report:

                    ${ex}

                The offending action code chunk as reported above:

            ${offendingChunk}
        `);

        new_src = src;
    }

    // inject analysis report now:
    new_src = new_src.replace(/\/\*\s*JISON-LEX-ANALYTICS-REPORT\s*\*\//g, rmCommonWS$3`
        // Code Generator Information Report
        // ---------------------------------
        //
        // Options:
        //
        //   backtracking: .................... ${grammarSpec.options.backtrack_lexer}
        //   location.ranges: ................. ${grammarSpec.options.ranges}
        //   location line+column tracking: ... ${grammarSpec.options.trackPosition}
        //
        //
        // Forwarded Parser Analysis flags:
        //
        //   uses yyleng: ..................... ${grammarSpec.parseActionsUseYYLENG}
        //   uses yylineno: ................... ${grammarSpec.parseActionsUseYYLINENO}
        //   uses yytext: ..................... ${grammarSpec.parseActionsUseYYTEXT}
        //   uses yylloc: ..................... ${grammarSpec.parseActionsUseYYLOC}
        //   uses lexer values: ............... ${grammarSpec.parseActionsUseValueTracking} / ${grammarSpec.parseActionsUseValueAssignment}
        //   location tracking: ............... ${grammarSpec.parseActionsUseLocationTracking}
        //   location assignment: ............. ${grammarSpec.parseActionsUseLocationAssignment}
        //
        //
        // Lexer Analysis flags:
        //
        //   uses yyleng: ..................... ${grammarSpec.lexerActionsUseYYLENG}
        //   uses yylineno: ................... ${grammarSpec.lexerActionsUseYYLINENO}
        //   uses yytext: ..................... ${grammarSpec.lexerActionsUseYYTEXT}
        //   uses yylloc: ..................... ${grammarSpec.lexerActionsUseYYLOC}
        //   uses ParseError API: ............. ${grammarSpec.lexerActionsUseParseError}
        //   uses yyerror: .................... ${grammarSpec.lexerActionsUseYYERROR}
        //   uses location tracking & editing:  ${grammarSpec.lexerActionsUseLocationTracking}
        //   uses more() API: ................. ${grammarSpec.lexerActionsUseMore}
        //   uses unput() API: ................ ${grammarSpec.lexerActionsUseUnput}
        //   uses reject() API: ............... ${grammarSpec.lexerActionsUseReject}
        //   uses less() API: ................. ${grammarSpec.lexerActionsUseLess}
        //   uses display APIs pastInput(), upcomingInput(), showPosition():
        //        ............................. ${grammarSpec.lexerActionsUseDisplayAPIs}
        //   uses describeYYLLOC() API: ....... ${grammarSpec.lexerActionsUseDescribeYYLOC}
        //
        // --------- END OF REPORT -----------

    `);

    return new_src;
}





// generate lexer source from a grammar
/**  @public */
function generate(dict, tokens, build_options) {
    let grammarSpec = processGrammar(dict, tokens, build_options);

    return generateFromOpts(grammarSpec);
}

// process the grammar and build final data structures and functions
/**  @public */
function processGrammar(dict, tokens, build_options) {
    build_options = build_options || {};
    let grammarSpec = {
        // include the knowledge passed through `build_options` about which lexer
        // features will actually be *used* by the environment (which in 99.9%
        // of cases is a jison *parser*):
        //
        // (this stuff comes straight from the jison Optimization Analysis.)
        //
        parseActionsUseYYLENG: build_options.parseActionsUseYYLENG,
        parseActionsUseYYLINENO: build_options.parseActionsUseYYLINENO,
        parseActionsUseYYTEXT: build_options.parseActionsUseYYTEXT,
        parseActionsUseYYLOC: build_options.parseActionsUseYYLOC,
        parseActionsUseParseError: build_options.parseActionsUseParseError,
        parseActionsUseYYERROR: build_options.parseActionsUseYYERROR,
        parseActionsUseYYERROK: build_options.parseActionsUseYYERROK,
        parseActionsUseYYRECOVERING: build_options.parseActionsUseYYRECOVERING,
        parseActionsUseYYCLEARIN: build_options.parseActionsUseYYCLEARIN,
        parseActionsUseValueTracking: build_options.parseActionsUseValueTracking,
        parseActionsUseValueAssignment: build_options.parseActionsUseValueAssignment,
        parseActionsUseLocationTracking: build_options.parseActionsUseLocationTracking,
        parseActionsUseLocationAssignment: build_options.parseActionsUseLocationAssignment,
        parseActionsUseYYSTACK: build_options.parseActionsUseYYSTACK,
        parseActionsUseYYSSTACK: build_options.parseActionsUseYYSSTACK,
        parseActionsUseYYSTACKPOINTER: build_options.parseActionsUseYYSTACKPOINTER,
        parseActionsUseYYRULELENGTH: build_options.parseActionsUseYYRULELENGTH,
        parseActionsUseYYMERGELOCATIONINFO: build_options.parseActionsUseYYMERGELOCATIONINFO,
        parserHasErrorRecovery: build_options.parserHasErrorRecovery,
        parserHasErrorReporting: build_options.parserHasErrorReporting,

        lexerActionsUseYYLENG: '???',
        lexerActionsUseYYLINENO: '???',
        lexerActionsUseYYTEXT: '???',
        lexerActionsUseYYLOC: '???',
        lexerActionsUseParseError: '???',
        lexerActionsUseYYERROR: '???',
        lexerActionsUseLocationTracking: '???',
        lexerActionsUseMore: '???',
        lexerActionsUseUnput: '???',
        lexerActionsUseReject: '???',
        lexerActionsUseLess: '???',
        lexerActionsUseDisplayAPIs: '???',
        lexerActionsUseDescribeYYLOC: '???',
    };

    dict = autodetectAndConvertToJSONformat(dict, build_options) || {};

    // Feed the possibly reprocessed 'dictionary' above back to the caller
    // (for use by our error diagnostic assistance code)
    grammarSpec.lex_rule_dictionary = dict;
    grammarSpec.codeSections = dict.codeSections || [];     // [ array of {qualifier,include} pairs ]
    grammarSpec.importDecls = dict.importDecls || [];       // [ array of {name,path} pairs ] list of files with (partial?) symbol tables.
    grammarSpec.unknownDecls = dict.unknownDecls || [];     // [ array of {name,value} pairs ]

    // Always provide the lexer with an options object, even if it's empty!
    // Make sure to camelCase all options:
    grammarSpec.options = mkStdOptions(build_options, dict.options);

    grammarSpec.conditions = prepareStartConditions(dict.startConditions);
    grammarSpec.conditions.INITIAL = {
        rules: [],
        inclusive: true
    };

    // only produce rule action code blocks when there are any rules at all;
    // a "custom lexer" has ZERO rules and must be defined entirely in
    // other code blocks:
    let code = (dict.rules ? buildActions(dict, tokens, grammarSpec) : {});
    grammarSpec.performAction = code.actions;
    grammarSpec.caseHelperInclude = code.caseHelperInclude;
    grammarSpec.rules = code.rules || [];
    grammarSpec.macros = code.macros;

    grammarSpec.regular_rule_count = code.regular_rule_count;
    grammarSpec.simple_rule_count = code.simple_rule_count;

    grammarSpec.conditionStack = [ 'INITIAL' ];

    grammarSpec.actionInclude = (dict.actionInclude || '');
    let modIncSrc = (grammarSpec.moduleInclude || '') + '\n\n\n\n' + (dict.moduleInclude || '');
    grammarSpec.moduleInclude = modIncSrc.trimEnd();

    return grammarSpec;
}

// Assemble the final source from the processed grammar
/**  @public */
function generateFromOpts(grammarSpec) {
    let code = '';

    switch (grammarSpec.options.moduleType) {
    case 'js':
        code = generateModule(grammarSpec);
        break;
    case 'amd':
        code = generateAMDModule(grammarSpec);
        break;
    case 'es':
        code = generateESModule(grammarSpec);
        break;
    case 'commonjs':
        code = generateCommonJSModule(grammarSpec);
        break;
    default:
        throw new Error('unsupported moduleType: ' + grammarSpec.options.moduleType);
    }

    return code;
}

function generateRegexesInitTableCode(grammarSpec) {
    let a = grammarSpec.rules;
    let print_xregexp = grammarSpec.options && grammarSpec.options.xregexp;
    let id_display_width = (1 + Math.log10(a.length | 1) | 0);
    let ws_prefix = new Array(id_display_width).join(' ');
    let b = a.map(function generateXRegExpInitCode(re, idx) {
        let idx_str = (ws_prefix + idx).substr(-id_display_width);

        if (re instanceof XRegExp__default['default']) {
            // When we don't need the special XRegExp sauce at run-time, we do with the original
            // JavaScript RegExp instance a.k.a. 'native regex':
            if (re.xregexp.isNative || !print_xregexp) {
                return `/* ${idx_str}: */  ${re}`;
            }
            // And make sure to escape the regex to make it suitable for placement inside a *string*
            // as it is passed as a string argument to the XRegExp constructor here.
            let re_src = re.xregexp.source.replace(/[\\"]/g, '\\$&');
            return `/* ${idx_str}: */  new XRegExp("${re_src}", "${re.xregexp.flags}")`;
        }
        return `/* ${idx_str}: */  ${re}`;

    });
    return b.join(',\n');
}

function generateModuleBody(grammarSpec) {
    // make the JSON output look more like JavaScript:
    function cleanupJSON(str) {
        str = str.replace(/ {2}"rules": \[/g, '  rules: [');
        str = str.replace(/ {2}"inclusive": /g, '  inclusive: ');
        return str;
    }

    function produceOptions(opts) {
        let obj = {};
        const do_not_pass = {
            debug: !opts.debug,     // do not include this item when it is FALSE as there's no debug tracing built into the generated grammar anyway!
            enableDebugLogs: 1,
            json: 1,
            _: 1,
            noMain: 1,
            dumpSourceCodeOnFailure: 1,
            throwErrorOnCompileFailure: 1,
            doNotTestCompile: 1,
            reportStats: 1,
            file: 1,
            outfile: 1,
            inputPath: 1,
            inputFilename: 1,
            defaultModuleName: 1,
            moduleName: 1,
            moduleType: 1,
            lexerErrorsAreRecoverable: 0,
            flex: 0,
            backtrack_lexer: 0,
            caseInsensitive: 0,
            showSource: 1,
            exportAST: 1,
            exportAllTables: 1,
            exportSourceCode: 1,
            prettyCfg: 1,
            parseActionsUseYYLENG: 1,
            parseActionsUseYYLINENO: 1,
            parseActionsUseYYTEXT: 1,
            parseActionsUseYYLOC: 1,
            parseActionsUseParseError: 1,
            parseActionsUseYYERROR: 1,
            parseActionsUseYYRECOVERING: 1,
            parseActionsUseYYERROK: 1,
            parseActionsUseYYCLEARIN: 1,
            parseActionsUseValueTracking: 1,
            parseActionsUseValueAssignment: 1,
            parseActionsUseLocationTracking: 1,
            parseActionsUseLocationAssignment: 1,
            parseActionsUseYYSTACK: 1,
            parseActionsUseYYSSTACK: 1,
            parseActionsUseYYSTACKPOINTER: 1,
            parseActionsUseYYRULELENGTH: 1,
            parseActionsUseYYMERGELOCATIONINFO: 1,
            parserHasErrorRecovery: 1,
            parserHasErrorReporting: 1,
            lexerActionsUseYYLENG: 1,
            lexerActionsUseYYLINENO: 1,
            lexerActionsUseYYTEXT: 1,
            lexerActionsUseYYLOC: 1,
            lexerActionsUseParseError: 1,
            lexerActionsUseYYERROR: 1,
            lexerActionsUseLocationTracking: 1,
            lexerActionsUseMore: 1,
            lexerActionsUseUnput: 1,
            lexerActionsUseReject: 1,
            lexerActionsUseLess: 1,
            lexerActionsUseDisplayAPIs: 1,
            lexerActionsUseDescribeYYLOC: 1
        };
        for (let k in opts) {
            if (!do_not_pass[k] && opts[k] != null && opts[k] !== false) {
                // make sure numeric values are encoded as numeric, the rest as boolean/string.
                if (typeof opts[k] === 'string') {
                    let f = parseFloat(opts[k]);
                    if (f == opts[k]) {
                        obj[k] = f;
                        continue;
                    }
                }
                obj[k] = opts[k];
            }
        }

        // And now some options which should receive some special processing:
        let pre = obj.pre_lex;
        let post = obj.post_lex;
        // since JSON cannot encode functions, we'll have to do it manually at run-time, i.e. later on:
        if (pre) {
            obj.pre_lex = true;
        }
        if (post) {
            obj.post_lex = true;
        }

        let js = JSON.stringify(obj, null, 2);

        js = js.replace(new XRegExp__default['default'](`  "(${ID_REGEX_BASE$1})": `, 'g'), '  $1: ');
        js = js.replace(/^( +)pre_lex: true(,)?$/gm, function (m, ls, tc) {
            return ls + 'pre_lex: ' + String(pre) + (tc || '');
        });
        js = js.replace(/^( +)post_lex: true(,)?$/gm, function (m, ls, tc) {
            return ls + 'post_lex: ' + String(post) + (tc || '');
        });
        return js;
    }


    let out;
    if (grammarSpec.rules.length > 0 || grammarSpec.__in_rules_failure_analysis_mode__) {
        // we don't mind that the `test_me()` code above will have this `lexer` variable re-defined:
        // JavaScript is fine with that.
        let code = [ rmCommonWS$3`
            const lexer = {
              `, '/* JISON-LEX-ANALYTICS-REPORT */\n' /* slot #1: placeholder for analysis report further below */
        ];

        // get the RegExpLexer.prototype in source code form:
        let protosrc = getRegExpLexerPrototype();
        code.push(protosrc + ',\n');

        assert__default['default'](grammarSpec.options);
        // Assure all options are camelCased:
        assert__default['default'](typeof grammarSpec.options['case-insensitive'] === 'undefined');

        code.push('    options: ' + produceOptions(grammarSpec.options));

        let performActionCode = String(grammarSpec.performAction);
        let simpleCaseActionClustersCode = String(grammarSpec.caseHelperInclude);
        let rulesCode = generateRegexesInitTableCode(grammarSpec);
        let conditionsCode = cleanupJSON(JSON.stringify(grammarSpec.conditions, null, 2));
        code.push(rmCommonWS$3`,
            JisonLexerError: JisonLexerError,
            performAction: ${performActionCode},
            simpleCaseActionClusters: ${simpleCaseActionClustersCode},
            rules: [
                ${rulesCode}
            ],
            conditions: ${conditionsCode}
        };
        `);

        grammarSpec.is_custom_lexer = false;

        out = code.join('');
    } else {
        // We're clearly looking at a custom lexer here as there's no lexer rules at all.
        //
        // We are re-purposing the `%{...%}` `actionInclude` code block here as it serves no purpose otherwise.
        //
        // Try to make sure we have the `lexer` variable declared in *local scope* no matter
        // what crazy stuff (or lack thereof) the userland code is pulling in the `actionInclude` chunk.
        out = '\n';

        assert__default['default'](grammarSpec.regular_rule_count === 0);
        assert__default['default'](grammarSpec.simple_rule_count === 0);
        grammarSpec.is_custom_lexer = true;

        if (grammarSpec.actionInclude) {
            out += grammarSpec.actionInclude + (!grammarSpec.actionInclude.match(/;[\s\r\n]*$/) ? ';' : '') + '\n';
        }
    }

    // The output of this function is guaranteed to read something like this:
    //
    // ```
    // bla bla bla bla ... lotsa bla bla;
    // ```
    //
    // and that should work nicely as an `eval()`-able piece of source code.
    return out;
}

function generateGenericHeaderComment() {
    let out = rmCommonWS$3`
    /* lexer generated by jison-lex ${version} */

    /*
     * Returns a Lexer object of the following structure:
     *
     *  Lexer: {
     *    yy: {}     The so-called "shared state" or rather the *source* of it;
     *               the real "shared state" \`yy\` passed around to
     *               the rule actions, etc. is a direct reference!
     *
     *               This "shared context" object was passed to the lexer by way of
     *               the \`lexer.setInput(str, yy)\` API before you may use it.
     *
     *               This "shared context" object is passed to the lexer action code in \`performAction()\`
     *               so userland code in the lexer actions may communicate with the outside world
     *               and/or other lexer rules' actions in more or less complex ways.
     *
     *  }
     *
     *  Lexer.prototype: {
     *    EOF: 1,
     *    ERROR: 2,
     *
     *    yy:        The overall "shared context" object reference.
     *
     *    JisonLexerError: function(msg, hash),
     *
     *    performAction: function lexer__performAction(yy, yyrulenumber, YY_START),
     *
     *               The function parameters and \`this\` have the following value/meaning:
     *               - \`this\`    : reference to the \`lexer\` instance.
     *                               \`yy_\` is an alias for \`this\` lexer instance reference used internally.
     *
     *               - \`yy\`      : a reference to the \`yy\` "shared state" object which was passed to the lexer
     *                             by way of the \`lexer.setInput(str, yy)\` API before.
     *
     *                             Note:
     *                             The extra arguments you specified in the \`%parse-param\` statement in your
     *                             **parser** grammar definition file are passed to the lexer via this object
     *                             reference as member variables.
     *
     *               - \`yyrulenumber\`   : index of the matched lexer rule (regex), used internally.
     *
     *               - \`YY_START\`: the current lexer "start condition" state.
     *
     *    parseError: function(str, hash, ExceptionClass),
     *
     *    constructLexErrorInfo: function(error_message, is_recoverable),
     *               Helper function.
     *               Produces a new errorInfo \'hash object\' which can be passed into \`parseError()\`.
     *               See it\'s use in this lexer kernel in many places; example usage:
     *
     *                   let infoObj = lexer.constructParseErrorInfo(\'fail!\', true);
     *                   let retVal = lexer.parseError(infoObj.errStr, infoObj, lexer.JisonLexerError);
     *
     *    options: { ... lexer %options ... },
     *
     *    lex: function(),
     *               Produce one token of lexed input, which was passed in earlier via the \`lexer.setInput()\` API.
     *               You MAY use the additional \`args...\` parameters as per \`%parse-param\` spec of the **lexer** grammar:
     *               these extra \`args...\` are added verbatim to the \`yy\` object reference as member variables.
     *
     *               WARNING:
     *               Lexer's additional \`args...\` parameters (via lexer's \`%parse-param\`) MAY conflict with
     *               any attributes already added to \`yy\` by the **parser** or the jison run-time;
     *               when such a collision is detected an exception is thrown to prevent the generated run-time
     *               from silently accepting this confusing and potentially hazardous situation!
     *
     *    cleanupAfterLex: function(),
     *               Helper function.
     *
     *               This helper API is invoked when the **parse process** has completed: it is the responsibility
     *               of the **parser** (or the calling userland code) to invoke this method once cleanup is desired.
     *
     *               This helper may be invoked by user code to ensure the internal lexer gets properly garbage collected.
     *
     *    setInput: function(input, [yy]),
     *
     *
     *    input: function(),
     *
     *
     *    unput: function(str),
     *
     *
     *    more: function(),
     *
     *
     *    reject: function(),
     *
     *
     *    less: function(n),
     *
     *
     *    pastInput: function(n),
     *
     *
     *    upcomingInput: function(n),
     *
     *
     *    showPosition: function(),
     *
     *
     *    test_match: function(regex_match_array, rule_index),
     *
     *
     *    next: function(),
     *
     *
     *    begin: function(condition),
     *
     *
     *    pushState: function(condition),
     *
     *
     *    popState: function(),
     *
     *
     *    topState: function(),
     *
     *
     *    _currentRules: function(),
     *
     *
     *    stateStackSize: function(),
     *
     *
     *    performAction: function(yy, yy_, yyrulenumber, YY_START),
     *
     *
     *    rules: [...],
     *
     *
     *    conditions: {associative list: name ==> set},
     *  }
     *
     *
     *  token location info (\`yylloc\`): {
     *    first_line: n,
     *    last_line: n,
     *    first_column: n,
     *    last_column: n,
     *    range: [start_number, end_number]
     *               (where the numbers are indexes into the input string, zero-based)
     *  }
     *
     * ---
     *
     * The \`parseError\` function receives a \'hash\' object with these members for lexer errors:
     *
     *  {
     *    text:        (matched text)
     *    token:       (the produced terminal token, if any)
     *    token_id:    (the produced terminal token numeric ID, if any)
     *    line:        (yylineno)
     *    loc:         (yylloc)
     *    recoverable: (boolean: TRUE when the parser MAY have an error recovery rule
     *                  available for this particular error)
     *    yy:          (object: the current parser internal "shared state" \`yy\`
     *                  as is also available in the rule actions; this can be used,
     *                  for instance, for advanced error analysis and reporting)
     *    lexer:       (reference to the current lexer instance used by the parser)
     *  }
     *
     * while \`this\` will reference the current lexer instance.
     *
     * When \`parseError\` is invoked by the lexer, the default implementation will
     * attempt to invoke \`yy.parser.parseError()\`; when this callback is not provided
     * it will try to invoke \`yy.parseError()\` instead. When that callback is also not
     * provided, a \`JisonLexerError\` exception will be thrown containing the error
     * message and \`hash\`, as constructed by the \`constructLexErrorInfo()\` API.
     *
     * Note that the lexer\'s \`JisonLexerError\` error class is passed via the
     * \`ExceptionClass\` argument, which is invoked to construct the exception
     * instance to be thrown, so technically \`parseError\` will throw the object
     * produced by the \`new ExceptionClass(str, hash)\` JavaScript expression.
     *
     * ---
     *
     * You can specify lexer options by setting / modifying the \`.options\` object of your Lexer instance.
     * These options are available:
     *
     * (Options are permanent.)
     *
     *  yy: {
     *      parseError: function(str, hash, ExceptionClass)
     *                 optional: overrides the default \`parseError\` function.
     *  }
     *
     *  lexer.options: {
     *      pre_lex:  function()
     *                 optional: is invoked before the lexer is invoked to produce another token.
     *                 \`this\` refers to the Lexer object.
     *      post_lex: function(token) { return token; }
     *                 optional: is invoked when the lexer has produced a token \`token\`;
     *                 this function can override the returned token value by returning another.
     *                 When it does not return any (truthy) value, the lexer will return
     *                 the original \`token\`.
     *                 \`this\` refers to the Lexer object.
     *
     * WARNING: the next set of options are not meant to be changed. They echo the abilities of
     * the lexer as per when it was compiled!
     *
     *      ranges: boolean
     *                 optional: \`true\` ==> token location info will include a .range[] member.
     *      flex: boolean
     *                 optional: \`true\` ==> flex-like lexing behaviour where the rules are tested
     *                 exhaustively to find the longest match.
     *      backtrack_lexer: boolean
     *                 optional: \`true\` ==> lexer regexes are tested in order and for invoked;
     *                 the lexer terminates the scan when a token is returned by the action code.
     *      xregexp: boolean
     *                 optional: \`true\` ==> lexer rule regexes are "extended regex format" requiring the
     *                 \`XRegExp\` library. When this %option has not been specified at compile time, all lexer
     *                 rule regexes have been written as standard JavaScript RegExp expressions.
     *  }
     */
     `;

    return out;
}

function prepareOptions(grammarSpec) {
    grammarSpec = grammarSpec || {};

    // check for illegal identifier
    let moduleName = grammarSpec.options.moduleName;
    if (!moduleName || !moduleName.match(/^[a-zA-Z_$][a-zA-Z0-9_$\.]*$/)) {
        if (moduleName) {
            let msg = `WARNING: The specified moduleName "${moduleName}" is illegal (only characters [a-zA-Z0-9_$] and "." dot are accepted); using the default moduleName "lexer" instead.`;
            if (typeof grammarSpec.warn_cb === 'function') {
                grammarSpec.warn_cb(msg);
            } else if (grammarSpec.warn_cb) {
                console.error(msg);
            } else {
                // do not treat as warning; barf hairball instead so that this oddity gets noticed right away!
                throw new Error(msg);
            }
        }
        grammarSpec.options.moduleName = 'lexer';
    }

    prepExportStructures(grammarSpec.options);

    return grammarSpec;
}

function generateModule(grammarSpec) {
    grammarSpec = prepareOptions(grammarSpec);
    let modIncSrc = grammarSpec.moduleInclude || '';

    let src = rmCommonWS$3`
        ${generateGenericHeaderComment()}

        const ${grammarSpec.options.moduleName} = (function () {
            "use strict";

            ${getInitCodeSection(grammarSpec.codeSections, 'imports')}
            ${getInitCodeSection(grammarSpec.codeSections, 'init')}

            ${jisonLexerErrorDefinition}

            ${getInitCodeSection(grammarSpec.codeSections, 'required')}

            ${generateModuleBody(grammarSpec)}

            ${getRemainingInitCodeSections(grammarSpec.codeSections, grammarSpec)}

            ${modIncSrc}

            return lexer;
        })();
    `;

    src = stripUnusedLexerCode(src, grammarSpec);
    grammarSpec.options.exportSourceCode.all = src;
    return src;
}

function generateAMDModule(grammarSpec) {
    grammarSpec = prepareOptions(grammarSpec);
    let modIncSrc = grammarSpec.moduleInclude || '';

    let src = rmCommonWS$3`
        ${generateGenericHeaderComment()}

        define([], function () {
            "use strict";

            ${getInitCodeSection(grammarSpec.codeSections, 'imports')}
            ${getInitCodeSection(grammarSpec.codeSections, 'init')}

            ${jisonLexerErrorDefinition}

            ${getInitCodeSection(grammarSpec.codeSections, 'required')}

            ${generateModuleBody(grammarSpec)}

            ${getRemainingInitCodeSections(grammarSpec.codeSections, grammarSpec)}

            ${modIncSrc}

            return lexer;
        });
    `;

    src = stripUnusedLexerCode(src, grammarSpec);
    grammarSpec.options.exportSourceCode.all = src;
    return src;
}

function generateESModule(grammarSpec) {
    grammarSpec = prepareOptions(grammarSpec);
    let modIncSrc = grammarSpec.moduleInclude || '';
    let moduleNameAsCode = '';
    let moduleImportsAsCode = '';
    let exportMain = '';
    let invokeMain = '';
    if (!grammarSpec.options.noMain) {
        moduleNameAsCode = String(grammarSpec.options.moduleMain || commonJsMain);
        moduleImportsAsCode = String(grammarSpec.options.moduleMainImports || commonES6MainImports);

        exportMain = rmCommonWS$3`
            yymain,
            yyExecMain as main,
        `;
        
        invokeMain = rmCommonWS$3`
            const yymain = ${moduleNameAsCode.trim()};

            function yyExecMain() {
              yymain(process.argv.slice(1));
            }

            // IFF this is the main module executed by NodeJS,
            // then run 'main()' immediately:
            if (typeof module !== 'undefined') {
              yyExecMain();
            }
        `;
    }

    let src = rmCommonWS$3`
        ${generateGenericHeaderComment()}

        ${moduleImportsAsCode}

        ${getInitCodeSection(grammarSpec.codeSections, 'imports')}

        const lexer = (function () {
            "use strict";

            ${getInitCodeSection(grammarSpec.codeSections, 'init')}

            ${jisonLexerErrorDefinition}

            ${getInitCodeSection(grammarSpec.codeSections, 'required')}

            ${generateModuleBody(grammarSpec)}

            ${getRemainingInitCodeSections(grammarSpec.codeSections, grammarSpec)}

            ${modIncSrc}

            return lexer;
        })();

        function yylex() {
            return lexer.lex.apply(lexer, arguments);
        }

        ${invokeMain}

        export {
            lexer,
            yylex as lex,
            ${exportMain}
        };
    `;

    src = stripUnusedLexerCode(src, grammarSpec);
    grammarSpec.options.exportSourceCode.all = src;
    return src;
}

function generateCommonJSModule(grammarSpec) {
    grammarSpec = prepareOptions(grammarSpec);
    let modIncSrc = grammarSpec.moduleInclude || '';
    let moduleNameAsCode = '';
    let moduleImportsAsCode = '';
    let main = '';
    let moduleName = grammarSpec.options.moduleName;
    if (!grammarSpec.options.noMain) {
        moduleNameAsCode = String(grammarSpec.options.moduleMain || commonJsMain);
        moduleImportsAsCode = String(grammarSpec.options.moduleMainImports || commonJsMainImports);

        main = rmCommonWS$3`
            if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
                exports.main = ${moduleNameAsCode.trim()};

                // IFF this is the main module executed by NodeJS,
                // then run 'main()' immediately:
                if (typeof module !== 'undefined' && require.main === module) {
                  exports.main(process.argv.slice(1));
                }
            }
        `;
    }

    let src = rmCommonWS$3`
        ${generateGenericHeaderComment()}

        ${moduleImportsAsCode}

        ${getInitCodeSection(grammarSpec.codeSections, 'imports')}

        const ${moduleName} = (function () {
            "use strict";

            ${getInitCodeSection(grammarSpec.codeSections, 'init')}

            ${jisonLexerErrorDefinition}

            ${getInitCodeSection(grammarSpec.codeSections, 'required')}

            ${generateModuleBody(grammarSpec)}

            ${getRemainingInitCodeSections(grammarSpec.codeSections, grammarSpec)}

            ${modIncSrc}

            return lexer;
        })();

        if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
            exports.lexer = ${moduleName};
            exports.lex = function () {
                return ${moduleName}.lex.apply(lexer, arguments);
            };
        }

        ${main}
    `;

    src = stripUnusedLexerCode(src, grammarSpec);
    grammarSpec.options.exportSourceCode.all = src;
    return src;
}

RegExpLexer.generate = generate;

RegExpLexer.version = version;
RegExpLexer.defaultJisonLexOptions = defaultJisonLexOptions;
RegExpLexer.mkStdOptions = mkStdOptions;
RegExpLexer.camelCase = helpers.camelCase;
RegExpLexer.mkIdentifier = mkIdentifier$2;
RegExpLexer.autodetectAndConvertToJSONformat = autodetectAndConvertToJSONformat;

const mkIdentifier$3 = helpers.mkIdentifier;
const mkdirp$1 = helpers.mkdirp;


assert__default['default'](RegExpLexer);
assert__default['default'](RegExpLexer.defaultJisonLexOptions);
assert__default['default'](typeof RegExpLexer.mkStdOptions === 'function');


const version$1 = '0.7.0-220';                              // require('./package.json').version;


function getCommandlineOptions() {
    const defaults = RegExpLexer.defaultJisonLexOptions;
    let opts = nomnom__default['default']
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
                choices: [ 'commonjs', 'amd', 'js', 'es' ],
                help: 'The type of module to generate (commonjs, amd, es, js)'
            },
            moduleName: {
                full: 'module-name',
                abbr: 'n',
                metavar: 'NAME',
                help: 'The name of the generated parser object, namespace supported.'
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
                            let src = fs__default['default'].readFileSync(val, "utf8");
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
            version: {
                abbr: 'V',
                flag: true,
                help: 'Print version and exit.',
                callback: function () {
                    console.log(version$1);
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
            return fs__default['default'].lstatSync(fp).isDirectory();
        } catch (e) {
            return false;
        }
    }

    function processInputFile() {
        let original_cwd = process.cwd();

        try {
            let raw = fs__default['default'].readFileSync(path__default['default'].normalize(opts.file), 'utf8');

            // making best guess at json mode
            opts.json = (path__default['default'].extname(opts.file) === '.json' || opts.json);

            // When only the directory part of the output path was specified, then we
            // do NOT have the target module name in there as well!
            let outpath = opts.outfile;
            if (typeof outpath === 'string') {
                if (/[\\\/]$/.test(outpath) || isDirectory(outpath)) {
                    opts.outfile = null;
                    outpath = outpath.replace(/[\\\/]$/, '');
                } else {
                    outpath = path__default['default'].dirname(outpath);
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
            let name = path__default['default'].basename(opts.outfile || opts.file);

            // get the base name (i.e. the file name without extension)
            // i.e. strip off only the extension and keep any other dots in the filename
            name = path__default['default'].basename(name, path__default['default'].extname(name));

            opts.outfile = opts.outfile || (outpath + name + '.js');
            if (!opts.moduleName && name) {
                opts.moduleName = opts.defaultModuleName = mkIdentifier$3(name);
            }

            // Change CWD to the directory where the source grammar resides: this helps us properly
            // %include any files mentioned in the grammar with relative paths:
            let new_cwd = path__default['default'].dirname(path__default['default'].normalize(opts.file));
            process.chdir(new_cwd);

            opts.outfile = path__default['default'].normalize(opts.outfile);
            mkdirp$1(path__default['default'].dirname(opts.outfile));

            let lexer = cli.generateLexerString(raw, opts);

            // and change back to the CWD we started out with:
            process.chdir(original_cwd);

            fs__default['default'].writeFileSync(opts.outfile, lexer);
            console.log('JISON-LEX output for module [' + opts.moduleName + '] has been written to file:', opts.outfile);
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
            console.log(cli.generateLexerString(raw, opts));
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


if (require.main === module) {
    const opts = getCommandlineOptions();
    cli.main(opts);
}

module.exports = cli;
