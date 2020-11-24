//
// title: "lexer regex/rule [...] set may legally include whitespace"
//
// ...
//

%%
"["[abc -> 'BAD_REGEX' // unterminated regex set...

// Let's have a look if the lexer correctly terminates that bad set on the first newline it encounters...

"dummy" -> 'GOOD_DUMMY'
