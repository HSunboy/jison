const assert = require('chai').assert;
const Jison = require('../setup').Jison;
const Lexer = require('../setup').Lexer;


describe('Error Recovery/Handling', function () {
    it('test error caught', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ],
                [ '.', "return 'ERR';" ]
            ]
        };
        let grammar = {
            bnf: {
                A :[ 'A x',
                    'A y',
                    [ 'A error', "return 'caught';" ],
                    ''      ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lr0' });
        parser.lexer = new Lexer(lexData);
        assert.ok(parser.parse('xxy'), 'should parse');
        assert.equal(parser.parse('xyg'), 'caught', "should return 'caught'");
    });

    it('test error recovery', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ],
                [ '.', "return 'ERR';" ]
            ]
        };
        let grammar = {
            bnf: {
                A :[ 'A x',
                    [ 'A y', "return 'recovery'" ],
                    'A error',
                    ''      ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lr0' });
        parser.lexer = new Lexer(lexData);
        assert.equal(parser.parse('xxgy'), 'recovery', "should return 'recovery'");
    });

    it('test deep error recovery', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ],
                [ 'g', "return 'g';" ],
                [ ';', "return ';';" ],
                [ '.', "return 'ERR';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ 'g A ;',
                    [ 'g error ;', 'return "nested"' ]
                ],
                A :[ 'A x',
                    'x' ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lr0' });
        parser.lexer = new Lexer(lexData);
        assert.ok(parser.parse('gxxx;'), 'should parse');
        assert.equal(parser.parse('gxxg;'), 'nested', "should return 'nested'");
    });

    it('test no recovery', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ],
                [ '.', "return 'ERR';" ]
            ]
        };
        let grammar = {
            bnf: {
                A :[ 'A x',
                    [ 'A y', "return 'recovery'" ],
                    ''      ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lr0' });
        parser.lexer = new Lexer(lexData);

        let JisonParserError = parser.JisonParserError;
        assert(JisonParserError);

        assert.throws(function () {
            parser.parse('xxgy');
        }, JisonParserError, /Parse error on line \d+[^]*?got unexpected ERR/);
    });

    it('test error after error recovery', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ],
                [ 'g', "return 'g';" ],
                [ '.', "return 'ERR';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ 'g A y',
                    [ 'g error y', 'return "nested"' ]
                ],
                A :[ 'A x',
                    'x' ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lr0' });
        parser.lexer = new Lexer(lexData);

        let JisonParserError = parser.JisonParserError;
        assert(JisonParserError);

        assert.throws(function () {
            parser.parse('gxxx;');
        }, JisonParserError, /Parsing halted on line 1 while starting to recover from another error -- previous error which resulted in this fatal result: Parse error on line 1/);
    });

// WARNING: the actual test in here differs from what it says on the tin, as we differ from jison in error recovery behaviour in this regard:
    it('test throws error despite recovery rule', function () {
        let lexData2 = {
            rules: [
                [ '0', "return 'ZERO';" ],
                [ '\\+', "return 'PLUS';" ],
                [ ';', "return ';';" ],
                [ '.', "return 'INVALID'" ],
                [ '$', "return 'EOF';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'Exp EOF',    'return $1' ] ],
                Exp :[ [ 'E ;',    '$$ = $1;' ],
                    [ 'E error', '$$ = $1;' ] ],
                E :[ [ 'E PLUS T', "$$ = ['+',$1,$3]" ],
                    [ 'T',        '$$ = $1' ] ],
                T :[ [ 'ZERO',     '$$ = [0]' ] ]
            }
        };

        let parser = new Jison.Parser(grammar /*, {debug: true} */);
        parser.lexer = new Lexer(lexData2);

        let expectedAST = [ '+', [ '+', [ 0 ], [ 0 ] ], [ 0 ] ];

        assert.doesNotThrow(function () { parser.parse('0+0+0>'); });     // here we expect behaviour different from vanilla jison as our error recovery handling is a bit more sophisticated and this error is coped with

        // and since we have error recovery, we should see it at work:
        assert.deepEqual(parser.parse('0+0+0>'), expectedAST, "the error recovery rule should have gobbled the erroneous '>' at the end of the input");
    });

    it('test error recovery rule on replacement error', function () {
        let lexData2 = {
            rules: [
                [ '0', "return 'ZERO';" ],
                [ '\\+', "return 'PLUS';" ],
                [ ';', "return ';';" ],
                [ '.', "return 'INVALID'" ],
                [ '$', "return 'EOF';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'Exp EOF',    'return $1' ] ],
                Exp :[ [ 'E ;',    '$$ = $1;' ],
                    [ 'E error',    "$$ = [$1, 'E']" ],
                    [ 'E error PLUS E',    "$$ = [$1, 'E-plus', $E2]" ],
                    [ 'E error E',    "$$ = [$E1, 'E-duo', $E2]" ] ],
                E :[ [ 'E PLUS T', "$$ = ['+',$1,$3]" ],
                    [ 'T',        '$$ = $1' ] ],
                T :[ [ 'ZERO',     '$$ = [0]' ] ]
            }
        };

        let parser = new Jison.Parser(grammar /*, {debug: true} */);
        parser.lexer = new Lexer(lexData2);

        let expectedAST1 = [ [ '+', [ '+', [ 0 ], [ 0 ] ], [ 0 ] ], 'E' ];
        let expectedAST2 = [ [ '+', [ 0 ], [ 0 ] ], 'E-duo', [ '+', [ 0 ], [ 0 ] ] ];
        let expectedAST3 = [ [ '+', [ 0 ], [ 0 ] ], 'E-plus', [ 0 ] ];
        let expectedAST4 = [ [ 0 ], 'E-duo', [ '+', [ 0 ], [ 0 ] ] ];
        let expectedAST5 = [ [ 0 ], 'E-plus', [ 0 ] ];

        // here we expect behaviour **different** from vanilla jison
        // as our error recovery handling is a bit more sophisticated
        // (we don't have to restart with the original error-triggering token once recovery has completed:
        // we check if that is feasible and if not, we skip that token as well as part of the recovery process)
        assert.doesNotThrow(function () { parser.parse('0+0+0>'); }, 'round 1');
        assert.doesNotThrow(function () { parser.parse('0+0>0+0'); }, 'round 2');  // 'replacement error'
        assert.doesNotThrow(function () { parser.parse('0+0>+0'); }, 'round 3');   // 'insertion error'
        assert.doesNotThrow(function () { parser.parse('0+>0+0'); }, 'round 4');  // 'insertion error'
        assert.doesNotThrow(function () { parser.parse('0+>+0'); }, 'round 5');   // 'replacement error'

        assert.deepEqual(parser.parse('0+0+0>'), expectedAST1, 'round 1');
        assert.deepEqual(parser.parse('0+0>0+0'), expectedAST2, 'round 2');
        assert.deepEqual(parser.parse('0+0>+0'), expectedAST3, 'round 3');
        assert.deepEqual(parser.parse('0+>0+0'), expectedAST4, 'round 4');
        assert.deepEqual(parser.parse('0+>+0'), expectedAST5, 'round 5');
    });

    it('test correct AST after error recovery abrupt end', function () {
        let lexData2 = {
            rules: [
                [ '0', "return 'ZERO';" ],
                [ '\\+', "return 'PLUS';" ],
                [ ';', "return ';';" ],
                [ '$', "return 'EOF';" ],
                [ '.', "return 'INVALID';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'Exp EOF',    'return $1' ] ],
                Exp :[ [ 'E ;',    '$$ = $1;' ],
                    [ 'E error', '$$ = $1;' ] ],
                E :[ [ 'E PLUS T', "$$ = ['+',$1,$3]"  ],
                    [ 'T',        '$$ = $1' ]  ],
                T :[ [ 'ZERO',     '$$ = [0]' ] ]
            }
        };

        let parser = new Jison.Parser(grammar /*, {debug: true} */);
        parser.lexer = new Lexer(lexData2);

        let expectedAST = [ '+', [ '+', [ 0 ], [ 0 ] ], [ 0 ] ];

        assert.deepEqual(parser.parse('0+0+0'), expectedAST);
    });


    it('test bison error recovery example', function () {
        let lexData2 = {
            rules: [
                [ '0', "return 'ZERO';" ],
                [ '\\+', "return 'PLUS';" ],
                [ ';', "return ';';" ],
                [ '$', "return 'EOF';" ],
                [ '.', "return 'INVALID';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'stmt stmt EOF',    'return $1' ] ],
                stmt :[ [ 'E ;',    '$$ = $1;' ],
                    [ 'error ;', '$$ = $1;' ] ],
                E :[ [ 'E PLUS T', "$$ = ['+',$1,$3]"  ],
                    [ 'T',        '$$ = $1' ]  ],
                T :[ [ 'ZERO',     '$$ = [0]' ] ]
            }
        };

        let parser = new Jison.Parser(grammar /*, {debug: true} */);
        parser.lexer = new Lexer(lexData2);

        assert.ok(parser.parse('0+0++++>;0;'), 'should recover');
    });


    it('test parse error exception class API', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ '.', "return 'ERR';" ]
            ]
        };
        let grammar = {
            bnf: {
                A :[ 'A x',
                    ''      ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lr0' });
        parser.lexer = new Lexer(lexData);
        try {
            parser.parse('xxy'); // must fail with exception being thrown of specific type!
            assert(false, 'exception should have been thrown on parse error!');
        } catch (ex) {
            let JisonParserError = parser.JisonParserError;
            assert(JisonParserError);

            assert(ex instanceof Error);
            assert(ex instanceof JisonParserError);
            assert(ex.hash);
            assert(ex.message);

            // test API
            let t = new JisonParserError('test', 42);
            assert(t instanceof Error);
            assert(t instanceof JisonParserError);
            assert(t.hash === 42);
            assert(t.message === 'test');
            assert(t.toString() === 'JisonParserError: test');

            let t2 = new Error('a');
            let t3 = new JisonParserError('test', { exception: t2 });
            assert(t2 instanceof Error);
            assert(!(t2 instanceof JisonParserError));
            assert(t3 instanceof Error);
            assert(t3 instanceof JisonParserError);
            assert(!t2.hash);
            assert(t3.hash);
            assert(t3.hash.exception);
            assert(t2.message === 'a');
            assert(t3.message === 'a');
            assert(t2.toString() === 'Error: a');
            assert(t3.toString() === 'JisonParserError: a');

        }
    });

    it('test lex error exception class API', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ]
            ]
        };
        let grammar = {
            bnf: {
                A :[ 'A x',
                    ''      ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lr0' });
        parser.lexer = new Lexer(lexData);
        try {
            parser.parse('xxy'); // must fail with exception being thrown of specific type!
            assert(false, 'exception should have been thrown on lex error!');
        } catch (ex) {
            let JisonParserError = parser.JisonParserError;
            assert(JisonParserError);

            assert(ex instanceof Error);
            assert(!(ex instanceof JisonParserError));

            assert(parser.lexer);
            let JisonLexerError = parser.lexer.JisonLexerError;
            assert(JisonLexerError);

            assert(ex instanceof JisonLexerError);
            assert(ex.hash);
            assert(ex.message);


            // test API
            let t = new JisonLexerError('test', 42);
            assert(t instanceof Error);
            assert(t instanceof JisonLexerError);
            assert(t.hash === 42);
            assert(t.message === 'test');
            assert(t.toString() === 'JisonLexerError: test');

            let t2 = new Error('a');
            let t3 = new JisonLexerError('test', { exception: t2 });
            assert(t2 instanceof Error);
            assert(!(t2 instanceof JisonLexerError));
            assert(t3 instanceof Error);
            assert(t3 instanceof JisonLexerError);
            assert(!t2.hash);
            assert(t3.hash);
            assert(t3.hash.exception);
            assert(t2.message === 'a');
            assert(t3.message === 'a');
            assert(t2.toString() === 'Error: a');
            assert(t3.toString() === 'JisonLexerError: a');
        }
    });

    it('parser comes with its own JisonParserError exception/error class', function () {
        let grammar = [
            '%lex',
            '',
            '%%',
            '',
            'x      return "x";',
            '',
            '/lex',
            '',
            '%%',
            '',
            'A: A x',
            ' | %epsilon',
            ' ;'
        ].join('\n');

        let parser = new Jison.Parser(grammar, { type: 'lalr' });
        let lexer = parser.lexer;
        assert(lexer);
        let JisonLexerError = lexer.JisonLexerError;
        assert(JisonLexerError);
        // assert(JisonLexerError instanceof Error);
        assert((new JisonLexerError('x')) instanceof Error);

        let JisonParserError = parser.JisonParserError;
        assert(JisonParserError);
        // assert(JisonParserError instanceof Error);
        assert((new JisonParserError('x')) instanceof Error);

        let t = new JisonLexerError('test', 42);
        assert(t instanceof Error);
        assert(t instanceof JisonLexerError);
        assert(t.hash === 42);
        assert(t.message === 'test');
        assert(t.toString() === 'JisonLexerError: test');

        let t2 = new Error('a');
        let t3 = new JisonLexerError('test', { exception: t2 });
        assert(t2 instanceof Error);
        assert(!(t2 instanceof JisonLexerError));
        assert(t3 instanceof Error);
        assert(t3 instanceof JisonLexerError);
        assert(!t2.hash);
        assert(t3.hash);
        assert(t3.hash.exception);
        assert(t2.message === 'a');
        assert(t3.message === 'a');
        assert(t2.toString() === 'Error: a');
        assert(t3.toString() === 'JisonLexerError: a');
    });

    it('parser errors are thrown using its own JisonParserError exception/error class', function () {
        let dict = [
            '%%',
            "'x'     {return 'X';}"
        ].join('\n');

        let lexer = new Lexer(dict);
        let JisonLexerError = lexer.JisonLexerError;
        assert(JisonLexerError);
        assert((new JisonLexerError('x')) instanceof Error);

        let input = 'xxyx';

        lexer.setInput(input);
        assert.equal(lexer.lex(), 'X');
        assert.equal(lexer.lex(), 'X');
        let ex1 = null;
        try {
            lexer.lex();
            assert(false, 'should never get here!');
        } catch (ex) {
            assert(ex instanceof Error);
            assert(ex instanceof JisonLexerError);
            assert(/JisonLexerError:[^]*?Unrecognized text\./.test(ex));
            assert(ex.hash);
            assert.equal(typeof ex.hash.errStr, 'string');
            assert.equal(typeof ex.message, 'string');
            ex1 = ex;
        }
        // since the lexer has been using the standard parseError method,
        // which throws an exception **AND DOES NOT MOVE THE READ CURSOR FORWARD**,
        // we WILL observe the same error again on the next invocation:
        try {
            lexer.lex();
            assert(false, 'should never get here!');
        } catch (ex) {
            assert(ex instanceof Error);
            assert(ex instanceof JisonLexerError);
            assert(/JisonLexerError:[^]*?Unrecognized text\./.test(ex));
            assert(ex.hash);
            assert.equal(typeof ex.hash.errStr, 'string');
            assert.equal(typeof ex.message, 'string');

            assert.strictEqual(ex.message, ex1.message);
            let check_items = [ 'text', 'line', 'loc', 'errStr' ];
            check_items.forEach(function (item) {
                assert.deepEqual(ex[item], ex1[item], "both exceptions should have a matching member '" + item + "'");
            });
        }
        // however, when we apply a non-throwing parseError, we MUST shift one character
        // forward on error:
        lexer.parseError = function (str, hash) {
            assert(hash);
            assert(str);
            // and make sure the `this` reference points right back at the current *lexer* instance!
            assert.equal(this, lexer);
        };
        assert.equal(lexer.lex(), lexer.ERROR);
        assert.equal(lexer.yytext, 'y');          // the one character shifted on error should end up in the lexer "value", i.e. `yytext`!

        assert.equal(lexer.lex(), 'X');
        assert.equal(lexer.yytext, 'x');
        assert.equal(lexer.lex(), lexer.EOF);
    });

    xit("default parser and lexer parseError() hooks should be linked up so that lexer errors travel through the parser's parseError() hook", function () {
    });

    xit('lexer and parser errors travelling via parseError() should be identifiable by their specific exception class instance', function () {
    });

});



