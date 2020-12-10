//
// title: "test %options easy_keyword_rules"
// test_input: "enter-test.x.z a fo\"obar f\"oo'bar ab fo\"obarf"
//
// ...
//

%options easy_keyword_rules
%s TEST TEST2
%x EAT
%%
"enter-test" {this.begin('TEST');}
"enter_test" {this.begin('TEST');}
<TEST,EAT>"x" {return 'T';}
<*>"z" {return 'Z';}
<TEST>"y" {this.begin('INITIAL'); return 'TY';}
\"\'"a" return 10;
\"\'\\\*\i return 11;
"a"\b return 12;
\cA {}
\012 {}
\xFF {}
"["[^\\]"]" {return true;}
'f"oo\'bar'  {return 'baz2';}
"fo\"obar"  {return 'baz';}

