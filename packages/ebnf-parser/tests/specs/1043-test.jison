//
// title: "erroneous grammar (bad use of EBNF wildcards)"
// input: "one two three four five"
//
// ...
//

%ebnf
%%
top : word word*? EOF;			// cannot have two wildcards follow one another...

