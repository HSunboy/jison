//
// title: "rule regex pathological case: '<' is a literal regex part when not starting a rule"
// test_input: ab<cab>ca ab<cab>ca
//
// ...
//

%s ALT

%%

// '<' as literal '<' when it cannot be a condition starter:
b<c 							return 'PATHOLOGICAL_CASE_HIT';

<ALT>a 							popState();
								return 'SWITCHING_TO_INITIAL_CONTEXT';

<INITIAL>a						pushState('ALT');
								return 'SWITCHING_TO_ALT_CONTEXT';

\s 								return 'SPACE';
.								return 'CHAR';

<<EOF>>                         return 'EOF';