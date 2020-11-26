// title: "expect proper error report when %include file does not exist"
// ...
//

%%

\s+                 // ignore

[a-z] 		        -> 'a'
[A-Z] 		        -> 'A'

%%
%include bugger-it-millenium-hands-and-shrimp.js