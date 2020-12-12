const bnfParser = require('../ebnf-parser');
const lexParser = require('../lex-parser');

function processGrammar(rawGrammar, lex) {
    let grammar = bnfParser.parse(rawGrammar);
    if (lex) {
        grammar.lex = lexParser.parse(lex);
    }

    // trick to reposition `bnf` after `lex` in serialized JSON
    grammar.bnf = grammar.bnf;

    return grammar;
}

exports.convert = processGrammar;

