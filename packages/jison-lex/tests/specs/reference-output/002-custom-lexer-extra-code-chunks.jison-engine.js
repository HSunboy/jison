
// custom lexer...
  console.log('The moment the custom lexer gets defined...');
  var lexer = {
    lex: function () {
      return 1;
    },
    setInput: function (s, yy) {
      console.log('setInput: ', s, yy);
    },
    options: {

    },
    ERROR: 2,
    EOF: 1, 
  };
