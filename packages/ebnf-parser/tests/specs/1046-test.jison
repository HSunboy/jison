//
// title: "erroneous grammar (bad use of EBNF wildcards)"
// input: "one, two, three, four, five"
//
// ...
//

%ebnf
%%
top : (word (',' word)+;	   // unmatched bracket --> missing )

middle: word word word;

bottom: word );	               // unmatched bracket --> missing (

