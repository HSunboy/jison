const assert = require('chai').assert;
const json2jison = require('../json2jison.js');

// TODO real tests

describe('JSON2JISON', function () {
    it('should be able to convert an appropriate JSON file to a JISON grammar', function () {
        let grammar = '%% foo : bar { return true; } ;';
        let json = {
            bnf: {
                foo: [
                    [
                        [
                            [
                                'symbol',
                                'bar'
                            ]
                        ],
                        'return true'
                    ]
                ]
            },
            grammar: {
                foo: [
                    [
                        [
                            [
                                'symbol',
                                'bar'
                            ]
                        ],
                        'return true'
                    ]
                ]
            }
        };

        let rv = json2jison.convert(json);
        assert.equal(rv.trim().replace(/\s+/g, ' '), grammar.replace(/\s+/g, ' '));
    });
});

