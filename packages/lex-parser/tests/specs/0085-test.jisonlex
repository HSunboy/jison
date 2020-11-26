//
// title: "cannot nest rule scopes"
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

