//
// title: "error in lexer regex/rule: [...] set spread across multiple lines"
//
// ...
//

%%
"["[abc
def]"]" -> 'BAD_REGEX'

