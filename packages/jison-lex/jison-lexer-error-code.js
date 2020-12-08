/**
 * See also:
 * 
 * - https://github.com/onury/custom-error-test
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 * 
 * We now provide an ES6 derived Error class. An updated ES5-compatible class
 * is available too, for those who might need it, as this is complex stuff to
 * get right (see first link above).
 *
 * @public
 * @constructor
 * @nocollapse
 */


/*---ES5---

//
// JS CustomError implementation — The One (Adapted for JISON)
// This is the closest we can get to ES2015 `extends Error` implementation.
// @version 2017-01-05
// @author
//     Onur Yıldırım (https://github.com/onury)
//     Matt Browne (https://github.com/mbrowne)
// @see
//     https://github.com/onury/custom-error-test
//     http://stackoverflow.com/a/35881508/112731
//     https://gist.github.com/mbrowne/4af54767dcb3d529648f5a8aa11d6348
//     http://stackoverflow.com/a/41338601/112731
//
function JisonLexerError(message, hash) {
    if (message == null) message = '???';

    let stacktrace;
    if (hash && hash.exception instanceof Error) {
        const ex2 = hash.exception;
        message = message + ' :: ' + ex2.message;
        stacktrace = ex2.stack;
    }

    let err;
    if (Object.setPrototypeOf) {
        err = new Error(message);
        Object.setPrototypeOf(err, CustomError.prototype);
    } else {
        err = this;
    }

    Object.defineProperty(err, 'name', {
        enumerable: false,
        writable: false,
        value: 'JisonLexerError'
    });

    err.hash = hash;

    if (!Object.setPrototypeOf) {
        Object.defineProperty(err, 'message', {
            enumerable: false,
            writable: true,
            value: message
        });
        if (!stacktrace) {
            if (typeof Error.captureStackTrace === 'function') { // V8
                Error.captureStackTrace(this, JisonLexerError);
            } else {
                stacktrace = (new Error(message)).stack;
            }
        }
    }

    if (stacktrace) {
        Object.defineProperty(err, 'stack', {
            enumerable: false,
            writable: false,
            value: stacktrace
        });
    }

    return err;
}
if (Object.setPrototypeOf) {
    Object.setPrototypeOf(JisonLexerError.prototype, Error.prototype);
} else {
    JisonLexerError.prototype = Object.create(Error.prototype, {
        constructor: { value: JisonLexerError }
    });
}

---ES5---*/

//---ES6---//

class JisonLexerError extends Error {
  constructor(message, hash, ...params) {
    if (message == null) message = '???';

    let stacktrace;
    if (hash && hash.exception instanceof Error) {
        const ex2 = hash.exception;
        message = message + ' :: ' + ex2.message;
        stacktrace = ex2.stack;
    }

    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message, ...params);

    if (!stacktrace) {
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (typeof Error.captureStackTrace === 'function') { // V8
            Error.captureStackTrace(this, JisonLexerError);
        } else {
            stacktrace = (new Error(message)).stack;
        }
    }
    if (stacktrace) {
        Object.defineProperty(this, 'stack', {
            enumerable: false,
            writable: false,
            value: stacktrace
        });
    }

    this.name = 'JisonLexerError';
    this.hash = hash;
  }
}

//---ES6---//
