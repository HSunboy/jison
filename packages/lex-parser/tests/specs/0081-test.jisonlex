//
// title: "one form of lexer regex [...] set which encompasses *all* characters, used often in JavaScript circles."
//
// ...
//

%%
"["[\s\S]"]" -> 'GOOD_REGEX' // [\s\S] matches ANY char...