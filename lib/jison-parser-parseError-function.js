
function parseError(str, hash, ExceptionClass) {
    // do not throw an exception to terminate the parser 
    // when one of these conditions has been met:
    //
    // 1. parseError() was invoked from the parser kernel,
    //    which has already decided this error is recoverable.
    // 2. parseError() was invoked by the parser userland code
    //    by way of `yyerror()`: in that case, we produce the
    //    error info hash as a usable return value in the form
    //    of a JisonParserError class instance.
    // 3. parseError() was invoked by the lexer kernel: we
    //    treat all lexer errors as recoverable, or rather... as
    //    *continuable*. 
    // 4. parseError() was invoked by the lexer userland code
    //    by way of `yyerror()`: in that case, we set `yytext`
    //    to an object containing both the lexed input (yytext)
    //    *and* the error info hash. We will return the
    //    lexer ERROR token.
    if (hash.recoverable) {
        if (typeof this.trace === 'function') {
            this.trace(str);
        }

        // conditions 3 & 4: is this the lexer calling us?
        if (hash.isLexerError) {
            // Note: yylloc, i.e. `loc`, has already been snapshotted by the kernel code.
            this.yytext = {
                text: yytext,
                errorInfo: hash,
            };
            return this.ERROR; 
        } else if (hash.yyErrorInvoked) {
            // condition 2 is met.
            return new ExceptionClass(str, hash);
        }
        // ELSE: condition 1 it is! DO NOT return anything, as the parser kernel
        // would then take this return value as the parser run's final
        // result and terminate the parse phase immediately.
        return;
    } else {
        if (typeof this.trace === 'function') {
            this.trace(str);
        }
        throw new ExceptionClass(str, hash);
    }
}
