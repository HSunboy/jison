/*
  jison Equivalent of accompanying bnf, developed in
  http://www.w3.org/2005/01/yacker/uploads/ShEx2

  Process:
    Started with yacker perl output.
    Made """{PNAME_LN} return 'PNAME_LN';""" lexer actions for refereneced terminals.
    Folded X_Opt back in to calling productions to eliminate conflicts.
      (X? didn't seem to accept null input during testing.)
    Stole as much as possible from sparql.jison
      https://github.com/RubenVerborgh/SPARQL.js
    including functions in the header. Some can be directly mapped to javascript
    functions:
      appendTo(A, B) === A.concat([B])
      unionAll(A, B) === A.concat(B)

  Mysteries:
    jison accepts X* but I wasn't able to eliminate eliminate X_Star because it
    wouldn't accept the next symbol.
*/


%code init %include "includes/unicode.helpers.js"
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// WARNING: brutal hack to make example compile and run in minimal jison-gho lexer CLI environment.


%{
  /*
    ShEx parser in the Jison parser generator format.
  */

  const UNBOUNDED = -1;

  //const ShExUtil = require("@shexjs/util");
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  // WARNING: brutal hack to make example compile and run in minimal jison-gho lexer CLI environment.

  // Common namespaces and entities
  const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      RDF_TYPE  = RDF + 'type',
      RDF_FIRST = RDF + 'first',
      RDF_REST  = RDF + 'rest',
      RDF_NIL   = RDF + 'nil',
      XSD = 'http://www.w3.org/2001/XMLSchema#',
      XSD_INTEGER  = XSD + 'integer',
      XSD_DECIMAL  = XSD + 'decimal',
      XSD_FLOAT   = XSD + 'float',
      XSD_DOUBLE   = XSD + 'double',
      XSD_BOOLEAN  = XSD + 'boolean',
      XSD_TRUE =  '"true"^^'  + XSD_BOOLEAN,
      XSD_FALSE = '"false"^^' + XSD_BOOLEAN,
      XSD_PATTERN        = XSD + 'pattern',
      XSD_MININCLUSIVE   = XSD + 'minInclusive',
      XSD_MINEXCLUSIVE   = XSD + 'minExclusive',
      XSD_MAXINCLUSIVE   = XSD + 'maxInclusive',
      XSD_MAXEXCLUSIVE   = XSD + 'maxExclusive',
      XSD_LENGTH         = XSD + 'length',
      XSD_MINLENGTH      = XSD + 'minLength',
      XSD_MAXLENGTH      = XSD + 'maxLength',
      XSD_TOTALDIGITS    = XSD + 'totalDigits',
      XSD_FRACTIONDIGITS = XSD + 'fractionDigits';

  const numericDatatypes = [
      XSD + "integer",
      XSD + "decimal",
      XSD + "float",
      XSD + "double",
      XSD + "string",
      XSD + "boolean",
      XSD + "dateTime",
      XSD + "nonPositiveInteger",
      XSD + "negativeInteger",
      XSD + "long",
      XSD + "int",
      XSD + "short",
      XSD + "byte",
      XSD + "nonNegativeInteger",
      XSD + "unsignedLong",
      XSD + "unsignedInt",
      XSD + "unsignedShort",
      XSD + "unsignedByte",
      XSD + "positiveInteger"
  ];

  const absoluteIRI = /^[a-z][a-z0-9+.-]*:/i,
    schemeAuthority = /^(?:([a-z][a-z0-9+.-]*:))?(?:\/\/[^\/]*)?/i,
    dotSegments = /(?:^|\/)\.\.?(?:$|[\/#?])/;

  const numericFacets = ["mininclusive", "minexclusive",
                       "maxinclusive", "maxexclusive"];

  // Returns a lowercase version of the given string
  function lowercase(string) {
    return string.toLowerCase();
  }

  // Appends the item to the array and returns the array
  function appendTo(array, item) {
    return array.push(item), array;
  }

  // Appends the items to the array and returns the array
  function appendAllTo(array, items) {
    return array.push.apply(array, items), array;
  }

  // Extends a base object with properties of other objects
  function extend(base) {
    if (!base) base = {};
    for (let i = 1, l = arguments.length, arg; i < l && (arg = arguments[i] || {}); i++)
      for (let name in arg)
        base[name] = arg[name];
    return base;
  }

  // Creates an array that contains all items of the given arrays
  function unionAll() {
    let union = [];
    for (let i = 0, l = arguments.length; i < l; i++)
      union = union.concat.apply(union, arguments[i]);
    return union;
  }

  // N3.js:lib/N3Parser.js<0.4.5>:58 with
  //   s/this\./Parser./g
  // ### `_setBase` sets the base IRI to resolve relative IRIs.
  Parser._setBase = function (baseIRI) {
    if (!baseIRI)
      baseIRI = null;

    // baseIRI '#' check disabled to allow -x 'data:text/shex,...#'
    // else if (baseIRI.indexOf('#') >= 0)
    //   throw new Error('Invalid base IRI ' + baseIRI);

    // Set base IRI and its components
    if (Parser._base = baseIRI) {
      Parser._basePath   = baseIRI.replace(/[^\/?]*(?:\?.*)?$/, '');
      baseIRI = baseIRI.match(schemeAuthority);
      Parser._baseRoot   = baseIRI[0];
      Parser._baseScheme = baseIRI[1];
    }
  }

  // N3.js:lib/N3Parser.js<0.4.5>:576 with
  //   s/this\./Parser./g
  //   s/token/iri/
  // ### `_resolveIRI` resolves a relative IRI token against the base path,
  // assuming that a base path has been set and that the IRI is indeed relative.
  function _resolveIRI (iri) {
    switch (iri[0]) {
    // An empty relative IRI indicates the base IRI
    case undefined: return Parser._base;
    // Resolve relative fragment IRIs against the base IRI
    case '#': return Parser._base + iri;
    // Resolve relative query string IRIs by replacing the query string
    case '?': return Parser._base.replace(/(?:\?.*)?$/, iri);
    // Resolve root-relative IRIs at the root of the base IRI
    case '/':
      // Resolve scheme-relative IRIs to the scheme
      return (iri[1] === '/' ? Parser._baseScheme : Parser._baseRoot) + _removeDotSegments(iri);
    // Resolve all other IRIs at the base IRI's path
    default: {
      return _removeDotSegments(Parser._basePath + iri);
    }
    }
  }

  // ### `_removeDotSegments` resolves './' and '../' path segments in an IRI as per RFC3986.
  function _removeDotSegments (iri) {
    // Don't modify the IRI if it does not contain any dot segments
    if (!dotSegments.test(iri))
      return iri;

    // Start with an imaginary slash before the IRI in order to resolve trailing './' and '../'
    const length = iri.length;
    let result = '', i = -1, pathStart = -1, next = '/', segmentStart = 0;

    while (i < length) {
      switch (next) {
      // The path starts with the first slash after the authority
      case ':':
        if (pathStart < 0) {
          // Skip two slashes before the authority
          if (iri[++i] === '/' && iri[++i] === '/')
            // Skip to slash after the authority
            while ((pathStart = i + 1) < length && iri[pathStart] !== '/')
              i = pathStart;
        }
        break;
      // Don't modify a query string or fragment
      case '?':
      case '#':
        i = length;
        break;
      // Handle '/.' or '/..' path segments
      case '/':
        if (iri[i + 1] === '.') {
          next = iri[++i + 1];
          switch (next) {
          // Remove a '/.' segment
          case '/':
            result += iri.substring(segmentStart, i - 1);
            segmentStart = i + 1;
            break;
          // Remove a trailing '/.' segment
          case undefined:
          case '?':
          case '#':
            return result + iri.substring(segmentStart, i) + iri.substr(i + 1);
          // Remove a '/..' segment
          case '.':
            next = iri[++i + 1];
            if (next === undefined || next === '/' || next === '?' || next === '#') {
              result += iri.substring(segmentStart, i - 2);
              // Try to remove the parent path from result
              if ((segmentStart = result.lastIndexOf('/')) >= pathStart)
                result = result.substr(0, segmentStart);
              // Remove a trailing '/..' segment
              if (next !== '/')
                return result + '/' + iri.substr(i + 1);
              segmentStart = i + 1;
            }
          }
        }
      }
      next = iri[++i];
    }
    return result + iri.substring(segmentStart);
  }

  // Creates an expression with the given type and attributes
  function expression(expr, attr) {
    const expression = { expression: expr };
    if (attr)
      for (let a in attr)
        expression[a] = attr[a];
    return expression;
  }

  // Creates a path with the given type and items
  function path(type, items) {
    return { type: 'path', pathType: type, items: items };
  }

  // Creates a literal with the given value and type
  function createLiteral(value, type) {
    return { value: value, type: type };
  }

  // Creates a new blank node identifier
  function blank() {
    return '_:b' + blankId++;
  };
  let blankId = 0;
  Parser._resetBlanks = function () { blankId = 0; }
  Parser.reset = function () {
    Parser._prefixes = Parser._imports = Parser._sourceMap = Parser.shapes = Parser.productions = Parser.start = Parser.startActs = null; // Reset state.
    Parser._base = Parser._baseIRI = Parser._baseIRIPath = Parser._baseIRIRoot = null;
  }
  let _fileName; // for debugging
  Parser._setFileName = function (fn) { _fileName = fn; }

  // Regular expression and replacement strings to escape strings
  const stringEscapeReplacements = { '\\': '\\', "'": "'", '"': '"',
                                   't': '\t', 'b': '\b', 'n': '\n', 'r': '\r', 'f': '\f' },
      semactEscapeReplacements = { '\\': '\\', '%': '%' },
      pnameEscapeReplacements = {
        '\\': '\\', "'": "'", '"': '"',
        'n': '\n', 'r': '\r', 't': '\t', 'f': '\f', 'b': '\b',
        '_': '_', '~': '~', '.': '.', '-': '-', '!': '!', '$': '$', '&': '&',
        '(': '(', ')': ')', '*': '*', '+': '+', ',': ',', ';': ';', '=': '=',
        '/': '/', '?': '?', '#': '#', '@': '@', '%': '%',
      };


  // Translates string escape codes in the string into their textual equivalent
  function unescapeString(string, trimLength) {
    string = string.substring(trimLength, string.length - trimLength);
    return { value: ShExUtil.unescapeText(string, stringEscapeReplacements) };
  }

  function unescapeLangString(string, trimLength) {
    const at = string.lastIndexOf("@");
    const lang = string.substr(at);
    string = string.substr(0, at);
    const u = unescapeString(string, trimLength);
    return extend(u, { language: lowercase(lang.substr(1)) });
  }

  // Translates regular expression escape codes in the string into their textual equivalent
  function unescapeRegexp (regexp) {
    const end = regexp.lastIndexOf("/");
    let s = regexp.substr(1, end-1);
    const regexpEscapeReplacements = {
      '.': "\\.", '\\': "\\\\", '?': "\\?", '*': "\\*", '+': "\\+",
      '{': "\\{", '}': "\\}", '(': "\\(", ')': "\\)", '|': "\\|",
      '^': "\\^", '$': "\\$", '[': "\\[", ']': "\\]", '/': "\\/",
      't': '\\t', 'n': '\\n', 'r': '\\r', '-': "\\-", '/': '/'
    };
    s = ShExUtil.unescapeText(s, regexpEscapeReplacements)
    const ret = {
      pattern: s
    };
    if (regexp.length > end+1)
      ret.flags = regexp.substr(end+1);
    return ret;
  }

  // Convenience function to return object with p1 key, value p2
  function keyValObject(key, val) {
    const ret = {};
    ret[key] = val;
    return ret;
  }

  // Return object with p1 key, p2 string value
  function unescapeSemanticAction(key, string) {
    string = string.substring(1, string.length - 2);
    return {
      type: "SemAct",
      name: key,
      code: ShExUtil.unescapeText(string, semactEscapeReplacements)
    };
  }

  function error (e, yy) {
    const hash = {
      text: yy.lexer.match,
      // token: this.terminals_[symbol] || symbol,
      line: yy.lexer.yylineno,
      loc: yy.lexer.yylloc,
      // expected: expected
      pos: yy.lexer.showPosition()
    }
    e.hash = hash;
    if (Parser.recoverable) {
      Parser.recoverable(e)
    } else {
      throw e;
      Parser.reset();
    }
  }

  // Expand declared prefix or throw Error
  function expandPrefix (prefix, yy) {
    if (!(prefix in Parser._prefixes))
      error(new Error('Parse error; unknown prefix "' + prefix + ':"'), yy);
    return Parser._prefixes[prefix];
  }

  // Add a shape to the map
  function addShape (label, shape, yy) {
    if (shape === EmptyShape)
      shape = { type: "Shape" };
    if (Parser.productions && label in Parser.productions)
      error(new Error("Structural error: "+label+" is a triple expression"), yy);
    if (!Parser.shapes)
      Parser.shapes = new Map();
    if (label in Parser.shapes) {
      if (Parser.options.duplicateShape === "replace")
        Parser.shapes[label] = shape;
      else if (Parser.options.duplicateShape !== "ignore")
        error(new Error("Parse error: "+label+" already defined"), yy);
    } else {
      Parser.shapes[label] = Object.assign({id: label}, shape);
    }
  }

  // Add a production to the map
  function addProduction (label, production, yy) {
    if (Parser.shapes && label in Parser.shapes)
      error(new Error("Structural error: "+label+" is a shape expression"), yy);
    if (!Parser.productions)
      Parser.productions = new Map();
    if (label in Parser.productions) {
      if (Parser.options.duplicateShape === "replace")
        Parser.productions[label] = production;
      else if (Parser.options.duplicateShape !== "ignore")
        error(new Error("Parse error: "+label+" already defined"), yy);
    } else
      Parser.productions[label] = production;
  }

  function addSourceMap (obj, yy) {
    if (!Parser._sourceMap)
      Parser._sourceMap = new Map();
    let list = Parser._sourceMap.get(obj)
    if (!list)
      Parser._sourceMap.set(obj, list = []);
    list.push(yy.lexer.yylloc);
    return obj;
  }

  // shapeJunction judiciously takes a shapeAtom and an optional list of con/disjuncts.
  // No created Shape{And,Or,Not} will have a `nested` shapeExpr.
  // Don't nonest arguments to shapeJunction.
  // shapeAtom emits `nested` so nonest every argument that can be a shapeAtom, i.e.
  //   shapeAtom, inlineShapeAtom, shapeAtomNoRef
  //   {,inline}shape{And,Or,Not}
  //   this does NOT include shapeOrRef or nodeConstraint.
  function shapeJunction (type, shapeAtom, juncts) {
    if (juncts.length === 0) {
      return nonest(shapeAtom);
    } else if (shapeAtom.type === type && !shapeAtom.nested) {
      nonest(shapeAtom).shapeExprs = nonest(shapeAtom).shapeExprs.concat(juncts);
      return shapeAtom;
    } else {
      return { type: type, shapeExprs: [nonest(shapeAtom)].concat(juncts) };
    }
  }

  // strip out .nested attribute
  function nonest (shapeAtom) {
    delete shapeAtom.nested;
    return shapeAtom;
  }

  const EmptyObject = {  };
  const EmptyShape = { type: "Shape" };
%}

/* lexical grammar */

IT_BASE                 [Bb][Aa][Ss][Ee]
IT_PREFIX               [Pp][Rr][Ee][Ff][Ii][Xx]
IT_IMPORT               [iI][mM][pP][oO][rR][tT]
IT_START                [sS][tT][aA][rR][tT]
IT_EXTERNAL             [eE][xX][tT][eE][rR][nN][aA][lL]
IT_CLOSED               [Cc][Ll][Oo][Ss][Ee][Dd]
IT_EXTRA                [Ee][Xx][Tt][Rr][Aa]
IT_LITERAL              [Ll][Ii][Tt][Ee][Rr][Aa][Ll]
IT_BNODE                [Bb][Nn][Oo][Dd][Ee]
IT_IRI                  [Ii][Rr][Ii]
IT_NONLITERAL           [Nn][Oo][Nn][Ll][Ii][Tt][Ee][Rr][Aa][Ll]
IT_AND                  [Aa][Nn][Dd]
IT_OR                   [Oo][Rr]
IT_NOT                  [No][Oo][Tt]
IT_MININCLUSIVE         [Mm][Ii][Nn][Ii][Nn][Cc][Ll][Uu][Ss][Ii][Vv][Ee]
IT_MINEXCLUSIVE         [Mm][Ii][Nn][Ee][Xx][Cc][Ll][Uu][Ss][Ii][Vv][Ee]
IT_MAXINCLUSIVE         [Mm][Aa][Xx][Ii][Nn][Cc][Ll][Uu][Ss][Ii][Vv][Ee]
IT_MAXEXCLUSIVE         [Mm][Aa][Xx][Ee][Xx][Cc][Ll][Uu][Ss][Ii][Vv][Ee]
IT_LENGTH               [Ll][Ee][Nn][Gg][Tt][Hh]
IT_MINLENGTH            [Mm][Ii][Nn][Ll][Ee][Nn][Gg][Tt][Hh]
IT_MAXLENGTH            [Mm][Aa][Xx][Ll][Ee][Nn][Gg][Tt][Hh]
IT_TOTALDIGITS          [Tt][Oo][Tt][Aa][Ll][Dd][Ii][Gg][Ii][Tt][Ss]
IT_FRACTIONDIGITS       [Ff][Rr][Aa][Cc][Tt][Ii][Oo][Nn][Dd][Ii][Gg][Ii][Tt][Ss]
LANGTAG                 "@"([A-Za-z])+(("-"([0-9A-Za-z])+))*
INTEGER                 ([+-])?([0-9])+
REPEAT_RANGE            "{"({INTEGER})((","(({INTEGER})|'*')?))?"}"
DECIMAL                 ([+-])?([0-9])*"."([0-9])+
EXPONENT                [Ee]([+-])?([0-9])+
DOUBLE                  ([+-])?((([0-9])+"."([0-9])*({EXPONENT}))|((".")?([0-9])+({EXPONENT})))
ECHAR                   "\\"[\"\'\\bfnrt]
WS                      (" ")|(("\t")|(("\r")|("\n")))
//ANON                  "\["(({WS}))*"\]"
PN_CHARS_BASE           [A-Z] | [a-z] | [\u00c0-\u00d6] | [\u00d8-\u00f6] | [\u00f8-\u02ff] | [\u0370-\u037d] | [\u037f-\u1fff] | [\u200c-\u200d] | [\u2070-\u218f] | [\u2c00-\u2fef] | [\u3001-\ud7ff] | [\uf900-\ufdcf] | [\ufdf0-\ufffd] | [\uD800-\uDB7F][\uDC00-\uDFFF] // UTF-16 surrogates for [\U00010000-\U000effff]
PN_CHARS_U              {PN_CHARS_BASE} | '_' | '_' /* !!! raise jison bug */
PN_CHARS                {PN_CHARS_U} | '-' | [0-9] | [\u00b7] | [\u0300-\u036f] | [\u203f-\u2040]
REGEXP                  '/' ([^\u002f\u005C\u000A\u000D] | '\\' [nrt\\|.?*+(){}$\u002D\u005B\u005D\u005E/] | {UCHAR})+ '/' [smix]*
BLANK_NODE_LABEL        '_:' ({PN_CHARS_U} | [0-9]) (({PN_CHARS} | '.')* {PN_CHARS})?
//ATBLANK_NODE_LABEL        '@_:' ({PN_CHARS_U} | [0-9]) (({PN_CHARS} | '.')* {PN_CHARS})?
PN_PREFIX               {PN_CHARS_BASE} (({PN_CHARS} | '.')* {PN_CHARS})?
PNAME_NS                {PN_PREFIX}? ':'
ATPNAME_NS              '@' {PNAME_NS}
HEX                     [0-9] | [A-F] | [a-f]
PERCENT                 '%' {HEX} {HEX}
UCHAR                   '\\u' {HEX} {HEX} {HEX} {HEX} | '\\U' {HEX} {HEX} {HEX} {HEX} {HEX} {HEX} {HEX} {HEX}
CODE                    "{" ([^%\\] | "\\"[%\\] | {UCHAR})* "%}"

STRING_LITERAL1         "'" ([^\u0027\u005c\u000a\u000d] | {ECHAR} | {UCHAR})* "'" /* #x27=' #x5C=\ #xA=new line #xD=carriage return */
STRING_LITERAL2         '"' ([^\u0022\u005c\u000a\u000d] | {ECHAR} | {UCHAR})* '"' /* #x22=" #x5C=\ #xA=new line #xD=carriage return */
STRING_LITERAL_LONG1    "'''" (("'" | "''")? ([^\'\\] | {ECHAR} | {UCHAR}))* "'''"
//NON_TERMINATED_STRING_LITERAL_LONG1    "'''"
STRING_LITERAL_LONG2    '"""' (('"' | '""')? ([^\"\\] | {ECHAR} | {UCHAR}))* '"""'
//NON_TERMINATED_STRING_LITERAL_LONG2    '"""'

LANG_STRING_LITERAL1         "'" ([^\u0027\u005c\u000a\u000d] | {ECHAR} | {UCHAR})* "'" {LANGTAG}
LANG_STRING_LITERAL2         '"' ([^\u0022\u005c\u000a\u000d] | {ECHAR} | {UCHAR})* '"' {LANGTAG}
LANG_STRING_LITERAL_LONG1    "'''" (("'" | "''")? ([^\'\\] | {ECHAR} | {UCHAR}))* "'''" {LANGTAG}
LANG_STRING_LITERAL_LONG2    '"""' (('"' | '""')? ([^\"\\] | {ECHAR} | {UCHAR}))* '"""' {LANGTAG}

IRIREF                  '<' ([^\u0000-\u0020<>\"{}|^`\\] | {UCHAR})* '>' /* #x00=NULL #01-#x1F=control codes #x20=space */
//ATIRIREF              '@<' ([^\u0000-\u0020<>\"{}|^`\\] | {UCHAR})* '>' /* #x00=NULL #01-#x1F=control codes #x20=space */
PN_LOCAL_ESC            '\\' ('_' | '~' | '.' | '-' | '!' | '$' | '&' | "'" | '(' | ')' | '*' | '+' | ',' | ';' | '=' | '/' | '?' | '#' | '@' | '%')
PLX                     {PERCENT} | {PN_LOCAL_ESC}
PN_LOCAL                ({PN_CHARS_U} | ':' | [0-9] | {PLX}) ({PN_CHARS} | '.' | ':' | {PLX})*
PNAME_LN                {PNAME_NS} {PN_LOCAL}
ATPNAME_LN              '@' {PNAME_LN}
COMMENT                 '#' [^\u000a\u000d]* | "/*" ([^*] | '*' ([^/] | '\\/'))* "*/"

%%

\s+|{COMMENT} /**/
{ATPNAME_LN}            return 'ATPNAME_LN';
// {ATIRIREF}           return 'ATIRIREF';
{ATPNAME_NS}            return 'ATPNAME_NS';
// {ATBLANK_NODE_LABEL} return 'ATBLANK_NODE_LABEL';
{LANGTAG}               { yytext = yytext.substr(1); return 'LANGTAG'; }
"@"                     return '@';
{PNAME_LN}              return 'PNAME_LN';
{REPEAT_RANGE}          return 'REPEAT_RANGE';
{DOUBLE}                return 'DOUBLE';
{DECIMAL}               return 'DECIMAL';
//{EXPONENT}            return 'EXPONENT';
{INTEGER}               return 'INTEGER';
//{ECHAR}               return 'ECHAR';
//{WS}                  return 'WS';
{ANON}                  return 'ANON';
{IRIREF}                return 'IRIREF';
{PNAME_NS}              return 'PNAME_NS';
"a"                     return 'a';
//{PN_CHARS_BASE}       return 'PN_CHARS_BASE';
//{PN_CHARS_U}          return 'PN_CHARS_U';
//{PN_CHARS}            return 'PN_CHARS';
{REGEXP}                return 'REGEXP';
{BLANK_NODE_LABEL}      return 'BLANK_NODE_LABEL';
//{PN_PREFIX}           return 'PN_PREFIX';
//{HEX}                 return 'HEX';
//{PERCENT}             return 'PERCENT';
//{UCHAR}               return 'UCHAR';
{CODE}                  return 'CODE';

{LANG_STRING_LITERAL_LONG1}  return 'LANG_STRING_LITERAL_LONG1';
{LANG_STRING_LITERAL_LONG2}  return 'LANG_STRING_LITERAL_LONG2';
{LANG_STRING_LITERAL1}       return 'LANG_STRING_LITERAL1';
{LANG_STRING_LITERAL2}       return 'LANG_STRING_LITERAL2';

{STRING_LITERAL_LONG1}  return 'STRING_LITERAL_LONG1';
//{NON_TERMINATED_STRING_LITERAL_LONG1}   return 'NON_TERMINATED_STRING_LITERAL_LONG2';
{STRING_LITERAL_LONG2}  return 'STRING_LITERAL_LONG2';
//{NON_TERMINATED_STRING_LITERAL_LONG2}   return 'NON_TERMINATED_STRING_LITERAL_LONG2';
{STRING_LITERAL1}       return 'STRING_LITERAL1';
{STRING_LITERAL2}       return 'STRING_LITERAL2';

//{PN_LOCAL_ESC}        return 'PN_LOCAL_ESC';
//{PLX}                 return 'PLX';
//{PN_LOCAL}            return 'PN_LOCAL';
{IT_BASE}               return 'IT_BASE';
{IT_PREFIX}             return 'IT_PREFIX';
{IT_IMPORT}             return 'IT_IMPORT';
{IT_START}              return 'IT_start';
{IT_EXTERNAL}           return 'IT_EXTERNAL';
{IT_CLOSED}             return 'IT_CLOSED';
{IT_EXTRA}              return 'IT_EXTRA';
{IT_LITERAL}            return 'IT_LITERAL';
{IT_BNODE}              return 'IT_BNODE';
{IT_IRI}                return 'IT_IRI';
{IT_NONLITERAL}         return 'IT_NONLITERAL';
{IT_AND}                return 'IT_AND';
{IT_OR}                 return 'IT_OR';
{IT_NOT}                return 'IT_NOT';
{IT_MININCLUSIVE}       return 'IT_MININCLUSIVE';
{IT_MINEXCLUSIVE}       return 'IT_MINEXCLUSIVE';
{IT_MAXINCLUSIVE}       return 'IT_MAXINCLUSIVE';
{IT_MAXEXCLUSIVE}       return 'IT_MAXEXCLUSIVE';
{IT_LENGTH}             return 'IT_LENGTH';
{IT_MINLENGTH}          return 'IT_MINLENGTH';
{IT_MAXLENGTH}          return 'IT_MAXLENGTH';
{IT_TOTALDIGITS}        return 'IT_TOTALDIGITS';
{IT_FRACTIONDIGITS}     return 'IT_FRACTIONDIGITS';
"="                     return '=';
"//"                    return '//';
"{"                     return '{';
"}"                     return '}';
"&"                     return '&';
"||"                    return '||';
"|"                     return '|';
","                     return ',';
"("                     return '(';
")"                     return ')';
"["                     return '[';
"]"                     return ']';
"$"                     return '$';
"!"                     return '!';
"^^"                    return '^^';
"^"                     return '^';
"."                     return '.';
"~"                     return '~';
";"                     return ';';
"*"                     return '*';
"+"                     return '+';
"?"                     return '?';
"-"                     return '-';
"%"                     return '%';
"true"                  return 'IT_true';
"false"                 return 'IT_false';
<<EOF>>                 return 'EOF';
[a-zA-Z0-9_-]+          return 'unexpected word "'+yytext+'"';
.                       return 'invalid character '+yytext;