// GOOD
//
// https://github.com/GerHobbelt/jison/issues/51

%%

expr: 'foo' -> {                    // comment A
					ad: 42, 		// comment B
					nauseam: 666,   // comment C
				}                   // comment D
;

