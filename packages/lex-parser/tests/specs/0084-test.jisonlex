//
// title: "it's an error to indent rules inside scopes"
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
