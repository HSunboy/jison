//
// title: "indented multi-line <A,B,...> condition block"
// test_input: |-
//   $A.8
//   B1
//   $$55Z...
//   $
//   ~
//
// ...
//

%s    
    CALL_DIRECTIVE_STATE,
    SOURCE_DIRECTIVE_STATE,
    DEFINE_DIRECTIVE_STATE,
    ON_OFF_DIRECTIVE_STATE,
    SET_DIRECTIVE_STATE,
    TURN_DIRECTIVE_STATE,
    IF_DIRECTIVE_STATE,
    ELSE_DIRECTIVE_STATE,
    ENDIF_DIRECTIVE_STATE,
    ALNUM_LITERAL_STATE,
    CONTROL_STATEMENT_STATE

%%

<CALL_DIRECTIVE_STATE,
SOURCE_DIRECTIVE_STATE,
DEFINE_DIRECTIVE_STATE,
ON_OFF_DIRECTIVE_STATE,
SET_DIRECTIVE_STATE,
TURN_DIRECTIVE_STATE,
IF_DIRECTIVE_STATE,
ELSE_DIRECTIVE_STATE,
ENDIF_DIRECTIVE_STATE,
ALNUM_LITERAL_STATE,
CONTROL_STATEMENT_STATE>{
  \n            {
    this.popState();
    this.unput('\n');
    return 'TERMINATOR';
  }
  [ ,;]+        { /* ignore */ }
  "."           {
    return DOT;
  }
  .             {
    return '#' + yytext[0].charCodeAt(0).toString(16);
  }
}

'$'                             
                                // using pushState/popState as a better way of doing `begin()`
                                // which would only increase the condition stack and never 
                                // pop one off, potentially leading to out-of-memory issues
                                // when you'ld feed such a lexer with long input.
                                this.pushState('CALL_DIRECTIVE_STATE');
                                return 'MARKER';

. 
                                return yytext.charCodeAt(0);

<<EOF>>                         yytext = {
                                    conditionStack: this.conditionStack,
                                    conditionsSet: Object.keys(this.conditions),
                                };
                                return 'EOF';