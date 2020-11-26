// title: "expect proper error report when %include file does not exist"
// ...
//

%%

%include bugger-it-millenium-hands-and-shrimp.js

\s+                 // ignore

[a-z] 		        -> 'a'
[A-Z] 		        -> 'A'
