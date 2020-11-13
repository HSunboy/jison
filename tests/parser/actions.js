const assert = require('chai').assert;
const Jison = require('../setup').Jison;
const RegExpLexer = require('../setup').RegExpLexer;


describe('Parser Actions', function () {
    it('test Semantic action basic return', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ]
            ]
        };
        let grammar = {
            bnf: {
                E   :[ [ 'E x', 'return 0' ],
                    [ 'E y', 'return 1' ],
                    '' ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('x'), 0, 'semantic action');
        assert.equal(parser.parse('y'), 1, 'semantic action');
    });

    it('test return null', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ]
            ]
        };
        let grammar = {
            bnf: {
                E   :[ [ 'E x', 'return null;' ],
                    '' ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('x'), null, 'semantic action');
    });

    it('test terminal semantic values are not null', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ]
            ]
        };
        let grammar = {
            bnf: {
                E   :[ [ 'E x', "return [$2 === 'x']" ],
                    [ 'E y', 'return [$2]' ],
                    '' ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.deepEqual(parser.parse('x'), [ true ], 'semantic action');
        assert.deepEqual(parser.parse('y'), [ 'y' ], 'semantic action');
    });

    it('test Semantic action stack lookup', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ]
            ]
        };
        let grammar = {
            bnf: {
                pgm :[ [ 'E', 'return $1' ] ],
                E   :[ [ 'B E', 'return $1+$2' ],
                    [ 'x', "$$ = 'EX'" ] ],
                B   :[ [ 'y', "$$ = 'BY'" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('x'), 'EX', 'return first token');
        assert.equal(parser.parse('yx'), 'BYEX', 'return first after reduction');
    });

    it('test Semantic actions on nullable grammar', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'A', 'return $1' ] ],
                A :[ [ 'x A', "$$ = $2+'x'" ],
                    [ '', "$$ = '->'" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('xx'), '->xx', 'return first after reduction');
    });

    it('test named semantic value', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'A', 'return $A' ] ],
                A :[ [ 'x A', "$$ = $A+'x'" ],
                    [ '', "$$ = '->'" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('xx'), '->xx', 'return first after reduction');
    });

    it('test ambiguous named semantic value', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ]
            ]
        };
        let grammar = {
            operators: [ [ 'left', 'y' ] ],
            bnf: {
                S :[ [ 'A', 'return $A' ] ],
                A :[ [ 'A y A', "$$ = $A2+'y'+$A1" ],
                    [ 'x', "$$ = 'x'" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('xyx'), 'xyx', 'return first after reduction');
    });

    it("test vars that look like named semantic values shouldn't be replaced", function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'A', 'return $A' ] ],
                A :[ [ 'x A', "var $blah = 'x', blah = 8; $$ = $A + $blah" ],
                    [ '', "$$ = '->'" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('xx'), '->xx', 'return first after reduction');
    });

    it('test previous semantic value lookup ($0)', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'A B', 'return $A + $B' ] ],
                A :[ [ 'A x', "$$ = $A+'x'" ], [ 'x', '$$ = $1' ] ],
                B :[ [ 'y', '$$ = $0' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('xxy'), 'xxxx', 'return first after reduction');
    });


    it('test negative semantic value lookup ($-1)', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ],
                [ 'z', "return 'z';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'G A B', 'return $G + $A + $B' ] ],
                G :[ [ 'z', '$$ = $1' ] ],
                A :[ [ 'A x', "$$ = $A+'x'" ], [ 'x', '$$ = $1' ] ],
                B :[ [ 'y', '$$ = $-1' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('zxy'), 'zxz', 'return first after reduction');
    });

    it('test Build AST', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'A', 'return $1;' ] ],
                A :[ [ 'x A', "$2.push(['ID',{value:'x'}]); $$ = $2;" ],
                    [ '', "$$ = ['A',{}];" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        let expectedAST = [ 'A', {},
            [ 'ID', { value:'x' } ],
            [ 'ID', { value:'x' } ],
            [ 'ID', { value:'x' } ] ];

        let r = parser.parse('xxx');
        assert.deepEqual(r, expectedAST);
    });

    it('test 0+0 grammar', function () {
        let lexData2 = {
            rules: [
                [ '0', "return 'ZERO';" ],
                [ '\\+', "return 'PLUS';" ],
                [ '$', "return 'EOF';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'E EOF',    'return $1' ] ],
                E :[ [ 'E PLUS T', "$$ = ['+',$1,$3]"  ],
                    [ 'T',        '$$ = $1' ]  ],
                T :[ [ 'ZERO',     '$$ = [0]' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData2);

        let expectedAST = [ '+', [ '+', [ 0 ], [ 0 ] ], [ 0 ] ];

        assert.deepEqual(parser.parse('0+0+0'), expectedAST);
    });

    it('test implicit $$ = $1 action', function () {
        let lexData2 = {
            rules: [
                [ '0', "return 'ZERO';" ],
                [ '\\+', "return 'PLUS';" ],
                [ '$', "return 'EOF';" ]
            ]
        };
        let grammar = {
            bnf: {
                S :[ [ 'E EOF',    'return $1' ] ],
                E :[ [ 'E PLUS T', "$$ = ['+',$1,$3]"  ],
                    'T' ],
                T :[ [ 'ZERO',     '$$ = [0]' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData2);

        let expectedAST = [ '+', [ '+', [ 0 ], [ 0 ] ], [ 0 ] ];

        assert.deepEqual(parser.parse('0+0+0'), expectedAST);
    });

    it('test yytext', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ]
            ]
        };
        let grammar = {
            bnf: {
                pgm :[ [ 'Xexpr', 'return $1;' ] ],
                Xexpr   :[ [ 'x', '$$ = yytext;' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('x'), 'x', 'return first token');
    });

    it('test yyleng', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ]
            ]
        };
        let grammar = {
            bnf: {
                pgm :[ [ 'Xexpr', 'return $1;' ] ],
                Xexpr   :[ [ 'x', '$$ = yyleng;' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('x'), 1, 'return first token');
    });

    it('test yytext more', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ]
            ]
        };
        let grammar = {
            bnf: {
                pgm :[ [ 'expr expr', 'return $1+$2;' ] ],
                expr   :[ [ 'x', '$$ = yytext;' ],
                    [ 'y', '$$ = yytext;' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('xy'), 'xy', 'return first token');
    });

    it('test action include', function () {
        let lexData = {
            rules: [
                [ 'y', "return 'y';" ]
            ]
        };
        let grammar = {
            bnf: {
                E   :[ [ 'E y', 'return test();' ],
                    '' ]
            },
            actionInclude:
                /* istanbul ignore next: `actionInclude` code is injected and then crashes the generated parser due to unreachable coverage global */
                function () {
                    function test(val) {
                        return 1;
                    }
                }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('y'), 1, 'semantic action');
    });

    it('test next token not shifted if only one action', function () {
        let lexData = {
            rules: [
                [ '\\(', "return '(';" ],
                [ '\\)', "return ')';" ],
                [ 'y', "return yy.xed ? 'yfoo' : 'ybar';" ]
            ]
        };
        let grammar = {
            bnf: {
                prog :[ 'e ybar' ],
                esub :[ [ '(', 'yy.xed = true;' ] ],
                e :[ [ 'esub yfoo )', 'yy.xed = false;' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.ok(parser.parse('(y)y'), 'should parse correctly');
    });

    it('test token array LIFO', function () {
        let lexData = {
            rules: [
                [ 'a', "return ['b','a'];" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            ebnf: {
                pgm :[ [ 'expr expr expr', 'return $1+$2+$3;' ] ],
                expr   :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            },
            options: { 'token-stack': true }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('ac'), 'abc', 'should return second token');
    });

    it('test YYACCEPT', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ]
            ]
        };
        let grammar = {
            bnf: {
                pgm :[ [ 'E', 'return $1' ] ],
                E   :[ [ 'B E', 'return $1+$2' ],
                    [ 'x', "$$ = 'EX'" ] ],
                B   :[ [ 'y', 'YYACCEPT' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('x'), 'EX', 'return first token');
        assert.equal(parser.parse('yx'), true, 'return first after reduction');
    });

    it('test YYABORT', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ]
            ]
        };
        let grammar = {
            bnf: {
                pgm :[ [ 'E', 'return $1' ] ],
                E   :[ [ 'B E', 'return $1+$2' ],
                    [ 'x', "$$ = 'EX'" ] ],
                B   :[ [ 'y', 'YYABORT' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('x'), 'EX', 'return first token');
        assert.equal(parser.parse('yx'), false, 'return first after reduction');
    });

    it('test parse params', function () {
        let lexData = {
            rules: [
                [ 'y', "return 'y';" ]
            ]
        };
        let grammar = {
            bnf: {
                E   :[ [ 'E y', 'return yy.first + yy.second;' ],
                    '' ]
            },
            parseParams: [ 'first', 'second' ]
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);

        assert.equal(parser.parse('y', 'foo', 'bar'), 'foobar', 'semantic action');
    });

    it('test symbol aliases', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            bnf: {
                pgm :[ [ 'expr[alice] expr[bob] expr[carol]', 'return $alice+$bob+$carol;' ] ],
                expr   :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('abc'), 'abc', 'should return original string');
    });

    it('test symbol aliases in ebnf (basic)', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            ebnf: {
                pgm :[ [ 'expr[alice] (expr[bob] expr[carol])+', "return $alice+'['+$2.join(',')+']';" ] ],
                expr   :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('abc'), 'a[b,c]', 'should tolerate aliases in subexpression');
    });

    it('test symbol aliases in ebnf (group alias)', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            ebnf: {
                pgm :[ [ 'expr[alice] (expr[bob] expr[carol])+[steve]', "return $alice+'['+$steve.join(',')+']';" ] ],
                expr   :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('abc'), 'a[b,c]', 'should accept alias for outer-most group expression');
    });

    it('test implicit symbol aliases in ebnf 1', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            ebnf: {
                pgm :[ [ 'expr (expr expr)+ expr', "return $expr1+'['+$2.join(',')+']'+$3;" ] ],
                expr   :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('abcb'), 'a[b,c]b', 'should accept implicit (numbered) alias for outer-most element');
    });

    it('test implicit symbol aliases in ebnf 2', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            ebnf: {
                pgm :[ [ 'expr (expr expr)+ expr', "return $expr1+'['+$2.join(',')+']'+$expr2;" ] ],
                expr   :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('abcb'), 'a[b,c]b', 'should accept implicit (and correctly numbered) alias for last outer-most element');
    });

    it('test implicit symbol aliases in ebnf 3', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            ebnf: {
                pgm :[ [ 'expr (expr expr)+ expr', "return $expr1+'['+$pgm_repetition_plus1.join(',')+']'+$expr2;" ] ],
                expr   :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('abcb'), 'a[b,c]b', 'should accept implicit (and correctly numbered) alias for EBNF wildcarded element');
    });

    it('test correct blocking of implicit numbered symbol aliases in ebnf', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            ebnf: {
                pgm :[ [ 'expr (expr expr)+ expr expr expr expr expr expr expr expr expr expr expr11',
                    "return $expr11+'['+$pgm_repetition_plus1.join(',')+']'+$expr1;" ] ],
                expr1  :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ],
                expr11 :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            }
        };

    //assert.equal(parser.parse('abcabcabcabcab'), "a[b,c]abcabcabcab", "should accept implicit (and correctly numbered) alias for EBNF wildcarded element");
        assert.throws(function () {
            let parser = new Jison.Parser(grammar);
        }, Error, /The action block references the named alias "expr1" which is not available in production/);
    });

    it('test correct blocking of using ambiguous named symbol references in ebnf', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            ebnf: {
                pgm :[ [ 'expr1 (expr1 expr1)+ expr1 expr1 expr1 expr1 expr1 expr1 expr1 expr1 expr1 expr1 expr1[expr11]',
                    "return $expr1+'['+$pgm_repetition_plus1.join(',')+']'+$expr11;" ] ],
                expr1  :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ],
                expr11 :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            }
        };

        assert.throws(function () {
            let parser = new Jison.Parser(grammar);
        // parser.lexer = new RegExpLexer(lexData);
        // assert.equal(parser.parse('abcabcabcabcab'), "a[b,c]b", "should accept implicit (and correctly numbered) alias for EBNF wildcarded element");
        }, Error, /The action block references the ambiguous named alias or term reference "expr1"/);
    });

    it('test correct use of unambiguous term reference constructs in ebnf', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            ebnf: {
                pgm :[ [ 'expr1 (expr1 expr1)+ expr1 expr1 expr1 expr1 expr1 expr1 expr1 expr1 expr1 expr1 expr1[expr11]',
                    "return $1+'['+$pgm_repetition_plus1.join(',')+']'+$expr11;" ] ],
                expr1  :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ],
                expr11 :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('abcabcabcabcab'), 'a[b,c]b', 'should accept implicit (and correctly numbered) alias for EBNF wildcarded element');
    });

    it('test correct use of unambiguous term references in ebnf (v2)', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            ebnf: {
                pgm :[ [ 'expr1[expr0] (expr1 expr1)+ expr1[expr2] expr1[expr3] expr1[expr4] expr1[expr5] expr1[expr6] expr1[expr7] expr1[expr8] expr1[expr9] expr1[expr10] expr1[expr11] expr1[expr12]',
                    "return $expr0+'['+$pgm_repetition_plus1.join(',')+']'+$expr2+$expr3+$expr4+$expr5+$expr6+$expr7+$expr8+$expr9+$expr10+$expr11+$expr12;" ] ],
                expr1  :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ],
                expr11 :[ [ 'a', "$$ = 'a';" ],
                    [ 'b', "$$ = 'b';" ],
                    [ 'c', "$$ = 'c';" ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('abcabcabcabcab'), 'a[b,c]abcabcabcab', 'should accept implicit (and correctly numbered) alias for EBNF wildcarded element');
    });

    it('test symbol aliases for terminals', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            bnf: {
                pgm :[ [ 'a[alice] b[bob] c[carol]', 'return $alice+$bob+$carol;' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('abc'), 'abc', 'should return original string');
    });

    it('test implicit (numbered) symbol aliases for terminals', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ]
            ]
        };
        let grammar = {
            bnf: {
                pgm :[ [ 'a b c', 'return $a1+$b1+$c1;' ] ]
            }
        };

        let parser = new Jison.Parser(grammar);
        parser.lexer = new RegExpLexer(lexData);
        assert.equal(parser.parse('abc'), 'abc', 'should return original string');
    });
});
