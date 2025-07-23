import e from"@gerhobbelt/xregexp";import t from"@gerhobbelt/json5";import r from"@gerhobbelt/lex-parser";import n from"assert";import i from"jison-helpers-lib";let s=/^\{[A-Za-z0-9 \-\._]+\}/,o=/^(?:[^\\]|\\[^cxu0-9]|\\[0-9]{1,3}|\\c[A-Z]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})/,a=/^(?:[^\\\]]|\\[^cxu0-9]|\\[0-9]{1,3}|\\c[A-Z]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})+/,l=/^\\[dDwWsS]$|^\\p\{[A-Za-z0-9 \-\._]+\}$/,c=" \f\n\r	\v\xa0 ᠎ - \u2028\u2029  　\uFEFF",u="A-Za-z0-9_";function h(e){var t,r;switch(e){case 10:return"\\n";case 13:return"\\r";case 9:return"\\t";case 8:return"\\b";case 12:return"\\f";case 11:return"\\v";case 45:return"\\-";case 91:return"\\[";case 92:return"\\\\";case 93:return"\\]";case 94:return"\\^"}return e<32||e>65520||e>=55296&&e<=57343||String.fromCharCode(e).match(/[\u2028\u2029]/)?(r=e.toString(16)).length>=1&&e<=65535?"\\u"+(t="0000"+r).substr(t.length-4):"\\u{"+r+"}":String.fromCharCode(e)}var p,f,d,m,y,x={},g=[];function _(e){var t=Array(65536),r={},i=e&&e.options&&e.options.xregexp;for(h in x)if(p=x[h],!(!i&&h.indexOf("\\p{")>=0)){var s=0;for(c=0;c<=65535;c++)p[c]&&(s++,t[c]?t[c].push(h):t[c]=[h]);r[h]=s}var o=[],a={},l=Object.keys(x);for(c=0;c<=65535;c++)h=t[c][0],1!==t[c].length||a[h]||(n(r[h]>0),o.push([c,h]),a[h]=!0);for(u=0;l[u];u++)if(h=l[u],!(!i&&h.indexOf("\\p{")>=0)&&!a[h]){n(r[h]>0);var c,u,h,p,f,d=1/0;for(c=0,p=x[h];c<=65535;c++)if(p[c]){var m=t[c].length;m>1&&m<d&&(n(r[h]>0),f=[c,h],d=m)}f&&(a[h]=!0,o.push(f))}o.sort(function(e,t){var n=e[1],i=r[t[1]]-r[n];return i||t[0]-e[0]}),g=o}function v(t,r,i){var a,l,c,u=r,h=!1;function p(e,r){null==r&&(r=e);for(var n=e;n<=r;n++)t[n]=!0}function f(e,t){for(var r=0;r<=65535;r++)t[r]&&(e[r]=!0)}function d(e){var t;if(0!==e.indexOf("\\"))return e;switch(e.substr(0,2)){case"\\c":return String.fromCharCode(t=e.charCodeAt(2)-65+1);case"\\x":return String.fromCharCode(t=parseInt(e=e.substr(2),16));case"\\u":if("{"===(e=e.substr(2))[0]&&(e=e.substr(1,e.length-2)),(t=parseInt(e,16))>=65536)return Error("We do NOT support Extended Plane Unicode Codepoints (i.e. CodePoints beyond U:FFFF) in regex set expressions, e.g. \\u{"+e+"}");return String.fromCharCode(t);case"\\0":case"\\1":case"\\2":case"\\3":case"\\4":case"\\5":case"\\6":case"\\7":return String.fromCharCode(t=parseInt(e=e.substr(1),8));case"\\r":return"\r";case"\\n":return"\n";case"\\v":return"\v";case"\\f":return"\f";case"\\t":return"	";case"\\b":return"\b";default:return e.substr(1)}}if(r&&r.length){for("^"===r[0]&&(h=!0,r=r.substr(1),a=t,t=Array(65536));r.length;){if(l=r.match(o))switch(l=l[0]){case"\\p":if(c=(r=r.substr(l.length)).match(s)){c=c[0],r=r.substr(c.length);var m=l+c,g=x[m];if(!g){var v=""+new e("["+m+"]");g=E(v=v.substr(1,v.length-2),m,i),x[m]=g,_(i)}f(t,g);continue}break;case"\\S":case"\\s":case"\\W":case"\\w":case"\\d":case"\\D":r=r.substr(l.length);var b=y.esc2bitarr[l[1]];n(b),f(t,b);continue;case"\\b":l="\b"}else l=r[0];var A=d(l);if(A instanceof Error)return A;if(A=A.charCodeAt(0),"-"===(r=r.substr(l.length))[0]&&r.length>=2){var w=d(c=(c=(r=r.substr(1)).match(o))?c[0]:r[0]);if(w instanceof Error)return A;w=w.charCodeAt(0),r=r.substr(c.length),A<=w?p(A,w):(console.warn("INVALID CHARACTER RANGE found in regex: ",{re:u,start:l,start_n:A,end:c,end_n:w}),p(A),p(45),p(w));continue}p(A)}if(h)for(var k=0;k<=65535;k++)t[k]||(a[k]=!0)}return!1}function b(e,t,r){e[65536]=1;var i,s,o,a,l,c,u,p,f,d,m=[],_=!1,v=e;if(t){for(i=0,o=0;i<=65535;i++)!e[i]&&o++;if(65536===o)return"\\S\\s";if(0===o)return"^\\S\\s";if(r){for(l=0,a=g;a[l];l++)if(!e[(c=a[l])[0]]){for(s=0,f=x[p=c[1]],u=0;s<=65535;s++)if(f[s])if(e[s]){if(v[s]){u=!1;break}}else u++;if(u&&u>p.length)if(m.push(p),_)for(s=0;s<=65535;s++)e[s]=e[s]||f[s];else{for(s=0,d=Array(65536);s<=65535;s++)d[s]=e[s]||f[s];d[65536]=1,e=d,_=!0}}}for(i=0;i<=65535;){for(;e[i];)i++;if(i>=65536)break;for(s=i+1;!e[s];s++);m.push(h(i)),s-1>i&&m.push((s-2>i?"-":"")+h(s-1)),i=s}}else{for(i=0,o=0;i<=65535;i++)e[i]&&o++;if(65536===o)return"\\S\\s";if(0===o)return"^\\S\\s";if(r){for(l=0,a=g;a[l];l++)if(e[(c=a[l])[0]]){for(s=0,f=x[p=c[1]],u=0;s<=65535;s++)if(f[s]){if(e[s])u++;else if(!v[s]){u=!1;break}}if(u&&u>p.length)if(m.push(p),_)for(s=0;s<=65535;s++)e[s]=e[s]&&!f[s];else{for(s=0,d=Array(65536);s<=65535;s++)d[s]=e[s]&&!f[s];d[65536]=1,e=d,_=!0}}}for(i=0;i<=65535;){for(;!e[i];)i++;if(i>=65536)break;for(s=i+1;e[s];s++);s>65536&&(s=65536),m.push(h(i)),s-1>i&&m.push((s-2>i?"-":"")+h(s-1)),i=s}}n(m.length);var b=m.join("");n(b);var E=y.set2esc[b];return E?"\\"+E:b}function E(t,r,i){var s,l=t;if(t instanceof Error)return t;for(var c=Array(65536),u=0;t.length;){var h=t.match(o);if(!h)return Error('illegal escape sequence at start of regex part: "'+t+'" of regex "'+l+'"');switch(h=h[0],t=t.substr(h.length),h){case"[":for(var p=[];t.length;){var f=t.match(a);if(f)f=f[0];else{if(!(f=t.match(o)))return Error("illegal escape sequence at start of regex part: "+t+'" of regex "'+l+'"');if("]"===(f=f[0]))break}p.push(f),t=t.substr(f.length)}var d=t.match(o);if(!d)return Error('regex set expression is broken in regex: "'+l+'" --\x3e "'+t+'"');if("]"!==(d=d[0]))return Error("regex set expression is broken in regex: "+l);t=t.substr(d.length);var m=p.join("");if(!u){if((s=v(c,m,i))instanceof Error)return s;u=1}break;case"|":u=0;break;case"(":return t=(t=(t=t.replace(/^\((?:\?:)?(.*?)\)$/,"$1")).replace(/^\^?(.*?)\$?$/,"$1")).replace(/^\((?:\?:)?(.*?)\)$/,"$1"),Error("[macro ["+r+'] is unsuitable for use inside regex set expressions: "['+l+']"]');case".":case"*":case"+":case"?":case"{":return Error("[macro ["+r+'] is unsuitable for use inside regex set expressions: "['+l+']"]');default:if(!u){if((s=v(c,h,i))instanceof Error)return s;u=2}}}t=b(c);try{if(n(t),n(!(t instanceof Error)),new e("["+t+"]").test(t[0]),/[^\\][\[\]]/.exec(t))throw Error("unescaped brackets in set data")}catch(e){t=Error("[macro ["+r+'] is unsuitable for use inside regex set expressions: "['+t+']"]: '+e.message)}return(n(t),t instanceof Error)?t:c}d={},m={},y={esc2bitarr:{},set2esc:{}},g=[],v(f=[],"^"+c),p=b(f),m.S=f,d[p]="S",x["\\S"]=f,v(f=[],c),p=b(f),m.s=f,d[p]="s",x["\\s"]=f,v(f=[],"^0-9"),p=b(f),m.D=f,d[p]="D",x["\\D"]=f,v(f=[],"0-9"),p=b(f),m.d=f,d[p]="d",x["\\d"]=f,v(f=[],"^"+u),p=b(f),m.W=f,d[p]="W",x["\\W"]=f,v(f=[],u),p=b(f),m.w=f,d[p]="w",x["\\w"]=f,y={esc2bitarr:m,set2esc:d},_();var A=v,w=function(e){var t=b(e,!1,!0);if(t.match(l))return t;t="["+t+"]";var r=b(e,!0,!0);if("^"===r[0]){if((r=r.substr(1)).match(l))return r}else r="^"+r;r="["+r+"]";var n=b(e,!1,!1);if(n.match(l))return n;n="["+n+"]";var i=b(e,!0,!1);if("^"===i[0]){if((i=i.substr(1)).match(l))return i}else i="^"+i;return i="["+i+"]",r.length<t.length&&(t=r),n.length<t.length&&(t=n),i.length<t.length&&(t=i),t},k="0.6.1-215",L=i.rmCommonWS,S=i.mkIdentifier,R=i.exec;function I(e){(e=""+e).match(/\bcov_\w+/)&&console.error("### ISTANBUL COVERAGE CODE DETECTED ###\n",e)}let Y=/^(?:[^\\\[\]\(\)\|^\{\}]|\\[^cxu0-9]|\\[0-9]{1,3}|\\c[A-Z]|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\})+/,N={moduleType:"commonjs",debug:!1,enableDebugLogs:!1,json:!1,main:!1,dumpSourceCodeOnFailure:!0,throwErrorOnCompileFailure:!0,moduleName:void 0,defaultModuleName:"lexer",file:void 0,outfile:void 0,inputPath:void 0,inputFilename:void 0,warn_cb:void 0,xregexp:!1,lexerErrorsAreRecoverable:!1,flex:!1,backtrack_lexer:!1,ranges:!1,trackPosition:!0,caseInsensitive:!1,showSource:!1,exportSourceCode:!1,exportAST:!1,prettyCfg:!0,pre_lex:void 0,post_lex:void 0};function O(){var e=Object.prototype.hasOwnProperty,t={},r=[].concat.apply([],arguments);"NODEFAULT"!==r[0]?r.unshift(N):r.shift();for(var n=0,i=r.length;n<i;n++){var s=r[n];if(s){var o={};for(var a in s)void 0!==s[a]&&e.call(s,a)&&(o[S(a)]=s[a]);for(var a in void 0!==o.main&&(o.noMain=!o.main),delete o.main,o.moduleName===o.defaultModuleName&&delete o.moduleName,o)e.call(o,a)&&void 0!==o[a]&&(t[a]=o[a])}}return t}function T(e){var t=e.exportSourceCode;t&&"object"==typeof t?"boolean"!=typeof t.enabled&&(t.enabled=!0):t={enabled:!!t},e.exportSourceCode=t}function U(e,n){var i,s,o=null;if("string"==typeof e){if(n.json)try{o=t.parse(e)}catch(e){i=e}if(!o)try{o=r.parse(e,n)}catch(e){throw n.json?((s=Error("Could not parse lexer spec in JSON AUTODETECT mode\nError: "+i.message+" ("+e.message+")")).secondary_exception=e,s.stack=i.stack):(s=Error("Could not parse lexer spec\nError: "+e.message)).stack=e.stack,s}}else o=e;return o}function C(t,r,i,l,c){var u,h,p,f,d=t;function m(){return r?"macro [["+r+"]]":"regex [["+d+"]]"}if(t instanceof Error)return t;for(var y=[];t.length;){if(!(u=t.match(o)))return Error(m()+": illegal escape sequence at start of regex part: "+t);switch(u=u[0],t=t.substr(u.length),u){case"[":for(var x=[],g=Array(65536);t.length;){var _=t.match(a);if(_)_=_[0];else{if(!(_=t.match(o)))return Error(m()+": illegal escape sequence at start of regex part: "+t);if("]"===(_=_[0]))break}x.push(_),t=t.substr(_.length)}if(!(h=t.match(o)))return Error(m()+': regex set expression is broken: "'+t+'"');if("]"!==(h=h[0]))return Error(m()+": regex set expression is broken: apparently unterminated");if(t=t.substr(h.length),f=x.join(""),l&&(n(f=l(f)),f instanceof Error))return Error(m()+": "+f.message);if((p=A(g,f,i))instanceof Error)return Error(m()+": "+p.message);var v=w(g),b=f.indexOf("{")>=0;f="["+f+"]",!b&&f.length<v.length&&(v=f),y.push(v);break;case"\\p":(h=t.match(s))?(h=h[0],t=t.substr(h.length),y.push(u+h)):y.push(u);break;case"{":if(h=t.match(Y)){h=h[0];var E=(t=t.substr(h.length))[0];if(t=t.substr(E.length),"}"===E){if(h=u+h+E,c&&(n(h=c(h)),h instanceof Error))return Error(m()+": "+h.message)}else h=u+h+E;y.push(h)}else y.push(u);break;default:(h=t.match(Y))?(h=h[0],t=t.substr(h.length),y.push(u+h)):y.push(u)}}t=y.join("");try{new e(t).test(t[0])}catch(e){return Error(m()+": expands to an invalid regex: /"+t+"/")}return n(t),t}let j=`/**
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
JisonLexerError.prototype.name = 'JisonLexerError';`;function P(e,t,r,i){var s,o=!1;function a(t,a,l,c){(s=F(e,r,i)).__in_rules_failure_analysis_mode__=!1,T(s),n(s.options),t&&t();var u=z(s);try{var h=["// provide a local version for test purposes:",j,"",L`
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
    `,"",u,"\nreturn lexer;"].join("\n"),p=R(h,function(e){return I(e),Function("",e)()},s.options,"lexer");if(!p)throw Error("no lexer defined *at all*?!");if("object"!=typeof p.options||null==p.options)throw Error("your lexer class MUST have an .options member object or it won't fly!");if("function"!=typeof p.setInput)throw Error("your lexer class MUST have a .setInput function member or it won't fly!");if(1!==p.EOF&&2!==p.ERROR)throw Error("your lexer class MUST have these constants defined: lexer.EOF = 1 and lexer.ERROR = 2 or it won't fly!");if(l&&a){var f=a;"function"==typeof a&&(f=a()),l.message+="\n        ("+f+")"}if(s.options){var d=s.options.pre_lex,m=s.options.post_lex;"function"==typeof d&&(p.options.pre_lex=d),"function"==typeof m&&(p.options.post_lex=m)}return s.options.showSource&&("function"==typeof s.options.showSource?s.options.showSource(p,u,s):console.log("\nGenerated lexer sourcecode:\n----------------------------------------\n",u,"\n----------------------------------------\n")),p}catch(e){return c?c(e):o&&console.log("source code:\n",u),!1}}var l=a(null,null,null,function(e){n(s.options),n(void 0!==s.options.xregexp);var t=!!s.options.xregexp;if(!a(function(){n(void 0!==s.options.xregexp),s.options.xregexp=!1,s.showSource=!1},"When you have specified %option xregexp, you must also properly IMPORT the XRegExp library in the generated lexer.",e,null)&&!a(function(){s.options.xregexp=t,s.conditions=[],s.showSource=!1},function(){return n(Array.isArray(s.rules)),s.rules.length>0?"One or more of your lexer state names are possibly botched?":"Your custom lexer is somehow botched."},e,null)&&!a(function(){n(Array.isArray(s.rules)),r=s.rules.length,s.rules=[],s.showSource=!1,s.__in_rules_failure_analysis_mode__=!0},"One or more of your lexer rules are possibly botched?",e,null)){for(var r,i,l=!1,c=0,u=r;c<u&&!(l=a(function(){n(Array.isArray(s.rules)),n(s.rules.length===r);for(var e=0;e<=c;e++){var t=s.rules[e];n(Array.isArray(t)),n(2===t.length||3===t.length),t.pop(),t.push("{ /* nada */ }"),i=t}},function(){return'Your lexer rule "'+i[0]+'" action code block is botched?'},e,null));c++);l||a(function(){s.conditions=[],s.rules=[],s.performAction="null",s.showSource=!1,s.__in_rules_failure_analysis_mode__=!0,o=!1},"One or more of your lexer rule action code block(s) are possibly botched?",e,null)}throw e});return l.setInput(t),l.generate=function(){return D(s)},l.generateModule=function(){return W(s)},l.generateCommonJSModule=function(){return H(s)},l.generateESModule=function(){return X(s)},l.generateAMDModule=function(){return G(s)},l.getExpandedMacros=function(){return s.macros},l}function M(){return`{
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
}`}function $(e,t){var r=i.parseCodeChunkToAST(e,t),n=i.prettyPrintAST(r,t);return n.replace(/\/\*\s*JISON-LEX-ANALYTICS-REPORT\s*\*\//g,L`
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

    `)}function F(t,r,s){var o={parseActionsUseYYLENG:(s=s||{}).parseActionsUseYYLENG,parseActionsUseYYLINENO:s.parseActionsUseYYLINENO,parseActionsUseYYTEXT:s.parseActionsUseYYTEXT,parseActionsUseYYLOC:s.parseActionsUseYYLOC,parseActionsUseParseError:s.parseActionsUseParseError,parseActionsUseYYERROR:s.parseActionsUseYYERROR,parseActionsUseYYERROK:s.parseActionsUseYYERROK,parseActionsUseYYRECOVERING:s.parseActionsUseYYRECOVERING,parseActionsUseYYCLEARIN:s.parseActionsUseYYCLEARIN,parseActionsUseValueTracking:s.parseActionsUseValueTracking,parseActionsUseValueAssignment:s.parseActionsUseValueAssignment,parseActionsUseLocationTracking:s.parseActionsUseLocationTracking,parseActionsUseLocationAssignment:s.parseActionsUseLocationAssignment,parseActionsUseYYSTACK:s.parseActionsUseYYSTACK,parseActionsUseYYSSTACK:s.parseActionsUseYYSSTACK,parseActionsUseYYSTACKPOINTER:s.parseActionsUseYYSTACKPOINTER,parseActionsUseYYRULELENGTH:s.parseActionsUseYYRULELENGTH,parseActionsUseYYMERGELOCATIONINFO:s.parseActionsUseYYMERGELOCATIONINFO,parserHasErrorRecovery:s.parserHasErrorRecovery,parserHasErrorReporting:s.parserHasErrorReporting,lexerActionsUseYYLENG:"???",lexerActionsUseYYLINENO:"???",lexerActionsUseYYTEXT:"???",lexerActionsUseYYLOC:"???",lexerActionsUseParseError:"???",lexerActionsUseYYERROR:"???",lexerActionsUseLocationTracking:"???",lexerActionsUseMore:"???",lexerActionsUseUnput:"???",lexerActionsUseReject:"???",lexerActionsUseLess:"???",lexerActionsUseDisplayAPIs:"???",lexerActionsUseDescribeYYLOC:"???"};o.lex_rule_dictionary=t=U(t,s)||{},o.options=O(s,t.options),o.moduleType=o.options.moduleType,o.moduleName=o.options.moduleName,o.conditions=function(e){var t,r={};for(t in e)e.hasOwnProperty(t)&&(r[t]={rules:[],inclusive:!e[t]});return r}(t.startConditions),o.conditions.INITIAL={rules:[],inclusive:!0};var a=t.rules?function(t,r,s){var o,a=[t.actionInclude||"","var YYSTATE = YY_START;"],l={},c=[];for(o in r){var u=parseInt(o);u&&u>0&&(l[r[o]]=u)}var h=function(t,r,s,o,a,l){n(Array.isArray(t.rules));var c,u,h,p,f,d,m,y=t.rules.slice(0),x=[],g={},_=0,v=0;function A(e,t){return"return "+(o[t]||"'"+t.replace(/'/g,"\\'")+"'")}function w(e){return Array.isArray(e)&&(e=e.join(" ")),e=e.replace(/\*\//g,"*\\/")}n(void 0===l.options["case-insensitive"]),o||(o={}),l.options.flex&&y.length>0&&y.push([".",'console.log("", yytext); /* `flex` lexing mode: the last resort rule! */']),t.macros&&(g=function(t,r){var i,s={};function o(i){var a,l,c;if(s[i]){if((c=s[i].in_set)instanceof Error)return Error(c.message);if(!1===c)return Error('Macro name "'+i+"\" has an illegal, looping, definition, i.e. it's definition references itself, either directly or indirectly, via other macros.")}else{if((c=t[i]).indexOf("{")>=0){for(a in s[i]={in_set:!1,elsewhere:null,raw:t[i]},t)if(t.hasOwnProperty(a)&&i!==a){if(e._getUnicodeProperty(a)&&a.toUpperCase()!==a){c=Error('Cannot use name "'+a+'" as a macro name as it clashes with the same XRegExp "\\p{..}" Unicode \'General Category\' Property name. Use all-uppercase macro names, e.g. name your macro "'+a.toUpperCase()+'" to work around this issue or give your offending macro a different name.');break}if((l=c.split("{"+a+"}")).length>1){var u,h=o(a);if(n(h),h instanceof Error){c=h;break}c=l.join(h)}}}var p=E(c,i,r);p instanceof Error?u=p:c=u=b(p,!1),s[i]={in_set:u,elsewhere:null,raw:t[i]}}return c}function a(e){var n;if(null==s[e].elsewhere){if(n=t[e],s[e].elsewhere=!1,(n=C(n,e,r,l,c))instanceof Error)return n;s[e].elsewhere=n}else{if((n=s[e].elsewhere)instanceof Error)return n;if(!1===n)return Error('Macro name "'+e+"\" has an illegal, looping, definition, i.e. it's definition references itself, either directly or indirectly, via other macros.")}return n}function l(e){var t,r;if(e.indexOf("{")>=0){for(t in s)if(s.hasOwnProperty(t)){var i=e.split("{"+t+"}");if(i.length>1){if(n(r=o(t)),r instanceof Error)return Error("failure to expand the macro ["+t+"] in set ["+e+"]: "+r.message);e=i.join(r)}if(-1===e.indexOf("{"))break}}return e}function c(e){var t,r;if(e.indexOf("{")>=0){for(t in s)if(s.hasOwnProperty(t)){var i=e.split("{"+t+"}");if(i.length>1){if(n(r=a(t)),r instanceof Error)return Error("failure to expand the macro ["+t+"] in regex /"+e+"/: "+r.message);e=i.join("(?:"+r+")")}if(-1===e.indexOf("{"))break}}return e}for(i in r.debug&&console.log("\n############## RAW macros: ",t),t)t.hasOwnProperty(i)&&o(i);for(i in t)t.hasOwnProperty(i)&&a(i);return r.debug&&console.log("\n############### expanded macros: ",s),s}(t.macros,l));var k=["switch(yyrulenumber) {"];for(u=0;u<y.length;u++){if(c=(p=y[u].slice(0))[0],m=[],Array.isArray(c))if("*"===c[0]){for(h in m.push("*"),a)a[h].rules.push(u);p.shift(),c=p[0]}else for(h=0,d=p.shift(),c=p[0];h<d.length;h++)a.hasOwnProperty(d[h])||(a[d[h]]={rules:[],inclusive:!1},console.warn("Lexer Warning:",'"'+d[h]+'" start condition should be defined as %s or %x; assuming %x now.')),m.push(d[h]),a[d[h]].rules.push(u);else for(h in a)a[h].inclusive&&(m.push(h),a[h].rules.push(u));"string"==typeof c&&(c=new e("^(?:"+(c=function(e,t,r){var i=0,s=C(e,null,r,function(e){var r,s,o;if(e.indexOf("{")>=0){for(r in t)if(t.hasOwnProperty(r)){s=t[r];var a=e.split("{"+r+"}");if(a.length>1){if(n(o=s.in_set),o instanceof Error)throw o;if(!1===o)return Error('Macro name "'+r+"\" has an illegal, looping, definition, i.e. it's definition references itself, either directly or indirectly, via other macros.");e=a.join(o),i++}if(-1===e.indexOf("{"))break}}return e},function(e){var r,s,o;if(e.indexOf("{")>=0){for(r in t)if(t.hasOwnProperty(r)){s=t[r];var a=e.split("{"+r+"}");if(a.length>1){if(n(o=s.elsewhere),!1===o)return Error('Macro name "'+r+"\" has an illegal, looping, definition, i.e. it's definition references itself, either directly or indirectly, via other macros.");e=a.join("("+o+")"),i++}if(-1===e.indexOf("{"))break}}return e});if(s instanceof Error)throw s;return i>0||e.indexOf("\\p{")>=0&&!r.options.xregexp?e=s:s.length<e.length&&(e=s),e}(c,g,l))+")",l.options.caseInsensitive?"i":"")),x.push(c),"function"==typeof(f=p[1])&&(f=i.printFunctionSourceCodeContainer(f).code),f=(f=f.replace(/return\s*\(?'((?:\\'|[^']+)+)'\)?/g,A)).replace(/return\s*\(?"((?:\\"|[^"]+)+)"\)?/g,A);var L=["\n/*! Conditions::"];L.push(w(m)),L.push("*/","\n/*! Rule::      "),L.push(w(p[0])),L.push("*/","\n");var S=/^return[\s\r\n]+((?:'(?:\\'|[^']+)+')|(?:"(?:\\"|[^"]+)+")|\d+)[\s\r\n]*;?$/.exec(f.trim());S?(v++,s.push([].concat(L,u,":",S[1]).join(" ").replace(/[\n]/g,"\n  "))):(_++,k.push([].concat("case",u,":",L,f,"\nbreak;").join(" ")))}return v&&(k.push("default:"),k.push("  return this.simpleCaseActionClusters[yyrulenumber];")),k.push("}"),v+_>0?r.push.apply(r,k):r.push("/* no rules ==> no rule SWITCH! */"),{rules:x,macros:g,regular_rule_count:_,simple_rule_count:v}}(t,a,c,r&&l,s.conditions,s),p=a.join("\n");return"yytext yyleng yylineno yylloc yyerror".split(" ").forEach(function(e){p=p.replace(RegExp("\\b("+e+")\\b","g"),"yy_.$1")}),{caseHelperInclude:"{\n"+c.join(",")+"\n}",actions:`function lexer__performAction(yy, yyrulenumber, YY_START) {
            var yy_ = this;

            ${p}
        }`,rules:h.rules,macros:h.macros,regular_rule_count:h.regular_rule_count,simple_rule_count:h.simple_rule_count}}(t,r,o):{};return o.performAction=a.actions,o.caseHelperInclude=a.caseHelperInclude,o.rules=a.rules||[],o.macros=a.macros,o.regular_rule_count=a.regular_rule_count,o.simple_rule_count=a.simple_rule_count,o.conditionStack=["INITIAL"],o.actionInclude=t.actionInclude||"",o.moduleInclude=(o.moduleInclude||"")+(t.moduleInclude||"").trim(),o}function D(e){var t="";switch(e.moduleType){case"js":t=W(e);break;case"amd":t=G(e);break;case"es":t=X(e);break;default:t=H(e)}return t}function z(t){if(t.rules.length>0||t.__in_rules_failure_analysis_mode__){var r,i,s,o,a,l=[L`
            var lexer = {
            `,"/*JISON-LEX-ANALYTICS-REPORT*/"],c=M();l.push((c=c.replace(/^[\s\r\n]*\{/,"").replace(/\s*\}[\s\r\n]*$/,"").trim())+",\n"),n(t.options),n(void 0===t.options["case-insensitive"]),l.push("    options: "+function(t){var r={},n={debug:!t.debug,enableDebugLogs:1,json:1,_:1,noMain:1,dumpSourceCodeOnFailure:1,throwErrorOnCompileFailure:1,reportStats:1,file:1,outfile:1,inputPath:1,inputFilename:1,defaultModuleName:1,moduleName:1,moduleType:1,lexerErrorsAreRecoverable:0,flex:0,backtrack_lexer:0,caseInsensitive:0,showSource:1,exportAST:1,exportAllTables:1,exportSourceCode:1,prettyCfg:1,parseActionsUseYYLENG:1,parseActionsUseYYLINENO:1,parseActionsUseYYTEXT:1,parseActionsUseYYLOC:1,parseActionsUseParseError:1,parseActionsUseYYERROR:1,parseActionsUseYYRECOVERING:1,parseActionsUseYYERROK:1,parseActionsUseYYCLEARIN:1,parseActionsUseValueTracking:1,parseActionsUseValueAssignment:1,parseActionsUseLocationTracking:1,parseActionsUseLocationAssignment:1,parseActionsUseYYSTACK:1,parseActionsUseYYSSTACK:1,parseActionsUseYYSTACKPOINTER:1,parseActionsUseYYRULELENGTH:1,parseActionsUseYYMERGELOCATIONINFO:1,parserHasErrorRecovery:1,parserHasErrorReporting:1,lexerActionsUseYYLENG:1,lexerActionsUseYYLINENO:1,lexerActionsUseYYTEXT:1,lexerActionsUseYYLOC:1,lexerActionsUseParseError:1,lexerActionsUseYYERROR:1,lexerActionsUseLocationTracking:1,lexerActionsUseMore:1,lexerActionsUseUnput:1,lexerActionsUseReject:1,lexerActionsUseLess:1,lexerActionsUseDisplayAPIs:1,lexerActionsUseDescribeYYLOC:1};for(var i in t)if(!n[i]&&null!=t[i]&&!1!==t[i]){if("string"==typeof t[i]){var s=parseFloat(t[i]);if(s==t[i]){r[i]=s;continue}}r[i]=t[i]}var o=r.pre_lex,a=r.post_lex;o&&(r.pre_lex=!0),a&&(r.post_lex=!0);var l=JSON.stringify(r,null,2);return(l=(l=l.replace(new e('  "([\\p{Alphabetic}_][\\p{Alphabetic}_\\p{Number}]*)": ',"g"),"  $1: ")).replace(/^( +)pre_lex: true(,)?$/gm,function(e,t,r){return t+"pre_lex: "+String(o)+(r||"")})).replace(/^( +)post_lex: true(,)?$/gm,function(e,t,r){return t+"post_lex: "+String(a)+(r||"")})}(t.options));var u=String(t.performAction),h=String(t.caseHelperInclude),p=(r=t.rules,i=t.options&&t.options.xregexp,o=Array(s=1+Math.log10(1|r.length)|0).join(" "),r.map(function(t,r){var n=(o+r).substr(-s);if(!(t instanceof e)||t.xregexp.isNative||!i)return`/* ${n}: */  ${t}`;var a=t.xregexp.source.replace(/[\\"]/g,"\\$&");return`/* ${n}: */  new XRegExp("${a}", "${t.xregexp.flags}")`}).join(",\n")),f=JSON.stringify(t.conditions,null,2).replace(/  "rules": \[/g,"  rules: [").replace(/  "inclusive": /g,"  inclusive: ");l.push(L`,
            JisonLexerError: JisonLexerError,
            performAction: ${u},
            simpleCaseActionClusters: ${h},
            rules: [
                ${p}
            ],
            conditions: ${f}
        };
        `),t.is_custom_lexer=!1,a=l.join("")}else a="var lexer;\n",n(0===t.regular_rule_count),n(0===t.simple_rule_count),t.is_custom_lexer=!0,t.actionInclude&&(a+=t.actionInclude+(t.actionInclude.match(/;[\s\r\n]*$/)?"":";")+"\n");return a}function J(){return L`
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
`)(),P.generate=function(e,t,r){return D(F(e,t,r))},P.version=k,P.defaultJisonLexOptions=N,P.mkStdOptions=O,P.camelCase=i.camelCase,P.mkIdentifier=S,P.autodetectAndConvertToJSONformat=U;export{P as default};
