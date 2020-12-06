
// Note: this function will be invoked with argv[0] being the app JS, i.e.
//
//         __jison_default_main__(process.argv.slice(1));
//
// which is the same convention as for C programs, shell scripts, etc.
// NodeJS differs from those in that the first argument *always* is the
// node executable itself, even when this script was invoked *without*
// the node prefix, e.g.
//
//         ./lexer.js --help
//
function __jisonlexer_default_main__(argv) {
    // When the lexer comes with its own `main` function, then use that one:
    if (typeof exports.lexer.main === 'function') {
        return exports.lexer.main(argv);
    }

    // don't dump more than 4 EOF tokens at the end of the stream:
    const maxEOFTokenCount = 4;
    // don't dump more than 20 error tokens in the output stream:
    const maxERRORTokenCount = 20;
    // maximum number of tokens in the output stream:
    const maxTokenCount = 10000;

    if (!argv[1] || argv[1] == '--help' || argv[1] == '-h') {
        console.log(`
Usage:
  ${path.basename(argv[0])} INFILE [OUTFILE]

Input
-----

Reads input from INFILE (which may be specified as '-' to specify STDIN for
use in piped commands, e.g.

  cat "example input" | ${path.basename(argv[0])} -

The input is lexed into a token stream, which is written to the OUTFILE as
an array of JSON nodes.

Output
------

When the OUTFILE is not specified, its path & name are derived off the INFILE,
appending the '.lexed.json' suffix. Hence

  ${path.basename(argv[0])} path/foo.bar

will have its token stream written to the 'path/foo.bar.lexed.json' file.

Errors
------

A (fatal) failure during lexing (i.e. an exception thrown) will be logged as
a special fatal error token:

  {
      id: -1,  // this signals a fatal failure
      token: null,
      fail: 1,
      msg: <the extended error exception type, message and stacktrace as STRING>
  }

Application Exit Codes
----------------------

This particular error situation will produce the same exit code as a successful
lexing: exitcode 0 (zero: SUCCESS)

However, any failure to read/write the files will be reported as errors with
exitcode 1 (one: FAILURE)

Limits
------

- The lexer output (token stream) is limited to ${maxTokenCount} tokens.
- The token stream will end with at most ${maxEOFTokenCount} EOF tokens.
- The token stream will end when at most ${maxERRORTokenCount} ERROR tokens have been
  produced by the lexer.
`);
        process.exit(1);
    }

    function customMainParseError(str, hash, ExceptionClass) {
        console.error("parseError: ", str);
        return this.ERROR;
    }

    function main_work_function(input) {
        const lexer = exports.lexer;

        let yy = {
            // if a custom parseError has already been defined, we DO NOT override that one:
            parseError: (lexer.yy && lexer.yy.parseError) || (lexer.yy && lexer.yy.parser && lexer.yy.parser.parseError) || customMainParseError
        };

        let tokens = [];
        
        let countEOFs = 0;
        let countERRORs = 0;
        let countFATALs = 0;

        try {
            lexer.setInput(input, yy);

            for (i = 0; i < maxTokenCount; i++) {
                let tok = lexer.lex();
                tokens.push({
                    id: tok,
                    token: (tok === 1 ? 'EOF' : tok),    // lexer.describeSymbol(tok),
                    yytext: lexer.yytext,
                    yylloc: lexer.yylloc
                });
                if (tok === lexer.EOF) {
                    // and make sure EOF stays EOF, i.e. continued invocation of `lex()` will only
                    // produce more EOF tokens at the same location:
                    countEOFs++;
                    if (countEOFs >= maxEOFTokenCount) {
                        break;
                    }
                }
                else if (tok === lexer.ERROR) {
                    countERRORs++;
                    if (countERRORs >= maxERRORTokenCount) {
                        break;
                    }
                }
            }
        } catch (ex) {
            countFATALs++;
            // save the error:
            let stk = '' + ex.stack;
            stk = stk.replace(/\t/g, '  ')
            .replace(/  at (.+?)\(.*?[\\/]([^\\/\s]+)\)/g, '  at $1($2)');
            let msg = 'ERROR:' + ex.name + '::' + ex.message + '::' + stk;
            tokens.push({
                id: -1,
                token: null,
                fail: 1,
                err: msg,
            });
        }

        // write a summary node at the end of the stream:
        tokens.push({
            id: -2,
            token: null,
            summary: {
                totalTokenCount: tokens.length,
                EOFTokenCount: countEOFs,
                ERRORTokenCount: countERRORs,
                fatalExceptionCount: countFATALs
            }
        });
        return tokens;
    }

    //const [ , ...args ] = argv;
    let must_read_from_stdin = (argv[1] === '-');
    let input_path = (!must_read_from_stdin ? path.normalize(argv[1]) : '(stdin)');
    let must_write_to_stdout = (argv[2] === '-');
    let output_path = (!must_write_to_stdout ? (path.normalize(argv[2] || (must_read_from_stdin ? input_path : 'stdin') + '.lexed.json')) : '(stdout)');
    const print_summary_and_write_to_output = (tokens) => {
        let summary = tokens[tokens.length - 1].summary;

        console.log(`
////////////////////////////////////////////////////////////////////////////                    
// Lexer output: 
//
// - total # tokens read:                         ${summary.totalTokenCount} 
// - # of EOF totkens:                            ${summary.EOFTokenCount} 
// - # of ERROR tokens produced by the lexer:     ${summary.ERRORTokenCount}
// - # of fatal crashes, i.e. lexer exceptions:   ${summary.fatalExceptionCount}
////////////////////////////////////////////////////////////////////////////
`);

        let dst = JSON.stringify(tokens, null, 2);
        if (!must_write_to_stdout) {
            fs.writeFileSync(output_path, dst, 'utf8');
        } else {
            console.log(dst);                
        }
    };

    if (!must_read_from_stdin) {
        try {
            const input = fs.readFileSync(input_path, 'utf8');
            let tokens = main_work_function(input);

            print_summary_and_write_to_output(tokens);

            process.exit(0); // SUCCESS!
        } catch (ex2) {
            console.error("Failure:\n", ex2, `

Input filepath:  ${input_path}
Output filepath: ${output_path}               
            `);
            process.exit(1);   // FAIL
        }
    } else {
        if (process.stdin.isTTY) {
            console.error(`
Error: 
You specified to read from STDIN without piping anything into the application.

Manual entry from the console is not supported.
            `);
            process.exit(1);
        } else {
            // Accepting piped content. E.g.:
            // echo "pass in this string as input" | ./example-script
            const stdin = process.openStdin();
            let data = '';
            stdin.setEncoding(encoding);

            stdin.on('readable', function () {
                let chunk;
                while (chunk = stdin.read()) {
                    data += chunk;
                }
            });

            stdin.on('end', function () {
                // There MAY be a trailing \n from the user hitting enter. Send it along.
                //data = data.replace(/\n$/, '')
                try {
                    let tokens = main_work_function(data);

                    print_summary_and_write_to_output(tokens);

                    process.exit(0);   // SUCCESS!
                } catch (ex2) {
                    console.error("Failure:\n", ex2, `

Input filepath:  ${input_path}
Output filepath: ${output_path}               
                    `);
                    process.exit(1);   // FAIL
                }
            });
        }
    }
}
