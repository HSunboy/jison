//
// title: "empty lexer regex/rule [] is considered illegal. Use [^] or [\\s\\S] instead."
// test_input: 'a [\u14a7"\nNL\tbecky foo[bar]] b'
//
// ...
//

%%
"["[]"]" -> 'BAD_REGEX' // empty regex set...