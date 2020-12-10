//
// title: "rule regex pathological case: ',' literal regex part"
// test_input: a,,,a,a,aALT,DIFaALT,DIFaa ALT,DIF,C a 
//
// ...
//

%s ALT DIF

%%

// ',' as a literal ',' after the <...> condition has been lexed/parsed:
<ALT,DIF>,+						return 'PATHOLOGICAL_CASE_HIT_1';

// ',' as a literal ',':
ALT,DIF							return 'PATHOLOGICAL_CASE_HIT_2';

<ALT>a 							popState();
								return 'SWITCHING_TO_INITIAL_CONTEXT';

<INITIAL>a						pushState('ALT');
								return 'SWITCHING_TO_ALT_CONTEXT';

\s 								return 'SPACE';
. 								return 'CHAR';

<<EOF>>                         return 'EOF';