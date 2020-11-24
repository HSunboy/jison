//
// title: "one form of lexer regex [...] set which encompasses *all* characters, used often in JavaScript circles."
//
// ...
//

%%
"["[^]"]" -> 'GOOD_REGEX' // [^] matches ANY char...