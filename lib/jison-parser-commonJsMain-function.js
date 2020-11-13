
function __jison_default_main__(args) {
    // When the parser comes with its own `main` function, then use that one:
    if (typeof exports.parser.main === 'function') {
        return exports.parser.main(args);
    }

    if (!args[1]) {
        console.log('Usage:', path.basename(args[0]) + ' FILE');
        process.exit(1);
    }
    const source = fs.readFileSync(path.normalize(args[1]), 'utf8');
    const dst = exports.parser.parse(source);
    console.log('parser output:\n\n', {
        type: typeof dst,
        value: dst
    });
    try {
        console.log('\n\nor as JSON:\n', JSON.stringify(dst, null, 2));
    } catch (e) { /* ignore crashes; output MAY not be serializable! We are a generic bit of code, after all... */ }
    let rv = 0;
    if (typeof dst === 'number' || typeof dst === 'boolean') {
        rv = dst;
    }
    return dst;
}
