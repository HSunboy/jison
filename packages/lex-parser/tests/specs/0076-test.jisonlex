//
// title: "lexer regex/rule [...] set may legally include whitespace"
//
// ...
//

%%
"["[abc \xA0 \u1234 \166 def]"]" -> 'GOOD_REGEX'

