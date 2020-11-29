{
  error: {
    message: `Lexical error on line 10: 
unsupported lexer input: "."
while lexing in "options" state.

If this input was intentional, you might want to put quotes around
it; any JavaScript string quoting style is accepted (single quotes,
double quotes *or* backtick quotes a la ES6 string templates).

  Erroneous area:
 7: [A-Z]           -> 'A'
 8: 
 9: %%
10: %include bugger-it-millenium-hands-and-shrimp.js
^^...............................................^
`,
    type: 'JisonLexerError',
    stack: `JisonLexerError: Lexical error on line 10: 
unsupported lexer input: "."
while lexing in "options" state.

If this input was intentional, you might want to put quotes around
it; any JavaScript string quoting style is accepted (single quotes,
double quotes *or* backtick quotes a la ES6 string templates).

  Erroneous area:
 7: [A-Z]           -> 'A'
 8: 
 9: %%
10: %include bugger-it-millenium-hands-and-shrimp.js
^^...............................................^

    at Object.parseError (/regexp-lexer-cjs.js:7173:15)
    at Object.lexer_parseError [as parseError] (/regexp-lexer-cjs.js:9268:44)
    at Object.yyError [as yyerror] (/regexp-lexer-cjs.js:9299:19)
    at Object.lexer__performAction [as performAction] (/regexp-lexer-cjs.js:11399:13)
    at Object.lexer_test_match [as test_match] (/regexp-lexer-cjs.js:10204:38)
    at Object.lexer_next [as next] (/regexp-lexer-cjs.js:10327:28)
    at Object.lexer_lex [as lex] (/regexp-lexer-cjs.js:10412:18)
    at stdLex (/regexp-lexer-cjs.js:7745:27)
    at Object.parse (/regexp-lexer-cjs.js:7942:30)
    at Object.yyparse [as parse] (/regexp-lexer-cjs.js:12337:25)
    at autodetectAndConvertToJSONformat (/regexp-lexer-cjs.js:13531:35)
    at processGrammar (/regexp-lexer-cjs.js:16629:12)
    at test_me (/regexp-lexer-cjs.js:14512:23)
    at new RegExpLexer (/regexp-lexer-cjs.js:14630:17)
    at Context.testEachLexerExample (/regexplexer.js:3720:25)
    at callFn (/runnable.js:364:21)
    at Test.Runnable.run (/runnable.js:352:5)
    at Runner.runTest (/runner.js:677:10)
    at /runner.js:801:12
    at next (/runner.js:594:14)
    at /runner.js:604:7
    at next (/runner.js:486:14)
    at cbHookRun (/runner.js:551:7)
    at done (/runnable.js:308:5)
    at callFn (/runnable.js:387:7)
    at Hook.Runnable.run (/runnable.js:352:5)
    at next (/runner.js:510:10)
    at Immediate._onImmediate (/runner.js:572:5)
    at processImmediate (/timers.js:456:21)`,
  },
}