// title: "unterminated string constant error should include correct location info RANGE"
// ...
//

%%

.    { 
	    console.error(`'${yytext[0]}' (${yytext.charCodeAt(0)}): illegal charcter at line ${line_no}.");  // <-- error at end!
    }

%%

function commenteof() {
 	throw new Error(`unexpected EOF inside comment at line ${line_no}.`);
}
