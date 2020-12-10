//
// title: test stability across lexer invocations as we patch lexer rules under the hood
// test_input: 'XYZYX'
//
// ...
//

%{{
	// line A
%}}

%%
{{
	// line B
}}
"X" {{{{{
return "%{..%}";
}}}}}
"Y" %{{{ return "Y"; %}}}
. %{{ return "dot"; %}}
