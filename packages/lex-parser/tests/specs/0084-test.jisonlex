//
// title: "it's an error to indent rules inside scopes"
// test_run_lexer_output: false
//
// ...
//

%s subset

%%
"A"		 -> 'A'

<subset>{

	// SHOULD NOT indent regex rules: expect error
	"C"		 -> 'C'
	"B"		 -> 'B'

}
