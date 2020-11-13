

import camelCase from './camelCase';
import mkIdentifier from './mkIdentifier';

// Check if the given input can be a legal identifier-to-be-camelcased:
// use this function to check if the way the identifier is written will
// produce a sensible & comparable identifier name using the `mkIdentifier'
// API - for humans that transformation should be obvious/trivial in
// order to prevent confusion.
/** @public */
export default function isLegalIdentifierInput(s) {
    s = '' + s;
    // Convert dashed ids to Camel Case (though NOT lowercasing the initial letter though!), 
    // e.g. `camelCase('camels-have-one-hump')` => `'camelsHaveOneHump'`
    let ref = s
    .replace(/-\w/g, function (match) {
        var c = match.charAt(1);
        var rv = c.toUpperCase();
        // mutate 'a-2' to 'a_2':
        if (c === rv && c.match(/\d/)) {
            return '_' + match.substr(1);
        }
        return rv;
    });
    var alt = mkIdentifier(s);
    return alt === ref;
}
