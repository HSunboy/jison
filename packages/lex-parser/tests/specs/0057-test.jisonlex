//
// title: "test [^\\\\]"
// test_input: "[xy]f\"oo'barfo\"obarx"
//
// ...
//

%%
"["[^\\]"]" {return true;}
'f"oo\'bar'  {return 'baz2';}
"fo\"obar"  {return 'baz';}

