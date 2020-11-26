{
  error: {
    message: `
Lexer rule regex action code declaration error?
    
  Erroneous code:
25: "\\"(?:{esc}[\\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\\"{esc}])*\\"", "yytext = yytext.substr(1,yyleng-2); return 'STRING';"
^^.................................................................^
26: 
27: '/'                             return '/'
    
  Technical error report:
Parse error on line 25:
"\\"(?:{esc}[\\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\\"{esc}])*\\"", "yytext ...
---------------------------------------------------------------^
Expecting "|", "(", ")", "+", "*", "?", "/", ".", "^", "$", "MACRO_END", "ACTION_START_AT_SOL", "ACTION_START", "ARROW_ACTION_START", "SPECIAL_GROUP", "/!", "REGEX_SPECIAL_CHAR", "ESCAPED_CHAR", macro name in '{...}' curly braces, "REGEX_SET_START", "RANGE_REGEX", "STRING_LIT", "CHARACTER_LIT", "range_regex", got unexpected ","
`,
    type: 'JisonParserError',
    stack: `JisonParserError: 
Lexer rule regex action code declaration error?
    
  Erroneous code:
25: "\\"(?:{esc}[\\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\\"{esc}])*\\"", "yytext = yytext.substr(1,yyleng-2); return 'STRING';"
^^.................................................................^
26: 
27: '/'                             return '/'
    
  Technical error report:
Parse error on line 25:
"\\"(?:{esc}[\\"bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^\\"{esc}])*\\"", "yytext ...
---------------------------------------------------------------^
Expecting "|", "(", ")", "+", "*", "?", "/", ".", "^", "$", "MACRO_END", "ACTION_START_AT_SOL", "ACTION_START", "ARROW_ACTION_START", "SPECIAL_GROUP", "/!", "REGEX_SPECIAL_CHAR", "ESCAPED_CHAR", macro name in '{...}' curly braces, "REGEX_SET_START", "RANGE_REGEX", "STRING_LIT", "CHARACTER_LIT", "range_regex", got unexpected ","

    at Object.parseError (/regexp-lexer-cjs.js:7138:15)
    at Object.yyError (/regexp-lexer-cjs.js:7328:25)
    at Object.parser__PerformAction (/regexp-lexer-cjs.js:4085:14)
    at Object.parse (/regexp-lexer-cjs.js:8392:24)
    at Object.yyparse [as parse] (/regexp-lexer-cjs.js:12302:25)
    at autodetectAndConvertToJSONformat (/regexp-lexer-cjs.js:13496:35)
    at processGrammar (/regexp-lexer-cjs.js:16557:12)
    at test_me (/regexp-lexer-cjs.js:14477:23)
    at new RegExpLexer (/regexp-lexer-cjs.js:14595:17)
    at Context.testEachLexerExample (/regexplexer.js:3686:25)
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