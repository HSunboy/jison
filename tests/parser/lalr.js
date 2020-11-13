const assert = require('chai').assert;
const Jison = require('../setup').Jison;
const Lexer = require('../setup').Lexer;


const lexData = {
    rules: [
        [ 'x', "return 'x';" ],
        [ 'y', "return 'y';" ]
    ]
};


describe('LALR(1)', function () {
    it('test left-recursive nullable grammar', function () {

        let grammar = {
            tokens: [ 'x' ],
            startSymbol: 'A',
            bnf: {
                A :[ 'A x',
                    ''      ]
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'lalr', hasPartialLrUpgradeOnConflict: false });
        let parser = gen.createParser();
        let JisonParserError = parser.JisonParserError;
        assert(JisonParserError);

        parser.lexer = new Lexer(lexData);
        assert(parser.lexer);
        let JisonLexerError = parser.lexer.JisonLexerError;
        assert(JisonLexerError);

        assert.equal(gen.nullable('A'), true, 'A is nullable');

        assert.ok(parser.parse('xxx'), "parse 3 x's");
        assert.ok(parser.parse('x'),   'parse single x');

        // also test the two different types of errors a parser can produce:

        assert.throws(function () {
            parser.parse('y');
        }, JisonParserError, /Parse error on line[^]*?got unexpected y/);

        assert.throws(function () {
            parser.parse('+');
        }, JisonLexerError, /Lexical error on line[^]*?Unrecognized text/);

        assert.strictEqual(gen.conflicts, 0, 'no conflicts');

        // parsers generated 'live' have a few extra members copied over from
        // the JISON parser generator engine itself:
        // - conflicts (count)
        // - productions (rule set)
        // - unused_productions (rule set)
        // which is a feature we employ here to check no conflicts have been
        // reported during grammar compilation:
        assert.strictEqual(parser.conflicts, 0, 'no conflicts');
    });

    it('test right-recursive nullable grammar', function () {

        let grammar = {
            tokens: [ 'x' ],
            startSymbol: 'A',
            bnf: {
                A :[ 'x A',
                    ''      ]
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'lalr', debug: false, hasPartialLrUpgradeOnConflict: false });

        assert.equal(gen.table.length, 4, 'table has 4 states');
        assert.equal(gen.conflicts, 0, 'no conflicts');

        let parser = gen.createParser();
        let JisonParserError = parser.JisonParserError;
        assert(JisonParserError);

        parser.lexer = new Lexer(lexData);
        let JisonLexerError = parser.lexer.JisonLexerError;
        assert(JisonLexerError);

        assert.ok(parser.parse('xxx'), "parse 3 x's");
        assert.ok(parser.parse('x'),   'parse single x');

        assert.equal(gen.nullable('A'), true, 'A is nullable');

        // also test the two different types of errors a parser can produce:

        assert.throws(function () {
            parser.parse('y');
        }, JisonParserError, /Parse error on line[^]*?got unexpected y/);

        assert.throws(function () {
            parser.parse('+');
        }, JisonLexerError, /Lexical error on line[^]*?Unrecognized text/);
    });

    it('test 0+0 grammar', function () {
        let lexData2 = {
            rules: [
                [ '0', "return 'ZERO';" ],
                [ '\\+', "return 'PLUS';" ]
            ]
        };
        let grammar = {
            tokens: [ 'ZERO', 'PLUS' ],
            startSymbol: 'E',
            bnf: {
                E :[ 'E PLUS T',
                    'T'      ],
                T :[ 'ZERO' ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lalr', hasPartialLrUpgradeOnConflict: false });
        let JisonParserError = parser.JisonParserError;
        assert(JisonParserError);

        parser.lexer = new Lexer(lexData2);

        assert.ok(parser.parse('0+0+0'), 'parse');
        assert.ok(parser.parse('0'), 'parse single 0');

        assert.throws(function () {
            parser.parse('+');
        }, JisonParserError, /Parse error on line \d+[^]*?Expecting "ZERO", "E", "T", got unexpected "PLUS"/);
    });

    it('test LALR algorithm from Bermudez, Logothetis', function () {
        let lexData = {
            rules: [
                [ 'a', "return 'a';" ],
                [ 'b', "return 'b';" ],
                [ 'c', "return 'c';" ],
                [ 'd', "return 'd';" ],
                [ 'g', "return 'g';" ]
            ]
        };
        let grammar = {
            tokens: 'a b c d g',
            startSymbol: 'S',
            bnf: {
                S :[ 'a g d',
                    'a A c',
                    'b A d',
                    'b g c' ],
                A :[ 'B' ],
                B :[ 'g' ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lalr', hasPartialLrUpgradeOnConflict: false });
        parser.lexer = new Lexer(lexData);
        assert.ok(parser.parse('agd'));
        assert.ok(parser.parse('agc'));
        assert.ok(parser.parse('bgd'));
        assert.ok(parser.parse('bgc'));
    });

    it('test basic JSON grammar', function () {
        let grammar = {
            lex: {
                macros: {
                    digit: '[0-9]',
                    esc: '\\\\',
                    int: '-?(?:[0-9]|[1-9][0-9]+)',
                    exp: '(?:[eE][-+]?[0-9]+)',
                    frac: '(?:\\.[0-9]+)'
                },
                rules: [
                    [ '\\s+', '/* skip whitespace */' ],
                    [ '{int}{frac}?{exp}?\\b', "return 'NUMBER';" ],
                    [ '"(?:{esc}["bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^"{esc}])*"', "yytext = yytext.substr(1,yyleng-2); return 'STRING';" ],
                    [ '\\{', "return '{'" ],
                    [ '\\}', "return '}'" ],
                    [ '\\[', "return '['" ],
                    [ '\\]', "return ']'" ],
                    [ ',', "return ','" ],
                    [ ':', "return ':'" ],
                    [ 'true\\b', "return 'TRUE'" ],
                    [ 'false\\b', "return 'FALSE'" ],
                    [ 'null\\b', "return 'NULL'" ]
                ]
            },

            tokens: 'STRING NUMBER { } [ ] , : TRUE FALSE NULL',
            bnf: {
                JsonThing: [ 'JsonObject',
                    'JsonArray' ],

                JsonObject: [ '{ JsonPropertyList }' ],

                JsonPropertyList: [ 'JsonProperty',
                    'JsonPropertyList , JsonProperty' ],

                JsonProperty: [ 'StringLiteral : JsonValue' ],

                JsonArray: [ '[ JsonValueList ]' ],

                JsonValueList: [ 'JsonValue',
                    'JsonValueList , JsonValue' ],

                JsonValue: [ 'StringLiteral',
                    'NumericalLiteral',
                    'JsonObject',
                    'JsonArray',
                    'TRUE',
                    'FALSE',
                    'NULL' ],

                StringLiteral: [ 'STRING' ],

                NumericalLiteral: [ 'NUMBER' ]
            }
        };

        let source = '{"foo": "Bar", "hi": 42, "array": [1, 2, 3.004, -4.04e-4], "false": false, "true": true, "null": null, "obj": {"ha": "ho"}, "string": "str\\ting\\"sgfg" }';

        let gen = new Jison.Generator(grammar, { type: 'lalr', hasPartialLrUpgradeOnConflict: false });
        let parser = gen.createParser();
        let gen2 = new Jison.Generator(grammar, { type: 'slr' });
        let parser2 = gen2.createParser();
        assert.deepEqual(gen.table, gen2.table, 'SLR(1) and LALR(1) tables should be equal');
        assert.ok(parser.parse(source));
    });

    it('test an LR(1) grammar in strict LALR mode', function () {
        let grammar = {
            comment: 'Produces a reduce-reduce conflict unless using LR(1).',
            tokens: 'z d b c a',
            start: 'S',
            bnf: {
                S :[ 'a A c',
                    'a B d',
                    'b A d',
                    'b B c' ],
                A :[ 'z' ],
                B :[ 'z' ]
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'lalr', hasPartialLrUpgradeOnConflict: false });
        assert.equal(gen.conflicts, 2);
    });

    it('test an LR(1) grammar in LALR mode with partial-lr-upgrade-on-conflict option', function () {
        let grammar = {
            comment: 'Produces a reduce-reduce conflict unless using LR(1).',
            tokens: 'z d b c a',
            start: 'S',
            bnf: {
                S :[ 'a A c',
                    'a B d',
                    'b A d',
                    'b B c' ],
                A :[ 'z' ],
                B :[ 'z' ]
            }
        };

        let gen = new Jison.Generator(grammar, { type: 'lalr', hasPartialLrUpgradeOnConflict: true });
        assert.equal(gen.conflicts, 2);
    });

    it('test BNF grammar bootstrap', function () {
        let grammar = "%%\n\nspec\n    : declaration_list '%%' grammar EOF\n        {$$ = $1; $$.bnf = $3; return $$;}\n    | declaration_list '%%' grammar '%%' EOF\n        {$$ = $1; $$.bnf = $3; return $$;}\n    ;\n\ndeclaration_list\n    : declaration_list declaration\n        {$$ = $1; yy.addDeclaration($$, $2);}\n    | \n        %{$$ = {};%}\n    ;\n\ndeclaration\n    : START id\n        %{$$ = {start: $2};%}\n    | operator\n        %{$$ = {operator: $1};%}\n    ;\n\noperator\n    : associativity token_list\n        {$$ = [$1]; $$.push.apply($$, $2);}\n    ;\n\nassociativity\n    : LEFT\n        {$$ = 'left';}\n    | RIGHT\n        {$$ = 'right';}\n    | NONASSOC\n        {$$ = 'nonassoc';}\n    ;\n\ntoken_list\n    : token_list symbol\n        {$$ = $1; $$.push($2);}\n    | symbol\n        {$$ = [$1];}\n    ;\n\ngrammar\n    : production_list\n        {$$ = $1;}\n    ;\n\nproduction_list\n    : production_list production\n        {$$ = $1; $$[$2[0]] = $2[1];}\n    | production\n        %{$$ = {}; $$[$1[0]] = $1[1];%}\n    ;\n\nproduction\n    : id ':' handle_list ';'\n        {$$ = [$1, $3];}\n    ;\n\nhandle_list\n    : handle_list '|' handle_action\n        {$$ = $1; $$.push($3);}\n    | handle_action\n        {$$ = [$1];}\n    ;\n\nhandle_action\n    : handle action prec\n        {$$ = [($1.length ? $1.join(' ') : '')];\n            if($2) $$.push($2);\n            if($3) $$.push($3);\n            if ($$.length === 1) $$ = $$[0];\n        }\n    ;\n\nhandle\n    : handle symbol\n        {$$ = $1; $$.push($2)}\n    | \n        {$$ = [];}\n    ;\n\nprec\n    : PREC symbol\n        %{$$ = {prec: $2};%}\n    | \n        {$$ = null;}\n    ;\n\nsymbol\n    : id\n        {$$ = $1;}\n    | STRING\n        {$$ = yytext;}\n    ;\n\nid\n    : ID\n        {$$ = yytext;}\n    ;\n\naction\n    : ACTION\n        {$$ = yytext;}\n    | \n        {$$ = '';}\n    ;\n\n";

        let lex = "\n%%\n\\s+    \t{/* skip whitespace */}\n\"/*\"[^*]*\"*\"    \t{return yy.lexComment(this);}\n[a-zA-Z][a-zA-Z0-9_-]*    \t{return 'ID';}\n'\"'[^\"]+'\"'    \t{yytext = yytext.substr(1, yyleng-2); return 'STRING';}\n\"'\"[^']+\"'\"    \t{yytext = yytext.substr(1, yyleng-2); return 'STRING';}\n\":\"    \t{return ':';}\n\";\"    \t{return ';';}\n\"|\"    \t{return '|';}\n\"%%\"    \t{return '%%';}\n\"%prec\"    \t{return 'PREC';}\n\"%start\"    \t{return 'START';}\n\"%left\"    \t{return 'LEFT';}\n\"%right\"    \t{return 'RIGHT';}\n\"%nonassoc\"    \t{return 'NONASSOC';}\n\"%\"[a-zA-Z]+[^\\n]*    \t{/* ignore unrecognized decl */}\n\"{{\"[^}]*\"}\"    \t{return yy.lexAction(this);}\n\"{\"[^}]*\"}\"    \t{yytext = yytext.substr(1, yyleng-2); return 'ACTION';}\n\"%{\"(.|\\n)*?\"%}\"    	{yytext = yytext.substr(2, yyleng-4);return 'ACTION';} \n.    \t{/* ignore bad characters */}\n<<EOF>>    \t{return 'EOF';}\n\n%%\n\n";


        let gen = new Jison.Generator(grammar, { type: 'lalr', hasPartialLrUpgradeOnConflict: false });
        gen.lexer = new Lexer(lex);

        let parser = gen.createParser();

        assert.ok(parser.parse(grammar), 'bootstrapped bnf parser should parse correctly.');
    });

    it('test compilers test grammar', function () {
        let grammar = {
            tokens: [ 'x' ],
            startSymbol: 'S',
            bnf: {
                S :[ 'A' ],
                A :[ 'B A', '' ],
                B :[ '', 'x' ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lalr', hasPartialLrUpgradeOnConflict: false });
        parser.lexer = new Lexer(lexData);

        assert.ok(parser.parse('xxx'), 'parse');
    });

    it('test compilers test grammar 2', function () {
        let grammar = '%% n : a b ; a : | a x ; b : | b x y ;';

        let parser = new Jison.Generator(grammar, { type: 'lalr', hasPartialLrUpgradeOnConflict: false });

        assert.equal(parser.conflicts, 1, 'only one conflict');
    });

    it('test nullables', function () {
        let lexData = {
            rules: [
                [ 'x', "return 'x';" ],
                [ 'y', "return 'y';" ],
                [ 'z', "return 'z';" ],
                [ ';', "return ';';" ]
            ]
        };
        let grammar = {
            tokens: [ ';', 'x', 'y', 'z' ],
            startSymbol: 'S',
            bnf: {
                S :[ 'A ;' ],
                A :[ 'B C' ],
                B :[ 'x' ],
                C :[ 'y', 'D' ],
                D :[ 'F' ],
                F :[ '', 'F z' ]
            }
        };

        let parser = new Jison.Parser(grammar, { type: 'lalr', hasPartialLrUpgradeOnConflict: false });
        parser.lexer = new Lexer(lexData);

        assert.ok(parser.parse('x;'), 'parse');
    });
});

