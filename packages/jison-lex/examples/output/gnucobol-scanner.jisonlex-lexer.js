{
  error: {
    message: `
The lexer rule's action code section does not compile: Error: Line 87: Unexpected token *
    
  Erroneous area:
78: ^"#LINE"[ ]?[0-9]+" ".* {
^^..........................^
79:  /* Line directive */
^^..^^^^^^^^^^^^^^^^^^^^^
    (...continued...)
--  (---------------)
93:  }
^^..^^
94: }
^^..^
95: 
96: ^"#".* {
`,
    type: 'JisonParserError',
    stack: `JisonParserError: 
The lexer rule's action code section does not compile: Error: Line 87: Unexpected token *
    
  Erroneous area:
78: ^"#LINE"[ ]?[0-9]+" ".* {
^^..........................^
79:  /* Line directive */
^^..^^^^^^^^^^^^^^^^^^^^^
    (...continued...)
--  (---------------)
93:  }
^^..^^
94: }
^^..^
95: 
96: ^"#".* {

    at Object.parseError (/regexp-lexer-cjs.js:7252:15)
    at Object.yyError (/regexp-lexer-cjs.js:7442:25)
    at Object.parser__PerformAction (/regexp-lexer-cjs.js:4000:18)
    at Object.parse (/regexp-lexer-cjs.js:8709:24)
    at Object.yyparse [as parse] (/regexp-lexer-cjs.js:12564:25)
    at autodetectAndConvertToJSONformat (/regexp-lexer-cjs.js:13769:35)
    at processGrammar (/regexp-lexer-cjs.js:16968:12)
    at test_me (/regexp-lexer-cjs.js:14817:23)
    at new RegExpLexer (/regexp-lexer-cjs.js:14935:17)
    at Context.testEachLexerExample (/regexplexer.js:3738:25)
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