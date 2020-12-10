//
// title: "expect helpful error report when using indented regex rules (copied from a flex grammar)"
// test_run_lexer_output: false
//
// ...
//

%s    PICTURE_STATE    FUNCTION_STATE

%%


. {
    let c;

    yyerror(`invalid symbol '${yytext}' - skipping word`);
    while ((c = this.input()) != this.EOF) {
        if (c === '\n' || c === ' ') {
            break;
        }
    }
    if (c !== this.EOF) {
        this.unput(c);
    }
}


<PICTURE_STATE>{
  "IS" {
    /* Ignore */
  }
  [^ \n;]+ {
    return 'PICTURE';
  }
}

<FUNCTION_STATE>{
  [A-Z0-9-]+ {
    return 'FUNCTION_NAME';
  }
  . {
    return yytext[0];
  }
}


<<EOF>>                         return 'EOF';