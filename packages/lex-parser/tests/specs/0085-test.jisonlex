//
// title: "cannot nest rule scopes"
// test_run_lexer_output: false
//
// ...
//

%s subsetA subsetB

%%
"A"		 -> 'A'

<subsetA>{

"C"		 -> 'C'

<subsetB>{

"B"		 -> 'B'

}

"D"		 -> 'D'

}

