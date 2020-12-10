//
// title: test rules with trailing escapes
// test_input: 'a#dikke mik! @him @her\nb#booboo'
//
// ...
//

%%
\#[^\n]*\n {/* ok */}

