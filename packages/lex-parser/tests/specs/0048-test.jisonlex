//
// title: test special groupings
// test_input: 'foo()bar()foofoo()barbar()'
//
// ...
//

%%
(?:"foo"|"bar")\(\) return 11;

