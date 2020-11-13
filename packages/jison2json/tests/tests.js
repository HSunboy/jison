// TODO real tests
const assert = require('chai').assert;
const jison2json = require('../jison2json');

describe('JISON2JSON', function () {
    it('should convert a simple jison grammar file correctly', function () {
        let grammar = '%% foo: bar { return true; };';

        let json = jison2json.convert(grammar);
        let expected = {
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
        let rv = JSON.parse(json);
        assert.deepEqual(rv, expected);
    });
});

