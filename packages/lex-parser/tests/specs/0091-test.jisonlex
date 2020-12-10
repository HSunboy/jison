//
// title: "%option do-not-test-compile"
// test_run_generated_lexer: false
//
// ...
//

%option do-not-test-compile

%{
	Here's line A, which is not JavaScript.
%}

%%
{{
	Ditto for line B!
}}
"X" {{
		Dit is X.
	}}
"Y" %{ en dat is Y; %}
.  %{{ zeg maar PUNT. %}}
