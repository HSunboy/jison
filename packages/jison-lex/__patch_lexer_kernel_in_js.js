
const globby = require('globby');
const fs = require('fs');

function encode(str) {
    return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '$\\{')
    .trim();
}

let kernel = encode(fs.readFileSync('jison-lexer-kernel.js', 'utf8'))
    // strip header comment and surrounding {} curly braces too:
    .replace(/^[^{]*\{/, '')
    .replace(/\}[^\}]*$/, '')
    .trim();

let errorClassCode = encode(fs.readFileSync('jison-lexer-error-code.js', 'utf8'));

var commonJsMainCode = encode(fs.readFileSync('jison-lexer-commonJsMain-function.js', 'utf8'));




// DIAGNOSTICS/DEBUGGING:
//
// set `test` to TRUE to help verify that all code chunks are properly detected and edited:
const test = false;


if (test) {
    kernel = 'kernel::xxxxxx';
    errorClassCode = 'errorClass::xxxxxx';
    commonJsMainCode = 'commonJsMain::xxxxxx';
}



globby([ 'regexp-lexer.js' ]).then(paths => {
    let count = 0;
    let edit_cnt = 0;

    //console.log(paths);
    paths.forEach(path => {
        let updated = false;

        //console.log('path: ', path);

        let src = fs.readFileSync(path, 'utf8');
        let dst = src
        .replace(/(\/\/ --- START lexer kernel ---)[^]+?(\/\/ --- END lexer kernel ---)/, function f(m, p1, p2) {
            edit_cnt++;
            return p1 + `
return \`${kernel}\`;
    ` + p2;
        })
        .replace(/(\/\/ --- START lexer error class ---)[^]+?(\/\/ --- END lexer error class ---)/, function f(m, p1, p2) {
            edit_cnt++;
            return p1 + `

const prelude = \`${errorClassCode}\`;

    ` + p2;
        })
        .replace(/(const commonJsMain = `)[^]+?(\/\/ --- END( of)? commonJsMain chunk ---)/, function f(m, p1, p2) {
            edit_cnt++;
            return p1 + '\n' + commonJsMainCode + '\n\`;\n' + p2;
        });
        updated = (dst !== src);

        if (updated) {
            count++;
            console.log('updated: ', path);
            fs.writeFileSync(path, dst, {
                encoding: 'utf8',
                flags: 'w'
            });
        }
    });

    if (edit_cnt !== 3) {
        console.error('ERROR: unexpected number of edits: check regexp-lexer.js and this patch tool\'s regexes, then fix them or this verification number:', edit_cnt);
        process.exit(1);
    }

    console.log('\nUpdated', count, 'files\' lexer kernel core code.');
});
