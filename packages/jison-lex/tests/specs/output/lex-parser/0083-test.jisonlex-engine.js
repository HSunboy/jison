{
  error: {
    message: `
\`the exclusive lexer start conditions set (%x)\` statements must be placed in
the top section of the lexer spec file, above the first '%%'
separator. You cannot specify any in the second section as has been
done here.
    
  Erroneous code:
12: <subset>{
13: 
14: "C"   -> 'C'
15: %x      // is not accepted here
^^..^^
16: "B"   -> 'B'
17: 
`,
    type: 'JisonParserError',
    stack: `JisonParserError: 
\`the exclusive lexer start conditions set (%x)\` statements must be placed in
the top section of the lexer spec file, above the first '%%'
separator. You cannot specify any in the second section as has been
done here.
    
  Erroneous code:
12: <subset>{
13: 
14: "C"   -> 'C'
15: %x      // is not accepted here
^^..^^
16: "B"   -> 'B'
17: 

    at Object.parseError (/regexp-lexer-cjs.js:8009:15)
    at Object.yyError (/regexp-lexer-cjs.js:8194:25)
    at Object.parser__PerformAction (/regexp-lexer-cjs.js:4927:14)
    at Object.parse (/regexp-lexer-cjs.js:9472:24)
    at Object.yyparse [as parse] (/regexp-lexer-cjs.js:13065:25)
    at autodetectAndConvertToJSONformat (/regexp-lexer-cjs.js:14305:35)
    at processGrammar (/regexp-lexer-cjs.js:17656:12)
    at test_me (/regexp-lexer-cjs.js:15394:23)
    at new RegExpLexer (/regexp-lexer-cjs.js:15535:17)
    at Context.testEachLexerExample (/regexplexer.js:3707:25)
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