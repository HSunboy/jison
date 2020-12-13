const path = require('path');
const fs = require('fs');
const XRegExp = require('@gerhobbelt/xregexp');
const JSON5 = require('@gerhobbelt/json5');
const globby = require('globby');
const assert = require('chai').assert;
// NodeJS doesn't support ES2015 import statements yet, so we must use the compiled/rollup-ed version instead:
const helpers = require('../dist/helpers-lib-cjs');


// TODO real tests

describe('helpers API', function () {
    it('camelCase', function () {
        assert.strictEqual(helpers.camelCase('abc'), 'abc');
        assert.strictEqual(helpers.camelCase('abc-def-ghi'), 'abcDefGhi');

        assert.strictEqual(helpers.camelCase('1abc'), '1abc');
        assert.strictEqual(helpers.camelCase(' abc'), ' abc');
        assert.strictEqual(helpers.camelCase('abc_def_ghi'), 'abc_def_ghi');

        assert.strictEqual(helpers.camelCase('abc___def'), 'abc___def');
        assert.strictEqual(helpers.camelCase('abc--def'), 'abc-Def');
        assert.strictEqual(helpers.camelCase('abc----def'), 'abc---Def');
        assert.strictEqual(helpers.camelCase('1-abc-2--def'), '1Abc-2-Def');
        assert.strictEqual(helpers.camelCase('a+b+c+d+e+-Fg'), 'a+b+c+d+e+Fg');
    });

    it('mkIdentifier', function () {
        assert.strictEqual(helpers.mkIdentifier('abc'), 'abc');
        assert.strictEqual(helpers.mkIdentifier('abc-def-ghi'), 'abcDefGhi');

        assert.strictEqual(helpers.mkIdentifier('1abc'), '_1abc');
        assert.strictEqual(helpers.mkIdentifier(' abc'), '_abc');
        assert.strictEqual(helpers.mkIdentifier('abc_def_ghi'), 'abc_def_ghi');

        assert.strictEqual(helpers.mkIdentifier('abc___def'), 'abc_def');
        assert.strictEqual(helpers.mkIdentifier('abc--def'), 'abc_Def');
        assert.strictEqual(helpers.mkIdentifier('abc----def'), 'abc_Def');
        assert.strictEqual(helpers.mkIdentifier('-abc----def'), 'Abc_Def');          // !
        assert.strictEqual(helpers.mkIdentifier('--var'), '_Var');                   // !
        assert.strictEqual(helpers.mkIdentifier('--var--'), '_Var__');
        assert.strictEqual(helpers.mkIdentifier('--Var--'), '_Var__');
        assert.strictEqual(helpers.mkIdentifier('__var__'), '__var__');
        assert.strictEqual(helpers.mkIdentifier('__VAR__'), '__VAR__');
        assert.strictEqual(helpers.mkIdentifier('_VAR_'), '_VAR_');
        assert.strictEqual(helpers.mkIdentifier('____VAR____'), '__VAR__');
        assert.strictEqual(helpers.mkIdentifier('-abc----def---'), 'Abc_Def__');
        assert.strictEqual(helpers.mkIdentifier('1-abc-2--def'), '_1Abc_2_Def');
        assert.strictEqual(helpers.mkIdentifier('-1-abc-2--def'), '_1Abc_2_Def');
        assert.strictEqual(helpers.mkIdentifier('a+b+c+d+e+-Fg'), 'a_b_c_d_e_Fg');
    });

    it('dquote: onlyRegular = output for code generators', function () {
        const opts = { onlyRegular: true };
        assert.strictEqual(helpers.dquote('abc', opts), '"abc"');
        assert.strictEqual(helpers.dquote("abc's", opts), "\"abc's\"");
        assert.strictEqual(helpers.dquote('"abc', opts), "'\"abc'");
        assert.strictEqual(helpers.dquote("\"abc\'s\"", opts), "\"\\\"abc\'s\\\"\"");
    });

    it('dquote: default = unicode quotes', function () {
        assert.strictEqual(helpers.dquote('abc'), '“abc”');
        assert.strictEqual(helpers.dquote("abc's"), "“abc's”");
        assert.strictEqual(helpers.dquote('"abc'), "“\"abc”");
        assert.strictEqual(helpers.dquote("\"abc\'s\""), "“\"abc\'s\"”");
    });

    it('dquote: default; find suitable quotes for content with various quotes contained', function () {
        assert.strictEqual(helpers.dquote('quote “ abc'), '‘quote “ abc’');
        assert.strictEqual(helpers.dquote('quote “’ abc'), '«quote “’ abc»');
        assert.strictEqual(helpers.dquote('quote 「“’«›》〈…」 abc'), '•quote 「“’«›》〈…」 abc•');
        assert.strictEqual(helpers.dquote('quote 「“’«›》〈•••」 abc'), '”quote 「“’«›》〈•••」 abc”');
        assert.strictEqual(helpers.dquote("quote '「”’«›》〈•••」' abc"), '"quote \'「”’«›》〈•••」\' abc"');
    });

    it('dquote: preferred = true', function () {
        const opts = { preferred: true };
        assert.strictEqual(helpers.dquote('abc', opts), '“abc”');
        assert.strictEqual(helpers.dquote("abc's", opts), "“abc's”");
        assert.strictEqual(helpers.dquote('"abc', opts), "“\"abc”");
        assert.strictEqual(helpers.dquote("\"abc\'s\"", opts), "“\"abc\'s\"”");
    });

    it('dquote: empty options -> unicode quotes', function () {
        const opts = { };
        assert.strictEqual(helpers.dquote('abc', opts), '“abc”');
        assert.strictEqual(helpers.dquote("abc's", opts), "“abc's”");
        assert.strictEqual(helpers.dquote('"abc', opts), "“\"abc”");
        assert.strictEqual(helpers.dquote("\"abc\'s\"", opts), "“\"abc\'s\"”");
        assert.strictEqual(helpers.dquote('quote “ abc', opts), '‘quote “ abc’');
        assert.strictEqual(helpers.dquote('quote “’ abc', opts), '«quote “’ abc»');
    });

    it('dquote: preferred quotes', function () {
        const opts = { preferred: '•”' };
        assert.strictEqual(helpers.dquote('abc', opts), '•abc•');
        assert.strictEqual(helpers.dquote("abc's", opts), "•abc's•");
        assert.strictEqual(helpers.dquote('"abc', opts), "•\"abc•");
        assert.strictEqual(helpers.dquote("abc•s", opts), "”abc•s”");
        assert.strictEqual(helpers.dquote('quote •” abc', opts), '‘quote •” abc’');
    });

    it('dquote: preferred quotes + onlyRegular', function () {
        const opts = { onlyRegular: true, preferred: '•”' };
        assert.strictEqual(helpers.dquote('abc', opts), '•abc•');
        assert.strictEqual(helpers.dquote("abc's", opts), "•abc's•");
        assert.strictEqual(helpers.dquote('"abc', opts), "•\"abc•");
        assert.strictEqual(helpers.dquote("abc•s", opts), "”abc•s”");
        assert.strictEqual(helpers.dquote('quote •” abc', opts), '"quote •” abc"');
        assert.strictEqual(helpers.dquote('quote "•” abc', opts), "'quote \"•” abc'");
        assert.strictEqual(helpers.dquote('quote "•”\' abc', opts), "\"quote \\\"•”' abc\"");
    });

    it('rmCommonWS', function () {
        let rmCommonWS = helpers.rmCommonWS;

        assert.strictEqual(rmCommonWS`
        abc
    `, '\nabc\n');

        function rep_da_di_da_da(s) {
            return s;
        }
        function dquote(s) {
            return '"' + s + '"';
        }
        function topState() {
            return 'TOPSTATE';
        }
        function prettyPrintRange() {
            return 'PRETTY RANGE';
        }

        let yy_ = {
            yytext: 'YYTEXT'
        };

        let rv = rep_da_di_da_da(rmCommonWS`
                                                EBNF: ignoring unsupported parser option ${dquote(yy_.yytext)}
                                                while lexing in ${dquote(topState())} state.

                                                  Erroneous area:
                                                ` + prettyPrintRange());

        assert.strictEqual(rv, '\n' +
      'EBNF: ignoring unsupported parser option "YYTEXT"\n' +
      'while lexing in "TOPSTATE" state.\n' +
      '\n' +
      '  Erroneous area:\n' +
      'PRETTY RANGE');
    });

    it ('rmCommonWS: applied to zero-indent initial line input string (bug regression check)', function () {
        let rmCommonWS = helpers.rmCommonWS;

        // the key part of the next chunk is the ZERO INDENT of the yyerror... line!
        assert.strictEqual(rmCommonWS`
yyerror(rmCommonWS\`
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
            $\{yylexer.prettyPrintRange(ဩerror)}

              Technical error report:
            $\{$error.errStr}
        \`);
    `, '\n' + `
yyerror(rmCommonWS\`
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
            $\{yylexer.prettyPrintRange(ဩerror)}

              Technical error report:
            $\{$error.errStr}
        \`);
    `.trim() + '\n');
    });

    it('detectIstanbulGlobal', function () {
        if (!helpers.detectIstanbulGlobal()) {
            assert.strictEqual(helpers.detectIstanbulGlobal(), false);
        } else {
            let o = helpers.detectIstanbulGlobal();
            assert.ok(o);
            assert.equal(typeof o, 'object');
            let k = Object.keys(o);
            var kp = k.filter(function pass_paths(el) {
                return el.match(/[\\\/][^\\\/]+$/);
            });
            assert.ok(k.length > 0, 'expected 1 or more keys in the istanbul global');
            assert.ok(kp.length > 0, 'expected 1 or more paths as keys in the istanbul global');
            var kp = k.filter(function pass_istanbul_file_objects(idx) {
                let el = o[idx];
                return el && el.hash && el.statementMap && el.path;
            });
            assert.ok(kp.length > 0, 'expected 1 or more istanbul file coverage objects in the istanbul global');
        }
    });

    /* istanbul ignore next: test functions' code is injected and then crashes the test due to extra code coverage statements having been injected */
    it('printFunctionSourceCode (direct)', function () {
        function d(i) { /* mock for linters */ }

        if (!helpers.detectIstanbulGlobal()) {
            assert.strictEqual(helpers.printFunctionSourceCode(function a(x) { return x; }), 'function a(x) { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode(function (x)  { return x; }), 'function (x)  { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode((x) => { return x; }), '(x) => { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode((x) => x), '(x) => x');
            assert.strictEqual(helpers.printFunctionSourceCode((x) => (d(1), d(2), x)), '(x) => (d(1), d(2), x)');
            assert.strictEqual(helpers.printFunctionSourceCode(x => x + 7), 'x => x + 7');
        } else {
            assert.strictEqual(helpers.printFunctionSourceCode(function a(x) { return x; }), 'function a(x) { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode(function (x)  { return x; }), 'function (x)  { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode((x) => { return x; }), '(x) => { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode((x) => x), '(x) => x');
            assert.strictEqual(helpers.printFunctionSourceCode((x) => (d(1), d(2), x)), '(x) => (d(1), d(2), x)');
            assert.strictEqual(helpers.printFunctionSourceCode(x => x + 7), 'x => x + 7');
        }
    });

    /* istanbul ignore next: test functions' code is injected and then crashes the test due to extra code coverage statements having been injected */
    it('printFunctionSourceCode (indirect)', function () {
        function d(i) { /* mock for linters */ }

        let f1 = function a(x) { return x; };
        let f2 = function (x)  { return x; };
        let f3 = (x) => { return x; };
        let f4 = (x) => x;
        let f5 = (x) => (d(1), d(2), x);
        let f6 = x => x + 7;

        if (!helpers.detectIstanbulGlobal()) {
            assert.strictEqual(helpers.printFunctionSourceCode(f1), 'function a(x) { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode(f2), 'function (x)  { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode(f3), '(x) => { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode(f4), '(x) => x');
            assert.strictEqual(helpers.printFunctionSourceCode(f5), '(x) => (d(1), d(2), x)');
            assert.strictEqual(helpers.printFunctionSourceCode(f6), 'x => x + 7');
        } else {
            assert.strictEqual(helpers.printFunctionSourceCode(f1), 'function a(x) { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode(f2), 'function (x)  { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode(f3), '(x) => { return x; }');
            assert.strictEqual(helpers.printFunctionSourceCode(f4), '(x) => x');
            assert.strictEqual(helpers.printFunctionSourceCode(f5), '(x) => (d(1), d(2), x)');
            assert.strictEqual(helpers.printFunctionSourceCode(f6), 'x => x + 7');
        }
    });

    /* istanbul ignore next: test functions' code is injected and then crashes the test due to extra code coverage statements having been injected */
    it('printFunctionSourceCodeContainer (direct)', function () {
        function d(i) { /* mock for linters */ }
        let x;          /* mock */

        if (!helpers.detectIstanbulGlobal()) {
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(function a(x) { return x; }), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(function (x)  { return x; }), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer((x) => { return x; }), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer((x) => x), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer((x) => (d(1), d(2), x)), { args: 'x', code: 'return (d(1), d(2), x);' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(x => x + 7), { args: 'x', code: 'return x + 7;' });
        } else {
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(function a(x) { return x; }), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(function (x)  { return x; }), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer((x) => { return x; }), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer((x) => x), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer((x) => (d(1), d(2), x)), { args: 'x', code: 'return (d(1), d(2), x);' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(x => x + 7), { args: 'x', code: 'return x + 7;' });
        }
    });

    /* istanbul ignore next: test functions' code is injected and then crashes the test due to extra code coverage statements having been injected */
    it('printFunctionSourceCodeContainer (indirect)', function () {
        function d(i) { /* mock for linters */ }
        let x;          /* mock */

        let f1 = function a(x) { return x; };
        let f2 = function (x)  { return x; };
        let f3 = (x) => { return x; };
        let f4 = (x) => x;
        let f5 = (x) => (d(1), d(2), x);
        let f6 = x => x + 7;

        if (!helpers.detectIstanbulGlobal()) {
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f1), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f2), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f3), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f4), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f5), { args: 'x', code: 'return (d(1), d(2), x);' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f6), { args: 'x', code: 'return x + 7;' });
        } else {
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f1), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f2), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f3), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f4), { args: 'x', code: 'return x;' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f5), { args: 'x', code: 'return (d(1), d(2), x);' });
            assert.deepEqual(helpers.printFunctionSourceCodeContainer(f6), { args: 'x', code: 'return x + 7;' });
        }
    });

    // remove all whitespace from input string `src`
    function rmAllWS(src) {
        return src.replace(/\s+/g, '');
    }

    it('generateMapper4JisonGrammarIdentifiers(input) picks a reasonable set of escapes to use', () => {
        let source = fs.readFileSync(__dirname + '/../../ebnf-parser/bnf.y');
        let g = helpers.generateMapper4JisonGrammarIdentifiers(source);

        function matchIdRegexBase(re) {
            //let ist = re.toString();
            //console.error('RE:', ist);
            //return /^\/#\(.+\)#\/g$/.test(ist);
            return re instanceof XRegExp;
        }

        function matchGeneralIdRe(re) {
            //let ist = re.toString();
            //return /^\/#\(.+?\)#\/g$/.test(ist);
            return re instanceof XRegExp;
        }

        assert.ok(g);
        assert.equal(typeof g, 'object');
        assert.equal(typeof g.decode, 'function');
        assert.equal(typeof g.encode, 'function');
        assert.deepEqual(g.tokenDirectIdentifierStart, 'ဩᐁ');
        assert.ok(matchIdRegexBase(g.tokenDirectIdentifierRe));
        assert.deepEqual(g.tokenValueReferenceStart, '$');
        assert.ok(matchIdRegexBase(g.tokenValueReferenceRe));
        assert.deepEqual(g.tokenLocationStart, 'ဩᑌ');
        assert.ok(matchIdRegexBase(g.tokenLocationRe));
        assert.deepEqual(g.tokenIdentifierStart, 'ဩᑫ');
        assert.ok(matchIdRegexBase(g.tokenIdentifierRe));
        assert.deepEqual(g.tokenStackIndexStart, 'ဩᔦ');
        assert.ok(matchIdRegexBase(g.tokenStackIndexRe));
        assert.deepEqual(g.tokenNegativeValueReferenceStart, 'ဩᗜ');
        assert.ok(matchIdRegexBase(g.tokenValueReferenceRe));
        assert.deepEqual(g.tokenNegativeLocationStart, 'ဩᘔ');
        assert.ok(matchIdRegexBase(g.tokenNegativeLocationRe));
        assert.deepEqual(g.tokenNegativeStackIndexStart, 'ဩᗄ');
        assert.ok(matchIdRegexBase(g.tokenNegativeStackIndexRe));
        assert.ok(matchGeneralIdRe(g.tokenDetect4EncodeRe));
        assert.ok(matchGeneralIdRe(g.tokenDetect4DecodeRe));
    });

    it('generateMapper4JisonGrammarIdentifiers(input) picks a reasonable set of escapes to use when confronted with Unicode collisions in the input', () => {
        let source = fs.readFileSync(__dirname + '/../../ebnf-parser/bnf.y', 'utf8');

        source = source
    .replace(/@/g, rmAllWS('ဩ ℹ ᐁ ᐯ ᑌ ᑍ ᑎ ᑏ ᔦ ᔧ ᔨ ᔩ ᔪ ᔫ ᔬ ᔭ ᔮ'))
    .replace(/$$/g, rmAllWS('ℹ'))
    .replace(/$/g, rmAllWS('இ ண ஐ ᐂ  ᐃ  ᐄ  ᐅ  ᐆ  ᐇ  ᐈ  ᐉ  ᐊ  ᐋ  ᐌ  ᐍ  ᐎ  ᐏ  ᐐ  ᐑ'));

        let g = helpers.generateMapper4JisonGrammarIdentifiers(source);

        function matchIdRegexBase(re) {
            //let ist = re.toString();
            //console.error('RE:', ist);
            //return /^\/#\(.+\)#\/g$/.test(ist);
            return re instanceof XRegExp;
        }

        function matchGeneralIdRe(re) {
            //let ist = re.toString();
            //return /^\/#\(.+?\)#\/g$/.test(ist);
            return re instanceof XRegExp;
        }

        assert.ok(g);
        assert.equal(typeof g, 'object');
        assert.equal(typeof g.decode, 'function');
        assert.equal(typeof g.encode, 'function');
        assert.deepEqual(g.tokenDirectIdentifierStart, 'Ϟᐒ');
        assert.ok(matchIdRegexBase(g.tokenDirectIdentifierRe));
        assert.deepEqual(g.tokenValueReferenceStart, '$');
        assert.ok(matchIdRegexBase(g.tokenValueReferenceRe));
        assert.deepEqual(g.tokenLocationStart, 'Ϟᑐ');
        assert.ok(matchIdRegexBase(g.tokenLocationRe));
        assert.deepEqual(g.tokenIdentifierStart, 'Ϟᑫ');
        assert.ok(matchIdRegexBase(g.tokenIdentifierRe));
        assert.deepEqual(g.tokenStackIndexStart, 'Ϟᔯ');
        assert.ok(matchIdRegexBase(g.tokenStackIndexRe));
        assert.deepEqual(g.tokenNegativeValueReferenceStart, 'Ϟᗜ');
        assert.ok(matchIdRegexBase(g.tokenValueReferenceRe));
        assert.deepEqual(g.tokenNegativeLocationStart, 'Ϟᘔ');
        assert.ok(matchIdRegexBase(g.tokenNegativeLocationRe));
        assert.deepEqual(g.tokenNegativeStackIndexStart, 'Ϟᗄ');
        assert.ok(matchIdRegexBase(g.tokenNegativeStackIndexRe));
        assert.ok(matchGeneralIdRe(g.tokenDetect4EncodeRe));
        assert.ok(matchGeneralIdRe(g.tokenDetect4DecodeRe));
    });

    it('generateMapper4JisonGrammarIdentifiers(input) properly encodes and decodes jison variables (1)', () => {
        let source = fs.readFileSync(__dirname + '/fixtures/Mapper4JisonGrammarIdentifiers.sample.txt', 'utf8');
        let g = helpers.generateMapper4JisonGrammarIdentifiers(source);

        assert.ok(g);
        assert.equal(typeof g, 'object');
        assert.equal(typeof g.decode, 'function');
        assert.equal(typeof g.encode, 'function');

        let im = g.encode(source);
        assert.notEqual(im, source);
        let cvt = g.decode(im);
        assert.deepEqual(cvt, source);
    });

    it('generateMapper4JisonGrammarIdentifiers(input) properly encodes and decodes jison variables (2)', () => {
        let source = fs.readFileSync(__dirname + '/../../ebnf-parser/bnf.y', 'utf8');
        let g = helpers.generateMapper4JisonGrammarIdentifiers(source);

        assert.ok(g);
        assert.equal(typeof g, 'object');
        assert.equal(typeof g.decode, 'function');
        assert.equal(typeof g.encode, 'function');

        let im = g.encode(source);
        let cvt = g.decode(im);
        assert.deepEqual(cvt, source);
    });

    // auto-init the Unicode mapper:
    let mapper;
    function autoInitUnicodeMapper() {
        return {
            encode: function (source) {
                if (!mapper) {
                    mapper = helpers.generateMapper4JisonGrammarIdentifiers(source);
                }
                return mapper.encode(source);
            },
            decode: function (source) {
                return mapper.decode(source);
            }
        };
    }

    it('parseCodeChunkToAST + prettyPrintAST', function () {
        let rmCommonWS = helpers.rmCommonWS;

        let options = {
            mapper4JisonGrammarIdentifiers: autoInitUnicodeMapper()
        };

        let ast = helpers.parseCodeChunkToAST(`
            for (var i = 0, len = 10; i < len; i++) {
                console.log(i);
            }
        `, options);

        //fs.writeFileSync(__dirname + "/parseCodeChunkAST-0001.json5", JSON5.stringify(ast, null, 2), 'utf8');

        let rv = helpers.prettyPrintAST(ast, options);
        let sollwert_src = rmCommonWS`
            for (var i = 0, len = 10; i < len; i++) {
              console.log(i);
            }
        `;
        assert.strictEqual(rv, sollwert_src.trim());
    });

    it('parseCodeChunkToAST + prettyPrintAST backticked code snippets with Unicode variable', function () {
        let rmCommonWS = helpers.rmCommonWS;

        let options = {
            mapper4JisonGrammarIdentifiers: autoInitUnicodeMapper()
        };

        let src = rmCommonWS`
yyerror(rmCommonWS\`
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
            $\{yylexer.prettyPrintRange(ဩerror)}

              Technical error report:
            $\{$error.errStr}
        \`);
    `;

        let ast = helpers.parseCodeChunkToAST(src, options);

        //fs.writeFileSync(__dirname + "/parseCodeChunkAST-0002.json5", JSON5.stringify(ast, null, 2), 'utf8');

        let rv = helpers.prettyPrintAST(ast, options);
        let sollwert_src = src;
        assert.strictEqual(rv, sollwert_src.trim());
    });

    // regression test: recast-0.15.1-32 is boogered and MUST NOT be used!
    it('parseCodeChunkToAST must parse valid jison action code correctly (or your babel/recast version(s) will be boogered!)', function () {
        let rmCommonWS = helpers.rmCommonWS;

        let options = {
            mapper4JisonGrammarIdentifiers: autoInitUnicodeMapper()
        };

        let src = rmCommonWS`
yyerror(rmCommonWS\`
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
            $\{yylexer.prettyPrintRange(@error)}

              Technical error report:
            $\{$error.errStr}
        \`);
    `;

        let ast = helpers.parseCodeChunkToAST(src, options);

        //fs.writeFileSync(__dirname + "/parseCodeChunkAST-0003.json5", JSON5.stringify(ast, null, 2), 'utf8');

        let rv = helpers.prettyPrintAST(ast, options);
        let sollwert_src = src;
        assert.strictEqual(rv.replace(/\s+/g, ' '), sollwert_src.trim().replace(/\s+/g, ' '));
    });

    it('exec_and_diagnose_this_stuff: **TBD**', function () {
        assert.ok(typeof helpers.exec_and_diagnose_this_stuff === 'function');
    });

    it('dumpSourceToFile: **TBD**', function () {
        assert.ok(typeof helpers.dumpSourceToFile === 'function');
    });

    it('isLegalIdentifierInput:', function () {
        assert.ok(typeof helpers.isLegalIdentifierInput === 'function');
        assert.ok(helpers.isLegalIdentifierInput('camelCase1'), 'camelCase1');
        assert.ok(helpers.isLegalIdentifierInput('camels-have-one-hump'), 'camels-have-one-hump');
        assert.ok(helpers.isLegalIdentifierInput('camel-case-1'), 'camel-case-1');
        assert.ok(!helpers.isLegalIdentifierInput('@camelCase1'), 'NOT LEGAL: @camelCase1');
        assert.ok(!helpers.isLegalIdentifierInput('#camelCase1'), 'NOT LEGAL: #camelCase1');
        assert.ok(!helpers.isLegalIdentifierInput('1camelCase1'), 'NOT LEGAL: 1camelCase1');
    });

    it('scanRegExp:', function () {
        assert.ok(typeof helpers.scanRegExp === 'function');

        let fixtures = JSON5.parse(fs.readFileSync(path.join(__dirname, 'fixtures/scanRegExp.input.json5'), 'utf8'));
        let fuzzer = 3;
        for (let key in fixtures.re) {
            let txt = fixtures.re[key];
            let l = helpers.scanRegExp(txt);
            const master_length = txt.substr(1).lastIndexOf('/') + 2;
            assert.equal(l, master_length, `RE test ${key} ~ text: '${txt}'`);
            
            let txt_sans_leading_slash = txt.substr(1);
            l = helpers.scanRegExp(txt_sans_leading_slash);
            assert.equal(l, txt_sans_leading_slash.lastIndexOf('/') + 1, `RE test ${key} SANS LEADING SLASH ~ text: '${txt_sans_leading_slash}'`);
            
            fuzzer = (fuzzer * 43) % 17 + 2;
            let fuzzed_txt = txt + 'ookibooki[(?:((u|U|L))?([^\\n\\\\]|((\\\\(["?\\\\abfnrtv]|[0-7]{1,3}|x[\\dA-Fa-f]+))))+)/'.substr(fuzzer);
            l = helpers.scanRegExp(fuzzed_txt);
            assert.equal(l, master_length, `RE test ${key} with FUZZED tail ~ text: '${fuzzed_txt}'`);
        }

        for (let key in fixtures.source) {
            let txt = fixtures.source[key];
            let l = helpers.scanRegExp(txt);
            assert.equal(l, -1, `SOURCE test ${key} ~ text: '${txt}'`);
            
            fuzzer = (fuzzer * 43) % 17 + 2;
            let fuzzed_txt = txt + '/' + 'ookibooki[(?:((u|U|L))?([^\\n\\\\]|((\\\\(["?\\\\abfnrtv]|[0-7]{1,3}|x[\\dA-Fa-f]+))))+)/'.substr(fuzzer);
            l = helpers.scanRegExp(fuzzed_txt);
            assert.equal(l, txt.length + 1, `SOURCE test ${key} with FUZZED tail ~ text: '${fuzzed_txt}'`);
        }
    });

    it('trimErrorForTestReporting:', function () {
        assert.ok(typeof helpers.trimErrorForTestReporting === 'function');
        assert.equal(helpers.trimErrorForTestReporting('a\nb/c/d\ne\\f\\g\n'), 'a\nb/c/d\ne\\f\\g\n');
    });

    it('stripErrorStackPaths:', function () {
        assert.ok(typeof helpers.stripErrorStackPaths === 'function');
        // Note to self: top four lines in this fake stacktrace are stacktrace output from inside `nyc` profiler runs:
        const input = `
  Erroneous area:
    at Object.lexer__performAction [as performAction] (W:\\blarg/a/b/c/regexp-lexer-cjs.js:13671:31), <anonymous>:1489:27)
    at Object.lexer_test_match [as test_match] (W:\\blarg/a/b/c/regexp-lexer-cjs.js:13671:31), <anonymous>:1085:40)
    at Object.lexer_next [as next] (W:\\blarg/a/b/c/regexp-lexer-cjs.js:13671:31), <anonymous>:1184:34)
    at Object.lexer_lex [as lex] (W:\\blarg/a/b/c/regexp-lexer-cjs.js:13671:31), <anonymous>:1262:22)
    at Context.testEachLexerExample (W:\\blarg/a/b/c/regexplexer.js:3649:37)
    at Object.lexer_parseError [as parseError] (W:\\blarg/lex-parser-cjs.js:8519:13)
    at Object.yyError [as yyerror] (W:\\blarg/lex-parser-cjs.js:8544:19)
    at Object.lexer__performAction [as performAction] (W:\\blarg/lex-parser-cjs.js:10107:17)
    at Object.lexer_test_match [as test_match] (W:\\blarg/lex-parser-cjs.js:9449:38)
    at Object.lexer_next [as next] (W:\\blarg/lex-parser-cjs.js:9572:28)
    at Object.lexer_lex [as lex] (W:\\blarg/lex-parser-cjs.js:9657:18)
    at Context.testEachParserExample (W:\\blarg/all-tests.js:231:37)
    at callFn (W:\\blarg/runnable.js:364:21)
    at Test.Runnable.run (W:\\blarg/runnable.js:352:5)
    at Runner.runTest (W:\\blarg/runner.js:677:10)
    at W:\\blarg/runner.js:801:12
    at next (W:\\blarg/runner.js:594:14)
    at W:\\blarg/runner.js:604:7
    at next (W:\\blarg/runner.js:486:14)
    at cbHookRun (W:\\blarg/runner.js:551:7)
    at done (W:\\blarg/runnable.js:308:5)
    at callFn (W:\\blarg/runnable.js:387:7)
    at Hook.Runnable.run (W:\\blarg/runnable.js:352:5)
    at next (W:\\blarg/runner.js:510:10)
    at Immediate._onImmediate (W:\\blarg/runner.js:572:5)
    at processImmediate (W:\\blarg/timers.js:456:21)
        `;
        const soll = `
  Erroneous area:
    at Object.lexer__performAction [as performAction] (/regexp-lexer-cjs.js:13671:31)
    at Object.lexer_test_match [as test_match] (/regexp-lexer-cjs.js:13671:31)
    at Object.lexer_next [as next] (/regexp-lexer-cjs.js:13671:31)
    at Object.lexer_lex [as lex] (/regexp-lexer-cjs.js:13671:31)
    at Context.testEachLexerExample (/regexplexer.js:3649:37)
    at Object.lexer_parseError [as parseError] (/lex-parser-cjs.js:8519:13)
    at Object.yyError [as yyerror] (/lex-parser-cjs.js:8544:19)
    at Object.lexer__performAction [as performAction] (/lex-parser-cjs.js:10107:17)
    at Object.lexer_test_match [as test_match] (/lex-parser-cjs.js:9449:38)
    at Object.lexer_next [as next] (/lex-parser-cjs.js:9572:28)
    at Object.lexer_lex [as lex] (/lex-parser-cjs.js:9657:18)
    at Context.testEachParserExample (/all-tests.js:231:37)
    at callFn (/runnable.js:364:21)
    at Test.Runnable.run (/runnable.js:352:5)
    at Runner.runTest (/runner.js:677:10)
    at /runner.js:801:12
    at next (/runner.js:594:14)
    at /runner.js:604:7
    at next (/runner.js:486:14)
    at cbHookRun (/runner.js:551:7)
    at done (/runnable.js:308:5)
    at callFn (/runnable.js:387:7)
    at Hook.Runnable.run (/runnable.js:352:5)
    at next (/runner.js:510:10)
    at Immediate._onImmediate (/runner.js:572:5)
    at processImmediate (/timers.js:456:21)
        `;
        let ist = helpers.stripErrorStackPaths(input);
        assert.deepEqual(ist, soll);

        // and re-applying the filter should not have a bad effect either:
        let ist2 = helpers.stripErrorStackPaths(ist);
        assert.deepEqual(ist2, soll);
    });

    it('cleanStackTrace4Comparison:', function () {
        assert.ok(typeof helpers.cleanStackTrace4Comparison === 'function');
        // Note to self: top four lines in this fake stacktrace are stacktrace output from inside `nyc` profiler runs:
        const input = `
  Erroneous area:
    at Object.lexer__performAction [as performAction] (/regexp-lexer-cjs.js:13671:31), <anonymous>:1489:27)
    at Object.lexer_test_match [as test_match] (/regexp-lexer-cjs.js:13671:31), <anonymous>:1085:40)
    at Object.lexer_next [as next] (/regexp-lexer-cjs.js:13671:31), <anonymous>:1184:34)
    at Object.lexer_lex [as lex] (/regexp-lexer-cjs.js:13671:31), <anonymous>:1262:22)
    at Context.testEachLexerExample (/regexplexer.js:3649:37)
    at Object.lexer_parseError [as parseError] (W:\\blarg/lex-parser-cjs.js:8519:13)
    at Object.yyError [as yyerror] (W:\\blarg/lex-parser-cjs.js:8544:19)
    at Object.lexer__performAction [as performAction] (W:\\blarg/lex-parser-cjs.js:10107:17)
    at Object.lexer_test_match [as test_match] (W:\\blarg/lex-parser-cjs.js:9449:38)
    at Object.lexer_next [as next] (W:\\blarg/lex-parser-cjs.js:9572:28)
    at Object.lexer_lex [as lex] (W:\\blarg/lex-parser-cjs.js:9657:18)
    at Context.testEachParserExample (W:\\blarg/all-tests.js:231:37)
    at callFn (W:\\blarg/runnable.js:364:21)
    at Test.Runnable.run (W:\\blarg/runnable.js:352:5)
    at Runner.runTest (W:\\blarg/runner.js:677:10)
    at W:\\blarg/runner.js:801:12
    at next (W:\\blarg/runner.js:594:14)
    at W:\\blarg/runner.js:604:7
    at next (W:\\blarg/runner.js:486:14)
    at cbHookRun (W:\\blarg/runner.js:551:7)
    at done (W:\\blarg/runnable.js:308:5)
    at callFn (W:\\blarg/runnable.js:387:7)
    at Hook.Runnable.run (W:\\blarg/runnable.js:352:5)
    at next (W:\\blarg/runner.js:510:10)
    at Immediate._onImmediate (W:\\blarg/runner.js:572:5)
    at processImmediate (W:\\blarg/timers.js:456:21)
        `;
        const soll = `
  Erroneous area:
    at Object.lexer__performAction [as performAction] (/regexp-lexer-cjs.js)
    at Object.lexer_test_match [as test_match] (/regexp-lexer-cjs.js)
    at Object.lexer_next [as next] (/regexp-lexer-cjs.js)
    at Object.lexer_lex [as lex] (/regexp-lexer-cjs.js)
    at Context.testEachLexerExample (/regexplexer.js)
    at Object.lexer_parseError [as parseError] (/lex-parser-cjs.js)
    at Object.yyError [as yyerror] (/lex-parser-cjs.js)
    at Object.lexer__performAction [as performAction] (/lex-parser-cjs.js)
    at Object.lexer_test_match [as test_match] (/lex-parser-cjs.js)
    at Object.lexer_next [as next] (/lex-parser-cjs.js)
    at Object.lexer_lex [as lex] (/lex-parser-cjs.js)
    at Context.testEachParserExample (/all-tests.js)
    at callFn (/runnable.js)
    at Test.Runnable.run (/runnable.js)
    at Runner.runTest (/runner.js)
    at /runner.js
    at next (/runner.js)
    at /runner.js
    at next (/runner.js)
    at cbHookRun (/runner.js)
    at done (/runnable.js)
    at callFn (/runnable.js)
    at Hook.Runnable.run (/runnable.js)
    at next (/runner.js)
    at Immediate._onImmediate (/runner.js)
    at processImmediate (/timers.js)
        `;
        let ist = helpers.cleanStackTrace4Comparison(input);
        assert.deepEqual(ist, soll);

        // and re-applying the filter should not have a bad effect either:
        let istA = helpers.cleanStackTrace4Comparison(ist);
        assert.deepEqual(istA, soll);

        const input2 = {
            a: [
                {
                    stack: 'at next (/a/b/c/runner.js:2:3)'
                }
               ],
            b: 1.0,
            d: false,
            e: {
                f: 'x',
                stack: 'at nextXX (/a/b/c/runnerXX.js:4:5)'
            }
        };
        const soll2 = {
            a: [
                {
                    stack: 'at next (/runner.js)'
                }
               ],
            b: 1.0,
            d: false,
            e: {
                f: 'x',
                stack: 'at nextXX (/runnerXX.js)'
            }
        };
        let ist2 = helpers.cleanStackTrace4Comparison(input2);
        assert.deepEqual(ist2, soll2);
    });

    it('checkRegExp:', function () {
        assert.ok(typeof helpers.checkRegExp === 'function');

        let fixtures = JSON5.parse(fs.readFileSync(path.join(__dirname, 'fixtures/scanRegExp.input.json5'), 'utf8'));
        let fuzzer = 3;
        for (let key in fixtures.re) {
            let txt = fixtures.re[key];
            let l = helpers.checkRegExp(txt, null, XRegExp);
            assert.equal(l, false, `RE test ${key} ~ text: '${txt}'`);
            
            fuzzer = (fuzzer * 43) % 17 + 2;
            let fuzzed_txt = txt + 'ookibooki[(?:((u|U|L))?([^\\n\\\\]|((\\\\(["?\\\\abfnrtv]|[0-7]{1,3}|x[\\dA-Fa-f]+))))+)/'.substr(fuzzer);
            l = helpers.checkRegExp(fuzzed_txt, null, XRegExp);
            assert.equal(typeof l, 'object', `RE test ${key} with FUZZED ${fuzzer} tail ~ text: '${fuzzed_txt}'`);
            assert.equal(String(l).indexOf('SyntaxError: Invalid regular expression:'), 0, `RE test ${key} with FUZZED ${fuzzer} tail ~ text: '${fuzzed_txt}'`);
        }

        for (let key in fixtures.source) {
            let txt = fixtures.source[key];
            let l = helpers.checkRegExp(txt, null, XRegExp);
            assert.equal(l, false, `SOURCE test ${key} ~ text: '${txt}'`);
            
            fuzzer = (fuzzer * 43) % 17 + 2;
            let fuzzed_txt = txt + '/' + 'ookibooki[(?:((u|U|L))?([^\\n\\\\]|((\\\\(["?\\\\abfnrtv]|[0-7]{1,3}|x[\\dA-Fa-f]+))))+)/'.substr(fuzzer);
            l = helpers.checkRegExp(fuzzed_txt, null, XRegExp);
            assert.equal(typeof l, 'object', `RE test ${key} with FUZZED ${fuzzer} tail ~ text: '${fuzzed_txt}'`);
            assert.equal(String(l).indexOf('SyntaxError: Invalid regular expression:'), 0, `RE test ${key} with FUZZED ${fuzzer} tail ~ text: '${fuzzed_txt}'`);
        }
    });

    it('getRegExpInfo: **TBD**', function () {
        assert.ok(typeof helpers.getRegExpInfo === 'function');
    });

    it('checkActionBlock:', function () {
        assert.ok(typeof helpers.checkActionBlock === 'function');

        // argument robustness: can we deal with 'bad' args? 
        // src=NULL should just say 'OK' to us.
        assert.deepEqual(helpers.checkActionBlock(null), { source: '', fault: false });
        // src='' should be OK
        assert.deepEqual(helpers.checkActionBlock(''), { source: '', fault: false });
        assert.deepEqual(helpers.checkActionBlock('   '), { source: '', fault: false });
        assert.deepEqual(helpers.checkActionBlock('\n\n\n\n\n\n\n'), { source: '', fault: false });

        // sample action code chunk to test-parse OK:
        const src_ok = `
            yyerror(rmCommonWS\`
                Production for rule '\${$id}' is missing: arrows introduce action code in Jison.

                Jison does not support rule production definition using arrows (->, =>, →) but expects
                colons (:) instead, so maybe you intended this:

                    \${$id} : \${$ARROW_ACTION}

                while the user-defined action code block MAY be an arrow function, e.g.

                    rule: id -> Math.min($id, 42);

                  Erroneous area:
                \${yylexer.prettyPrintRange(@ARROW_ACTION, @id)}
            \`);

            $$ = $handle_list;
            $$.push([$handle_action, @handle_action, #handle_action, ##handle_action]);
        `;
        // API doesn't need anything but this attribute in `yylloc` so we don't provide anything else:
        const yylloc = {
            first_line: 50,
        }
        const options = {
            doNotTestCompile: true,
        }
        assert.deepEqual(helpers.checkActionBlock(src_ok).fault, false);
        assert.deepEqual(helpers.checkActionBlock(src_ok, yylloc).fault, false);
        assert.deepEqual(helpers.checkActionBlock(src_ok, yylloc, options).fault, false);
        assert.deepEqual(helpers.checkActionBlock(src_ok, null, options).fault, false);

        const src_bad1 = `
            yyerror(rmCommonWS\`
                Production for rule '\${$id}' is missing: arrows introduce action code in Jison.

                Jison does not support rule production definition using arrows (->, =>, →) but expects
                colons (:) instead, so maybe you intended this:

Missing } at end of next line:
                    \${$id} : \${$ARROW_ACTION

                while the user-defined action code block MAY be an arrow function, e.g.

                    rule: id -> Math.min($id, 42);

                  Erroneous area:
                \${yylexer.prettyPrintRange(@ARROW_ACTION, @id)}
            \`);

            $$ = $handle_list;
            $$.push([$handle_action, @handle_action, #handle_action, ##handle_action]);
        `;

        assert.deepEqual(helpers.checkActionBlock(src_bad1).fault.message, 'Line 9: Unexpected token ILLEGAL');
        assert.deepEqual(helpers.checkActionBlock(src_bad1, yylloc).fault.message, 'Line 58: Unexpected token ILLEGAL');
        assert.deepEqual(helpers.checkActionBlock(src_bad1, yylloc, options).fault, false);    // due to options.doNotTextCompile=true
        assert.deepEqual(helpers.checkActionBlock(src_bad1, null, options).fault, false);      // due to options.doNotTextCompile=true
        assert.deepEqual(helpers.checkActionBlock(src_bad1, null, options).source, src_bad1);
    });

    it('trimActionCode: **TBD**', function () {
        assert.ok(typeof helpers.trimActionCode === 'function');
    });

    it('convertExceptionToObject:', function () {
        assert.ok(typeof helpers.convertExceptionToObject === 'function');

        try {
            throw new SyntaxError('blarg');
        } catch (ex) {
            let out = helpers.convertExceptionToObject(ex);
            let trace = helpers.stripErrorStackPaths(out.stack);
            // check if first few lines exist in the stack trace:
            assert.ok(/SyntaxError: blarg/.test(trace));
            assert.ok(/\(\/tests\.js:/.test(trace));
            assert.ok(trace.split('\n').length > 4);
            out.stack = 'bogus stack trace';
            assert.deepEqual(out, {
              message: 'blarg',
              name: 'SyntaxError',
              stack: 'bogus stack trace',
            });
        }
    });

    it('extractSymbolTableFromFile: **TBD**', function () {
        assert.ok(typeof helpers.extractSymbolTableFromFile === 'function');

        let table = helpers.extractSymbolTableFromFile(path.join(__dirname, '../../lex-parser/dist/lex-parser-cjs.js'));
        assert.ok(table);
        assert.equal(table.error, 2);
        assert.equal(table.$end, 1);
        assert.equal(table.$accept, 0);
        assert.equal(typeof table.$, 'number');
        assert.ok(table.$ > 2);
        assert.ok(table.REGEX_SET_START > 2);

        assert.throws(function () {
            void helpers.extractSymbolTableFromFile('./lex-parser-cjs.js');
        },
        Error,
        /\bENOENT\b/);
    });

    it('mkdirp: **TBD**', function () {
        assert.ok(typeof helpers.mkdirp === 'function');
    });

    it('setupDelimitedActionChunkMatcher: **TBD**', function () {
        assert.ok(typeof helpers.setupDelimitedActionChunkMatcher === 'function');
    });

    it('braceArrowActionCode: **TBD**', function () {
        assert.ok(typeof helpers.braceArrowActionCode === 'function');
    });

    it('generateSourcePrelude: **TBD**', function () {
        assert.ok(typeof helpers.generateSourcePrelude === 'function');
    });

    it('setupFileBasedTestRig:', function () {
        assert.ok(typeof helpers.setupFileBasedTestRig === 'function');

        const original_cwd = process.cwd();
        let testset;
        try {
            process.chdir(__dirname);
            testset = globby.sync([
                './fixtures/**/*.txt', 
            ]);

            testset = testset.sort();
        } finally {
            process.chdir(original_cwd);
        }
        assert(Array.isArray(testset));
        const len = testset.length;

        let spec = helpers.setupFileBasedTestRig(__dirname, testset, 'foo', null);
        assert(spec);
        assert(Array.isArray(spec.filespecList));
        assert.strictEqual(spec.filespecList.length, len);

        assert.strictEqual(typeof spec.testrig_JSON5circularRefHandler, 'function');
        assert.strictEqual(typeof spec.stripForSerialization, 'function');
        assert.strictEqual(typeof spec.reduceWhitespace, 'function');
        assert.strictEqual(typeof spec.trimErrorForTestReporting,  'function');
        assert.strictEqual(typeof spec.stripErrorStackPaths,  'function');
        assert.strictEqual(typeof spec.cleanStackTrace4Comparison, 'function');
    });

});

