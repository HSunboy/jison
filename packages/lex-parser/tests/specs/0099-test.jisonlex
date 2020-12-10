//
// title: "rule regex pathological case: '<' / '>' are literal regex parts when not starting a rule"
// test_input: a1bacab<cab>cab<c>a
//
// ...
//

%s ALT

%%

// '<' as literal '<' when it cannot be a condition starter:
b<c 							return 'PATHOLOGICAL_CASE_HIT_1';
b>c 							return 'PATHOLOGICAL_CASE_HIT_2';
b<c> 							return 'PATHOLOGICAL_CASE_HIT_3';

<ALT>a 							popState();
								return 'SWITCHING_TO_INITIAL_CONTEXT';

<INITIAL>a						pushState('ALT');
								return 'SWITCHING_TO_ALT_CONTEXT';

\s 								return 'SPACE';
.                               return 'CHAR';

<<EOF>>                         return 'EOF';