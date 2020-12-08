//
// title: "erroneous grammar (bad use of EBNF wildcards)"
// input: "one two three four five"
//
// ...
//

%ebnf
%%
top : %epsilon+ 	   // a variable number of epsilons? Not gonna work...
	| word+;

