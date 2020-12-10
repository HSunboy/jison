//
// title: "multi-line <A,B,...> condition"
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
    this.begin('INITIAL');
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
                                this.begin('CALL_DIRECTIVE_STATE');
                                return 'MARKER';

. 
                                return yytext.charCodeAt(0);

<<EOF>>                         yytext = {
                                    conditionStack: this.conditionStack,
                                    conditionsSet: Object.keys(this.conditions),
                                };
                                return 'EOF';