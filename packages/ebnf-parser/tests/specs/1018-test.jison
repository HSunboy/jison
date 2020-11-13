//
// title: errorneous grammar 
//
// ...
//

%%

%{
	console.error('foo bar');
%}

foo: bar;

// incomplete rule spec:
fuzz

%%