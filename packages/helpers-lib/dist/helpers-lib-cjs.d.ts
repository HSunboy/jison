// tagged template string helper which removes the indentation common to all
// non-empty lines: that indentation was added as part of the source code
// formatting of this lexer spec file and must be removed to produce what
// we were aiming for.
//
// Each template string starts with an optional empty line, which should be
// removed entirely, followed by a first line of error reporting content text,
// which should not be indented at all, i.e. the indentation of the first
// non-empty line should be treated as the 'common' indentation and thus
// should also be removed from all subsequent lines in the same template string.
//
// See also: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals
declare function rmCommonWS(strings: any, ...values: any[]): string;
// Convert dashed option keys to Camel Case, e.g. `camelCase('camels-have-one-hump')` => `'camelsHaveOneHump'`
/** @public */
declare function camelCase(s: any): any;
// Convert dashed option keys and other inputs to Camel Cased legal JavaScript identifiers
/** @public */
declare function mkIdentifier(s: any): any;
// properly quote and escape the given input string
declare function dquote(s: any): any;
//
//
//
declare function detectIstanbulGlobal(): any;
declare const _default: {
    rmCommonWS: typeof rmCommonWS;
    camelCase: typeof camelCase;
    mkIdentifier: typeof mkIdentifier;
    dquote: typeof dquote;
    exec: (sourcecode: any, code_execution_rig: any, options: any, title: any) => any;
    dump: (sourcecode: any, errname: any, err_id: any, options: any, ex: any) => void;
    parseCodeChunkToAST: (src: any) => any;
    prettyPrintAST: (ast: any, options: any) => any;
    checkActionBlock: (src: any, yylloc: any) => any;
    printFunctionSourceCode: (f: any) => string;
    printFunctionSourceCodeContainer: (f: any) => {
        args: any;
        code: string;
    };
    detectIstanbulGlobal: typeof detectIstanbulGlobal;
};
export { _default as default };
