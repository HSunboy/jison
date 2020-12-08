//
// title: "erroneous grammar (bad use of EBNF wildcards)"
// input: "one two three four five"
//
// ...
//

%ebnf
%%
top : %epsilon? 	   // EDGE CASE: this should resolve to a single epsilon either way, but jison-gho won't be so smart...
	| word+;

