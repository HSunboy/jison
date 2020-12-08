//
// title: "erroneous grammar (bad use of EBNF wildcards)"
// input: "one two three four five"
//
// ...
//

%ebnf
%%
top : word *word EOF;			// looks weird, but will be accepted as a legal grammar?...

