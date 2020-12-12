//
// title: "multi-line %s and %x"
// test_input: 'abc AZ=0.4'
//
// ...
//

// %s is 'active' as long as the lines following are indented *and* non-empty
// (i.e. cannot have an empty, whitespace-only line in there)
%s    
    PICTURE_STATE    
    FUNCTION_STATE
    A
    B
    C

%x    
    D
    E
    FOOBAR
    G7
    8bit

%%


. {
    this.begin('FUNCTION_STATE');
    return yytext.charCodeAt(0);
}

<<EOF>>                         yytext = {
                                    conditionStack: this.conditionStack,
                                    conditionsSet: Object.keys(this.conditions),
                                };
                                return 'EOF';