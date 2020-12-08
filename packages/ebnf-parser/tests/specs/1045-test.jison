//
// title: "erroneous grammar (bad use of EBNF wildcards)"
// input: "one, two, three, four, five"
//
// ...
//

%ebnf
%%
top : word ',' word++;	   // bad dual wildcard at the end there

