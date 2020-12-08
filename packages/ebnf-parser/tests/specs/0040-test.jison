//
// title: "edge case with literal whitespace token"
// input: "one two"
//
// ...
//

%%
top : word[alpha] ' '[bob] word[carol] EOF;
