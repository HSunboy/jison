{
  error: {
    message: `Could not parse jison lexer spec in JSON AUTODETECT mode:
in JISON Mode we get Error: 
You specified an unknown lexer condition state 'NUMBER'.
Is this a typo or did you forget to include this one in the '%s' and '%x'
inclusive and exclusive condition state sets specifications at the top of
the lexer spec?
    
As a rough example, things should look something like this in your lexer
spec file:
    
    %s NUMBER
    %%
    <NUMBER>LEXER_RULE_REGEX    return 'TOK';
    
  Erroneous code:
8: <NUMBER>\\d+         -> 'NUMBER';
^...^^^^^^
9: 


while JSON5 Mode produces Error: JSON5: invalid character '%' at 3:1`,
    type: 'Error',
    stack: `SyntaxError: JSON5: invalid character '%' at 3:1
    at syntaxError (/index.js:1954:16)
    at invalidChar (/index.js:1895:13)
    at Object.value (/index.js:964:16)
    at lex (/index.js:743:41)
    at Object.parse (/index.js:689:18)
    at autodetectAndConvertToJSONformat (/regexp-lexer-cjs.js:13564:51)
    at processGrammar (/regexp-lexer-cjs.js:16695:12)
    at test_me (/regexp-lexer-cjs.js:14561:23)
    at new RegExpLexer (/regexp-lexer-cjs.js:14679:17)
    at Context.testEachLexerExample (/regexplexer.js:3728:25)
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