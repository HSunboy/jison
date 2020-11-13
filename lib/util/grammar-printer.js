
// import Lexer from '../../packages/jison-lex';
// import ebnfParser from '../../packages/ebnf-parser';
// import lexParser from '../../packages/lex-parser';
// import XRegExp from '@gerhobbelt/xregexp';
// import recast from 'recast';
// import astUtils from 'ast-util';
// import prettier from '@gerhobbelt/prettier-miscellaneous';
import JSON5 from '@gerhobbelt/json5';
import helpers from '../../packages/helpers-lib';
let rmCommonWS = helpers.rmCommonWS;
let camelCase  = helpers.camelCase;
import assert from 'assert';


let devDebug = 0;


/**
 * Output the `raw` input (JSON format or plain STRING containing JSON-formatted data)
 * as JISON source file format in the returned string.
 *
 * @returns a string containing the file contents of an input-equivalent JISON parser/lexer source file.
 * @public
 */
function grammarPrinter(raw, options) {
    if (typeof raw !== 'object') {
        raw = JSON5.parse(raw);
    }
    options = Object.assign({}, options);
    options.showLexer = (options.showLexer !== undefined ? !!options.showLexer : true);
    options.showParser = (options.showParser !== undefined ? !!options.showParser : true);
    switch (String(options.format).toLowerCase()) {
    default:
    case 'jison':
        options.format = 'jison';
        break;

    case 'json5':
        options.format = 'json5';
        break;

    case '.y':
    case '.yacc':
        options.format = 'jison';
        options.showLexer = false;
        options.showParser = true;
        break;

    case '.l':
    case '.lex':
        options.format = 'jison';
        options.showLexer = true;
        options.showParser = false;
        break;
    }

    function isWord(key) {
        if (typeof key !== 'string') {
            return false;
        }
        if (!isWordStart(key[0])) {
            return false;
        }
        let i = 1;
        let length = key.length;
        while (i < length) {
            if (!isWordChar(key[i])) {
                return false;
            }
            i++;
        }
        return true;
    }

    function makeIndent(num) {
        return (new Array(num + 1)).join(' ');
    }

    function padRight(str, num) {
        return str + (new Array(Math.max(0, num - str.length) + 1)).join(' ');
    }

    function indentAction(src, num) {
        // It's dangerous to indent an action code chunk as it MAY contain **template strings**
        // which MAY get corrupted that way as their actual content would change then!

        // construct fake nesting levels to arrive at the intended start indent value: `num`
        let nesting_levels = num / 2;
        let pre = '// **PRE**';
        let post = '// **POST**';
        for (; nesting_levels > 0; nesting_levels--) {
            pre = 'function x() {\n' + pre;
            post += '\n}';
        }
        src = '\n' + pre + '\n' + src + '\n' + post + '\n';

        let ast = helpers.parseCodeChunkToAST(src, options);
        let new_src = helpers.prettyPrintAST(ast, options);

        let start = new_src.indexOf('// **PRE**');
        let end = new_src.lastIndexOf('// **POST**');
        new_src = new_src
        .substring(start + 10, end)
        .trim();

        return new_src;
    }

    function isEmptyObj(obj) {
        let keys = obj && typeof obj === 'object' && Object.keys(obj);
        return keys && keys.length === 0;
    }

    function isEmptyArr(arr) {
        if (arr && arr instanceof Array) {
            for (let i = 0, len = arr.length; i < len; i++) {
                if (arr[i] !== undefined) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    // Copied from Crokford's implementation of JSON
    // See https://github.com/douglascrockford/JSON-js/blob/e39db4b7e6249f04a195e7dd0840e610cc9e941e/json2.js#L195
    // Begin
    let escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    let meta = { // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    };

    function escapeString(string) {
        // If the string contains no control characters, no quote characters, and no
        // backslash characters, then we can safely slap some quotes around it.
        // Otherwise we must also replace the offending characters with safe escape
        // sequences.
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            let c = meta[a];
            return typeof c === 'string' ?
                c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }

    let ref_list;
    let ref_names;

    // create a deep copy of the input, so we can delete the parts we converted and dump the remainder
    // so that we always output the entire thing, even when we don't know all the details about the
    // actual input:
    function deepClone(from, sub) {
        if (sub == null) {
            ref_list = [];
            ref_names = [];
            sub = 'root';
        }
        if (typeof from === 'function') return '[Function]';
        if (from == null || typeof from !== 'object') return from;
        if (from.constructor !== Object && from.constructor !== Array) {
            return from;
        }

        for (let i = 0, len = ref_list.length; i < len; i++) {
            if (ref_list[i] === from) {
                return '[Circular/Xref:' + ref_names[i] + ']';   // circular or cross reference
            }
        }
        ref_list.push(from);
        ref_names.push(sub);
        sub += '.';

        let to = new from.constructor();
        for (let name in from) {
            to[name] = deepClone(from[name], sub + name);
        }
        return to;
    }


    let originalInput = raw;
    raw = deepClone(raw);

    let lex_out_str = '';
    if (raw.lex) {
        var lex_pre = [];
        let lex_rules = [];
        let lex_post = [];

        {
            let src = raw.lex.macros;
            delete raw.lex.macros;
            if (src && !isEmptyObj(src)) {
                lex_pre.push(rmCommonWS`
                    // macros:
                `);

                let keylen = 0;
                for (let key in src) {
                    keylen = Math.max(keylen, key.length);
                }
                console.log('macros keylen:', keylen);
                keylen = ((keylen / 4) | 0) * 4 + 4;
                console.log('macros keylen B:', keylen);
                for (let key in src) {
                    lex_pre.push(padRight(key, keylen) + src[key]);
                }

                lex_pre.push(rmCommonWS`
                    // END of the lexer macros.
                `);
            }
        }

        {
            let src = raw.lex.unknownDecls;
            delete raw.lex.unknownDecls;
            if (src && !isEmptyObj(src)) {
                lex_pre.push(rmCommonWS`
                    // unknown declarations:
                `);

                for (let i = 0, len = src.length; i < len; i++) {
                    let entry = src[i];
                    let key = entry.name;
                    let value = entry.value;

                    lex_pre.push('%' + key + ' ' + value);
                }

                lex_pre.push(rmCommonWS`
                    // END of unknown declarations.
                `);
            }
        }

        {
            let src = raw.lex.options;
            delete raw.lex.options;
            if (src && !isEmptyObj(src)) {
                lex_pre.push(rmCommonWS`
                    // options:
                `);

                for (let key in src) {
                    let value = src[key];
                    if (value) {
                        lex_pre.push('%options ' + key + '=' + value);
                    } else {
                        lex_pre.push('%options ' + key);
                    }
                }
            }
        }

        {
            let src = raw.lex.startConditions;
            delete raw.lex.startConditions;
            if (src && !isEmptyObj(src)) {
                for (let key in src) {
                    let value = src[key];

                    lex_pre.push((value ? '%x ' : '%s ') + key);
                }
            }
        }

        {
            let src = raw.lex.actionInclude;
            delete raw.lex.actionInclude;
            if (src && src.trim()) {
                lex_pre.push('%{\n' + indentAction(src.trim(), 4) + '\n%}');
            }
        }

        {
            let src = raw.lex.rules;
            delete raw.lex.rules;
            if (src) {
                for (let i = 0, len = src.length; i < len; i++) {
                    let entry = src[i];
                    let key = entry[0];
                    let action = indentAction(entry[1], 4);

                    let actionHasLF = /[\r\n]/.test(action);
                    console.log('indented action:', {
                        entry: entry[1],
                        action,
                        actionHasLF
                    });
                    if (key.length <= 12) {
                        if (!actionHasLF) {
                            lex_rules.push(padRight(key, 16) + indentAction(action, 16));
                        } else {
                            lex_rules.push(padRight(key, 16) + '%' + indentAction('{ ' + action + ' }', 16) + '%');
                        }
                    } else if (!actionHasLF) {
                        lex_rules.push(key, makeIndent(16) + indentAction(action, 16));
                    } else {
                        lex_rules.push(key, makeIndent(16) + '%' + indentAction('{ ' + action + ' }', 16) + '%');
                    }
                }
            }
        }

        {
            let src = raw.lex.moduleInclude;
            delete raw.lex.moduleInclude;
            if (src && src.trim()) {
                lex_post.push(indentAction(src.trim(), 0));
            }
        }

        {
            let out = '';

            if (!isEmptyObj(raw.lex)) {
            // dump the remainder as a comment:
                let rem = JSON5.stringify(raw.lex, null, 2);
                out += rmCommonWS`
                    /*
                     * Lexer stuff that's unknown to the JISON prettyPrint service:
                     *
                     * ${rem.replace(/\*\//g, '*\\/')}
                     */
                
                `;
            }
            delete raw.lex;

            out += lex_pre.join('\n') + '\n\n';
            out += rmCommonWS`

                %%

            ` + lex_rules.join('\n') + '\n\n';
            if (lex_post.length > 0) {
                out += rmCommonWS`

                    %%

                ` + lex_post.join('\n') + '\n\n';
            }
            lex_out_str = out;
        }
    }

    let grammar_pre = [];
    let grammar_mid = [];
    let ebnf_rules = [];
    let bnf_rules = [];
    let grammar_post = [];

    let fmtprod = function fmtprod(rule, prodset) {
        let backup = deepClone(prodset);

        rule += prodset[0] ? prodset[0] : '%epsilon';
        let prec = null;
        let lead = rule.split(/\r\n\|\n|\r/).pop();
        delete prodset[0];

        if (prodset.length === 3 && typeof prodset[2] === 'object') {
            prec = '%prec ' + prodset[2].prec;
            if (lead.length < 12) {
                rule += makeIndent(12 - lead.length);
            }
            rule += '  ' + prec;

            delete prodset[2].prec;
            if (isEmptyObj(prodset[2])) {
                delete prodset[2];
            }
        } else if (prodset.length === 2 && typeof prodset[1] === 'object') {
            prec = '%prec ' + prodset[1].prec;
            if (lead.length < 12) {
                rule += makeIndent(12 - lead.length);
            }
            rule += '  ' + prec;

            delete prodset[1].prec;
            if (isEmptyObj(prodset[1])) {
                delete prodset[1];
            }
        }
        if (typeof prodset[1] === 'string') {
            let action = prodset[1];
            if (lead.length < 12 - 1) {
                rule += makeIndent(12 - lead.length) + indentAction('{ ' + action + ' }', 12);
            } else {
                rule += '\n' + makeIndent(12) + indentAction('{ ' + action + ' }', 12);
            }
            delete prodset[1];
        }

        if (isEmptyArr(prodset)) {
            prodset.length = 0;
        } else {
            prodset = backup;
        }
        return rule;
    };

    let grammarfmt = function grammarfmt(src) {
        let dst = [];

        for (let key in src) {
            let prodset = src[key];
            let rule;
            console.log('format one rule:', {
                key,
                prodset
            });

            if (typeof prodset === 'string') {
                rule = fmtprod(key + ' : ', [ prodset ]) + ';';
                delete src[key];
            } else if (prodset instanceof Array) {
                if (prodset.length === 1) {
                    if (typeof prodset[0] === 'string') {
                        rule = fmtprod(key + ' : ', [ prodset ]) + ';';
                        delete src[key];
                    } else if (prodset[0] instanceof Array) {
                        rule = fmtprod(key + ' : ', prodset[0]);
                        rule += '\n    ;';
                        if (prodset[0].length === 0) {
                            delete src[key];
                        }
                    } else {
                        rule = key + '\n    : **ERRONEOUS PRODUCTION** (see the dump for more): ' + prodset[0];
                    }
                } else if (prodset.length > 1) {
                    if (typeof prodset[0] === 'string') {
                        rule = fmtprod(key + '\n    : ', [ prodset[0] ]);
                        delete prodset[0];
                    } else if (prodset[0] instanceof Array) {
                        rule = fmtprod(key + '\n    : ', prodset[0]);
                        if (prodset[0].length === 0) {
                            delete prodset[0];
                        }
                    } else {
                        rule = key + '\n    : **ERRONEOUS PRODUCTION** (see the dump for more): ' + prodset[0];
                    }
                    for (let i = 1, len = prodset.length; i < len; i++) {
                        if (typeof prodset[i] === 'string') {
                            rule += fmtprod('\n    | ', [ prodset[i] ]);
                            delete prodset[i];
                        } else if (prodset[i] instanceof Array) {
                            rule += fmtprod('\n    | ', prodset[i]);
                            if (prodset[i].length === 0) {
                                delete prodset[i];
                            }
                        } else {
                            rule += '\n    | **ERRONEOUS PRODUCTION** (see the dump for more): ' + prodset[i];
                        }
                    }
                    rule += '\n    ;';

                    if (isEmptyArr(prodset)) {
                        delete src[key];
                    }
                }
            } else {
                rule = key + '\n    : **ERRONEOUS PRODUCTION** (see the dump for more): ' + prodset;
            }
            dst.push(rule);
        }

        return dst;
    };

    {
        let src = raw.ebnf;
        if (src) {
            ebnf_rules = grammarfmt(src);

            if (isEmptyObj(src)) {
                delete raw.ebnf;
            }
        }
    }

    {
        let src = raw.bnf;
        //delete raw.bnf;
        if (src) {
            bnf_rules = grammarfmt(src);

            if (isEmptyObj(src)) {
                delete raw.bnf;
            }
        }
    }

    {
        let src = raw.unknownDecls;
        delete raw.unknownDecls;
        if (src && !isEmptyObj(src)) {
            lex_pre.push(rmCommonWS`
                // unknown declarations:
            `);

            for (let i = 0, len = src.length; i < len; i++) {
                let entry = src[i];
                let key = entry.name;
                let value = entry.value;

                lex_pre.push('%' + key + ' ' + value);
            }

            lex_pre.push(rmCommonWS`
                // END of unknown declarations.
            `);
        }
    }

    //let src = raw.lex;
    //delete raw.lex;
    //if (src) {
    if (lex_out_str.trim() && options.showLexer) {
        grammar_pre.push(rmCommonWS`
            // ============================== START lexer section =========================== 
            
            %lex
            
            ${lex_out_str}

            /lex

            // ============================== END lexer section =============================

        `);
    }

    {
        let src = raw.options;
        delete raw.options;
        if (src && !isEmptyObj(src)) {
            let a = [];
            for (let key in src) {
                let value = src[key];
                switch (key) {
                default:
                    if (value !== true) {
                        a.push('options', '%options ' + key + '=' + value);
                    } else {
                        a.push('options', '%options ' + key);
                    }
                    break;

                case 'ebnf':
                    if (value) {
                        a.push(key, '%ebnf');
                    }
                    break;

                case 'type':
                    if (value) {
                        a.push(key, '%parser-type ' + value);
                    }
                    break;

                case 'debug':
                    if (typeof value !== 'boolean') {
                        a.push(key, '%debug ' + value);
                    } else if (value) {
                        a.push(key, '%debug');
                    }
                    break;
                }
            }
            let type = null;
            for (let i = 0, len = a.length; i < len; i += 2) {
                let t = a[i];
                let line = a[i + 1];
                if (t !== type) {
                    type = t;
                    grammar_pre.push('');
                }
                grammar_pre.push(line);
            }
            grammar_pre.push('');
        }
    }

    {
        let src = raw.imports;
        if (src) {
            let clean = true;
            for (let i = 0, len = src.length; i < len; i++) {
                let entry = src[i];

                grammar_pre.push('%import ' + entry.name + '  ' + entry.path);
                delete entry.name;
                delete entry.path;
                if (isEmptyObj(entry)) {
                    delete src[i];
                } else {
                    clean = false;
                }
            }
            if (clean) {
                delete raw.imports;
            }
        }
    }

    {
        let src = raw.moduleInit;
        if (src) {
            let clean = true;
            for (let i = 0, len = src.length; i < len; i++) {
                let entry = src[i];

                grammar_pre.push('%code ' + entry.qualifier + '  ' + entry.include);
                delete entry.qualifier;
                delete entry.include;
                if (isEmptyObj(entry)) {
                    delete src[i];
                } else {
                    clean = false;
                }
            }
            if (clean) {
                delete raw.moduleInit;
            }
        }
    }

    {
        let src = raw.operators;
        if (src) {
            let clean = true;
            for (let i = 0, len = src.length; i < len; i++) {
                let entry = src[i];
                let tokens = entry[1];
                let line = '%' + entry[0] + ' ';

                for (let t = 0, tlen = tokens.length; t < tlen; t++) {
                    line += ' ' + tokens[t];
                }

                grammar_pre.push(line);

                if (entry.length === 2) {
                    delete src[i];
                } else {
                    clean = false;
                }
            }
            if (clean) {
                delete raw.operators;
            }
        }
    }

    {
        let src = raw.extra_tokens;
        if (src) {
            let clean = true;
            for (let i = 0, len = src.length; i < len; i++) {
                let entry = src[i];
                let line = '%token ' + entry.id;

                if (entry.type) {
                    line += ' <' + entry.type + '>';
                    delete entry.type;
                }
                if (entry.value) {
                    line += ' ' + entry.value;
                    delete entry.value;
                }
                if (entry.description) {
                    line += ' ' + escapeString(entry.description);
                    delete entry.description;
                }

                grammar_pre.push(line);

                delete entry.id;
                if (isEmptyObj(entry)) {
                    delete src[i];
                } else {
                    clean = false;
                }
            }
            if (clean) {
                delete raw.extra_tokens;
            }
        }
    }

    {
        let src = raw.parseParams;
        delete raw.parseParams;
        if (src) {
            grammar_pre.push('%parse-param ' + src.join(' '));
        }
    }

    {
        let src = raw.start;
        delete raw.start;
        if (src) {
            grammar_pre.push('%start ' + src);
        }
    }

    {
        let src = raw.moduleInclude;
        delete raw.moduleInclude;
        if (src && src.trim()) {
            grammar_post.push(indentAction(src.trim(), 0));
        }
    }

    {
        let src = raw.actionInclude;
        delete raw.actionInclude;
        if (src && src.trim()) {
            grammar_mid.push('%{\n' + indentAction(src.trim(), 4) + '\n%}');
        }
    }

    {
        let out = '';

        if (!isEmptyObj(raw)) {
        // dump the remainder as a comment:
            let rem = JSON5.stringify(raw, null, 2);
            out += rmCommonWS`
                /*
                 * Parser stuff that's unknown to the JISON prettyPrint service:
                 *
                 * ${rem.replace(/\*\//g, '*\\/')}
                 */
            
            `;
            // delete raw;
        }

        if (!options.showParser) {
            out += lex_out_str;
        } else {
            out += grammar_pre.join('\n') + '\n\n';
            out += rmCommonWS`

                %%

            `;
            if (grammar_mid.length > 0) {
                out += grammar_mid.join('\n') + '\n\n';
            }
            if (ebnf_rules.length > 0) {
                if (bnf_rules.length > 0) {
                // dump the original EBNF grammar as source and dump the BNF derivative as COMMENT:
                    let bnf_deriv = bnf_rules.join('\n\n');
                    let a = bnf_deriv.split(/\r\n|\n|\r/).map(function (line) {
                        return '// ' + line;
                    });

                    out += rmCommonWS`
                        //
                        // JISON says:
                        //
                        // This is a EBNF grammar. The resulting **BNF** grammar has been
                        // reproduced here for your convenience:
                        //
                        // ---------------------------- START ---------------------------
                        ${a.join('\n')}
                        // ---------------------------- END OF BNF grammar --------------
                        //


                    `;
                }
                out += ebnf_rules.join('\n\n') + '\n\n';
            } else if (bnf_rules.length > 0) {
                out += bnf_rules.join('\n\n') + '\n\n';
            }

            if (grammar_post.length > 0) {
                out += rmCommonWS`

                    %%

                ` + grammar_post.join('\n') + '\n\n';
            }
        }

        if (options.format === 'json5') {
            let a = out.split(/\r\n|\n|\r/).map(function (line) {
                return '// ' + line;
            });

            out = rmCommonWS`
                //
                // JISON says:
                //
                // The JISON ${options.showParser ? 'grammar' : 'lexer'} has been
                // reproduced here for your convenience:
                //
                // ---------------------------- START ---------------------------
                ${a.join('\n')}
                // ---------------------------- END -----------------------------
                //

            `;

            // process the original input once again: this time via JSON5
            raw = deepClone(originalInput);

            if (!options.showLexer) {
                delete raw.lex;
                out += JSON5.stringify(raw, null, 2);
            } else if (!options.showParser) {
                out += JSON5.stringify(raw.lex, null, 2);
            }
        }

        return out;
    }
}

export default grammarPrinter;
