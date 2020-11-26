// Basic Lexer implemented using JavaScript regular expressions
// Zachary Carter <zach@carter.name>
// MIT Licensed

import XRegExp from '@gerhobbelt/xregexp';
import JSON5 from '@gerhobbelt/json5';
import lexParser from '../lex-parser';
import setmgmt from './regexp-set-management.js';
import helpers from '../helpers-lib';
const rmCommonWS = helpers.rmCommonWS;
const mkIdentifier = helpers.mkIdentifier;
const code_exec = helpers.exec;
// import recast from 'recast';
// import astUtils from 'ast-util';
import assert from 'assert';

const version = '0.7.0-220';                              // require('./package.json').version;



function chkBugger(src) {
    src = '' + src;
    if (src.match(/\bcov_\w+/)) {
        console.error('### ISTANBUL COVERAGE CODE DETECTED ###\n', src);
    }
}



const XREGEXP_UNICODE_ESCAPE_RE = setmgmt.XREGEXP_UNICODE_ESCAPE_RE;              // Matches the XRegExp Unicode escape braced part, e.g. `{Number}`
const CHR_RE = setmgmt.CHR_RE;
const SET_PART_RE = setmgmt.SET_PART_RE;
const NOTHING_SPECIAL_RE = setmgmt.NOTHING_SPECIAL_RE;
const UNICODE_BASE_PLANE_MAX_CP = setmgmt.UNICODE_BASE_PLANE_MAX_CP;

// The expanded regex sets which are equivalent to the given `\\{c}` escapes:
//
// `/\s/`:
const WHITESPACE_SETSTR = setmgmt.WHITESPACE_SETSTR;
// `/\d/`:
const DIGIT_SETSTR = setmgmt.DIGIT_SETSTR;
// `/\w/`:
const WORDCHAR_SETSTR = setmgmt.WORDCHAR_SETSTR;

// WARNING: this regex MUST match the regex for `ID` in ebnf-parser::bnf.l jison language lexer spec! (`ID = [{ALPHA}]{ALNUM}*`)
//
// This is the base XRegExp ID regex used in many places; this should match the ID macro definition in the EBNF/BNF parser et al as well!
const ID_REGEX_BASE = '[\\p{Alphabetic}_][\\p{Alphabetic}_\\p{Number}]*';




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
                o2[mkIdentifier(p)] = o[p];
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
                chk_l = JSON5.parse(lexerSpec);

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
    assert(Array.isArray(dict.rules));
    let rules = dict.rules.slice(0);    // shallow copy of the rules array as we MAY modify it in here!
    let newRules = [];
    let macros = {};
    let regular_rule_count = 0;
    let simple_rule_count = 0;

    // Assure all options are camelCased:
    assert(typeof grammarSpec.options['case-insensitive'] === 'undefined');

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
            m = new XRegExp('^(?:' + m + ')', grammarSpec.options.caseInsensitive ? 'i' : '');
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
        c1 = s.match(CHR_RE);
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
            let l = new Array(UNICODE_BASE_PLANE_MAX_CP + 1);

            while (s.length) {
                let inner = s.match(SET_PART_RE);
                if (!inner) {
                    inner = s.match(CHR_RE);
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
            c2 = s.match(CHR_RE);
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
                assert(se);
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
            c2 = s.match(XREGEXP_UNICODE_ESCAPE_RE);
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
            c2 = s.match(NOTHING_SPECIAL_RE);
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
                        assert(c2);
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
            c2 = s.match(NOTHING_SPECIAL_RE);
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
        re = new XRegExp(s);
        re.test(s[0]);
    } catch (ex) {
        // make sure we produce a regex expression which will fail badly when it is used
        // in actual code:
        return new Error(errinfo() + ': expands to an invalid regex: /' + s + '/');
    }

    assert(s);
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
                        if (XRegExp._getUnicodeProperty(k)) {
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
                            assert(x);
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
        let k, a, m;

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
                        assert(x);
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
                        assert(x);
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


    let m, i;

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

                        assert(x);
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
                        assert(x);

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
        return rmCommonWS`

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

                const msg = rmCommonWS`
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

            rv.push(rmCommonWS`

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

    if (msg == null) msg = '???';

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
        if (Error.hasOwnProperty('captureStackTrace')) { // V8
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
    Object.setPrototypeOf(JisonLexerError.prototype, Error.prototype);
} else {
    JisonLexerError.prototype = Object.create(Error.prototype);
}
JisonLexerError.prototype.constructor = JisonLexerError;
JisonLexerError.prototype.name = 'JisonLexerError';`;

    // --- END lexer error class ---

    return prelude;
}


const jisonLexerErrorDefinition = generateErrorClass();


function generateFakeXRegExpClassSrcCode() {
    return rmCommonWS`
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
        assert(grammarSpec.options);
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
                rmCommonWS`
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
                chkBugger(sourcecode);
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
        assert(grammarSpec.options);
        assert(grammarSpec.options.xregexp !== undefined);
        let orig_xregexp_opt = !!grammarSpec.options.xregexp;
        if (!test_me(function () {
            assert(grammarSpec.options.xregexp !== undefined);
            grammarSpec.options.xregexp = false;
            grammarSpec.showSource = false;
        }, 'When you have specified %option xregexp, you must also properly IMPORT the XRegExp library in the generated lexer.', ex, null)) {
            if (!test_me(function () {
                // restore xregexp option setting: the trouble wasn't caused by the xregexp flag i.c.w. incorrect XRegExp library importing!
                grammarSpec.options.xregexp = orig_xregexp_opt;

                grammarSpec.conditions = [];
                grammarSpec.showSource = false;
            }, function () {
                assert(Array.isArray(grammarSpec.rules));
                return (grammarSpec.rules.length > 0 ?
                    'One or more of your lexer state names are possibly botched?' :
                    'Your custom lexer is somehow botched.'
                );
            }, ex, null)) {
                let rulesSpecSize;
                if (!test_me(function () {
                    // store the parsed rule set size so we can use that info in case
                    // this attempt also fails:
                    assert(Array.isArray(grammarSpec.rules));
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
                            assert(Array.isArray(grammarSpec.rules));
                            assert(grammarSpec.rules.length === rulesSpecSize);

                            // grammarSpec.conditions = [];
                            // grammarSpec.rules = [];
                            // grammarSpec.__in_rules_failure_analysis_mode__ = true;

                            // nuke all rules' actions up to and including rule numero `i`:
                            for (let j = 0; j <= i; j++) {
                                // rules, when parsed, have 2 or 3 elements: [conditions, handle, action];
                                // now we want to edit the *action* part:
                                let rule = grammarSpec.rules[j];
                                assert(Array.isArray(rule));
                                assert(rule.length === 2 || rule.length === 3);
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
    yyerror: function yyError(str /*, ...args */) {
        let lineno_msg = 'Lexical error';
        if (this.yylloc) {
            lineno_msg += ' on line ' + (this.yylineno + 1);
        }
        const p = this.constructLexErrorInfo(lineno_msg + ': ' + str, this.options.lexerErrorsAreRecoverable);

        // Add any extra args to the hash under the name \`extra_error_attributes\`:
        let args = Array.prototype.slice.call(arguments, 1);
        if (args.length) {
            p.extra_error_attributes = args;
        }

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

            let token = (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
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

    function main_work_function(input) {
        const lexer = exports.lexer;

        let yy = {
            parseError: function customMainParseError(str, hash, ExceptionClass) {
                console.error("parseError: ", str);
                return this.ERROR;
            }
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


chkBugger(getRegExpLexerPrototype());
RegExpLexer.prototype = (new Function(rmCommonWS`
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
        let ast = helpers.parseCodeChunkToAST(src, grammarSpec.options.prettyCfg);
        new_src = helpers.prettyPrintAST(ast, grammarSpec.options.prettyCfg);
    } catch (ex) {
        let line = ex.lineNumber || 0;
        let a = src.split(/\r?\n/g);
        let len = a.length;
        let minl = Math.max(0, line - 10);
        let b = a.slice(minl, line + 10);
        let c = b.splice(line - minl, 0, '', '^^^^^^^^^^^ source line above is reported as erroneous ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^', '');
        let offendingChunk = '        ' + b.join('\n        ');
        console.error(rmCommonWS`
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


    if (0) {
        this.actionsUseYYLENG = analyzeFeatureUsage(this.performAction, /\byyleng\b/g, 1);
        this.actionsUseYYLINENO = analyzeFeatureUsage(this.performAction, /\byylineno\b/g, 1);
        this.actionsUseYYTEXT = analyzeFeatureUsage(this.performAction, /\byytext\b/g, 1);
        this.actionsUseYYLOC = analyzeFeatureUsage(this.performAction, /\byyloc\b/g, 1);
        this.actionsUseParseError = analyzeFeatureUsage(this.performAction, /\.parseError\b/g, 0);

        this.actionsUseValueTracking = analyzeFeatureUsage(this.performAction, /\byyvstack\b/g, 1);
        // Ditto for the specific case where we are assigning a value to `$$`, i.e. `this.$`:
        this.actionsUseValueAssignment = analyzeFeatureUsage(this.performAction, /\bthis\.\$[^\w]/g, 0);
        // Ditto for the expansion of `@name`, `@$` and `@n` to its `yylstack[n]` index expression:
        this.actionsUseLocationTracking = analyzeFeatureUsage(this.performAction, /\byylstack\b/g, 1);
        // Ditto for the specific case where we are assigning a value to `@$`, i.e. `this._$`:
        this.actionsUseLocationAssignment = analyzeFeatureUsage(this.performAction, /\bthis\._\$[^\w]/g, 0);
        // Note that the `#name`, `#$` and `#n` constructs are expanded directly to their symbol number without
        // the need to use yystack! Hence yystack is only there for very special use action code.)


        if (this.DEBUG) {
            console.log('Optimization analysis: ', {
                actionsUseYYLENG: this.actionsUseYYLENG,
                actionsUseYYLINENO: this.actionsUseYYLINENO,
                actionsUseYYTEXT: this.actionsUseYYTEXT,
                actionsUseYYLOC: this.actionsUseYYLOC,
                actionsUseParseError: this.actionsUseParseError,
                actionsUseYYERROR: this.actionsUseYYERROR,
                actionsUseYYRECOVERING: this.actionsUseYYRECOVERING,
                actionsUseYYERROK: this.actionsUseYYERROK,
                actionsUseYYCLEARIN: this.actionsUseYYCLEARIN,
                actionsUseValueTracking: this.actionsUseValueTracking,
                actionsUseValueAssignment: this.actionsUseValueAssignment,
                actionsUseLocationTracking: this.actionsUseLocationTracking,
                actionsUseLocationAssignment: this.actionsUseLocationAssignment,
                actionsUseYYSTACK: this.actionsUseYYSTACK,
                actionsUseYYSSTACK: this.actionsUseYYSSTACK,
                actionsUseYYSTACKPOINTER: this.actionsUseYYSTACKPOINTER,
                hasErrorRecovery: this.hasErrorRecovery,
                hasErrorReporting: this.hasErrorReporting,
                defaultActionMode: this.options.defaultActionMode,
                noTryCatch: this.options.noTryCatch
            });
        }


        function analyzeFeatureUsage(sourcecode, feature, threshold) {
            let found = sourcecode.match(feature);
            return !!(found && found.length > threshold);
        }
    }


    // inject analysis report now:
    new_src = new_src.replace(/\/\*\s*JISON-LEX-ANALYTICS-REPORT\s*\*\//g, rmCommonWS`
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
    grammarSpec.moduleInclude = (grammarSpec.moduleInclude || '') + (dict.moduleInclude || '').trim();

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

        if (re instanceof XRegExp) {
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

        js = js.replace(new XRegExp(`  "(${ID_REGEX_BASE})": `, 'g'), '  $1: ');
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
        let code = [ rmCommonWS`
            const lexer = {
              `, '/* JISON-LEX-ANALYTICS-REPORT */\n' /* slot #1: placeholder for analysis report further below */
        ];

        // get the RegExpLexer.prototype in source code form:
        let protosrc = getRegExpLexerPrototype();
        code.push(protosrc + ',\n');

        assert(grammarSpec.options);
        // Assure all options are camelCased:
        assert(typeof grammarSpec.options['case-insensitive'] === 'undefined');

        code.push('    options: ' + produceOptions(grammarSpec.options));

        let performActionCode = String(grammarSpec.performAction);
        let simpleCaseActionClustersCode = String(grammarSpec.caseHelperInclude);
        let rulesCode = generateRegexesInitTableCode(grammarSpec);
        let conditionsCode = cleanupJSON(JSON.stringify(grammarSpec.conditions, null, 2));
        code.push(rmCommonWS`,
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

        assert(grammarSpec.regular_rule_count === 0);
        assert(grammarSpec.simple_rule_count === 0);
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
    let out = rmCommonWS`
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
    let modIncSrc = (grammarSpec.moduleInclude ? grammarSpec.moduleInclude + ';' : '');

    let src = rmCommonWS`
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
    let modIncSrc = (grammarSpec.moduleInclude ? grammarSpec.moduleInclude + ';' : '');

    let src = rmCommonWS`
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
    let modIncSrc = (grammarSpec.moduleInclude ? grammarSpec.moduleInclude + ';' : '');
    let moduleNameAsCode = '';
    let moduleImportsAsCode = '';
    let exportMain = '';
    let invokeMain = '';
    if (!grammarSpec.options.noMain) {
        moduleNameAsCode = String(grammarSpec.options.moduleMain || commonJsMain);
        moduleImportsAsCode = String(grammarSpec.options.moduleMainImports || commonES6MainImports);

        exportMain = rmCommonWS`
            yymain,
            yyExecMain as main,
        `;
        
        invokeMain = rmCommonWS`
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

    let src = rmCommonWS`
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
    let modIncSrc = (grammarSpec.moduleInclude ? grammarSpec.moduleInclude + ';' : '');
    let moduleNameAsCode = '';
    let moduleImportsAsCode = '';
    let main = '';
    let moduleName = grammarSpec.options.moduleName;
    if (!grammarSpec.options.noMain) {
        moduleNameAsCode = String(grammarSpec.options.moduleMain || commonJsMain);
        moduleImportsAsCode = String(grammarSpec.options.moduleMainImports || commonJsMainImports);

        main = rmCommonWS`
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

    let src = rmCommonWS`
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
RegExpLexer.mkIdentifier = mkIdentifier;
RegExpLexer.autodetectAndConvertToJSONformat = autodetectAndConvertToJSONformat;


export default RegExpLexer;

