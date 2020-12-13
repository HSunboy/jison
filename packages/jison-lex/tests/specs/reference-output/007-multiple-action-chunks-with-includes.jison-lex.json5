{
  error: {
    message: `
There's probably an error in one or more of your lexer regex rules.
The lexer rule spec should have this structure:
    
        regex  action_code
    
where 'regex' is a lex-style regex expression (see the
jison and jison-lex documentation) which is intended to match a chunk
of the input to lex, while the 'action_code' block is the JS code
which will be invoked when the regex is matched. The 'action_code' block
may be any (indented!) set of JS statements, optionally surrounded
by '{...}' curly braces or otherwise enclosed in a '%{...%}' block.
    
  Erroneous code:
14:  block0B();   // init chunk 2
15: %}
16: 
17:      %{
^^.......^^
18:       block0C();   // indented, hence SHOULD barf a hairball as there's no rule to relate it to! Or it should become init chunk 3...
^^..^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    (...continued...)
--  (---------------)
32:      %}
^^..^^^^^^^
33: 
^^..^
34: 
^^..^
35: 
^^..^
36: 
^^..^
37: 
^^..^
38: 
^^..^
39: 
^^..^
40: 
^^..^
41: %%
^^..^^
42: 
43: %include "includes/dummydecl.include"
    
  Technical error report:
Parse error on line 19:
     %{
-----^
Expecting end of input, "<", ">", "|", "(", "/", ",", ".", "^", "$", "UNTERMINATED_ACTION_BLOCK", "ACTION_START_AT_SOL", "ACTION_START", "UNKNOWN_DECL", "OPTIONS", "IMPORT", "INIT_CODE", "START_INC", "START_EXC", "%%", "ENTIRE_ACTION_AT_SOL", "SPECIAL_GROUP", "/!", "REGEX_SPECIAL_CHAR", "ESCAPED_CHAR", macro name in '{...}' curly braces, "REGEX_SET_START", "STRING_LIT", "CHARACTER_LIT", "option_keyword", "import_keyword", "init_code_keyword", "start_inclusive_keyword", "start_exclusive_keyword", "start_conditions_marker", "start_epilogue_marker", "scoped_rules_collective", "rule", "action_chunk_at_SOL", "start_conditions", "regex", "nonempty_regex_list", "regex_concat", "regex_base", "name_expansion", "any_group_regex", "literal_string", "epilogue", got unexpected "ENTIRE_ACTION"
`,
    type: 'JisonParserError',
    stack: `JisonParserError: 
There's probably an error in one or more of your lexer regex rules.
The lexer rule spec should have this structure:
    
        regex  action_code
    
where 'regex' is a lex-style regex expression (see the
jison and jison-lex documentation) which is intended to match a chunk
of the input to lex, while the 'action_code' block is the JS code
which will be invoked when the regex is matched. The 'action_code' block
may be any (indented!) set of JS statements, optionally surrounded
by '{...}' curly braces or otherwise enclosed in a '%{...%}' block.
    
  Erroneous code:
14:  block0B();   // init chunk 2
15: %}
16: 
17:      %{
^^.......^^
18:       block0C();   // indented, hence SHOULD barf a hairball as there's no rule to relate it to! Or it should become init chunk 3...
^^..^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    (...continued...)
--  (---------------)
32:      %}
^^..^^^^^^^
33: 
^^..^
34: 
^^..^
35: 
^^..^
36: 
^^..^
37: 
^^..^
38: 
^^..^
39: 
^^..^
40: 
^^..^
41: %%
^^..^^
42: 
43: %include "includes/dummydecl.include"
    
  Technical error report:
Parse error on line 19:
     %{
-----^
Expecting end of input, "<", ">", "|", "(", "/", ",", ".", "^", "$", "UNTERMINATED_ACTION_BLOCK", "ACTION_START_AT_SOL", "ACTION_START", "UNKNOWN_DECL", "OPTIONS", "IMPORT", "INIT_CODE", "START_INC", "START_EXC", "%%", "ENTIRE_ACTION_AT_SOL", "SPECIAL_GROUP", "/!", "REGEX_SPECIAL_CHAR", "ESCAPED_CHAR", macro name in '{...}' curly braces, "REGEX_SET_START", "STRING_LIT", "CHARACTER_LIT", "option_keyword", "import_keyword", "init_code_keyword", "start_inclusive_keyword", "start_exclusive_keyword", "start_conditions_marker", "start_epilogue_marker", "scoped_rules_collective", "rule", "action_chunk_at_SOL", "start_conditions", "regex", "nonempty_regex_list", "regex_concat", "regex_base", "name_expansion", "any_group_regex", "literal_string", "epilogue", got unexpected "ENTIRE_ACTION"

    at Object.parseError (/regexp-lexer-cjs.js:7935:15)
    at Object.yyError (/regexp-lexer-cjs.js:8120:25)
    at Object.parser__PerformAction (/regexp-lexer-cjs.js:3456:14)
    at Object.parse (/regexp-lexer-cjs.js:9398:24)
    at Object.yyparse [as parse] (/regexp-lexer-cjs.js:12991:25)
    at autodetectAndConvertToJSONformat (/regexp-lexer-cjs.js:14231:35)
    at processGrammar (/regexp-lexer-cjs.js:17582:12)
    at test_me (/regexp-lexer-cjs.js:15320:23)
    at new RegExpLexer (/regexp-lexer-cjs.js:15461:17)
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