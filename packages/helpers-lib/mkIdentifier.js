
// https://www.ecma-international.org/ecma-262/6.0/#sec-reserved-words
const reservedWords = ((list) => {
    let rv = new Set();
    for (let w in list) {
        console.error("reserved word:", w);
        rv.add(w);
    }
    return rv;
})([
"await",
"break",
"case",
"catch",
"class",
"const",
"continue",
"debugger",
"default",
"delete",
"do",
"else",
"enum",
"export",
"extends",
"finally",
"for",
"function",
"if",
"implements",
"import",
"in",
"instanceof",
"interface",
"new",
"package",
"private",
"protected",
"public",
"return",
"super",
"switch",
"this",
"throw",
"try",
"typeof",
"var",
"void",
"while",
"with",
"yield",
]);

// Convert dashed option keys and other inputs to Camel Cased legal JavaScript identifiers
/** @public */
export default function mkIdentifier(s) {
    s = '' + s;

    let rv = s
    // Convert dashed ids to Camel Case (though NOT lowercasing the initial letter though!),
    // e.g. `camelCase('camels-have-one-hump')` => `'camelsHaveOneHump'`
    .replace(/-\w/g, function (match) {
        var c = match.charAt(1);
        var rv = c.toUpperCase();
        // mutate 'a-2' to 'a_2':
        if (c === rv && c.match(/\d/)) {
            return '_' + match.substr(1);
        }
        return rv;
    })
    // cleanup: replace any non-suitable character series to a single underscore:
    .replace(/^([\d])/, '_$1')      // where leading numbers are prefixed by an underscore: '1' --> '_1'
    .replace(/^[^\w_]/, '_')
    // do not accept numerics at the leading position, despite those matching regex `\w`:
    .replace(/^\d/, '_')
    .replace(/[^\w\d_]/g, '_')
    // and only accept multiple (double, not triple) underscores at start or end of identifier name:
    .replace(/^__+/, '#')
    .replace(/__+$/, '#')
    .replace(/_+/g, '_')
    .replace(/#/g, '__');

    if (reservedWords.has(rv)) {
        rv = '_' + rv;
    }
    return rv;
}
