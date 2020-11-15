const fs = require('fs');
const path = require('path');
const assert = require('chai').assert;
const Jison = require('../setup').Jison;
const Lexer = require('../setup').Lexer;
const helpers = require('../../packages/helpers-lib');
const code_exec = helpers.exec;


const original_cwd = process.cwd();


describe('Regression Checks', function () {
    it('GitHub JISON issue #13: https://github.com/GerHobbelt/jison/issues/13', function () {
        // Change CWD to the directory where the source grammar resides: this helps us properly
        // %include any files mentioned in the grammar with relative paths:
        process.chdir(__dirname);

        let filespec = {
            path: './github-issues-nr-13-gho.y'
        };

        let grammar = fs.readFileSync(filespec.path, 'utf8');

        let options = {
            noMain: false
        };
        options.file = filespec.path;
        try {
            let parser = new Jison.Parser(grammar, options);

            assert.ok(false, 'should never get here');
        } catch (ex) {
            //console.log('ex:' + ex.stack);
            assert.ok(true);
            assert.ok(ex instanceof Error);
            // the offending bit of action code should be mentioned in the error report:
            assert.ok(/yyerror\(`named %option value error for \$\{\$option\}\?"/.test(ex.message));
        }
    });
});


describe('Github issues', function () {
    // related to https://github.com/GerHobbelt/jison/issues/9
    //
    // We explicitly obtain the Jison Lexer generator API from the
    // Jison API (which acts as a 'facade' there):
    let RegExpLexer = Jison.Lexer;

    //
    // NOTE:
    //
    // Compare these tests with the ones in packages/jison-lex/:
    // you'll find they are identical, since we use exactly the same
    // API here, only now obtained via Jison itself.
    //
    it('GerHobbelt/jison#9:: test multiple independent lexer instances', function () {
        let dict1 = {
            rules: [
                [ 'x', "return 'X';" ],
                [ 'y', "return 'Y';" ],
                [ '$', "return 'EOF';" ]
            ]
        };

        let dict2 = {
            rules: [
                [ 'a', "return 'A';" ],
                [ 'b', "return 'B';" ],
                [ '$', "return 'EOF';" ]
            ]
        };

        let input1 = 'xxyx';
        let input2 = 'aaba';

        let lexer1 = new RegExpLexer(dict1, input1);
        let lexer2 = new RegExpLexer(dict2, input2);
        assert.equal(lexer1.lex(), 'X');
        assert.equal(lexer2.lex(), 'A');
        assert.equal(lexer1.lex(), 'X');
        assert.equal(lexer2.lex(), 'A');
        assert.equal(lexer1.lex(), 'Y');
        assert.equal(lexer2.lex(), 'B');
        assert.equal(lexer1.lex(), 'X');
        assert.equal(lexer2.lex(), 'A');
        assert.equal(lexer1.lex(), 'EOF');
        assert.equal(lexer2.lex(), 'EOF');
    });

    it('GerHobbelt/jison#9:: test cloned yet independent lexer instances', function () {
        let dict = {
            rules: [
                [ 'x', "return 'X';" ],
                [ 'y', "return 'Y';" ],
                [ '$', "return 'EOF';" ]
            ]
        };

        let input1 = 'xxyx';
        let input2 = 'yyx';

        let lexerBase = new RegExpLexer(dict /*, input1 */);
        function MyLexerClass() {
            this.yy = {};
        }
        MyLexerClass.prototype = lexerBase;

        function mkLexer() {
            return new MyLexerClass();
        }

        let lexer1 = mkLexer();
        lexer1.setInput(input1, {
            one: true
        });

        let lexer2 = mkLexer();
        lexer2.setInput(input2, {
            two: true
        });

        assert.equal(lexer1.lex(), 'X');
        assert.equal(lexer2.lex(), 'Y');
        assert.equal(lexer1.lex(), 'X');
        assert.equal(lexer2.lex(), 'Y');
        assert.equal(lexer1.lex(), 'Y');
        assert.equal(lexer2.lex(), 'X');
        assert.equal(lexer1.lex(), 'X');
        assert.equal(lexer2.lex(), 'EOF');
        assert.equal(lexer1.lex(), 'EOF');
        // once you've gone 'past' EOF, you get the EOF **ID** returned, rather than your custom EOF token.
        //
        // The `EOF` attribute is just a handy constant defined in the lexer prototype...
        assert.equal(lexer2.lex(), lexerBase.EOF);
        assert.equal(lexer1.lex(), lexerBase.EOF);
        assert.equal(lexer1.EOF, lexerBase.EOF);
        assert.equal(lexer2.EOF, lexerBase.EOF);
    });

    it('https://github.com/zaach/jison-lex/issues/23:: ES6 arrow functions', function () {
        /* istanbul ignore next: arrow `action` code is injected and then crashes the generated parser due to unreachable coverage global */
        let dict = {
            rules: [
                [ 'x', () => 'X' ],
                [ 'y', () => 'Y' ],
                [ '$', () => 'EOF' ]
            ]
        };

        let input1 = 'xxyx';
        let input2 = 'yyx';

        let lexerBase = new RegExpLexer(dict /*, input1 */);
        function MyLexerClass() {
            this.yy = {};
        }
        MyLexerClass.prototype = lexerBase;

        function mkLexer() {
            return new MyLexerClass();
        }

        let lexer1 = mkLexer();
        lexer1.setInput(input1, {
            one: true
        });

        let lexer2 = mkLexer();
        lexer2.setInput(input2, {
            two: true
        });

        assert.equal(lexer1.lex(), 'X');
        assert.equal(lexer2.lex(), 'Y');
        assert.equal(lexer1.lex(), 'X');
        assert.equal(lexer2.lex(), 'Y');
        assert.equal(lexer1.lex(), 'Y');
        assert.equal(lexer2.lex(), 'X');
        assert.equal(lexer1.lex(), 'X');
        assert.equal(lexer2.lex(), 'EOF');
        assert.equal(lexer1.lex(), 'EOF');
        // once you've gone 'past' EOF, you get the EOF **ID** returned, rather than your custom EOF token.
        //
        // The `EOF` attribute is just a handy constant defined in the lexer prototype...
        assert.equal(lexer2.lex(), lexerBase.EOF);
        assert.equal(lexer1.lex(), lexerBase.EOF);
        assert.equal(lexer1.EOF, lexerBase.EOF);
        assert.equal(lexer2.EOF, lexerBase.EOF);
    });
});
