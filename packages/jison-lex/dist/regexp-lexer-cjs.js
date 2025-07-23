"use strict";var e,t,r,n,i,s=require("@gerhobbelt/xregexp"),o=require("@gerhobbelt/json5"),a=require("@gerhobbelt/lex-parser"),l=require("assert"),c=require("jison-helpers-lib");const u=/^\{[A-Za-z0-9 \-\._]+\}/,h=/^(?:[^\\]|\\[^cxu0-9]|\\[0-9]{1,3}|\\c[A-Z]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})/,p=/^(?:[^\\\]]|\\[^cxu0-9]|\\[0-9]{1,3}|\\c[A-Z]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})+/,f=/^\\[dDwWsS]$|^\\p\{[A-Za-z0-9 \-\._]+\}$/,d=" \f\n\r	\v\xa0 ᠎ - \u2028\u2029  　\uFEFF",m="A-Za-z0-9_";function y(e){var t,r;switch(e){case 10:return"\\n";case 13:return"\\r";case 9:return"\\t";case 8:return"\\b";case 12:return"\\f";case 11:return"\\v";case 45:return"\\-";case 91:return"\\[";case 92:return"\\\\";case 93:return"\\]";case 94:return"\\^"}return e<32||e>65520||e>=55296&&e<=57343||String.fromCharCode(e).match(/[\u2028\u2029]/)?(r=e.toString(16)).length>=1&&e<=65535?"\\u"+(t="0000"+r).substr(t.length-4):"\\u{"+r+"}":String.fromCharCode(e)}var x={},g=[];function _(e){var t=Array(65536),r={},n=e&&e.options&&e.options.xregexp;for(h in x)if(p=x[h],!(!n&&h.indexOf("\\p{")>=0)){var i=0;for(c=0;c<=65535;c++)p[c]&&(i++,t[c]?t[c].push(h):t[c]=[h]);r[h]=i}var s=[],o={},a=Object.keys(x);for(c=0;c<=65535;c++)h=t[c][0],1!==t[c].length||o[h]||(l(r[h]>0),s.push([c,h]),o[h]=!0);for(u=0;a[u];u++)if(h=a[u],!(!n&&h.indexOf("\\p{")>=0)&&!o[h]){l(r[h]>0);var c,u,h,p,f,d=1/0;for(c=0,p=x[h];c<=65535;c++)if(p[c]){var m=t[c].length;m>1&&m<d&&(l(r[h]>0),f=[c,h],d=m)}f&&(o[h]=!0,s.push(f))}s.sort(function(e,t){var n=e[1],i=r[t[1]]-r[n];return i||t[0]-e[0]}),g=s}function v(e,t,r){var n,o,a,c=t,p=!1;function f(t,r){null==r&&(r=t);for(var n=t;n<=r;n++)e[n]=!0}function d(e,t){for(var r=0;r<=65535;r++)t[r]&&(e[r]=!0)}function m(e){var t;if(0!==e.indexOf("\\"))return e;switch(e.substr(0,2)){case"\\c":return String.fromCharCode(t=e.charCodeAt(2)-65+1);case"\\x":return String.fromCharCode(t=parseInt(e=e.substr(2),16));case"\\u":if("{"===(e=e.substr(2))[0]&&(e=e.substr(1,e.length-2)),(t=parseInt(e,16))>=65536)return Error("We do NOT support Extended Plane Unicode Codepoints (i.e. CodePoints beyond U:FFFF) in regex set expressions, e.g. \\u{"+e+"}");return String.fromCharCode(t);case"\\0":case"\\1":case"\\2":case"\\3":case"\\4":case"\\5":case"\\6":case"\\7":return String.fromCharCode(t=parseInt(e=e.substr(1),8));case"\\r":return"\r";case"\\n":return"\n";case"\\v":return"\v";case"\\f":return"\f";case"\\t":return"	";case"\\b":return"\b";default:return e.substr(1)}}if(t&&t.length){for("^"===t[0]&&(p=!0,t=t.substr(1),n=e,e=Array(65536));t.length;){if(o=t.match(h))switch(o=o[0]){case"\\p":if(a=(t=t.substr(o.length)).match(u)){a=a[0],t=t.substr(a.length);var y=o+a,g=x[y];if(!g){var v=""+new s("["+y+"]");g=E(v=v.substr(1,v.length-2),y,r),x[y]=g,_(r)}d(e,g);continue}break;case"\\S":case"\\s":case"\\W":case"\\w":case"\\d":case"\\D":t=t.substr(o.length);var b=i.esc2bitarr[o[1]];l(b),d(e,b);continue;case"\\b":o="\b"}else o=t[0];var A=m(o);if(A instanceof Error)return A;if(A=A.charCodeAt(0),"-"===(t=t.substr(o.length))[0]&&t.length>=2){var w=m(a=(a=(t=t.substr(1)).match(h))?a[0]:t[0]);if(w instanceof Error)return A;w=w.charCodeAt(0),t=t.substr(a.length),A<=w?f(A,w):(console.warn("INVALID CHARACTER RANGE found in regex: ",{re:c,start:o,start_n:A,end:a,end_n:w}),f(A),f(45),f(w));continue}f(A)}if(p)for(var k=0;k<=65535;k++)e[k]||(n[k]=!0)}return!1}function b(e,t,r){e[65536]=1;var n,s,o,a,c,u,h,p,f,d,m=[],_=!1,v=e;if(t){for(n=0,o=0;n<=65535;n++)!e[n]&&o++;if(65536===o)return"\\S\\s";if(0===o)return"^\\S\\s";if(r){for(c=0,a=g;a[c];c++)if(!e[(u=a[c])[0]]){for(s=0,f=x[p=u[1]],h=0;s<=65535;s++)if(f[s])if(e[s]){if(v[s]){h=!1;break}}else h++;if(h&&h>p.length)if(m.push(p),_)for(s=0;s<=65535;s++)e[s]=e[s]||f[s];else{for(s=0,d=Array(65536);s<=65535;s++)d[s]=e[s]||f[s];d[65536]=1,e=d,_=!0}}}for(n=0;n<=65535;){for(;e[n];)n++;if(n>=65536)break;for(s=n+1;!e[s];s++);m.push(y(n)),s-1>n&&m.push((s-2>n?"-":"")+y(s-1)),n=s}}else{for(n=0,o=0;n<=65535;n++)e[n]&&o++;if(65536===o)return"\\S\\s";if(0===o)return"^\\S\\s";if(r){for(c=0,a=g;a[c];c++)if(e[(u=a[c])[0]]){for(s=0,f=x[p=u[1]],h=0;s<=65535;s++)if(f[s]){if(e[s])h++;else if(!v[s]){h=!1;break}}if(h&&h>p.length)if(m.push(p),_)for(s=0;s<=65535;s++)e[s]=e[s]&&!f[s];else{for(s=0,d=Array(65536);s<=65535;s++)d[s]=e[s]&&!f[s];d[65536]=1,e=d,_=!0}}}for(n=0;n<=65535;){for(;!e[n];)n++;if(n>=65536)break;for(s=n+1;e[s];s++);s>65536&&(s=65536),m.push(y(n)),s-1>n&&m.push((s-2>n?"-":"")+y(s-1)),n=s}}l(m.length);var b=m.join("");l(b);var E=i.set2esc[b];return E?"\\"+E:b}function E(e,t,r){var n,i=e;if(e instanceof Error)return e;for(var o=Array(65536),a=0;e.length;){var c=e.match(h);if(!c)return Error('illegal escape sequence at start of regex part: "'+e+'" of regex "'+i+'"');switch(c=c[0],e=e.substr(c.length),c){case"[":for(var u=[];e.length;){var f=e.match(p);if(f)f=f[0];else{if(!(f=e.match(h)))return Error("illegal escape sequence at start of regex part: "+e+'" of regex "'+i+'"');if("]"===(f=f[0]))break}u.push(f),e=e.substr(f.length)}var d=e.match(h);if(!d)return Error('regex set expression is broken in regex: "'+i+'" --\x3e "'+e+'"');if("]"!==(d=d[0]))return Error("regex set expression is broken in regex: "+i);e=e.substr(d.length);var m=u.join("");if(!a){if((n=v(o,m,r))instanceof Error)return n;a=1}break;case"|":a=0;break;case"(":return e=(e=(e=e.replace(/^\((?:\?:)?(.*?)\)$/,"$1")).replace(/^\^?(.*?)\$?$/,"$1")).replace(/^\((?:\?:)?(.*?)\)$/,"$1"),Error("[macro ["+t+'] is unsuitable for use inside regex set expressions: "['+i+']"]');case".":case"*":case"+":case"?":case"{":return Error("[macro ["+t+'] is unsuitable for use inside regex set expressions: "['+i+']"]');default:if(!a){if((n=v(o,c,r))instanceof Error)return n;a=2}}}e=b(o);try{if(l(e),l(!(e instanceof Error)),new s("["+e+"]").test(e[0]),/[^\\][\[\]]/.exec(e))throw Error("unescaped brackets in set data")}catch(r){e=Error("[macro ["+t+'] is unsuitable for use inside regex set expressions: "['+e+']"]: '+r.message)}return(l(e),e instanceof Error)?e:o}r={},n={},i={esc2bitarr:{},set2esc:{}},g=[],v(t=[],"^"+d),e=b(t),n.S=t,r[e]="S",x["\\S"]=t,v(t=[],d),e=b(t),n.s=t,r[e]="s",x["\\s"]=t,v(t=[],"^0-9"),e=b(t),n.D=t,r[e]="D",x["\\D"]=t,v(t=[],"0-9"),e=b(t),n.d=t,r[e]="d",x["\\d"]=t,v(t=[],"^"+m),e=b(t),n.W=t,r[e]="W",x["\\W"]=t,v(t=[],m),e=b(t),n.w=t,r[e]="w",x["\\w"]=t,i={esc2bitarr:n,set2esc:r},_();var A=v,w=function(e){var t=b(e,!1,!0);if(t.match(f))return t;t="["+t+"]";var r=b(e,!0,!0);if("^"===r[0]){if((r=r.substr(1)).match(f))return r}else r="^"+r;r="["+r+"]";var n=b(e,!1,!1);if(n.match(f))return n;n="["+n+"]";var i=b(e,!0,!1);if("^"===i[0]){if((i=i.substr(1)).match(f))return i}else i="^"+i;return i="["+i+"]",r.length<t.length&&(t=r),n.length<t.length&&(t=n),i.length<t.length&&(t=i),t},k="0.6.1-215",L=c.rmCommonWS,S=c.mkIdentifier,R=c.exec;function I(e){(e=""+e).match(/\bcov_\w+/)&&console.error("### ISTANBUL COVERAGE CODE DETECTED ###\n",e)}const Y=/^(?:[^\\\[\]\(\)\|^\{\}]|\\[^cxu0-9]|\\[0-9]{1,3}|\\c[A-Z]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})+/,N={moduleType:"commonjs",debug:!1,enableDebugLogs:!1,json:!1,main:!1,dumpSourceCodeOnFailure:!0,throwErrorOnCompileFailure:!0,moduleName:void 0,defaultModuleName:"lexer",file:void 0,outfile:void 0,inputPath:void 0,inputFilename:void 0,warn_cb:void 0,xregexp:!1,lexerErrorsAreRecoverable:!1,flex:!1,backtrack_lexer:!1,ranges:!1,trackPosition:!0,caseInsensitive:!1,showSource:!1,exportSourceCode:!1,exportAST:!1,prettyCfg:!0,pre_lex:void 0,post_lex:void 0};function O(){var e=Object.prototype.hasOwnProperty,t={},r=[].concat.apply([],arguments);"NODEFAULT"!==r[0]?r.unshift(N):r.shift();for(var n=0,i=r.length;n<i;n++){var s=r[n];if(s){var o={};for(var a in s)void 0!==s[a]&&e.call(s,a)&&(o[S(a)]=s[a]);for(var a in void 0!==o.main&&(o.noMain=!o.main),delete o.main,o.moduleName===o.defaultModuleName&&delete o.moduleName,o)e.call(o,a)&&void 0!==o[a]&&(t[a]=o[a])}}return t}function T(e){var t=e.exportSourceCode;t&&"object"==typeof t?"boolean"!=typeof t.enabled&&(t.enabled=!0):t={enabled:!!t},e.exportSourceCode=t}function U(e,t){var r,n,i=null;if("string"==typeof e){if(t.json)try{i=o.parse(e)}catch(e){r=e}if(!i)try{i=a.parse(e,t)}catch(e){throw t.json?((n=Error("Could not parse lexer spec in JSON AUTODETECT mode\nError: "+r.message+" ("+e.message+")")).secondary_exception=e,n.stack=r.stack):(n=Error("Could not parse lexer spec\nError: "+e.message)).stack=e.stack,n}}else i=e;return i}function C(e,t,r,n,i){var o,a,c,f,d=e;function m(){return t?"macro [["+t+"]]":"regex [["+d+"]]"}if(e instanceof Error)return e;for(var y=[];e.length;){if(!(o=e.match(h)))return Error(m()+": illegal escape sequence at start of regex part: "+e);switch(o=o[0],e=e.substr(o.length),o){case"[":for(var x=[],g=Array(65536);e.length;){var _=e.match(p);if(_)_=_[0];else{if(!(_=e.match(h)))return Error(m()+": illegal escape sequence at start of regex part: "+e);if("]"===(_=_[0]))break}x.push(_),e=e.substr(_.length)}if(!(a=e.match(h)))return Error(m()+': regex set expression is broken: "'+e+'"');if("]"!==(a=a[0]))return Error(m()+": regex set expression is broken: apparently unterminated");if(e=e.substr(a.length),f=x.join(""),n&&(l(f=n(f)),f instanceof Error))return Error(m()+": "+f.message);if((c=A(g,f,r))instanceof Error)return Error(m()+": "+c.message);var v=w(g),b=f.indexOf("{")>=0;f="["+f+"]",!b&&f.length<v.length&&(v=f),y.push(v);break;case"\\p":(a=e.match(u))?(a=a[0],e=e.substr(a.length),y.push(o+a)):y.push(o);break;case"{":if(a=e.match(Y)){a=a[0];var E=(e=e.substr(a.length))[0];if(e=e.substr(E.length),"}"===E){if(a=o+a+E,i&&(l(a=i(a)),a instanceof Error))return Error(m()+": "+a.message)}else a=o+a+E;y.push(a)}else y.push(o);break;default:(a=e.match(Y))?(a=a[0],e=e.substr(a.length),y.push(o+a)):y.push(o)}}e=y.join("");try{new s(e).test(e[0])}catch(t){return Error(m()+": expands to an invalid regex: /"+e+"/")}return l(e),e}const j=`/**
 * See also:
 * http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript/#35881508
 * but we keep the prototype.constructor and prototype.name assignment lines too for compatibility
 * with userland code which might access the derived class in a 'classic' way.
 *
 * @public
 * @constructor
 * @nocollapse
 */
function JisonLexerError(msg, hash) {
    Object.defineProperty(this, 'name', {
        enumerable: false,
        writable: false,
        value: 'JisonLexerError'
    });

    if (msg == null) msg = '???';

    Object.defineProperty(this, 'message', {
        enumerable: false,
        writable: true,
        value: msg
    });

    this.hash = hash;

    var stacktrace;
    if (hash && hash.exception instanceof Error) {
        var ex2 = hash.exception;
        this.message = ex2.message || msg;
        stacktrace = ex2.stack;
    }
    if (!stacktrace) {
        if (Error.hasOwnProperty('captureStackTrace')) { // V8
            Error.captureStackTrace(this, this.constructor);
        } else {
            stacktrace = (new Error(msg)).stack;
        }
    }
    if (stacktrace) {
        Object.defineProperty(this, 'stack', {
            enumerable: false,
            writable: false,
            value: stacktrace
        });
    }
}

if (typeof Object.setPrototypeOf === 'function') {
    Object.setPrototypeOf(JisonLexerError.prototype, Error.prototype);
} else {
    JisonLexerError.prototype = Object.create(Error.prototype);
}
JisonLexerError.prototype.constructor = JisonLexerError;
JisonLexerError.prototype.name = 'JisonLexerError';`;function P(e,t,r,n){var i,s=!1;function o(t,o,a,c){(i=F(e,r,n)).__in_rules_failure_analysis_mode__=!1,T(i),l(i.options),t&&t();var u=z(i);try{var h=["// provide a local version for test purposes:",j,"",L`
        var __hacky_counter__ = 0;

        /**
         * @constructor
         * @nocollapse
         */
        function XRegExp(re, f) {
            this.re = re;
            this.flags = f;
            this._getUnicodeProperty = function (k) {};
            var fake = /./;    // WARNING: this exact 'fake' is also depended upon by the xregexp unit test!
            __hacky_counter__++;
            fake.__hacky_backy__ = __hacky_counter__;
            return fake;
        }
    `,"",u,"\nreturn lexer;"].join("\n"),p=R(h,function(e){return I(e),Function("",e)()},i.options,"lexer");if(!p)throw Error("no lexer defined *at all*?!");if("object"!=typeof p.options||null==p.options)throw Error("your lexer class MUST have an .options member object or it won't fly!");if("function"!=typeof p.setInput)throw Error("your lexer class MUST have a .setInput function member or it won't fly!");if(1!==p.EOF&&2!==p.ERROR)throw Error("your lexer class MUST have these constants defined: lexer.EOF = 1 and lexer.ERROR = 2 or it won't fly!");if(a&&o){var f=o;"function"==typeof o&&(f=o()),a.message+="\n        ("+f+")"}if(i.options){var d=i.options.pre_lex,m=i.options.post_lex;"function"==typeof d&&(p.options.pre_lex=d),"function"==typeof m&&(p.options.post_lex=m)}return i.options.showSource&&("function"==typeof i.options.showSource?i.options.showSource(p,u,i):console.log("\nGenerated lexer sourcecode:\n----------------------------------------\n",u,"\n----------------------------------------\n")),p}catch(e){return c?c(e):s&&console.log("source code:\n",u),!1}}var a=o(null,null,null,function(e){l(i.options),l(void 0!==i.options.xregexp);var t=!!i.options.xregexp;if(!o(function(){l(void 0!==i.options.xregexp),i.options.xregexp=!1,i.showSource=!1},"When you have specified %option xregexp, you must also properly IMPORT the XRegExp library in the generated lexer.",e,null)&&!o(function(){i.options.xregexp=t,i.conditions=[],i.showSource=!1},function(){return l(Array.isArray(i.rules)),i.rules.length>0?"One or more of your lexer state names are possibly botched?":"Your custom lexer is somehow botched."},e,null)&&!o(function(){l(Array.isArray(i.rules)),r=i.rules.length,i.rules=[],i.showSource=!1,i.__in_rules_failure_analysis_mode__=!0},"One or more of your lexer rules are possibly botched?",e,null)){for(var r,n,a=!1,c=0,u=r;c<u&&!(a=o(function(){l(Array.isArray(i.rules)),l(i.rules.length===r);for(var e=0;e<=c;e++){var t=i.rules[e];l(Array.isArray(t)),l(2===t.length||3===t.length),t.pop(),t.push("{ /* nada */ }"),n=t}},function(){return'Your lexer rule "'+n[0]+'" action code block is botched?'},e,null));c++);a||o(function(){i.conditions=[],i.rules=[],i.performAction="null",i.showSource=!1,i.__in_rules_failure_analysis_mode__=!0,s=!1},"One or more of your lexer rule action code block(s) are possibly botched?",e,null)}throw e});return a.setInput(t),a.generate=function(){return D(i)},a.generateModule=function(){return W(i)},a.generateCommonJSModule=function(){return H(i)},a.generateESModule=function(){return X(i)},a.generateAMDModule=function(){return G(i)},a.getExpandedMacros=function(){return i.macros},a}function M(){return`{
    EOF: 1,
    ERROR: 2,

    // JisonLexerError: JisonLexerError,        /// <-- injected by the code generator

    // options: {},                             /// <-- injected by the code generator

    // yy: ...,                                 /// <-- injected by setInput()

    __currentRuleSet__: null,                   /// INTERNAL USE ONLY: internal rule set cache for the current lexer state

    __error_infos: [],                          /// INTERNAL USE ONLY: the set of lexErrorInfo objects created since the last cleanup

    __decompressed: false,                      /// INTERNAL USE ONLY: mark whether the lexer instance has been 'unfolded' completely and is now ready for use

    done: false,                                /// INTERNAL USE ONLY
    _backtrack: false,                          /// INTERNAL USE ONLY
    _input: '',                                 /// INTERNAL USE ONLY
    _more: false,                               /// INTERNAL USE ONLY
    _signaled_error_token: false,               /// INTERNAL USE ONLY

    conditionStack: [],                         /// INTERNAL USE ONLY; managed via \`pushState()\`, \`popState()\`, \`topState()\` and \`stateStackSize()\`

    match: '',                                  /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks input which has been matched so far for the lexer token under construction. \`match\` is identical to \`yytext\` except that this one still contains the matched input string after \`lexer.performAction()\` has been invoked, where userland code MAY have changed/replaced the \`yytext\` value entirely!
    matched: '',                                /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks entire input which has been matched so far
    matches: false,                             /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks RE match result for last (successful) match attempt
    yytext: '',                                 /// ADVANCED USE ONLY: tracks input which has been matched so far for the lexer token under construction; this value is transferred to the parser as the 'token value' when the parser consumes the lexer token produced through a call to the \`lex()\` API.
    offset: 0,                                  /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks the 'cursor position' in the input string, i.e. the number of characters matched so far
    yyleng: 0,                                  /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: length of matched input for the token under construction (\`yytext\`)
    yylineno: 0,                                /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: 'line number' at which the token under construction is located
    yylloc: null,                               /// READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks location info (lines + columns) for the token under construction

    /**
     * INTERNAL USE: construct a suitable error info hash object instance for \`parseError\`.
     * 
     * @public
     * @this {RegExpLexer}
     */
    constructLexErrorInfo: function lexer_constructLexErrorInfo(msg, recoverable, show_input_position) {
        msg = '' + msg;

        // heuristic to determine if the error message already contains a (partial) source code dump
        // as produced by either \`showPosition()\` or \`prettyPrintRange()\`:
        if (show_input_position == undefined) {
            show_input_position = !(msg.indexOf('\\n') > 0 && msg.indexOf('^') > 0);
        }
        if (this.yylloc && show_input_position) {
            if (typeof this.prettyPrintRange === 'function') {
                var pretty_src = this.prettyPrintRange(this.yylloc);

                if (!/\\n\\s*$/.test(msg)) {
                    msg += '\\n';
                }
                msg += '\\n  Erroneous area:\\n' + this.prettyPrintRange(this.yylloc);          
            } else if (typeof this.showPosition === 'function') {
                var pos_str = this.showPosition();
                if (pos_str) {
                    if (msg.length && msg[msg.length - 1] !== '\\n' && pos_str[0] !== '\\n') {
                        msg += '\\n' + pos_str;
                    } else {
                        msg += pos_str;
                    }
                }
            }
        }
        /** @constructor */
        var pei = {
            errStr: msg,
            recoverable: !!recoverable,
            text: this.match,           // This one MAY be empty; userland code should use the \`upcomingInput\` API to obtain more text which follows the 'lexer cursor position'...
            token: null,
            line: this.yylineno,
            loc: this.yylloc,
            yy: this.yy,
            lexer: this,

            /**
             * and make sure the error info doesn't stay due to potential
             * ref cycle via userland code manipulations.
             * These would otherwise all be memory leak opportunities!
             * 
             * Note that only array and object references are nuked as those
             * constitute the set of elements which can produce a cyclic ref.
             * The rest of the members is kept intact as they are harmless.
             * 
             * @public
             * @this {LexErrorInfo}
             */
            destroy: function destructLexErrorInfo() {
                // remove cyclic references added to error info:
                // info.yy = null;
                // info.lexer = null;
                // ...
                var rec = !!this.recoverable;
                for (var key in this) {
                    if (this.hasOwnProperty(key) && typeof key === 'object') {
                        this[key] = undefined;
                    }
                }
                this.recoverable = rec;
            }
        };
        // track this instance so we can \`destroy()\` it once we deem it superfluous and ready for garbage collection!
        this.__error_infos.push(pei);
        return pei;
    },

    /**
     * handler which is invoked when a lexer error occurs.
     * 
     * @public
     * @this {RegExpLexer}
     */
    parseError: function lexer_parseError(str, hash, ExceptionClass) {
        if (!ExceptionClass) {
            ExceptionClass = this.JisonLexerError;
        }
        if (this.yy) {
            if (this.yy.parser && typeof this.yy.parser.parseError === 'function') {
                return this.yy.parser.parseError.call(this, str, hash, ExceptionClass) || this.ERROR;
            } else if (typeof this.yy.parseError === 'function') {
                return this.yy.parseError.call(this, str, hash, ExceptionClass) || this.ERROR;
            } 
        }
        throw new ExceptionClass(str, hash);
    },

    /**
     * method which implements \`yyerror(str, ...args)\` functionality for use inside lexer actions.
     * 
     * @public
     * @this {RegExpLexer}
     */
    yyerror: function yyError(str /*, ...args */) {
        var lineno_msg = '';
        if (this.yylloc) {
            lineno_msg = ' on line ' + (this.yylineno + 1);
        }
        var p = this.constructLexErrorInfo('Lexical error' + lineno_msg + ': ' + str, this.options.lexerErrorsAreRecoverable);

        // Add any extra args to the hash under the name \`extra_error_attributes\`:
        var args = Array.prototype.slice.call(arguments, 1);
        if (args.length) {
            p.extra_error_attributes = args;
        }

        return (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
    },

    /**
     * final cleanup function for when we have completed lexing the input;
     * make it an API so that external code can use this one once userland
     * code has decided it's time to destroy any lingering lexer error
     * hash object instances and the like: this function helps to clean
     * up these constructs, which *may* carry cyclic references which would
     * otherwise prevent the instances from being properly and timely
     * garbage-collected, i.e. this function helps prevent memory leaks!
     * 
     * @public
     * @this {RegExpLexer}
     */
    cleanupAfterLex: function lexer_cleanupAfterLex(do_not_nuke_errorinfos) {
        // prevent lingering circular references from causing memory leaks:
        this.setInput('', {});

        // nuke the error hash info instances created during this run.
        // Userland code must COPY any data/references
        // in the error hash instance(s) it is more permanently interested in.
        if (!do_not_nuke_errorinfos) {
            for (var i = this.__error_infos.length - 1; i >= 0; i--) {
                var el = this.__error_infos[i];
                if (el && typeof el.destroy === 'function') {
                    el.destroy();
                }
            }
            this.__error_infos.length = 0;
        }

        return this;
    },

    /**
     * clear the lexer token context; intended for internal use only
     * 
     * @public
     * @this {RegExpLexer}
     */
    clear: function lexer_clear() {
        this.yytext = '';
        this.yyleng = 0;
        this.match = '';
        // - DO NOT reset \`this.matched\`
        this.matches = false;
        this._more = false;
        this._backtrack = false;

        var col = (this.yylloc ? this.yylloc.last_column : 0);
        this.yylloc = {
            first_line: this.yylineno + 1,
            first_column: col,
            last_line: this.yylineno + 1,
            last_column: col,

            range: [this.offset, this.offset]
        };
    },

    /**
     * resets the lexer, sets new input
     * 
     * @public
     * @this {RegExpLexer}
     */
    setInput: function lexer_setInput(input, yy) {
        this.yy = yy || this.yy || {};

        // also check if we've fully initialized the lexer instance,
        // including expansion work to be done to go from a loaded
        // lexer to a usable lexer:
        if (!this.__decompressed) {
          // step 1: decompress the regex list:
          var rules = this.rules;
          for (var i = 0, len = rules.length; i < len; i++) {
            var rule_re = rules[i];

            // compression: is the RE an xref to another RE slot in the rules[] table?
            if (typeof rule_re === 'number') {
              rules[i] = rules[rule_re];
            }
          }

          // step 2: unfold the conditions[] set to make these ready for use:
          var conditions = this.conditions;
          for (var k in conditions) {
            var spec = conditions[k];

            var rule_ids = spec.rules;

            var len = rule_ids.length;
            var rule_regexes = new Array(len + 1);            // slot 0 is unused; we use a 1-based index approach here to keep the hottest code in \`lexer_next()\` fast and simple!
            var rule_new_ids = new Array(len + 1);

            for (var i = 0; i < len; i++) {
              var idx = rule_ids[i];
              var rule_re = rules[idx];
              rule_regexes[i + 1] = rule_re;
              rule_new_ids[i + 1] = idx;
            }

            spec.rules = rule_new_ids;
            spec.__rule_regexes = rule_regexes;
            spec.__rule_count = len;
          }

          this.__decompressed = true;
        }

        this._input = input || '';
        this.clear();
        this._signaled_error_token = false;
        this.done = false;
        this.yylineno = 0;
        this.matched = '';
        this.conditionStack = ['INITIAL'];
        this.__currentRuleSet__ = null;
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0,

            range: [0, 0]
        };
        this.offset = 0;
        return this;
    },

    /**
     * edit the remaining input via user-specified callback.
     * This can be used to forward-adjust the input-to-parse, 
     * e.g. inserting macro expansions and alike in the
     * input which has yet to be lexed.
     * The behaviour of this API contrasts the \`unput()\` et al
     * APIs as those act on the *consumed* input, while this
     * one allows one to manipulate the future, without impacting
     * the current \`yyloc\` cursor location or any history. 
     * 
     * Use this API to help implement C-preprocessor-like
     * \`#include\` statements, etc.
     * 
     * The provided callback must be synchronous and is
     * expected to return the edited input (string).
     *
     * The \`cpsArg\` argument value is passed to the callback
     * as-is.
     *
     * \`callback\` interface: 
     * \`function callback(input, cpsArg)\`
     * 
     * - \`input\` will carry the remaining-input-to-lex string
     *   from the lexer.
     * - \`cpsArg\` is \`cpsArg\` passed into this API.
     * 
     * The \`this\` reference for the callback will be set to
     * reference this lexer instance so that userland code
     * in the callback can easily and quickly access any lexer
     * API. 
     *
     * When the callback returns a non-string-type falsey value,
     * we assume the callback did not edit the input and we
     * will using the input as-is.
     *
     * When the callback returns a non-string-type value, it
     * is converted to a string for lexing via the \`"" + retval\`
     * operation. (See also why: http://2ality.com/2012/03/converting-to-string.html 
     * -- that way any returned object's \`toValue()\` and \`toString()\`
     * methods will be invoked in a proper/desirable order.)
     * 
     * @public
     * @this {RegExpLexer}
     */
    editRemainingInput: function lexer_editRemainingInput(callback, cpsArg) {
        var rv = callback.call(this, this._input, cpsArg);
        if (typeof rv !== 'string') {
            if (rv) {
                this._input = '' + rv; 
            }
            // else: keep \`this._input\` as is. 
        } else {
            this._input = rv; 
        }
        return this;
    },

    /**
     * consumes and returns one char from the input
     * 
     * @public
     * @this {RegExpLexer}
     */
    input: function lexer_input() {
        if (!this._input) {
            //this.done = true;    -- don't set \`done\` as we want the lex()/next() API to be able to produce one custom EOF token match after this anyhow. (lexer can match special <<EOF>> tokens and perform user action code for a <<EOF>> match, but only does so *once*)
            return null;
        }
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        // Count the linenumber up when we hit the LF (or a stand-alone CR).
        // On CRLF, the linenumber is incremented when you fetch the CR or the CRLF combo
        // and we advance immediately past the LF as well, returning both together as if
        // it was all a single 'character' only.
        var slice_len = 1;
        var lines = false;
        if (ch === '\\n') {
            lines = true;
        } else if (ch === '\\r') {
            lines = true;
            var ch2 = this._input[1];
            if (ch2 === '\\n') {
                slice_len++;
                ch += ch2;
                this.yytext += ch2;
                this.yyleng++;
                this.offset++;
                this.match += ch2;
                this.matched += ch2;
                this.yylloc.range[1]++;
            }
        }
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
            this.yylloc.last_column = 0;
        } else {
            this.yylloc.last_column++;
        }
        this.yylloc.range[1]++;

        this._input = this._input.slice(slice_len);
        return ch;
    },

    /**
     * unshifts one char (or an entire string) into the input
     * 
     * @public
     * @this {RegExpLexer}
     */
    unput: function lexer_unput(ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\\r\\n?|\\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        this.yyleng = this.yytext.length;
        this.offset -= len;
        this.match = this.match.substr(0, this.match.length - len);
        this.matched = this.matched.substr(0, this.matched.length - len);

        if (lines.length > 1) {
            this.yylineno -= lines.length - 1;

            this.yylloc.last_line = this.yylineno + 1;

            // Get last entirely matched line into the \`pre_lines[]\` array's
            // last index slot; we don't mind when other previously 
            // matched lines end up in the array too. 
            var pre = this.match;
            var pre_lines = pre.split(/(?:\\r\\n?|\\n)/g);
            if (pre_lines.length === 1) {
                pre = this.matched;
                pre_lines = pre.split(/(?:\\r\\n?|\\n)/g);
            }
            this.yylloc.last_column = pre_lines[pre_lines.length - 1].length;
        } else {
            this.yylloc.last_column -= len;
        }

        this.yylloc.range[1] = this.yylloc.range[0] + this.yyleng;

        this.done = false;
        return this;
    },

    /**
     * cache matched text and append it on next action
     * 
     * @public
     * @this {RegExpLexer}
     */
    more: function lexer_more() {
        this._more = true;
        return this;
    },

    /**
     * signal the lexer that this rule fails to match the input, so the
     * next matching rule (regex) should be tested instead.
     * 
     * @public
     * @this {RegExpLexer}
     */
    reject: function lexer_reject() {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            // when the \`parseError()\` call returns, we MUST ensure that the error is registered.
            // We accomplish this by signaling an 'error' token to be produced for the current
            // \`.lex()\` run.
            var lineno_msg = '';
            if (this.yylloc) {
                lineno_msg = ' on line ' + (this.yylineno + 1);
            }
            var p = this.constructLexErrorInfo('Lexical error' + lineno_msg + ': You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).', false);
            this._signaled_error_token = (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
        }
        return this;
    },

    /**
     * retain first n characters of the match
     * 
     * @public
     * @this {RegExpLexer}
     */
    less: function lexer_less(n) {
        return this.unput(this.match.slice(n));
    },

    /**
     * return (part of the) already matched input, i.e. for error
     * messages.
     * 
     * Limit the returned string length to \`maxSize\` (default: 20).
     * 
     * Limit the returned string to the \`maxLines\` number of lines of
     * input (default: 1).
     * 
     * Negative limit values equal *unlimited*.
     * 
     * @public
     * @this {RegExpLexer}
     */
    pastInput: function lexer_pastInput(maxSize, maxLines) {
        var past = this.matched.substring(0, this.matched.length - this.match.length);
        if (maxSize < 0)
            maxSize = past.length;
        else if (!maxSize)
            maxSize = 20;
        if (maxLines < 0)
            maxLines = past.length;         // can't ever have more input lines than this!
        else if (!maxLines)
            maxLines = 1;
        // \`substr\` anticipation: treat \\r\\n as a single character and take a little
        // more than necessary so that we can still properly check against maxSize
        // after we've transformed and limited the newLines in here:
        past = past.substr(-maxSize * 2 - 2);
        // now that we have a significantly reduced string to process, transform the newlines
        // and chop them, then limit them:
        var a = past.replace(/\\r\\n|\\r/g, '\\n').split('\\n');
        a = a.slice(-maxLines);
        past = a.join('\\n');
        // When, after limiting to maxLines, we still have too much to return,
        // do add an ellipsis prefix...
        if (past.length > maxSize) {
            past = '...' + past.substr(-maxSize);
        }
        return past;
    },

    /**
     * return (part of the) upcoming input, i.e. for error messages.
     * 
     * Limit the returned string length to \`maxSize\` (default: 20).
     * 
     * Limit the returned string to the \`maxLines\` number of lines of input (default: 1).
     * 
     * Negative limit values equal *unlimited*.
     *
     * > ### NOTE ###
     * >
     * > *"upcoming input"* is defined as the whole of the both
     * > the *currently lexed* input, together with any remaining input
     * > following that. *"currently lexed"* input is the input 
     * > already recognized by the lexer but not yet returned with
     * > the lexer token. This happens when you are invoking this API
     * > from inside any lexer rule action code block. 
     * >
     * 
     * @public
     * @this {RegExpLexer}
     */
    upcomingInput: function lexer_upcomingInput(maxSize, maxLines) {
        var next = this.match;
        if (maxSize < 0)
            maxSize = next.length + this._input.length;
        else if (!maxSize)
            maxSize = 20;
        if (maxLines < 0)
            maxLines = maxSize;         // can't ever have more input lines than this!
        else if (!maxLines)
            maxLines = 1;
        // \`substring\` anticipation: treat \\r\\n as a single character and take a little
        // more than necessary so that we can still properly check against maxSize
        // after we've transformed and limited the newLines in here:
        if (next.length < maxSize * 2 + 2) {
            next += this._input.substring(0, maxSize * 2 + 2);  // substring is faster on Chrome/V8
        }
        // now that we have a significantly reduced string to process, transform the newlines
        // and chop them, then limit them:
        var a = next.replace(/\\r\\n|\\r/g, '\\n').split('\\n');
        a = a.slice(0, maxLines);
        next = a.join('\\n');
        // When, after limiting to maxLines, we still have too much to return,
        // do add an ellipsis postfix...
        if (next.length > maxSize) {
            next = next.substring(0, maxSize) + '...';
        }
        return next;
    },

    /**
     * return a string which displays the character position where the
     * lexing error occurred, i.e. for error messages
     * 
     * @public
     * @this {RegExpLexer}
     */
    showPosition: function lexer_showPosition(maxPrefix, maxPostfix) {
        var pre = this.pastInput(maxPrefix).replace(/\\s/g, ' ');
        var c = new Array(pre.length + 1).join('-');
        return pre + this.upcomingInput(maxPostfix).replace(/\\s/g, ' ') + '\\n' + c + '^';
    },

    /**
     * return an YYLLOC info object derived off the given context (actual, preceding, following, current).
     * Use this method when the given \`actual\` location is not guaranteed to exist (i.e. when
     * it MAY be NULL) and you MUST have a valid location info object anyway:
     * then we take the given context of the \`preceding\` and \`following\` locations, IFF those are available,
     * and reconstruct the \`actual\` location info from those.
     * If this fails, the heuristic is to take the \`current\` location, IFF available.
     * If this fails as well, we assume the sought location is at/around the current lexer position
     * and then produce that one as a response. DO NOTE that these heuristic/derived location info
     * values MAY be inaccurate!
     *
     * NOTE: \`deriveLocationInfo()\` ALWAYS produces a location info object *copy* of \`actual\`, not just
     * a *reference* hence all input location objects can be assumed to be 'constant' (function has no side-effects).
     * 
     * @public
     * @this {RegExpLexer}
     */
    deriveLocationInfo: function lexer_deriveYYLLOC(actual, preceding, following, current) {
        var loc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0,

            range: [0, 0]
        };
        if (actual) {
            loc.first_line = actual.first_line | 0;
            loc.last_line = actual.last_line | 0;
            loc.first_column = actual.first_column | 0;
            loc.last_column = actual.last_column | 0;

            if (actual.range) {
                loc.range[0] = actual.range[0] | 0; 
                loc.range[1] = actual.range[1] | 0;
            } 
        }
        if (loc.first_line <= 0 || loc.last_line < loc.first_line) {
            // plan B: heuristic using preceding and following:
            if (loc.first_line <= 0 && preceding) {
                loc.first_line = preceding.last_line | 0;
                loc.first_column = preceding.last_column | 0;

                if (preceding.range) {
                    loc.range[0] = actual.range[1] | 0; 
                } 
            }

            if ((loc.last_line <= 0 || loc.last_line < loc.first_line) && following) {
                loc.last_line = following.first_line | 0;
                loc.last_column = following.first_column | 0;

                if (following.range) {
                    loc.range[1] = actual.range[0] | 0; 
                } 
            }

            // plan C?: see if the 'current' location is useful/sane too:
            if (loc.first_line <= 0 && current && (loc.last_line <= 0 || current.last_line <= loc.last_line)) {
                loc.first_line = current.first_line | 0;
                loc.first_column = current.first_column | 0;

                if (current.range) {
                    loc.range[0] = current.range[0] | 0; 
                } 
            }

            if (loc.last_line <= 0 && current && (loc.first_line <= 0 || current.first_line >= loc.first_line)) {
                loc.last_line = current.last_line | 0;
                loc.last_column = current.last_column | 0;

                if (current.range) {
                    loc.range[1] = current.range[1] | 0; 
                } 
            }
        }
        // sanitize: fix last_line BEFORE we fix first_line as we use the 'raw' value of the latter
        // or plan D heuristics to produce a 'sensible' last_line value:
        if (loc.last_line <= 0) {
            if (loc.first_line <= 0) {
                loc.first_line = this.yylloc.first_line;
                loc.last_line = this.yylloc.last_line;
                loc.first_column = this.yylloc.first_column;
                loc.last_column = this.yylloc.last_column;

                loc.range[0] = this.yylloc.range[0];
                loc.range[1] = this.yylloc.range[1];
            } else {
                loc.last_line = this.yylloc.last_line;
                loc.last_column = this.yylloc.last_column;

                loc.range[1] = this.yylloc.range[1];
            }
        }
        if (loc.first_line <= 0) {
            loc.first_line = loc.last_line;
            loc.first_column = 0; // loc.last_column;

            loc.range[1] = loc.range[0];
        }
        if (loc.first_column < 0) {
            loc.first_column = 0;
        }
        if (loc.last_column < 0) {
            loc.last_column = (loc.first_column > 0 ? loc.first_column : 80);
        }
        return loc;
    },

    /**
     * return a string which displays the lines & columns of input which are referenced 
     * by the given location info range, plus a few lines of context.
     * 
     * This function pretty-prints the indicated section of the input, with line numbers 
     * and everything!
     * 
     * This function is very useful to provide highly readable error reports, while
     * the location range may be specified in various flexible ways:
     * 
     * - \`loc\` is the location info object which references the area which should be
     *   displayed and 'marked up': these lines & columns of text are marked up by \`^\`
     *   characters below each character in the entire input range.
     * 
     * - \`context_loc\` is the *optional* location info object which instructs this
     *   pretty-printer how much *leading* context should be displayed alongside
     *   the area referenced by \`loc\`. This can help provide context for the displayed
     *   error, etc.
     * 
     *   When this location info is not provided, a default context of 3 lines is
     *   used.
     * 
     * - \`context_loc2\` is another *optional* location info object, which serves
     *   a similar purpose to \`context_loc\`: it specifies the amount of *trailing*
     *   context lines to display in the pretty-print output.
     * 
     *   When this location info is not provided, a default context of 1 line only is
     *   used.
     * 
     * Special Notes:
     * 
     * - when the \`loc\`-indicated range is very large (about 5 lines or more), then
     *   only the first and last few lines of this block are printed while a
     *   \`...continued...\` message will be printed between them.
     * 
     *   This serves the purpose of not printing a huge amount of text when the \`loc\`
     *   range happens to be huge: this way a manageable & readable output results
     *   for arbitrary large ranges.
     * 
     * - this function can display lines of input which whave not yet been lexed.
     *   \`prettyPrintRange()\` can access the entire input!
     * 
     * @public
     * @this {RegExpLexer}
     */
    prettyPrintRange: function lexer_prettyPrintRange(loc, context_loc, context_loc2) {
        loc = this.deriveLocationInfo(loc, context_loc, context_loc2);        
        const CONTEXT = 3;
        const CONTEXT_TAIL = 1;
        const MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT = 2;
        var input = this.matched + this._input;
        var lines = input.split('\\n');
        var l0 = Math.max(1, (context_loc ? context_loc.first_line : loc.first_line - CONTEXT));
        var l1 = Math.max(1, (context_loc2 ? context_loc2.last_line : loc.last_line + CONTEXT_TAIL));
        var lineno_display_width = (1 + Math.log10(l1 | 1) | 0);
        var ws_prefix = new Array(lineno_display_width).join(' ');
        var nonempty_line_indexes = [];
        var rv = lines.slice(l0 - 1, l1 + 1).map(function injectLineNumber(line, index) {
            var lno = index + l0;
            var lno_pfx = (ws_prefix + lno).substr(-lineno_display_width);
            var rv = lno_pfx + ': ' + line;
            var errpfx = (new Array(lineno_display_width + 1)).join('^');
            var offset = 2 + 1;
            var len = 0;

            if (lno === loc.first_line) {
              offset += loc.first_column;

              len = Math.max(
                2,
                ((lno === loc.last_line ? loc.last_column : line.length)) - loc.first_column + 1
              );
            } else if (lno === loc.last_line) {
              len = Math.max(2, loc.last_column + 1);
            } else if (lno > loc.first_line && lno < loc.last_line) {
              len = Math.max(2, line.length + 1);
            }

            if (len) {
              var lead = new Array(offset).join('.');
              var mark = new Array(len).join('^');
              rv += '\\n' + errpfx + lead + mark;

              if (line.trim().length > 0) {
                nonempty_line_indexes.push(index);
              }
            }

            rv = rv.replace(/\\t/g, ' ');
            return rv;
        });

        // now make sure we don't print an overly large amount of error area: limit it 
        // to the top and bottom line count:
        if (nonempty_line_indexes.length > 2 * MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT) {
            var clip_start = nonempty_line_indexes[MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT - 1] + 1;
            var clip_end = nonempty_line_indexes[nonempty_line_indexes.length - MINIMUM_VISIBLE_NONEMPTY_LINE_COUNT] - 1;

            var intermediate_line = (new Array(lineno_display_width + 1)).join(' ') +     '  (...continued...)';
            intermediate_line += '\\n' + (new Array(lineno_display_width + 1)).join('-') + '  (---------------)';
            rv.splice(clip_start, clip_end - clip_start + 1, intermediate_line);
        }
        return rv.join('\\n');
    },

    /**
     * helper function, used to produce a human readable description as a string, given
     * the input \`yylloc\` location object.
     * 
     * Set \`display_range_too\` to TRUE to include the string character index position(s)
     * in the description if the \`yylloc.range\` is available.
     * 
     * @public
     * @this {RegExpLexer}
     */
    describeYYLLOC: function lexer_describe_yylloc(yylloc, display_range_too) {
        var l1 = yylloc.first_line;
        var l2 = yylloc.last_line;
        var c1 = yylloc.first_column;
        var c2 = yylloc.last_column;
        var dl = l2 - l1;
        var dc = c2 - c1;
        var rv;
        if (dl === 0) {
            rv = 'line ' + l1 + ', ';
            if (dc <= 1) {
                rv += 'column ' + c1;
            } else {
                rv += 'columns ' + c1 + ' .. ' + c2;
            }
        } else {
            rv = 'lines ' + l1 + '(column ' + c1 + ') .. ' + l2 + '(column ' + c2 + ')';
        }
        if (yylloc.range && display_range_too) {
            var r1 = yylloc.range[0];
            var r2 = yylloc.range[1] - 1;
            if (r2 <= r1) {
                rv += ' {String Offset: ' + r1 + '}';
            } else {
                rv += ' {String Offset range: ' + r1 + ' .. ' + r2 + '}';
            }
        }
        return rv;
    },

    /**
     * test the lexed token: return FALSE when not a match, otherwise return token.
     * 
     * \`match\` is supposed to be an array coming out of a regex match, i.e. \`match[0]\`
     * contains the actually matched text string.
     * 
     * Also move the input cursor forward and update the match collectors:
     * 
     * - \`yytext\`
     * - \`yyleng\`
     * - \`match\`
     * - \`matches\`
     * - \`yylloc\`
     * - \`offset\`
     * 
     * @public
     * @this {RegExpLexer}
     */
    test_match: function lexer_test_match(match, indexed_rule) {
        var token,
            lines,
            backup,
            match_str,
            match_str_len;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.yylloc.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column,

                    range: this.yylloc.range.slice(0)
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                //_signaled_error_token: this._signaled_error_token,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
        }

        match_str = match[0];
        match_str_len = match_str.length;
        // if (match_str.indexOf('\\n') !== -1 || match_str.indexOf('\\r') !== -1) {
            lines = match_str.split(/(?:\\r\\n?|\\n)/g);
            if (lines.length > 1) {
                this.yylineno += lines.length - 1;

                this.yylloc.last_line = this.yylineno + 1;
                this.yylloc.last_column = lines[lines.length - 1].length;
            } else {
                this.yylloc.last_column += match_str_len;
            }
        // }
        this.yytext += match_str;
        this.match += match_str;
        this.matched += match_str;
        this.matches = match;
        this.yyleng = this.yytext.length;
        this.yylloc.range[1] += match_str_len;

        // previous lex rules MAY have invoked the \`more()\` API rather than producing a token:
        // those rules will already have moved this \`offset\` forward matching their match lengths,
        // hence we must only add our own match length now:
        this.offset += match_str_len;
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match_str_len);

        // calling this method:
        //
        //   function lexer__performAction(yy, yyrulenumber, YY_START) {...}
        token = this.performAction.call(this, this.yy, indexed_rule, this.conditionStack[this.conditionStack.length - 1] /* = YY_START */);
        // otherwise, when the action codes are all simple return token statements:
        //token = this.simpleCaseActionClusters[indexed_rule];

        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            this.__currentRuleSet__ = null;
            return false; // rule action called reject() implying the next rule should be tested instead.
        } else if (this._signaled_error_token) {
            // produce one 'error' token as \`.parseError()\` in \`reject()\`
            // did not guarantee a failure signal by throwing an exception!
            token = this._signaled_error_token;
            this._signaled_error_token = false;
            return token;
        }
        return false;
    },

    /**
     * return next match in input
     * 
     * @public
     * @this {RegExpLexer}
     */
    next: function lexer_next() {
        if (this.done) {
            this.clear();
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.clear();
        }
        var spec = this.__currentRuleSet__;
        if (!spec) {
            // Update the ruleset cache as we apparently encountered a state change or just started lexing.
            // The cache is set up for fast lookup -- we assume a lexer will switch states much less often than it will
            // invoke the \`lex()\` token-producing API and related APIs, hence caching the set for direct access helps
            // speed up those activities a tiny bit.
            spec = this.__currentRuleSet__ = this._currentRules();
            // Check whether a *sane* condition has been pushed before: this makes the lexer robust against
            // user-programmer bugs such as https://github.com/zaach/jison-lex/issues/19
            if (!spec || !spec.rules) {
                var lineno_msg = '';
                if (this.options.trackPosition) {
                    lineno_msg = ' on line ' + (this.yylineno + 1);
                }
                var p = this.constructLexErrorInfo('Internal lexer engine error' + lineno_msg + ': The lex grammar programmer pushed a non-existing condition name "' + this.topState() + '"; this is a fatal error and should be reported to the application programmer team!', false);
                // produce one 'error' token until this situation has been resolved, most probably by parse termination!
                return (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
            }
        }

        var rule_ids = spec.rules;
        var regexes = spec.__rule_regexes;
        var len = spec.__rule_count;

        // Note: the arrays are 1-based, while \`len\` itself is a valid index,
        // hence the non-standard less-or-equal check in the next loop condition!
        for (var i = 1; i <= len; i++) {
            tempMatch = this._input.match(regexes[i]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rule_ids[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = undefined;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rule_ids[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (!this._input) {
            this.done = true;
            this.clear();
            return this.EOF;
        } else {
            var lineno_msg = '';
            if (this.options.trackPosition) {
                lineno_msg = ' on line ' + (this.yylineno + 1);
            }
            var p = this.constructLexErrorInfo('Lexical error' + lineno_msg + ': Unrecognized text.', this.options.lexerErrorsAreRecoverable);

            var pendingInput = this._input;
            var activeCondition = this.topState();
            var conditionStackDepth = this.conditionStack.length;

            token = (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
            if (token === this.ERROR) {
                // we can try to recover from a lexer error that \`parseError()\` did not 'recover' for us
                // by moving forward at least one character at a time IFF the (user-specified?) \`parseError()\`
                // has not consumed/modified any pending input or changed state in the error handler:
                if (!this.matches && 
                    // and make sure the input has been modified/consumed ...
                    pendingInput === this._input &&
                    // ...or the lexer state has been modified significantly enough
                    // to merit a non-consuming error handling action right now.
                    activeCondition === this.topState() && 
                    conditionStackDepth === this.conditionStack.length
                ) {
                    this.input();
                }
            }
            return token;
        }
    },

    /**
     * return next match that has a token
     * 
     * @public
     * @this {RegExpLexer}
     */
    lex: function lexer_lex() {
        var r;
        // allow the PRE/POST handlers set/modify the return token for maximum flexibility of the generated lexer:
        if (typeof this.pre_lex === 'function') {
            r = this.pre_lex.call(this, 0);
        }
        if (typeof this.options.pre_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.options.pre_lex.call(this, r) || r;
        }
        if (this.yy && typeof this.yy.pre_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.yy.pre_lex.call(this, r) || r;
        }

        while (!r) {
            r = this.next();
        }

        if (this.yy && typeof this.yy.post_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.yy.post_lex.call(this, r) || r;
        }
        if (typeof this.options.post_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.options.post_lex.call(this, r) || r;
        }
        if (typeof this.post_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.post_lex.call(this, r) || r;
        }
        return r;
    },

    /**
     * return next match that has a token. Identical to the \`lex()\` API but does not invoke any of the 
     * \`pre_lex()\` nor any of the \`post_lex()\` callbacks.
     * 
     * @public
     * @this {RegExpLexer}
     */
    fastLex: function lexer_fastLex() {
        var r;

        while (!r) {
            r = this.next();
        }

        return r;
    },

    /**
     * return info about the lexer state that can help a parser or other lexer API user to use the
     * most efficient means available. This API is provided to aid run-time performance for larger
     * systems which employ this lexer.
     * 
     * @public
     * @this {RegExpLexer}
     */
    canIUse: function lexer_canIUse() {
        var rv = {
            fastLex: !(
                typeof this.pre_lex === 'function' ||
                typeof this.options.pre_lex === 'function' ||
                (this.yy && typeof this.yy.pre_lex === 'function') ||
                (this.yy && typeof this.yy.post_lex === 'function') ||
                typeof this.options.post_lex === 'function' ||
                typeof this.post_lex === 'function'
            ) && typeof this.fastLex === 'function',
        };
        return rv;
    },


    /**
     * backwards compatible alias for \`pushState()\`;
     * the latter is symmetrical with \`popState()\` and we advise to use
     * those APIs in any modern lexer code, rather than \`begin()\`.
     * 
     * @public
     * @this {RegExpLexer}
     */
    begin: function lexer_begin(condition) {
        return this.pushState(condition);
    },

    /**
     * activates a new lexer condition state (pushes the new lexer
     * condition state onto the condition stack)
     * 
     * @public
     * @this {RegExpLexer}
     */
    pushState: function lexer_pushState(condition) {
        this.conditionStack.push(condition);
        this.__currentRuleSet__ = null;
        return this;
    },

    /**
     * pop the previously active lexer condition state off the condition
     * stack
     * 
     * @public
     * @this {RegExpLexer}
     */
    popState: function lexer_popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            this.__currentRuleSet__ = null; 
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

    /**
     * return the currently active lexer condition state; when an index
     * argument is provided it produces the N-th previous condition state,
     * if available
     * 
     * @public
     * @this {RegExpLexer}
     */
    topState: function lexer_topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return 'INITIAL';
        }
    },

    /**
     * (internal) determine the lexer rule set which is active for the
     * currently active lexer condition state
     * 
     * @public
     * @this {RegExpLexer}
     */
    _currentRules: function lexer__currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]];
        } else {
            return this.conditions['INITIAL'];
        }
    },

    /**
     * return the number of states currently on the stack
     * 
     * @public
     * @this {RegExpLexer}
     */
    stateStackSize: function lexer_stateStackSize() {
        return this.conditionStack.length;
    }
}`}function $(e,t){var r=c.parseCodeChunkToAST(e,t),n=c.prettyPrintAST(r,t);return n.replace(/\/\*\s*JISON-LEX-ANALYTICS-REPORT\s*\*\//g,L`
        // Code Generator Information Report
        // ---------------------------------
        //
        // Options:
        //
        //   backtracking: .................... ${t.options.backtrack_lexer}
        //   location.ranges: ................. ${t.options.ranges}
        //   location line+column tracking: ... ${t.options.trackPosition}
        //
        //
        // Forwarded Parser Analysis flags:
        //
        //   uses yyleng: ..................... ${t.parseActionsUseYYLENG}
        //   uses yylineno: ................... ${t.parseActionsUseYYLINENO}
        //   uses yytext: ..................... ${t.parseActionsUseYYTEXT}
        //   uses yylloc: ..................... ${t.parseActionsUseYYLOC}
        //   uses lexer values: ............... ${t.parseActionsUseValueTracking} / ${t.parseActionsUseValueAssignment}
        //   location tracking: ............... ${t.parseActionsUseLocationTracking}
        //   location assignment: ............. ${t.parseActionsUseLocationAssignment}
        //
        //
        // Lexer Analysis flags:
        //
        //   uses yyleng: ..................... ${t.lexerActionsUseYYLENG}
        //   uses yylineno: ................... ${t.lexerActionsUseYYLINENO}
        //   uses yytext: ..................... ${t.lexerActionsUseYYTEXT}
        //   uses yylloc: ..................... ${t.lexerActionsUseYYLOC}
        //   uses ParseError API: ............. ${t.lexerActionsUseParseError}
        //   uses yyerror: .................... ${t.lexerActionsUseYYERROR}
        //   uses location tracking & editing:  ${t.lexerActionsUseLocationTracking}
        //   uses more() API: ................. ${t.lexerActionsUseMore}
        //   uses unput() API: ................ ${t.lexerActionsUseUnput}
        //   uses reject() API: ............... ${t.lexerActionsUseReject}
        //   uses less() API: ................. ${t.lexerActionsUseLess}
        //   uses display APIs pastInput(), upcomingInput(), showPosition():
        //        ............................. ${t.lexerActionsUseDisplayAPIs}
        //   uses describeYYLLOC() API: ....... ${t.lexerActionsUseDescribeYYLOC}
        //
        // --------- END OF REPORT -----------

    `)}function F(e,t,r){var n={parseActionsUseYYLENG:(r=r||{}).parseActionsUseYYLENG,parseActionsUseYYLINENO:r.parseActionsUseYYLINENO,parseActionsUseYYTEXT:r.parseActionsUseYYTEXT,parseActionsUseYYLOC:r.parseActionsUseYYLOC,parseActionsUseParseError:r.parseActionsUseParseError,parseActionsUseYYERROR:r.parseActionsUseYYERROR,parseActionsUseYYERROK:r.parseActionsUseYYERROK,parseActionsUseYYRECOVERING:r.parseActionsUseYYRECOVERING,parseActionsUseYYCLEARIN:r.parseActionsUseYYCLEARIN,parseActionsUseValueTracking:r.parseActionsUseValueTracking,parseActionsUseValueAssignment:r.parseActionsUseValueAssignment,parseActionsUseLocationTracking:r.parseActionsUseLocationTracking,parseActionsUseLocationAssignment:r.parseActionsUseLocationAssignment,parseActionsUseYYSTACK:r.parseActionsUseYYSTACK,parseActionsUseYYSSTACK:r.parseActionsUseYYSSTACK,parseActionsUseYYSTACKPOINTER:r.parseActionsUseYYSTACKPOINTER,parseActionsUseYYRULELENGTH:r.parseActionsUseYYRULELENGTH,parseActionsUseYYMERGELOCATIONINFO:r.parseActionsUseYYMERGELOCATIONINFO,parserHasErrorRecovery:r.parserHasErrorRecovery,parserHasErrorReporting:r.parserHasErrorReporting,lexerActionsUseYYLENG:"???",lexerActionsUseYYLINENO:"???",lexerActionsUseYYTEXT:"???",lexerActionsUseYYLOC:"???",lexerActionsUseParseError:"???",lexerActionsUseYYERROR:"???",lexerActionsUseLocationTracking:"???",lexerActionsUseMore:"???",lexerActionsUseUnput:"???",lexerActionsUseReject:"???",lexerActionsUseLess:"???",lexerActionsUseDisplayAPIs:"???",lexerActionsUseDescribeYYLOC:"???"};n.lex_rule_dictionary=e=U(e,r)||{},n.options=O(r,e.options),n.moduleType=n.options.moduleType,n.moduleName=n.options.moduleName,n.conditions=function(e){var t,r={};for(t in e)e.hasOwnProperty(t)&&(r[t]={rules:[],inclusive:!e[t]});return r}(e.startConditions),n.conditions.INITIAL={rules:[],inclusive:!0};var i=e.rules?function(e,t,r){var n,i=[e.actionInclude||"","var YYSTATE = YY_START;"],o={},a=[];for(n in t){var u=parseInt(n);u&&u>0&&(o[t[n]]=u)}var h=function(e,t,r,n,i,o){l(Array.isArray(e.rules));var a,u,h,p,f,d,m,y=e.rules.slice(0),x=[],g={},_=0,v=0;function A(e,t){return"return "+(n[t]||"'"+t.replace(/'/g,"\\'")+"'")}function w(e){return Array.isArray(e)&&(e=e.join(" ")),e=e.replace(/\*\//g,"*\\/")}l(void 0===o.options["case-insensitive"]),n||(n={}),o.options.flex&&y.length>0&&y.push([".",'console.log("", yytext); /* `flex` lexing mode: the last resort rule! */']),e.macros&&(g=function(e,t){var r,n={};function i(r){var o,a,c;if(n[r]){if((c=n[r].in_set)instanceof Error)return Error(c.message);if(!1===c)return Error('Macro name "'+r+"\" has an illegal, looping, definition, i.e. it's definition references itself, either directly or indirectly, via other macros.")}else{if((c=e[r]).indexOf("{")>=0){for(o in n[r]={in_set:!1,elsewhere:null,raw:e[r]},e)if(e.hasOwnProperty(o)&&r!==o){if(s._getUnicodeProperty(o)&&o.toUpperCase()!==o){c=Error('Cannot use name "'+o+'" as a macro name as it clashes with the same XRegExp "\\p{..}" Unicode \'General Category\' Property name. Use all-uppercase macro names, e.g. name your macro "'+o.toUpperCase()+'" to work around this issue or give your offending macro a different name.');break}if((a=c.split("{"+o+"}")).length>1){var u,h=i(o);if(l(h),h instanceof Error){c=h;break}c=a.join(h)}}}var p=E(c,r,t);p instanceof Error?u=p:c=u=b(p,!1),n[r]={in_set:u,elsewhere:null,raw:e[r]}}return c}function o(r){var i;if(null==n[r].elsewhere){if(i=e[r],n[r].elsewhere=!1,(i=C(i,r,t,a,c))instanceof Error)return i;n[r].elsewhere=i}else{if((i=n[r].elsewhere)instanceof Error)return i;if(!1===i)return Error('Macro name "'+r+"\" has an illegal, looping, definition, i.e. it's definition references itself, either directly or indirectly, via other macros.")}return i}function a(e){var t,r;if(e.indexOf("{")>=0){for(t in n)if(n.hasOwnProperty(t)){var s=e.split("{"+t+"}");if(s.length>1){if(l(r=i(t)),r instanceof Error)return Error("failure to expand the macro ["+t+"] in set ["+e+"]: "+r.message);e=s.join(r)}if(-1===e.indexOf("{"))break}}return e}function c(e){var t,r;if(e.indexOf("{")>=0){for(t in n)if(n.hasOwnProperty(t)){var i=e.split("{"+t+"}");if(i.length>1){if(l(r=o(t)),r instanceof Error)return Error("failure to expand the macro ["+t+"] in regex /"+e+"/: "+r.message);e=i.join("(?:"+r+")")}if(-1===e.indexOf("{"))break}}return e}for(r in t.debug&&console.log("\n############## RAW macros: ",e),e)e.hasOwnProperty(r)&&i(r);for(r in e)e.hasOwnProperty(r)&&o(r);return t.debug&&console.log("\n############### expanded macros: ",n),n}(e.macros,o));var k=["switch(yyrulenumber) {"];for(u=0;u<y.length;u++){if(a=(p=y[u].slice(0))[0],m=[],Array.isArray(a))if("*"===a[0]){for(h in m.push("*"),i)i[h].rules.push(u);p.shift(),a=p[0]}else for(h=0,d=p.shift(),a=p[0];h<d.length;h++)i.hasOwnProperty(d[h])||(i[d[h]]={rules:[],inclusive:!1},console.warn("Lexer Warning:",'"'+d[h]+'" start condition should be defined as %s or %x; assuming %x now.')),m.push(d[h]),i[d[h]].rules.push(u);else for(h in i)i[h].inclusive&&(m.push(h),i[h].rules.push(u));"string"==typeof a&&(a=new s("^(?:"+(a=function(e,t,r){var n=0,i=C(e,null,r,function(e){var r,i,s;if(e.indexOf("{")>=0){for(r in t)if(t.hasOwnProperty(r)){i=t[r];var o=e.split("{"+r+"}");if(o.length>1){if(l(s=i.in_set),s instanceof Error)throw s;if(!1===s)return Error('Macro name "'+r+"\" has an illegal, looping, definition, i.e. it's definition references itself, either directly or indirectly, via other macros.");e=o.join(s),n++}if(-1===e.indexOf("{"))break}}return e},function(e){var r,i,s;if(e.indexOf("{")>=0){for(r in t)if(t.hasOwnProperty(r)){i=t[r];var o=e.split("{"+r+"}");if(o.length>1){if(l(s=i.elsewhere),!1===s)return Error('Macro name "'+r+"\" has an illegal, looping, definition, i.e. it's definition references itself, either directly or indirectly, via other macros.");e=o.join("("+s+")"),n++}if(-1===e.indexOf("{"))break}}return e});if(i instanceof Error)throw i;return n>0||e.indexOf("\\p{")>=0&&!r.options.xregexp?e=i:i.length<e.length&&(e=i),e}(a,g,o))+")",o.options.caseInsensitive?"i":"")),x.push(a),"function"==typeof(f=p[1])&&(f=c.printFunctionSourceCodeContainer(f).code),f=(f=f.replace(/return\s*\(?'((?:\\'|[^']+)+)'\)?/g,A)).replace(/return\s*\(?"((?:\\"|[^"]+)+)"\)?/g,A);var L=["\n/*! Conditions::"];L.push(w(m)),L.push("*/","\n/*! Rule::      "),L.push(w(p[0])),L.push("*/","\n");var S=/^return[\s\r\n]+((?:'(?:\\'|[^']+)+')|(?:"(?:\\"|[^"]+)+")|\d+)[\s\r\n]*;?$/.exec(f.trim());S?(v++,r.push([].concat(L,u,":",S[1]).join(" ").replace(/[\n]/g,"\n  "))):(_++,k.push([].concat("case",u,":",L,f,"\nbreak;").join(" ")))}return v&&(k.push("default:"),k.push("  return this.simpleCaseActionClusters[yyrulenumber];")),k.push("}"),v+_>0?t.push.apply(t,k):t.push("/* no rules ==> no rule SWITCH! */"),{rules:x,macros:g,regular_rule_count:_,simple_rule_count:v}}(e,i,a,t&&o,r.conditions,r),p=i.join("\n");return"yytext yyleng yylineno yylloc yyerror".split(" ").forEach(function(e){p=p.replace(RegExp("\\b("+e+")\\b","g"),"yy_.$1")}),{caseHelperInclude:"{\n"+a.join(",")+"\n}",actions:`function lexer__performAction(yy, yyrulenumber, YY_START) {
            var yy_ = this;

            ${p}
        }`,rules:h.rules,macros:h.macros,regular_rule_count:h.regular_rule_count,simple_rule_count:h.simple_rule_count}}(e,t,n):{};return n.performAction=i.actions,n.caseHelperInclude=i.caseHelperInclude,n.rules=i.rules||[],n.macros=i.macros,n.regular_rule_count=i.regular_rule_count,n.simple_rule_count=i.simple_rule_count,n.conditionStack=["INITIAL"],n.actionInclude=e.actionInclude||"",n.moduleInclude=(n.moduleInclude||"")+(e.moduleInclude||"").trim(),n}function D(e){var t="";switch(e.moduleType){case"js":t=W(e);break;case"amd":t=G(e);break;case"es":t=X(e);break;default:t=H(e)}return t}function z(e){if(e.rules.length>0||e.__in_rules_failure_analysis_mode__){var t,r,n,i,o,a=[L`
            var lexer = {
            `,"/*JISON-LEX-ANALYTICS-REPORT*/"],c=M();a.push((c=c.replace(/^[\s\r\n]*\{/,"").replace(/\s*\}[\s\r\n]*$/,"").trim())+",\n"),l(e.options),l(void 0===e.options["case-insensitive"]),a.push("    options: "+function(e){var t={},r={debug:!e.debug,enableDebugLogs:1,json:1,_:1,noMain:1,dumpSourceCodeOnFailure:1,throwErrorOnCompileFailure:1,reportStats:1,file:1,outfile:1,inputPath:1,inputFilename:1,defaultModuleName:1,moduleName:1,moduleType:1,lexerErrorsAreRecoverable:0,flex:0,backtrack_lexer:0,caseInsensitive:0,showSource:1,exportAST:1,exportAllTables:1,exportSourceCode:1,prettyCfg:1,parseActionsUseYYLENG:1,parseActionsUseYYLINENO:1,parseActionsUseYYTEXT:1,parseActionsUseYYLOC:1,parseActionsUseParseError:1,parseActionsUseYYERROR:1,parseActionsUseYYRECOVERING:1,parseActionsUseYYERROK:1,parseActionsUseYYCLEARIN:1,parseActionsUseValueTracking:1,parseActionsUseValueAssignment:1,parseActionsUseLocationTracking:1,parseActionsUseLocationAssignment:1,parseActionsUseYYSTACK:1,parseActionsUseYYSSTACK:1,parseActionsUseYYSTACKPOINTER:1,parseActionsUseYYRULELENGTH:1,parseActionsUseYYMERGELOCATIONINFO:1,parserHasErrorRecovery:1,parserHasErrorReporting:1,lexerActionsUseYYLENG:1,lexerActionsUseYYLINENO:1,lexerActionsUseYYTEXT:1,lexerActionsUseYYLOC:1,lexerActionsUseParseError:1,lexerActionsUseYYERROR:1,lexerActionsUseLocationTracking:1,lexerActionsUseMore:1,lexerActionsUseUnput:1,lexerActionsUseReject:1,lexerActionsUseLess:1,lexerActionsUseDisplayAPIs:1,lexerActionsUseDescribeYYLOC:1};for(var n in e)if(!r[n]&&null!=e[n]&&!1!==e[n]){if("string"==typeof e[n]){var i=parseFloat(e[n]);if(i==e[n]){t[n]=i;continue}}t[n]=e[n]}var o=t.pre_lex,a=t.post_lex;o&&(t.pre_lex=!0),a&&(t.post_lex=!0);var l=JSON.stringify(t,null,2);return(l=(l=l.replace(new s('  "([\\p{Alphabetic}_][\\p{Alphabetic}_\\p{Number}]*)": ',"g"),"  $1: ")).replace(/^( +)pre_lex: true(,)?$/gm,function(e,t,r){return t+"pre_lex: "+String(o)+(r||"")})).replace(/^( +)post_lex: true(,)?$/gm,function(e,t,r){return t+"post_lex: "+String(a)+(r||"")})}(e.options));var u=String(e.performAction),h=String(e.caseHelperInclude),p=(t=e.rules,r=e.options&&e.options.xregexp,i=Array(n=1+Math.log10(1|t.length)|0).join(" "),t.map(function(e,t){var o=(i+t).substr(-n);if(!(e instanceof s)||e.xregexp.isNative||!r)return`/* ${o}: */  ${e}`;var a=e.xregexp.source.replace(/[\\"]/g,"\\$&");return`/* ${o}: */  new XRegExp("${a}", "${e.xregexp.flags}")`}).join(",\n")),f=JSON.stringify(e.conditions,null,2).replace(/  "rules": \[/g,"  rules: [").replace(/  "inclusive": /g,"  inclusive: ");a.push(L`,
            JisonLexerError: JisonLexerError,
            performAction: ${u},
            simpleCaseActionClusters: ${h},
            rules: [
                ${p}
            ],
            conditions: ${f}
        };
        `),e.is_custom_lexer=!1,o=a.join("")}else o="var lexer;\n",l(0===e.regular_rule_count),l(0===e.simple_rule_count),e.is_custom_lexer=!0,e.actionInclude&&(o+=e.actionInclude+(e.actionInclude.match(/;[\s\r\n]*$/)?"":";")+"\n");return o}function J(){return L`
    /* lexer generated by jison-lex ${k} */

    /*
     * Returns a Lexer object of the following structure:
     *
     *  Lexer: {
     *    yy: {}     The so-called "shared state" or rather the *source* of it;
     *               the real "shared state" \`yy\` passed around to
     *               the rule actions, etc. is a direct reference!
     *
     *               This "shared context" object was passed to the lexer by way of 
     *               the \`lexer.setInput(str, yy)\` API before you may use it.
     *
     *               This "shared context" object is passed to the lexer action code in \`performAction()\`
     *               so userland code in the lexer actions may communicate with the outside world 
     *               and/or other lexer rules' actions in more or less complex ways.
     *
     *  }
     *
     *  Lexer.prototype: {
     *    EOF: 1,
     *    ERROR: 2,
     *
     *    yy:        The overall "shared context" object reference.
     *
     *    JisonLexerError: function(msg, hash),
     *
     *    performAction: function lexer__performAction(yy, yyrulenumber, YY_START),
     *
     *               The function parameters and \`this\` have the following value/meaning:
     *               - \`this\`    : reference to the \`lexer\` instance. 
     *                               \`yy_\` is an alias for \`this\` lexer instance reference used internally.
     *
     *               - \`yy\`      : a reference to the \`yy\` "shared state" object which was passed to the lexer
     *                             by way of the \`lexer.setInput(str, yy)\` API before.
     *
     *                             Note:
     *                             The extra arguments you specified in the \`%parse-param\` statement in your
     *                             **parser** grammar definition file are passed to the lexer via this object
     *                             reference as member variables.
     *
     *               - \`yyrulenumber\`   : index of the matched lexer rule (regex), used internally.
     *
     *               - \`YY_START\`: the current lexer "start condition" state.
     *
     *    parseError: function(str, hash, ExceptionClass),
     *
     *    constructLexErrorInfo: function(error_message, is_recoverable),
     *               Helper function.
     *               Produces a new errorInfo \'hash object\' which can be passed into \`parseError()\`.
     *               See it\'s use in this lexer kernel in many places; example usage:
     *
     *                   var infoObj = lexer.constructParseErrorInfo(\'fail!\', true);
     *                   var retVal = lexer.parseError(infoObj.errStr, infoObj, lexer.JisonLexerError);
     *
     *    options: { ... lexer %options ... },
     *
     *    lex: function(),
     *               Produce one token of lexed input, which was passed in earlier via the \`lexer.setInput()\` API.
     *               You MAY use the additional \`args...\` parameters as per \`%parse-param\` spec of the **lexer** grammar:
     *               these extra \`args...\` are added verbatim to the \`yy\` object reference as member variables.
     *
     *               WARNING:
     *               Lexer's additional \`args...\` parameters (via lexer's \`%parse-param\`) MAY conflict with
     *               any attributes already added to \`yy\` by the **parser** or the jison run-time; 
     *               when such a collision is detected an exception is thrown to prevent the generated run-time 
     *               from silently accepting this confusing and potentially hazardous situation! 
     *
     *    cleanupAfterLex: function(do_not_nuke_errorinfos),
     *               Helper function.
     *
     *               This helper API is invoked when the **parse process** has completed: it is the responsibility
     *               of the **parser** (or the calling userland code) to invoke this method once cleanup is desired. 
     *
     *               This helper may be invoked by user code to ensure the internal lexer gets properly garbage collected.
     *
     *    setInput: function(input, [yy]),
     *
     *
     *    input: function(),
     *
     *
     *    unput: function(str),
     *
     *
     *    more: function(),
     *
     *
     *    reject: function(),
     *
     *
     *    less: function(n),
     *
     *
     *    pastInput: function(n),
     *
     *
     *    upcomingInput: function(n),
     *
     *
     *    showPosition: function(),
     *
     *
     *    test_match: function(regex_match_array, rule_index),
     *
     *
     *    next: function(),
     *
     *
     *    begin: function(condition),
     *
     *
     *    pushState: function(condition),
     *
     *
     *    popState: function(),
     *
     *
     *    topState: function(),
     *
     *
     *    _currentRules: function(),
     *
     *
     *    stateStackSize: function(),
     *
     *
     *    performAction: function(yy, yy_, yyrulenumber, YY_START),
     *
     *
     *    rules: [...],
     *
     *
     *    conditions: {associative list: name ==> set},
     *  }
     *
     *
     *  token location info (\`yylloc\`): {
     *    first_line: n,
     *    last_line: n,
     *    first_column: n,
     *    last_column: n,
     *    range: [start_number, end_number]
     *               (where the numbers are indexes into the input string, zero-based)
     *  }
     *
     * ---
     *
     * The \`parseError\` function receives a \'hash\' object with these members for lexer errors:
     *
     *  {
     *    text:        (matched text)
     *    token:       (the produced terminal token, if any)
     *    token_id:    (the produced terminal token numeric ID, if any)
     *    line:        (yylineno)
     *    loc:         (yylloc)
     *    recoverable: (boolean: TRUE when the parser MAY have an error recovery rule
     *                  available for this particular error)
     *    yy:          (object: the current parser internal "shared state" \`yy\`
     *                  as is also available in the rule actions; this can be used,
     *                  for instance, for advanced error analysis and reporting)
     *    lexer:       (reference to the current lexer instance used by the parser)
     *  }
     *
     * while \`this\` will reference the current lexer instance.
     *
     * When \`parseError\` is invoked by the lexer, the default implementation will
     * attempt to invoke \`yy.parser.parseError()\`; when this callback is not provided
     * it will try to invoke \`yy.parseError()\` instead. When that callback is also not
     * provided, a \`JisonLexerError\` exception will be thrown containing the error
     * message and \`hash\`, as constructed by the \`constructLexErrorInfo()\` API.
     *
     * Note that the lexer\'s \`JisonLexerError\` error class is passed via the
     * \`ExceptionClass\` argument, which is invoked to construct the exception
     * instance to be thrown, so technically \`parseError\` will throw the object
     * produced by the \`new ExceptionClass(str, hash)\` JavaScript expression.
     *
     * ---
     *
     * You can specify lexer options by setting / modifying the \`.options\` object of your Lexer instance.
     * These options are available:
     *
     * (Options are permanent.)
     *  
     *  yy: {
     *      parseError: function(str, hash, ExceptionClass)
     *                 optional: overrides the default \`parseError\` function.
     *  }
     *
     *  lexer.options: {
     *      pre_lex:  function()
     *                 optional: is invoked before the lexer is invoked to produce another token.
     *                 \`this\` refers to the Lexer object.
     *      post_lex: function(token) { return token; }
     *                 optional: is invoked when the lexer has produced a token \`token\`;
     *                 this function can override the returned token value by returning another.
     *                 When it does not return any (truthy) value, the lexer will return
     *                 the original \`token\`.
     *                 \`this\` refers to the Lexer object.
     *
     * WARNING: the next set of options are not meant to be changed. They echo the abilities of
     * the lexer as per when it was compiled!
     *
     *      ranges: boolean
     *                 optional: \`true\` ==> token location info will include a .range[] member.
     *      flex: boolean
     *                 optional: \`true\` ==> flex-like lexing behaviour where the rules are tested
     *                 exhaustively to find the longest match.
     *      backtrack_lexer: boolean
     *                 optional: \`true\` ==> lexer regexes are tested in order and for invoked;
     *                 the lexer terminates the scan when a token is returned by the action code.
     *      xregexp: boolean
     *                 optional: \`true\` ==> lexer rule regexes are "extended regex format" requiring the
     *                 \`XRegExp\` library. When this %option has not been specified at compile time, all lexer
     *                 rule regexes have been written as standard JavaScript RegExp expressions.
     *  }
     */
     `}function V(e){if(!(e=e||{}).moduleName||!e.moduleName.match(/^[a-zA-Z_$][a-zA-Z0-9_$\.]*$/)){if(e.moduleName){var t='WARNING: The specified moduleName "'+e.moduleName+'" is illegal (only characters [a-zA-Z0-9_$] and "." dot are accepted); using the default moduleName "lexer" instead.';if("function"==typeof e.warn_cb)e.warn_cb(t);else throw Error(t)}e.moduleName="lexer"}return T(e),e}function W(e){e=V(e);var t=[J(),"","var "+e.moduleName+" = (function () {",j,"",z(e),"",e.moduleInclude?e.moduleInclude+";":"","\nreturn lexer;\n})();"].join("\n")+"\n";return t=$(t,e),e.exportSourceCode.all=t,t}function G(e){e=V(e);var t=[J(),"\ndefine([], function () {",j,"",z(e),"",e.moduleInclude?e.moduleInclude+";":"","\nreturn lexer;\n});"].join("\n")+"\n";return t=$(t,e),e.exportSourceCode.all=t,t}function X(e){e=V(e);var t=[J(),"\nvar lexer = (function () {",j,"",z(e),"",e.moduleInclude?e.moduleInclude+";":"","\nreturn lexer;\n})();\n\nfunction yylex() {\n    return lexer.lex.apply(lexer, arguments);\n}",L`
            export {
                lexer,
                yylex as lex
            };
        `].join("\n")+"\n";return t=$(t,e),e.exportSourceCode.all=t,t}function H(e){e=V(e);var t=[J(),"","var "+e.moduleName+" = (function () {",j,"",z(e),"",e.moduleInclude?e.moduleInclude+";":"","\nreturn lexer;\n})();\n\nif (typeof require !== 'undefined' && typeof exports !== 'undefined') {","  exports.lexer = "+e.moduleName+";","  exports.lex = function () {","    return "+e.moduleName+".lex.apply(lexer, arguments);","  };\n}"].join("\n")+"\n";return t=$(t,e),e.exportSourceCode.all=t,t}I(M()),P.prototype=Function(L`
    return ${M()};
`)(),P.generate=function(e,t,r){return D(F(e,t,r))},P.version=k,P.defaultJisonLexOptions=N,P.mkStdOptions=O,P.camelCase=c.camelCase,P.mkIdentifier=S,P.autodetectAndConvertToJSONformat=U,module.exports=P;
