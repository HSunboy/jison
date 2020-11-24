//
// title: "empty lexer regex/rule [] is considered illegal. Use [^] or [\\s\\S] instead."
//
// ...
//

%%
"["[]"]" -> 'BAD_REGEX' // empty regex set...