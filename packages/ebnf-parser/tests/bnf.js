const assert = require('chai').assert;
const bnf = require('../dist/ebnf-parser-cjs');
const path = require('path');
const fs = require('fs');

const Jison = require('../../../../jison/');  // jison-gho

describe('BNF parser', function () {
    xit('test BNF production', function () {
        let grammar = fs.readFileSync(path.normalize(path.join(__dirname, 'specs/bnf-0001-grammar.jison')), 'utf8');

        let parser = new Jison.Parser(grammar);
        parser.yy.addDeclaration = function (grammar, decl) {
            if (decl.start) {
                grammar.start = decl.start;
                delete decl.start;
            }
            if (decl.operator) {
                if (!grammar.operators) {
                    grammar.operators = [];
                }
                grammar.operators.push(decl.operator);
                delete decl.operator;
            }

            // debug/testing:
            let remaining_keys = Object.keys(decl);
            if (remaining_keys.length > 0) {
                console.error("Error: unsupported decl keys:", { keys, decl });
                assert(!"should never get here");
            }
        };

        let input = fs.readFileSync(path.normalize(path.join(__dirname, 'specs/inputs/bnf-0001-grammar.input.txt')), 'utf8');
        let result = parser.parse(input);
        assert.ok(result, 'parse bnf production');
    });
});

