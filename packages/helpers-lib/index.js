
import rmCommonWS from './rmCommonWS';
import camelCase from './camelCase';
import mkIdentifier from './mkIdentifier';
import scanRegExp from './scanRegExp';
import isLegalIdentifierInput from './isLegalIdentifierInput';
import dquote from './dquote';
import exec from './safe-code-exec-and-diag';
import parse2AST from './parse-code-chunk-to-AST';
import stringifier from './code-stringification';
import detectIstanbulGlobal from './detect-istanbul';
import reHelpers from './validate-regex';
import { trimErrorForTestReporting, stripErrorStackPaths, cleanStackTrace4Comparison } from './trimErrorForTestReporting';
import extractSymbolTableFromFile from './extractSymbolTableFromJSON5File';



export default {
    rmCommonWS,
    camelCase,
    mkIdentifier,
    isLegalIdentifierInput,
    scanRegExp,
    dquote,
    trimErrorForTestReporting,
    stripErrorStackPaths,
    cleanStackTrace4Comparison,
    extractSymbolTableFromFile,

    checkRegExp: reHelpers.checkRegExp,
    getRegExpInfo: reHelpers.getRegExpInfo,

    exec: exec.exec,
    dump: exec.dump,
    convertExceptionToObject: exec.convertExceptionToObject,

    generateMapper4JisonGrammarIdentifiers: parse2AST.generateMapper4JisonGrammarIdentifiers,
    parseCodeChunkToAST: parse2AST.parseCodeChunkToAST,
    //compileCodeToES5: parse2AST.compileCodeToES5,
    prettyPrintAST: parse2AST.prettyPrintAST,
    checkActionBlock: parse2AST.checkActionBlock,
    trimActionCode: parse2AST.trimActionCode,
    braceArrowActionCode: parse2AST.braceArrowActionCode,

    ID_REGEX_BASE: parse2AST.ID_REGEX_BASE,
    IN_ID_CHARSET: parse2AST.IN_ID_CHARSET,

    printFunctionSourceCode: stringifier.printFunctionSourceCode,
    printFunctionSourceCodeContainer: stringifier.printFunctionSourceCodeContainer,

    detectIstanbulGlobal
};
