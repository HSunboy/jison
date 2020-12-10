//
// title: "rule regex pathological case: '<...>' literal regex part"
// test_input: a<x>a<x>a
//
// ...
//

%s ALT

%%

// '<' as a literal '<' after the <...> condition has been lexed/parsed:
<ALT><x> 						return 'PATHOLOGICAL_CASE_HIT';

<ALT>a 							popState();
								return 'SWITCHING_TO_INITIAL_CONTEXT';

<INITIAL>a						pushState('ALT');
								return 'SWITCHING_TO_ALT_CONTEXT';

\s 								return 'SPACE';
. 								return 'CHAR';

<<EOF>>                         return 'EOF';