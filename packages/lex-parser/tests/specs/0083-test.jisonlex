//
// title: "wrong place for %XYZ options - expect the proper error message"
//
// ...
//

%s subset

%%
"A"		 -> 'A'

<subset>{

"C"		 -> 'C'
%x  				// is not accepted here
"B"		 -> 'B'

}
