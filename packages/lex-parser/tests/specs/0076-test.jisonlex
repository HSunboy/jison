//
// title: "lexer regex/rule [...] set may legally include whitespace"
// test_input: 'a[abc\u1234]b'
//
// ...
//

%%
"["[abc \xA0 \u1234 \166 def]"]" -> 'GOOD_REGEX'

