//
// title: "typo error in lexer regex/rule: [...]]"
//
// ...
//

%%
"["[^\\]]"]" -> 'BAD_REGEX'

