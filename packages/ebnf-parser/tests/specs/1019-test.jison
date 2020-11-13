//
// title: errorneous grammar 
//
// ...
//

%options foo
%options bar=123

%%

%options fuzz=42

foo: bar;
