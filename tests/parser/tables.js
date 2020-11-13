const assert = require('chai').assert;
const Jison = require('../setup').Jison;


const lexData = {
    rules: [
        [ 'a', "return 'a';" ],
        [ 'b', "return 'b';" ],
        [ 'c', "return 'c';" ],
        [ 'd', "return 'd';" ],
        [ 'e', "return 'e';" ],
        [ 'x', "return 'x';" ],
        [ 'y', "return 'y';" ],
        [ 'z', "return 'z';" ]
    ]
};

describe('Parser Tables', function () {
    it('test right-recursive nullable grammar', function () {
        let grammar = {
            tokens: [ 'x' ],
            startSymbol: 'A',
            bnf: {
                A :[ 'x A',
                    ''      ]
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'slr' });
        let gen2 = new Jison.Generator(grammar, { type: 'lalr' });

        assert.equal(gen.table.length, 4, 'table has 4 states');
        assert.equal(gen.nullable('A'), true, 'A is nullable');
        assert.equal(gen.conflicts, 0, 'should have no conflict');
        assert.deepEqual(gen.table, gen2.table, 'should have identical tables');
    });

    it('test slr lalr lr tables are equal', function () {
        let grammar = {
            tokens: [ 'ZERO', 'PLUS' ],
            startSymbol: 'E',
            bnf: {
                E :[ 'E PLUS T',
                    'T'      ],
                T :[ 'ZERO' ]
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'slr' });
        let gen2 = new Jison.Generator(grammar, { type: 'lalr' });
        let gen3 = new Jison.Generator(grammar, { type: 'lr' });

        assert.deepEqual(gen.table, gen2.table, 'slr lalr should have identical tables');
        assert.deepEqual(gen2.table, gen3.table, 'lalr lr should have identical tables');
    });

    it('test LL parse table', function () {
        let grammar = {
            tokens: [ 'x' ],
            startSymbol: 'A',
            bnf: {
                A :[ 'x A',
                    ''      ]
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'll' });

        assert.deepEqual(gen.table, { $accept:{ x:[ 0 ], $end:[ 0 ] }, A:{ x:[ 1 ], $end:[ 2 ] } }, 'll table has 2 states');
    });

    it('test LL parse table with conflict', function () {

        let grammar = {
            tokens: [ 'x' ],
            startSymbol: 'L',
            bnf: {
                L :[ 'T L T',
                    ''      ],
                T :[ 'x' ]
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'll' });
        assert.equal(gen.conflicts, 1, 'should have 1 conflict');
    });

    it('test Ambigous grammar', function () {
        let grammar = {
            tokens: [ 'x', 'y' ],
            startSymbol: 'A',
            bnf: {
                A :[ 'A B A',
                    'x'      ],
                B :[ '',
                    'y'      ]
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'lr' });
        assert.equal(gen.conflicts, 2, 'should have 2 conflict');
    });

    // for Minimal LR testing. Not there yet.
    it('test Spector grammar G1', function () {
        let grammar = {
            tokens: 'z d b c a',
            startSymbol: 'S',
            bnf: {
                S :[ 'a A c',
                    'a B d',
                    'b A d',
                    'b B c' ],
                A :[ 'z' ],
                B :[ 'z' ]
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'lalr', debug: false });
        assert.ok(!gen.DEBUG, 'should have DEBUG *DIS*abled');
        assert.strictEqual(gen.conflicts, 2, 'should have 2 conflicts');

        let parser = gen.createParser();
        let JisonParserError = parser.JisonParserError;
        assert(JisonParserError);

        parser.lexer = gen.createLexer(lexData);
        let JisonLexerError = parser.lexer.JisonLexerError;
        assert(JisonLexerError);

        assert.ok(parser.parse('azc'), "parse 'azc'");

        // The if(0)'d checks are the ones you would expect to work if this
        // was an LALR(2) or LR(2) parser, which would have reported ZERO CONFLICTS:

        if (0) {
            assert.ok(parser.parse('azd'), "parse 'azd'");
        } else {
            assert.throws(function () {
                parser.parse('azd');
            }, JisonParserError, /Parse error on line[^]*?got unexpected "d"/);
        }
        if (0) {
            assert.ok(parser.parse('bzc'), "parse 'bzc'");
        } else {
            assert.throws(function () {
                parser.parse('bzc');
            }, JisonParserError, /Parse error on line[^]*?got unexpected "c"/);
        }
        assert.ok(parser.parse('bzd'), "parse 'bzd'");
    });

    it('test De Remer G4', function () {
        let grammar = {
            tokens: 'z d b c a',
            startSymbol: 'S',
            bnf: {
                S : 'a A d | b A c | b B d',
                A : 'e A | e',
                B : 'e B | e'
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'lalr', debug: false });
        assert.strictEqual(gen.conflicts, 0, 'should have no conflict');

        let parser = gen.createParser();
        let JisonParserError = parser.JisonParserError;
        assert(JisonParserError);

        parser.lexer = gen.createLexer(lexData);
        let JisonLexerError = parser.lexer.JisonLexerError;
        assert(JisonLexerError);

        assert.ok(parser.parse('aed'), "parse 'aed'");
        assert.ok(parser.parse('bec'), "parse 'bec'");
        assert.ok(parser.parse('bed'), "parse 'bed'");
        assert.ok(parser.parse('beec'), "parse 'beec'");
        assert.ok(parser.parse('beed'), "parse 'beed'");
    });
});
