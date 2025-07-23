#!/usr/bin/env node


import helpers from"jison-helpers-lib";import assert from"assert";import Lexer from"@gerhobbelt/jison-lex";import ebnfParser from"@gerhobbelt/ebnf-parser";import lexParser from"@gerhobbelt/lex-parser";import json5 from"@gerhobbelt/json5";import XRegExp from"@gerhobbelt/xregexp";import recast from"@gerhobbelt/recast";import astUtils from"@gerhobbelt/ast-util";import path from"path";import fs from"fs";import process from"process";import nomnom from"@gerhobbelt/nomnom";var mkIdentifier$2=helpers.mkIdentifier,create=Object.create||function(e){function t(){}return t.prototype=e,new t},position=/^(before|after)/;function layerMethod(e,t,r,o){return"after"===e?function(){var e=r.apply(this,arguments),t=[].slice.call(arguments);return t.splice(0,0,e),o.apply(this,t),e}:"before"===e?function(){o.apply(this,arguments);var e=r.apply(this,arguments);return e}:o}function typal_mix(){var e,t,r;for(e=0;e<arguments.length;e++)if(t=arguments[e]){for(r in Object.prototype.hasOwnProperty.call(t,"constructor")&&(this.constructor=t.constructor),Object.prototype.hasOwnProperty.call(t,"toString")&&(this.toString=t.toString),t)if(Object.prototype.hasOwnProperty.call(t,r)){var o=r.match(position),n=r.replace(position,"");o&&"function"==typeof this[n]?this[n]=layerMethod(o[0],n,this[n],t[r]):this[r]=t[r]}}return this}function typal_camel_mix(e){var t,r,o;function n(e){return e.replace(/^\w/,function(e){return e.toLowerCase()})}for(t=1;t<arguments.length;t++)if(r=arguments[t]){for(o in Object.prototype.hasOwnProperty.call(r,"constructor")&&(this.constructor=r.constructor),Object.prototype.hasOwnProperty.call(r,"toString")&&(this.toString=r.toString),e&&(r=e(r)),r)if(Object.prototype.hasOwnProperty.call(r,o)){var s=mkIdentifier$2(o),a=o.match(position),i=o.replace(position,""),l=n(i);a&&"function"==typeof this[i]?this[i]=layerMethod(a[0],i,this[i],r[o]):a&&"function"==typeof this[l]?this[l]=layerMethod(a[0],l,this[l],r[o]):this[s]=r[o]}}return this}var typal={mix:typal_mix,camelMix:typal_camel_mix,beget:function(){return arguments.length?typal_mix.apply(create(this),arguments):create(this)},construct:function(){var e=typal_mix.apply(create(this),arguments),t=e.constructor,r=e.constructor=function(){return t.apply(this,arguments)};return r.prototype=e,r.mix=typal_mix,r},constructor:function(){return this}},setMixin={constructor:function(e,t){this._items=[],e&&e.constructor===Array?this._items=t?e:e.slice(0):arguments.length&&(this._items=[].slice.call(arguments,0))},concat:function(e){return this._items.push.apply(this._items,e._items||e),this},eq:function(e){return this._items.length===e._items.length&&this.subset(e)&&this.superset(e)},indexOf:function(e){if(e&&e.eq){for(var t=0;t<this._items.length;t++)if(e.eq(this._items[t]))return t;return -1}return this._items.indexOf(e)},intersection:function(e){return this.filter(function(t){return e.contains(t)})},complement:function(e){var t=this;return e.filter(function(e){return!t.contains(e)})},subset:function(e){for(var t=!0,r=0;r<this._items.length&&t;r++)t=t&&e.contains(this._items[r]);return t},superset:function(e){return e.subset(this)},joinSet:function(e){return this.concat(this.complement(e))},contains:function(e){return -1!==this.indexOf(e)},item:function(e){return this._items[e]},i:function(e){return this._items[e]},assign:function(e,t){return this._items[e]=t,this},first:function(){return this._items[0]},last:function(){return this._items[this._items.length-1]},size:function(){return this._items.length},isEmpty:function(){return 0===this._items.length},copy:function(){return new Set(this._items)},toString:function(){return this._items.toString()}};"push shift unshift forEach some every join sort".split(" ").forEach(function(e,t){setMixin[e]=function(){return Array.prototype[e].apply(this._items,arguments)}}),"filter slice map".split(" ").forEach(function(e,t){setMixin[e]=function(){return new Set(Array.prototype[e].apply(this._items,arguments),!0)}});var Set=typal.construct(setMixin),rmCommonWS$2=helpers.rmCommonWS;function grammarPrinter(e,t){switch("object"!=typeof e&&(e=json5.parse(e)),(t=t||{}).showLexer=void 0===t.showLexer||!!t.showLexer,t.showParser=void 0===t.showParser||!!t.showParser,String(t.format).toLowerCase()){default:case"jison":t.format="jison";break;case"json5":t.format="json5";break;case".y":case".yacc":t.format="jison",t.showLexer=!1,t.showParser=!0;break;case".l":case".lex":t.format="jison",t.showLexer=!0,t.showParser=!1}function r(e){return Array(e+1).join(" ")}function o(e,t){return e+Array(Math.max(0,t-e.length)+1).join(" ")}function n(e,t){for(var r=t/2,o="// **PRE**",n="// **POST**";r>0;r--)o="function x() {\n"+o,n+="\n}";e="\n"+o+"\n"+e+"\n"+n+"\n";var s=helpers.parseCodeChunkToAST(e),a=helpers.prettyPrintAST(s),i=a.indexOf("// **PRE**"),l=a.lastIndexOf("// **POST**");return a.substring(i+10,l).trim()}function s(e){var t=e&&"object"==typeof e&&Object.keys(e);return t&&0===t.length}function a(e){if(e&&e instanceof Array){for(var t=0,r=e.length;t<r;t++)if(void 0!==e[t])return!1;return!0}return!1}var i,l,c=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,u={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"};function h(e){return c.lastIndex=0,c.test(e)?'"'+e.replace(c,function(e){var t=u[e];return"string"==typeof t?t:"\\u"+("0000"+e.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+e+'"'}function p(e,t){if(null==t&&(y=[],m=[],t="root"),"function"==typeof e)return"[Function]";if(null==e||"object"!=typeof e||e.constructor!==Object&&e.constructor!==Array)return e;for(var r=0,o=y.length;r<o;r++)if(y[r]===e)return"[Circular/Xref:"+m[r]+"]";y.push(e),m.push(t),t+=".";var n=new e.constructor;for(var s in e)n[s]=p(e[s],t+s);return n}var f=e;e=p(e);var d="";if(e.lex){var y,m,i,l,b=[],g=[],v=[];if(l=e.lex.macros,delete e.lex.macros,l&&!s(l)){b.push(rmCommonWS$2`
                // macros:
            `);var _=0;for(i in l)_=Math.max(_,i.length);for(i in console.log("macros keylen:",_),console.log("macros keylen B:",_=(_/4|0)*4+4),l)b.push(o(i,_)+l[i]);b.push(rmCommonWS$2`
                // END of the lexer macros.
            `)}if(l=e.lex.unknownDecls,delete e.lex.unknownDecls,l&&!s(l)){b.push(rmCommonWS$2`
                // unknown declarations:
            `);for(var E=0,k=l.length;E<k;E++){var w=l[E],i=w[0],x=w[1];b.push("%"+i+" "+x)}b.push(rmCommonWS$2`
                // END of unknown declarations.
            `)}if(l=e.lex.options,delete e.lex.options,l&&!s(l))for(i in b.push(rmCommonWS$2`
                // options:
            `),l){var x=l[i];x?b.push("%options "+i+"="+x):b.push("%options "+i)}if(l=e.lex.startConditions,delete e.lex.startConditions,l&&!s(l))for(i in l){var x=l[i];b.push((x?"%x ":"%s ")+i)}if(l=e.lex.actionInclude,delete e.lex.actionInclude,l&&l.trim()&&b.push("%{\n"+n(l.trim(),4)+"\n%}"),l=e.lex.rules,delete e.lex.rules,l)for(var E=0,k=l.length;E<k;E++){var w=l[E];i=w[0];var S=n(w[1],4),R=/[\r\n]/.test(S);console.log("indented action:",{entry:w[1],action:S,actionHasLF:R}),i.length<=12?R?g.push(o(i,16)+"%"+n("{ "+S+" }",16)+"%"):g.push(o(i,16)+n(S,16)):R?g.push(i,r(16)+"%"+n("{ "+S+" }",16)+"%"):g.push(i,r(16)+n(S,16))}l=e.lex.moduleInclude,delete e.lex.moduleInclude,l&&l.trim()&&v.push(n(l.trim(),0));var A="";if(!s(e.lex)){var O=json5.stringify(e.lex,null,2);A+=rmCommonWS$2`
                /*
                 * Lexer stuff that's unknown to the JISON prettyPrint service:
                 *
                 * ${O.replace(/\*\//g,"*\\/")}
                 */
                
            `}delete e.lex,A+=b.join("\n")+"\n\n",A+=rmCommonWS$2`

            %%

        `+g.join("\n")+"\n\n",v.length>0&&(A+=rmCommonWS$2`

                %%

            `+v.join("\n")+"\n\n"),d=A}var T=[],Y=[],N=[],I=[],C=[],U=function(e,t){var o=p(t);e+=t[0]?t[0]:"%epsilon";var i=null,l=e.split(/\r\n\|\n|\r/).pop();if(delete t[0],3===t.length&&"object"==typeof t[2]?(i="%prec "+t[2].prec,l.length<12&&(e+=r(12-l.length)),e+="  "+i,delete t[2].prec,s(t[2])&&delete t[2]):2===t.length&&"object"==typeof t[1]&&(i="%prec "+t[1].prec,l.length<12&&(e+=r(12-l.length)),e+="  "+i,delete t[1].prec,s(t[1])&&delete t[1]),"string"==typeof t[1]){var c=t[1];l.length<11?e+=r(12-l.length)+n("{ "+c+" }",12):e+="\n"+r(12)+n("{ "+c+" }",12),delete t[1]}return a(t)?t.length=0:t=o,e},L=function(e){var t=[];for(r in e){var r,o,n=e[r];if(console.log("format one rule:",{key:r,prodset:n}),"string"==typeof n)o=U(r+" : ",[n])+";",delete e[r];else if(n instanceof Array){if(1===n.length)"string"==typeof n[0]?(o=U(r+" : ",[n])+";",delete e[r]):n[0]instanceof Array?(o=U(r+" : ",n[0])+"\n    ;",0===n[0].length&&delete e[r]):o=r+"\n    : **ERRONEOUS PRODUCTION** (see the dump for more): "+n[0];else if(n.length>1){"string"==typeof n[0]?(o=U(r+"\n    : ",[n[0]]),delete n[0]):n[0]instanceof Array?(o=U(r+"\n    : ",n[0]),0===n[0].length&&delete n[0]):o=r+"\n    : **ERRONEOUS PRODUCTION** (see the dump for more): "+n[0];for(var s=1,i=n.length;s<i;s++)"string"==typeof n[s]?(o+=U("\n    | ",[n[s]]),delete n[s]):n[s]instanceof Array?(o+=U("\n    | ",n[s]),0===n[s].length&&delete n[s]):o+="\n    | **ERRONEOUS PRODUCTION** (see the dump for more): "+n[s];o+="\n    ;",a(n)&&delete e[r]}}else o=r+"\n    : **ERRONEOUS PRODUCTION** (see the dump for more): "+n;t.push(o)}return t};if((l=e.ebnf)&&(N=L(l),s(l)&&delete e.ebnf),(l=e.bnf)&&(I=L(l),s(l)&&delete e.bnf),l=e.unknownDecls,delete e.unknownDecls,l&&!s(l)){b.push(rmCommonWS$2`
            // unknown declarations:
        `);for(var E=0,k=l.length;E<k;E++){var w=l[E],i=w[0],x=w[1];b.push("%"+i+" "+x)}b.push(rmCommonWS$2`
            // END of unknown declarations.
        `)}if(d.trim()&&t.showLexer&&T.push(rmCommonWS$2`
            // ============================== START lexer section =========================== 
            
            %lex
            
            ${d}

            /lex

            // ============================== END lexer section =============================

        `),l=e.options,delete e.options,l&&!s(l)){var P=[];for(i in l){var x=l[i];switch(i){default:!0!==x?P.push("options","%options "+i+"="+x):P.push("options","%options "+i);break;case"ebnf":x&&P.push(i,"%ebnf");break;case"type":x&&P.push(i,"%parser-type "+x);break;case"debug":"boolean"!=typeof x?P.push(i,"%debug "+x):x&&P.push(i,"%debug")}}for(var $=null,E=0,k=P.length;E<k;E+=2){var j=P[E],D=P[E+1];j!==$&&($=j,T.push("")),T.push(D)}T.push("")}if(l=e.imports){for(var M=!0,E=0,k=l.length;E<k;E++){var w=l[E];T.push("%import "+w.name+"  "+w.path),delete w.name,delete w.path,s(w)?delete l[E]:M=!1}M&&delete e.imports}if(l=e.moduleInit){for(var M=!0,E=0,k=l.length;E<k;E++){var w=l[E];T.push("%code "+w.qualifier+"  "+w.include),delete w.qualifier,delete w.include,s(w)?delete l[E]:M=!1}M&&delete e.moduleInit}if(l=e.operators){for(var M=!0,E=0,k=l.length;E<k;E++){for(var w=l[E],F=w[1],D="%"+w[0]+" ",j=0,G=F.length;j<G;j++)D+=" "+F[j];T.push(D),2===w.length?delete l[E]:M=!1}M&&delete e.operators}if(l=e.extra_tokens){for(var M=!0,E=0,k=l.length;E<k;E++){var w=l[E],D="%token "+w.id;w.type&&(D+=" <"+w.type+">",delete w.type),w.value&&(D+=" "+w.value,delete w.value),w.description&&(D+=" "+h(w.description),delete w.description),T.push(D),delete w.id,s(w)?delete l[E]:M=!1}M&&delete e.extra_tokens}l=e.parseParams,delete e.parseParams,l&&T.push("%parse-param "+l.join(" ")),l=e.start,delete e.start,l&&T.push("%start "+l),l=e.moduleInclude,delete e.moduleInclude,l&&l.trim()&&C.push(n(l.trim(),0)),l=e.actionInclude,delete e.actionInclude,l&&l.trim()&&Y.push("%{\n"+n(l.trim(),4)+"\n%}");var A="";if(!s(e)){var O=json5.stringify(e,null,2);A+=rmCommonWS$2`
            /*
             * Parser stuff that's unknown to the JISON prettyPrint service:
             *
             * ${O.replace(/\*\//g,"*\\/")}
             */
            
        `}if(t.showParser){if(A+=T.join("\n")+"\n\n",A+=rmCommonWS$2`

            %%

        `,Y.length>0&&(A+=Y.join("\n")+"\n\n"),N.length>0){if(I.length>0){var P=I.join("\n\n").split(/\r\n|\n|\r/).map(function(e){return"// "+e});A+=rmCommonWS$2`
                    //
                    // JISON says:
                    //
                    // This is a EBNF grammar. The resulting **BNF** grammar has been
                    // reproduced here for your convenience:
                    //
                    // ---------------------------- START ---------------------------
                    ${P.join("\n")}
                    // ---------------------------- END OF BNF grammar --------------
                    //


                `}A+=N.join("\n\n")+"\n\n"}else I.length>0&&(A+=I.join("\n\n")+"\n\n");C.length>0&&(A+=rmCommonWS$2`

                %%

            `+C.join("\n")+"\n\n")}else A+=d;if("json5"===t.format){var P=A.split(/\r\n|\n|\r/).map(function(e){return"// "+e});A=rmCommonWS$2`
            //
            // JISON says:
            //
            // The JISON ${t.showParser?"grammar":"lexer"} has been
            // reproduced here for your convenience:
            //
            // ---------------------------- START ---------------------------
            ${P.join("\n")}
            // ---------------------------- END -----------------------------
            //

        `,e=p(f),t.showLexer?t.showParser||(A+=JSON5.stringify(e.lex,null,2)):(delete e.lex,A+=JSON5.stringify(e,null,2))}return A}helpers.camelCase;var rmCommonWS$1=helpers.rmCommonWS,mkIdentifier$1=helpers.mkIdentifier,code_exec=helpers.exec,version$1=require("../package.json").version,devDebug=0;function chkBugger(e){(e=""+e).match(/\bcov_\w+/)&&console.error("### ISTANBUL COVERAGE CODE DETECTED ###\n",e)}let ID_REGEX_BASE="[\\p{Alphabetic}_][\\p{Alphabetic}_\\p{Number}]*";var Jison={version:version$1};let defaultJisonOptions={moduleType:"commonjs",debug:!1,enableDebugLogs:!1,numExpectedConflictStates:0,json:!1,type:"lalr",compressTables:2,outputDebugTables:!1,noDefaultResolve:!1,defaultActionMode:["classic","merge"],testCompileActionCode:"parser:*,lexer:*",noTryCatch:!1,hasPartialLrUpgradeOnConflict:!0,errorRecoveryTokenDiscardCount:3,exportAllTables:!1,exportSourceCode:!1,noMain:!0,moduleMain:null,moduleMainImports:null,tokenStack:!1,dumpSourceCodeOnFailure:!0,throwErrorOnCompileFailure:!0,moduleName:void 0,defaultModuleName:"parser",file:void 0,outfile:void 0,inputPath:void 0,inputFilename:void 0,lexfile:void 0,warn_cb:void 0,parseParams:void 0,parserErrorsAreRecoverable:!1,lexerErrorsAreRecoverable:!1,ranges:void 0,showSource:!1,reportStats:!1,exportAST:!1,prettyCfg:!0,actionsUseLocationAssignment:!1,actionsUseLocationTracking:!1,actionsUseParseError:!1,actionsUseValueAssignment:!1,actionsUseValueTracking:!1,actionsUseYYCLEARIN:!1,actionsUseYYERROK:!1,actionsUseYYERROR:!1,actionsUseYYLENG:!1,actionsUseYYLINENO:!1,actionsUseYYLOC:!1,actionsUseYYRECOVERING:!1,actionsUseYYRULELENGTH:!1,actionsUseYYMERGELOCATIONINFO:!1,actionsUseYYSSTACK:!1,actionsUseYYSTACK:!1,actionsUseYYSTACKPOINTER:!1,actionsUseYYTEXT:!1,hasErrorRecovery:!1,hasErrorReporting:!1};function mkStdOptions(...e){var t=Object.prototype.hasOwnProperty,r={};"NODEFAULT"!==e[0]?e.unshift(Jison.defaultJisonOptions):e.shift();for(var o=0,n=e.length;o<n;o++){var s=e[o];if(s){var a={};for(var i in s)void 0!==s[i]&&t.call(s,i)&&(a[mkIdentifier$1(i)]=s[i]);if(void 0!==a.main&&(a.noMain=!a.main),void 0!==a.noDefaultAction)throw Error('option "no-default-action" has been OBSOLETED. Use "default-action-mode=[for-value,for-location]" instead (see \'jison --help\' for usage description).');if(void 0!==a.defaultAction)throw Error('option "default-action" has been OBSOLETED. Use "default-action-mode=[for-value,for-location]" instead (see \'jison --help\' for usage description).');switch(void 0!==a.hasDefaultResolve&&(a.noDefaultResolve=!a.hasDefaultResolve),typeof a.defaultActionMode){case"undefined":break;case"object":if("function"==typeof a.defaultActionMode.slice){a.defaultActionMode=a.defaultActionMode.slice(0);break}case"string":var l=String(a.defaultActionMode).split(",").map(function(e){return e.trim()});1===l.length&&(l[1]=l[0]),a.defaultActionMode=l;break;default:throw Error("option \"default-action-mode\" must be a STRING or 2-element ARRAY value, when specified (see 'jison --help' for usage description).")}if(void 0!==a.hasTryCatch&&(a.noTryCatch=!a.hasTryCatch),void 0!==a.parserType&&(a.type=a.parserType),void 0!==a.moduleType)switch(a.moduleType){case"js":case"amd":case"es":case"commonjs":break;case"cjs":a.moduleType="commonjs";break;case"iife":a.moduleType="js";break;case"umd":a.moduleType="amd";break;default:throw Error("unsupported moduleType: "+dquote(opt.moduleType))}if(null!=a.errorRecoveryTokenDiscardCount&&"number"!=typeof a.errorRecoveryTokenDiscardCount)throw Error("options.errorRecoveryTokenDiscardCount should be a number or undefined; instead it has type: "+typeof a.errorRecoveryTokenDiscardCount);for(var i in delete a.parserType,delete a.main,delete a.hasDefaultResolve,delete a.hasTryCatch,delete a.noDefaultAction,a.moduleName===a.defaultModuleName&&delete a.moduleName,a)t.call(a,i)&&void 0!==a[i]&&(r[i]=a[i])}}return r}function prepExportStructures(e){var t=e.exportAllTables;t&&"object"==typeof t?"boolean"!=typeof t.enabled&&(t.enabled=!0):t={enabled:!!t},e.exportAllTables=t;var r=e.exportSourceCode;r&&"object"==typeof r?"boolean"!=typeof r.enabled&&(r.enabled=!0):r={enabled:!!r},e.exportSourceCode=r}function autodetectAndConvertToJSONformat(e,t,r){var o,n,s=null,a=null;if("string"==typeof e){if(r.json)try{s=json5.parse(e)}catch(e){o=e}if(!s)try{s=ebnfParser.parse(e,r)}catch(e){throw r.json?[/does not compile/,/you did not correctly separate trailing code/,/You did not specify/,/You cannot specify/,/must be qualified/,/%start/,/%token/,/%import/,/%include/,/%options/,/%parse-params/,/%parser-type/,/%epsilon/,/definition list error/,/token list error/,/declaration error/,/should be followed/,/should be separated/,/an error in one or more of your lexer regex rules/,/an error in your lexer epilogue/,/unsupported definition type/].filter(function(t){return e.message.match(t)}).length>0?n=e:((n=Error("Could not parse jison grammar in JSON AUTODETECT mode:\nin JISON Mode we get Error: "+e.message+"\nwhile JSON5 Mode produces Error: "+o.message)).secondary_exception=e,n.stack=o.stack):(n=Error("Could not parse jison grammar\nError: "+e.message)).stack=e.stack,n}}else s=e;if(s&&t){if(s.lex)throw Error("Cannot invoke with both a lexer section in the grammar input and a separate lexer input at the same time!");if("string"==typeof t){if(r.json)try{a=json5.parse(t)}catch(e){o=e}if(!a)try{a=lexParser.parse(t,r)}catch(e){throw r.json?((n=Error("Could not parse lexer spec in JSON AUTODETECT mode\nError: "+o.message+" ("+e.message+")")).secondary_exception=e,n.stack=o.stack):(n=Error("Could not parse lexer spec\nError: "+e.message)).stack=e.stack,n}}else a=t;a&&(s.lex=a)}return s}function each(e,t){if("function"==typeof e.forEach)e.forEach(t);else{var r;for(r in e)e.hasOwnProperty(r)&&t.call(e,e[r],r,e)}}function union(e,t){if(assert(Array.isArray(e)),assert(Array.isArray(t)),e.length>52){var r,o,n={};for(r=0,o=e.length;r<o;r++)n[e[r]]=!0;for(r=0,o=t.length;r<o;r++)n[t[r]]||e.push(t[r])}else{var s=[];for(r=0,o=t.length;r<o;r++)0>e.indexOf(t[r])&&s.push(t[r]);e=e.concat(s)}return e}Jison.defaultJisonOptions=defaultJisonOptions,Jison.rmCommonWS=rmCommonWS$1,Jison.mkStdOptions=mkStdOptions,Jison.camelCase=helpers.camelCase,Jison.mkIdentifier=mkIdentifier$1,Jison.autodetectAndConvertToJSONformat=autodetectAndConvertToJSONformat,"undefined"!=typeof console&&console.log?Jison.print=function(){var e=Array.prototype.slice.call(arguments,0);e.unshift(""),console.log.apply(console,e)}:"undefined"!=typeof puts?Jison.print=function(){puts([].join.call(arguments," "))}:"undefined"!=typeof print?Jison.print=print:Jison.print=function(){},Jison.Lexer=Lexer,Jison.ebnfParser=ebnfParser,Jison.lexParser=lexParser,Jison.codeExec=code_exec,Jison.XRegExp=XRegExp,Jison.recast=recast,Jison.astUtils=astUtils,Jison.JSON5=json5,Jison.prettyPrint=grammarPrinter;var Nonterminal=typal.construct({constructor:function(e){this.symbol=e,this.productions=new Set,this.first=[],this.follows=[],this.nullable=!1},toString:function(){var e=this.symbol,t=[];return this.nullable&&t.push("nullable"),t.length&&(e+="        ["+t.join(" ")+"]"),e+="\n  Firsts:  ["+this.first.join("]  [")+"]",e+="\n  Follows: ["+this.follows.join("]  [")+"]",e+="\n  Productions:\n    "+this.productions.join("\n    ")}}),Production=typal.construct({constructor:function(e,t,r,o,n){this.symbol=e,this.handle=t,this.nullable=!1,this.id=r,this.aliases=o,this.action=n,this.first=[],this.follows=[],this.precedence=0,this.reachable=!1},toString:function(){var e=this.symbol,t=[];return this.nullable&&t.push("~"),this.precedence&&t.push("@"+this.precedence),this.reachable||t.push("*RIP*"),t.length&&(e+="["+t.join(" ")+"]"),e+=" -> "+this.handle.join(" ")},describe:function(){var e=this.symbol,t=[];return this.nullable&&t.push("nullable"),this.precedence&&t.push("precedence: "+this.precedence),t.length&&(e+="        ["+t.join(" ")+"]"),e+="\n  Firsts: ["+this.first.join("]  [")+"]",e+="\n  --\x3e  "+this.handle.join(" ")}}),generator=typal.beget();function processOperators(e){if(!e)return{};for(var t,r,o={},n=0;r=e[n];n++)for(t=1;t<r.length;t++)o[r[t]]={precedence:n+1,assoc:r[0]};return o}function reindentCodeBlock(e,t){var r=0;return e.trim().split("\n").map(function(e,t){if(1===t&&(r=1/0),""===e.trim())return"";e=e.replace(/^[ \t]+/,function(e){return e.replace(/\t/g,"    ")});var o=/^[ ]+/.exec(e);return o&&(r=Math.min(o[0].length,r)),e}).map(function(e,o){return e=e.replace(/^[ ]*/,function(e){return Array(Math.max(e.length-r,0)+t+1).join(" ")})}).join("\n")}function preprocessActionCode(e){function t(e){return e=e.replace(/##/g,"\x01\x89").replace(/#/g,"\x01\x81").replace(/\$/g,"\x01\x82").replace(/@/g,"\x01\x83").replace(/\/\*/g,"\x01\x85").replace(/\/\//g,"\x01\x86").replace(/\'/g,"\x01\x87").replace(/\"/g,"\x01\x88").replace(/\bYYABORT\b/g,"\x01\x94").replace(/\bYYACCEPT\b/g,"\x01\x95").replace(/\byyvstack\b/g,"\x01\x96").replace(/\byylstack\b/g,"\x01\x97").replace(/\byyerror\b/g,"\x01\x98").replace(/\bYYRECOVERING\b/g,"\x01\x99").replace(/\byyerrok\b/g,"\x01\x9a").replace(/\byyclearin\b/g,"\x01\x9b").replace(/\byysp\b/g,"\x01\x9c").replace(/\byy([a-zA-Z]+)\b/g,"\x01\x9d__$1")}e=e.replace(/^\s+/,"").replace(/\s+$/,"").replace(/\r\n|\r/g,"\n").replace(/^\s*\/\/.+$/mg,t).replace(/\/\/[^'"\n]+$/mg,t).replace(/^([^'"\n]*?)\/\*/mg,"$1\x01\x84").replace(/\/\*([^'"\n]*)$/mg,"\x01\x84$1").replace(/\/\*([^\/]*?\*\/[^'"\n]*)$/mg,"\x01\x84$1").replace(/\x01\x84[\s\S]*?\*\//g,t).replace(/\\\\/g,"\x01\x90").replace(/\\\'/g,"\x01\x91").replace(/\\\"/g,"\x01\x92").replace(/\\\//g,"\x01\x93").replace(/[^_a-zA-Z0-9\$\)\/][\s\n\r]*\/[^\n\/\*][^\n\/]*\//g,t);for(var r,o,n,s,a=-1,i=0;;i++)if(a++,r=e.indexOf('"',a),o=e.indexOf("'",a),n=e.indexOf("/*",a),s=e.indexOf("//",a),a=e.length,a=Math.min(r>=0?r:a,o>=0?o:a,n>=0?n:a,s>=0?s:a),r===a)e=e.replace(/"[^"\n]*"/,t);else if(o===a)e=e.replace(/'[^'\n]*'/,t);else if(n===a)e=e.replace(/\/\*[\s\S]*?\*\//,t);else if(s===a)e=e.replace(/\/\/[^\n]*$/m,t);else break;return e}function postprocessActionCode(e){return e=(e=e.replace(/\x01\x84/g,"/*").replace(/\x01\x85/g,"/*").replace(/\x01\x86/g,"//").replace(/\x01\x81/g,"#").replace(/\x01\x82/g,"$").replace(/\x01\x83/g,"@").replace(/\x01\x87/g,"'").replace(/\x01\x88/g,'"').replace(/\x01\x89/g,"##").replace(/\x01\x90/g,"\\\\").replace(/\x01\x91/g,"\\'").replace(/\x01\x92/g,'\\"').replace(/\x01\x93/g,"\\/").replace(/\x01\x94/g,"YYABORT").replace(/\x01\x95/g,"YYACCEPT").replace(/\x01\x96/g,"yyvstack").replace(/\x01\x97/g,"yylstack").replace(/\x01\x98/g,"yyerror").replace(/\x01\x99/g,"YYRECOVERING").replace(/\x01\x9A/g,"yyerrok").replace(/\x01\x9B/g,"yyclearin").replace(/\x01\x9C/g,"yysp").replace(/\x01\x9D__/g,"yy")).replace(/[\s\r\n]+$/,"").replace(/([^\;}])$/,"$1;")}function mkHashIndex(e){return e.trim().replace(/\s+$/mg,"").replace(/^\s+/mg,"")}function analyzeFeatureUsage(e,t,r){var o=e.match(t);return!!(o&&o.length>r)}function mkParserFeatureHash(e){return assert(e.options.exportAllTables),assert(e.options.exportSourceCode),JSON.stringify([e.actionsAreAllDefault,e.actionsUseLocationAssignment,e.actionsUseLocationTracking,e.actionsUseParseError,e.actionsUseValueAssignment,e.actionsUseValueTracking,e.actionsUseYYCLEARIN,e.actionsUseYYERROK,e.actionsUseYYERROR,e.actionsUseYYLENG,e.actionsUseYYLINENO,e.actionsUseYYLOC,e.actionsUseYYRECOVERING,e.actionsUseYYRULELENGTH,e.actionsUseYYMERGELOCATIONINFO,e.actionsUseYYSSTACK,e.actionsUseYYSTACK,e.actionsUseYYSTACKPOINTER,e.actionsUseYYTEXT,e.hasErrorRecovery,e.hasErrorReporting,e.onDemandLookahead,e.options.compressTables,e.options.debug,e.options.errorRecoveryTokenDiscardCount,e.options.exportAllTables.enabled,e.options.exportSourceCode.enabled,e.options.hasPartialLrUpgradeOnConflict,e.options.lexerErrorsAreRecoverable,e.options.moduleType,e.options.defaultActionMode,e.options.testCompileActionCode,e.options.noDefaultResolve,e.options.noMain,e.options.moduleMain,e.options.moduleMainImports,e.options.noTryCatch,e.options.numExpectedConflictStates,e.options.outputDebugTables,e.options.parserErrorsAreRecoverable,e.options.tokenStack,e.options.type,e.options.moduleName,e.options.parseParams,e.options.ranges,e.options.prettyCfg,"======================================",e.performAction,"======================================"])}generator.constructor=function(e,t,r){!r&&t&&"string"!=typeof t&&(r=t,t=null),e=autodetectAndConvertToJSONformat(e,t,mkStdOptions(r)),prepExportStructures(r=mkStdOptions(e.options,r)),this.terms={},this.operators={},this.productions=[],this.conflicts=0,this.new_conflicts_found_this_round=0,this.conflicting_states=[],this.resolutions=[],this.conflict_productions_LU={},this.conflict_states_LU={},this.conflict_fixing_round=!1,this.parseParams=e.parseParams,this.yy={},this.options=r,this.grammar=e,this.DEBUG=!!r.debug;var o=r.file||r.outfile||"./dummy";if(o=path.normalize(o),r.inputPath=path.dirname(o),r.inputFilename=path.basename(o),e.actionInclude&&("function"==typeof e.actionInclude&&(e.actionInclude=helpers.printFunctionSourceCodeContainer(e.actionInclude).code),this.actionInclude=e.actionInclude),this.moduleInclude=e.moduleInclude||"",this.moduleInit=e.moduleInit||[],assert(Array.isArray(this.moduleInit)),this.DEBUG=!!this.options.debug,this.enableDebugLogs=!!r.enableDebugLogs,this.numExpectedConflictStates=r.numExpectedConflictStates||0,this.DEBUG&&(this.mix(generatorDebug),Jison.print("Grammar::OPTIONS:\n",this.options)),this.processGrammar(e),e.lex){var n={parseActionsAreAllDefault:this.actionsAreAllDefault,parseActionsUseYYLENG:this.actionsUseYYLENG,parseActionsUseYYLINENO:this.actionsUseYYLINENO,parseActionsUseYYTEXT:this.actionsUseYYTEXT,parseActionsUseYYLOC:this.actionsUseYYLOC,parseActionsUseParseError:this.actionsUseParseError,parseActionsUseYYERROR:this.actionsUseYYERROR,parseActionsUseYYRECOVERING:this.actionsUseYYRECOVERING,parseActionsUseYYERROK:this.actionsUseYYERROK,parseActionsUseYYCLEARIN:this.actionsUseYYCLEARIN,parseActionsUseValueTracking:this.actionsUseValueTracking,parseActionsUseValueAssignment:this.actionsUseValueAssignment,parseActionsUseLocationTracking:this.actionsUseLocationTracking,parseActionsUseLocationAssignment:this.actionsUseLocationAssignment,parseActionsUseYYSTACK:this.actionsUseYYSTACK,parseActionsUseYYSSTACK:this.actionsUseYYSSTACK,parseActionsUseYYSTACKPOINTER:this.actionsUseYYSTACKPOINTER,parseActionsUseYYRULELENGTH:this.actionsUseYYRULELENGTH,parseActionsUseYYMERGELOCATIONINFO:this.actionsUseYYMERGELOCATIONINFO,parserHasErrorRecovery:this.hasErrorRecovery,parserHasErrorReporting:this.hasErrorReporting,moduleType:this.options.moduleType,debug:this.options.debug,enableDebugLogs:this.options.enableDebugLogs,json:this.options.json,main:!1,dumpSourceCodeOnFailure:this.options.dumpSourceCodeOnFailure,throwErrorOnCompileFailure:this.options.throwErrorOnCompileFailure,moduleName:"lexer",file:this.options.file,outfile:this.options.outfile,inputPath:this.options.inputPath,inputFilename:this.options.inputFilename,warn_cb:this.options.warn_cb,xregexp:this.options.xregexp,lexerErrorsAreRecoverable:this.options.lexerErrorsAreRecoverable,flex:this.options.flex,backtrack_lexer:this.options.backtrack_lexer,ranges:this.options.ranges,caseInsensitive:this.options.caseInsensitive,showSource:this.options.showSource,exportSourceCode:this.options.exportSourceCode,exportAST:this.options.exportAST,prettyCfg:this.options.prettyCfg,pre_lex:this.options.pre_lex,post_lex:this.options.post_lex};this.lexer=new Lexer(e.lex,null,this.terminals_,n)}},generator.processGrammar=function(e){var t=e.bnf,r=e.tokens,o=this.nonterminals={},n=this.productions;!e.bnf&&e.ebnf&&(t=e.bnf=ebnfParser.transform(e.ebnf)),r&&(r="string"==typeof r?r.trim().split(" "):r.slice(0));var s=null;if(e.imports){var a=e.imports.find(function(e,t){return"symbols"===e.name&&e});if(a){var i=path.resolve(a.path),l=fs.readFileSync(i,"utf8");try{s=json5.parse(l)}catch(e){try{var c=/[\r\n]\s*symbols_:\s*(\{[\s\S]*?\}),\s*[\r\n]/.exec(l);c&&c[1]&&(l=c[1],s=json5.parse(l))}catch(e){throw Error("Error: `%import symbols <path>` must point to either a JSON file containing a symbol table (hash table) or a previously generated JISON JavaScript file, which contains such a symbol table. Error message: "+e.message)}}if(!s||"object"!=typeof s)throw Error("Error: `%import symbols <path>` must point to either a JSON file containing a symbol table (hash table) or a previously generated JISON JavaScript file, which contains such a symbol table.");delete s.$accept,delete s.$end,delete s.error,delete s.$eof,delete s.EOF;var u={};u[1]="EOF",u[2]="error",Object.keys(s).forEach(function(e){var t=s[e];if(!0!==t){if("number"!=typeof t){if("string"!=typeof t||1!==t.length)throw Error("Error: `%import symbols <path>`: symbol table contains invalid entry at key '"+e+"': a non-numeric symbol ID value must be a single-character string.");t=t.charCodeAt(0)}if(t|=0,!t||t<0)throw Error("Error: `%import symbols <path>`: symbol table contains invalid entry at key '"+e+"': a symbol ID value must be an integer value, 3 or greater.");if(u[t]&&u[t]!==e)throw Error("Error: `%import symbols <path>`: symbol table contains duplicate ID values for keys '"+e+"' and '"+u[t]+"'");u[t]=e,s[e]=t}})}}var h=this.symbols=[],p=this.operators=processOperators(e.operators);if(this.buildProductions(t,n,o,h,p,s,e.extra_tokens),r){var f=this.terminals.filter(function(e){switch(e){case"EOF":case"error":case"$eof":case"$end":return!1;default:return!0}}),d=f.filter(function(e){return -1===r.indexOf(e)});d=d.concat(r.filter(function(e){return -1===f.indexOf(e)})),f.length!==r.length&&(this.trace("\nWarning: declared tokens differ from terminals set found in rules."),this.trace("difference: ",d),this.trace("Terminals:  ",f),this.trace("Tokens:     ",r))}this.augmentGrammar(e),this.signalUnusedProductions(),this.buildProductionActions()},generator.augmentGrammar=function(e){if(0===this.productions.length)throw Error("Grammar error: must have at least one rule.");if(this.startSymbol=e.start||e.startSymbol||this.productions[0].symbol,!this.nonterminals[this.startSymbol])throw Error("Grammar error: startSymbol must be a non-terminal found in your grammar.");var t=new Production("$accept",[this.startSymbol,"$end"],0);this.productions.unshift(t),this.nonterminals.$accept.productions.push(t),this.nonterminals[this.startSymbol].follows.push(this.EOF)},generator.signalUnusedProductions=function(){var e,t,r,o,n={},s=this.productions,a=this.nonterminals;for(e=0,t=a.length;e<t;e++)assert((r=a[e]).symbol),n[r.symbol]=!1;function i(e){assert(e),assert(e.symbol),n[e.symbol]=!0;var t=e.productions;assert(t),t.forEach(function(t){assert(t.symbol===e.symbol),assert(t.handle);for(var r=t.handle,o=0,s=r.length;o<s;o++){var l=r[o];assert(!!l||!a[l]),a[l]&&!n[l]&&i(a[l])}})}for(o in i(a.$accept),n){assert(r=a[o]);var l=r.productions;assert(l);var c=n[o];l.forEach(function(e){assert(e),c?e.reachable=!0:e.reachable=!1}),c||delete this.nonterminals[o]}this.unused_productions=s.filter(function(e){return!e.reachable}),this.productions=s.filter(function(e){return e.reachable})},generator.buildProductions=function(e,t,r,o,n,s,a){var i,l,c,u=this,h=[],p={},f={},d=[!0,!0,!0],y=3;if(this.EOF="$end",p.$accept=0,p[this.EOF]=1,p.$eof=1,p.EOF=1,o[0]="$accept",o[1]=this.EOF,r.$accept=new Nonterminal("$accept"),p.error=2,o[2]="error",s){for(l in s)if(!0!==(c=s[l])&&!(c<=2))if(d[c])throw Error('Error: Predefined symbol (imported via `%import symbols`) "'+l+'" has an ID '+c+' which is already in use by symbol "'+o[c]+'"');else d[c]=!0,p[l]=c,o[c]=l;for(l in y=(0|this.options.compressTables)<2?32:3,s)c=s[l],g(l);y=3}a&&(this.trace("descriptions obtained from grammar: ",a),a.forEach(function(e){e.description&&e.id&&(f[e.id]=e.description)}));var m=!1;function b(){for(var e=y;;e++)if(!d[e])return d[e]=!0,y=e+1,e}function g(e){if(e&&!p[e]){var t;1===e.length&&(0|u.options.compressTables)<2&&(t=e.charCodeAt(0))<128&&!d[t]?d[t]=!0:t=b(),p[e]=t,o[t]=e}return p[e]||!1}function v(t){var r,o,n,s,a=this.maxTokenLength||1/0;if(t.constructor===Array)for(o=0,r="string"==typeof t[0]?x(t[0]):t[0].slice(0);o<r.length;o++)(s=(n=r[o]).match(new XRegExp(`\\[${ID_REGEX_BASE}\\]$`)))&&(n=n.substr(0,n.length-s[0].length)),!e[n]&&n.length<=a&&g(n);else for(o=0,r=x(t=t.replace(new XRegExp(`\\[${ID_REGEX_BASE}\\]`,"g"),""));o<r.length;o++)!e[n=r[o]]&&n.length<=a&&g(n)}var _={};for(l in e)e.hasOwnProperty(l)&&(i="string"==typeof e[l]?e[l].split(/\s*\|\s*/g):e[l].slice(0),_[l]=i);for(l in _)_.hasOwnProperty(l)&&(i=_[l]).forEach(v,{maxTokenLength:1});for(l in _)_.hasOwnProperty(l)&&(i=_[l]).forEach(v,{maxTokenLength:1/0});for(l in e)e.hasOwnProperty(l)&&(g(l),r[l]=new Nonterminal(l));for(l in _)_.hasOwnProperty(l)&&(i=_[l]).forEach(S);var E=[],k={};if(each(p,function(e,t){r[t]||"$eof"===t||(E.push(t),k[e]=t)}),this.hasErrorRecovery=m,!this.hasErrorRecovery){var w=function(e,t){u.options[e]&&(u.options[e]=!1,u.warn("The grammar does not have any error recovery rules, so using the "+t+" is rather useless."))};w("parserErrorsAreRecoverable","parser-errors-are-recoverable feature/option"),w("lexerErrorsAreRecoverable","lexer-errors-are-recoverable feature/option"),w("parseActionsUseYYRECOVERING","YYRECOVERING macro/API in grammar rules' action code"),w("parseActionsUseYYERROK","yyerrok() function/API in grammar rules' action code"),w("parseActionsUseYYCLEARIN","yyclearin() function/API in grammar rules' action code")}function x(e){var t=(e=e.trim()).indexOf("'"),r=e.indexOf('"');if(t<0&&r<0)return e.split(" ");for(var o=[];t>=0||r>=0;){var n=t,s="'";n<0?(assert(r>=0),n=r,s='"'):n>=0&&r>=0&&r<n&&(n=r,s='"');var a=e.substr(0,n).trim();a.length>0&&o.push.apply(o,a.split(" "));var i=(e=e.substr(n+1)).indexOf("\\");for(n=e.indexOf(s),a="";i>=0&&i<n;)a+=e.substr(0,i+2),i=(e=e.substr(i+2)).indexOf("\\"),n=e.indexOf(s);if(n<0)throw Error("internal error parsing literal token(s) in grammar rule");a+=e.substr(0,n);var l=(e=e.substr(n+1)).match(new XRegExp(`^\\[${ID_REGEX_BASE}\\]`));l&&(a+=l[0],e=e.substr(l[0].length)),o.push(a),t=(e=e.trim()).indexOf("'"),r=e.indexOf('"')}return e.length>0&&o.push.apply(o,e.split(" ")),o}function S(o){var s,a,i,c,f=[],d=null;if(o.constructor===Array){for(i=0,a="string"==typeof o[0]?x(o[0]):o[0].slice(0);i<a.length;i++)(y=a[i].match(new XRegExp(`\\[${ID_REGEX_BASE}\\]$`)))?(a[i]=a[i].substr(0,a[i].length-y[0].length),y=y[0].substr(1,y[0].length-2),f[i]=y):f[i]=a[i],"error"===a[i]&&(m=!0),assert(!e[a[i]]||p[a[i]],"all nonterminals must already exist in the symbol table"),assert(!a[i]||p[a[i]],"all symbols (terminals and nonterminals) must already exist in the symbol table");assert(3!==o.length||"string"==typeof o[1]),"string"==typeof o[1]?(d=o[1],o[2]&&n[o[2].prec]&&(c={symbol:o[2].prec,spec:n[o[2].prec]})):n[o[1].prec]&&(c={symbol:o[1].prec,spec:n[o[1].prec]})}else for(i=0,a=x(o=o.replace(new XRegExp(`\\[${ID_REGEX_BASE}\\]`,"g"),""));i<a.length;i++)"error"===a[i]&&(m=!0),assert(!e[a[i]]||p[a[i]],"all nonterminals must already exist in the symbol table"),assert(!a[i]||p[a[i]],"all symbols (terminals and nonterminals) must already exist in the symbol table");if(assert(0===(s=new Production(l,a,t.length+1,f,d)).precedence),c)s.precedence=c.spec.precedence;else{var y,b,g=[];for(i=s.handle.length-1;i>=0;i--)if(!(s.handle[i]in r)&&s.handle[i]in n){var v=s.precedence,_=n[s.handle[i]].precedence;0!==v&&v!==_?(g.push(s.handle[i]),_<v?b=s.handle[i]:_=v):0===v&&(g.push(s.handle[i]),b=s.handle[i]),s.precedence=_}g.length>1&&(u.DEBUG||1)&&u.warn('Ambiguous rule precedence in grammar: picking the (highest) precedence from operator "'+b+'" for rule "'+l+": "+s.handle.join(" ")+'" which contains multiple operators with different precedences: {'+g.join(", ")+"}")}t.push(s),h.push([p[s.symbol],""===s.handle[0]?0:s.handle.length]),r[l].productions.push(s)}this.terminals=E,this.terminals_=k,this.symbols_=p,this.symbolIds=o,this.descriptions_=f,this.productions_=h,assert(this.productions===t)},generator.buildProductionActions=function(){var e=this.productions;this.nonterminals,this.symbols,this.operators;var t=this,r=preprocessActionCode(this.moduleInclude).replace(/#([^#\s\r\n]+)#/g,function(e,t){return k(t)}),o=this.moduleInit.map(function(e){return assert(e.qualifier),assert("string"==typeof e.include),{qualifier:e.qualifier,include:preprocessActionCode(e.include).replace(/#([^#\s\r\n]+)#/g,function(e,t){return k(t)})}});assert(Array.isArray(o));var n=0,s="n",a="y";for(this.performAction=null;a!==s;){var i,l=preprocessActionCode(this.actionInclude||""),c=[`
          /* this == yyval */

          // the JS engine itself can go and remove these statements when \`yy\` turns out to be unused in any action code!
          var yy = this.yy;
          var yyparser = yy.parser;
          var yylexer = yy.lexer;

          ${l}

          switch (yystate) {`],u={},h={},p=[];for(var f in e.forEach(x),u)c.push([].concat.apply([],u[f]).join("\n")+"\n\n"+h[f]+"\n    break;\n");if(this.hasErrorRecovery){var d="";c.push(`case YY_ERROR_RECOVERY_COMBINE_ID:       // === NO_ACTION[1] :: ensures that anyone (but us) using this new state will fail dramatically!
                // error recovery reduction action (action generated by jison,
                // using the user-specified \`%code error_recovery_reduction\` %{...%}
                // code chunk below.

                ${d}
                break;
            `)}for(var y=[],m=0,b=p.length;m<b;m++)p[m]||y.push(m);y.length&&(console.warn("WARNING: missing actions for states: ",y),c.push(`default:
                // default action for all unlisted resolve states: ${y.join(", ")}

                // When we hit this entry, it's always a non-recoverable issue as this is a severe internal parser state failure:
                function __b0rk_on_internal_failure(str) {
                    var hash = yyparser.constructParseErrorInfo(str, null, null, false);

                    return yyparser.parseError(str, hash, yyparser.JisonParserError);
                }

                return __b0rk_on_internal_failure("internal parser failure: resolving unlisted state: " + yystate);`)),c.push("}");var g="yytext, yyleng, yylineno, yyloc, yystate /* action[1] */, yysp, yyrulelength, yyvstack, yylstack, yystack, yysstack";switch(this.performAction=[].concat("function parser__PerformAction("+g+") {",c,"}").join("\n").replace(/\bYYABORT\b/g,"return false").replace(/\bYYACCEPT\b/g,"return true").replace(/#([^#\s\r\n]+)#/g,function(e,t){return k(t)}),this.performAction=this.performAction.replace(/\byyerror\b/g,"yyparser.yyError").replace(/\bYYRECOVERING\b(?:\s*\(\s*\))?/g,"yyparser.yyRecovering()").replace(/\byyerrok\b(?:\s*\(\s*\))?/g,"yyparser.yyErrOk()").replace(/\byyclearin\b(?:\s*\(\s*\))?/g,"yyparser.yyClearIn()"),this.actionsUseYYLENG=this.actionsUseYYLENG||analyzeFeatureUsage(this.performAction,/\byyleng\b/g,1),this.actionsUseYYLINENO=this.actionsUseYYLINENO||analyzeFeatureUsage(this.performAction,/\byylineno\b/g,1),this.actionsUseYYTEXT=this.actionsUseYYTEXT||analyzeFeatureUsage(this.performAction,/\byytext\b/g,1),this.actionsUseYYLOC=this.actionsUseYYLOC||analyzeFeatureUsage(this.performAction,/\byyloc\b/g,1),this.actionsUseParseError=this.actionsUseParseError||analyzeFeatureUsage(this.performAction,/\.parseError\b/g,0),this.actionsUseYYERROR=this.actionsUseYYERROR||analyzeFeatureUsage(this.performAction,/\.yyError\b/g,0),this.actionsUseYYRECOVERING=this.actionsUseYYRECOVERING||analyzeFeatureUsage(this.performAction,/\.yyRecovering\b/g,0),this.actionsUseYYERROK=this.actionsUseYYERROK||analyzeFeatureUsage(this.performAction,/\.yyErrOk\b/g,0),this.actionsUseYYCLEARIN=this.actionsUseYYCLEARIN||analyzeFeatureUsage(this.performAction,/\.yyClearIn\b/g,0),this.actionsUseValueTracking=this.actionsUseValueTracking||analyzeFeatureUsage(this.performAction,/\byyvstack\b/g,1),this.actionsUseValueAssignment=this.actionsUseValueAssignment||analyzeFeatureUsage(this.performAction,/\bthis\.\$[^\w]/g,0),this.actionsUseLocationTracking=this.actionsUseLocationTracking||analyzeFeatureUsage(this.performAction,/\byylstack\b/g,1),this.actionsUseLocationAssignment=this.actionsUseLocationAssignment||analyzeFeatureUsage(this.performAction,/\bthis\._\$[^\w]/g,0),this.actionsUseYYSTACK=this.actionsUseYYSTACK||analyzeFeatureUsage(this.performAction,/\byystack\b/g,1),this.actionsUseYYSSTACK=this.actionsUseYYSSTACK||analyzeFeatureUsage(this.performAction,/\byysstack\b/g,1),this.actionsUseYYSTACKPOINTER=this.actionsUseYYSTACKPOINTER||analyzeFeatureUsage(this.performAction,/\byysp\b/g,1),this.actionsUseYYRULELENGTH=this.actionsUseYYRULELENGTH||analyzeFeatureUsage(this.performAction,/\byyrulelength\b/g,1),this.actionsUseYYMERGELOCATIONINFO=this.actionsUseYYMERGELOCATIONINFO||analyzeFeatureUsage(this.performAction,/\.yyMergeLocationInfo\b/g,1),this.actionsUseParseError=this.actionsUseParseError||analyzeFeatureUsage(r,/\.parseError\b/g,0),this.actionsUseYYERROR=this.actionsUseYYERROR||analyzeFeatureUsage(r,/\.yyError\b/g,0),this.actionsUseYYRECOVERING=this.actionsUseYYRECOVERING||analyzeFeatureUsage(r,/\.yyRecovering\b/g,0),this.actionsUseYYERROK=this.actionsUseYYERROK||analyzeFeatureUsage(r,/\.yyErrOk\b/g,0),this.actionsUseYYCLEARIN=this.actionsUseYYCLEARIN||analyzeFeatureUsage(r,/\.yyClearIn\b/g,0),this.actionsUseValueTracking=this.actionsUseValueTracking||analyzeFeatureUsage(r,/\byyvstack\b/g,0),this.actionsUseValueTracking=this.actionsUseValueTracking||analyzeFeatureUsage(r,/\.value_stack\b/g,0),this.actionsUseLocationTracking=this.actionsUseLocationTracking||analyzeFeatureUsage(r,/\byylstack\b/g,0),this.actionsUseLocationTracking=this.actionsUseLocationTracking||analyzeFeatureUsage(r,/\.location_stack\b/g,0),this.actionsUseYYSTACK=this.actionsUseYYSTACK||analyzeFeatureUsage(r,/\byystack\b/g,0),this.actionsUseYYSTACK=this.actionsUseYYSTACK||analyzeFeatureUsage(r,/\.symbol_stack\b/g,0),this.actionsUseYYSSTACK=this.actionsUseYYSSTACK||analyzeFeatureUsage(r,/\byysstack\b/g,0),this.actionsUseYYSSTACK=this.actionsUseYYSSTACK||analyzeFeatureUsage(r,/\.state_stack\b/g,0),this.actionsUseYYSTACKPOINTER=this.actionsUseYYSTACKPOINTER||analyzeFeatureUsage(r,/\byysp\b/g,0),this.actionsUseYYSTACKPOINTER=this.actionsUseYYSTACKPOINTER||analyzeFeatureUsage(r,/\.stack_pointer\b/g,0),this.actionsUseYYMERGELOCATIONINFO=this.actionsUseYYMERGELOCATIONINFO||analyzeFeatureUsage(r,/\.yyMergeLocationInfo\b/g,0),o.forEach(function(e){assert(e.qualifier),assert("string"==typeof e.include);var r=e.include;t.actionsUseParseError=t.actionsUseParseError||analyzeFeatureUsage(r,/\.parseError\b/g,0),t.actionsUseYYERROR=t.actionsUseYYERROR||analyzeFeatureUsage(r,/\.yyError\b/g,0),t.actionsUseYYRECOVERING=t.actionsUseYYRECOVERING||analyzeFeatureUsage(r,/\.yyRecovering\b/g,0),t.actionsUseYYERROK=t.actionsUseYYERROK||analyzeFeatureUsage(r,/\.yyErrOk\b/g,0),t.actionsUseYYCLEARIN=t.actionsUseYYCLEARIN||analyzeFeatureUsage(r,/\.yyClearIn\b/g,0),t.actionsUseValueTracking=t.actionsUseValueTracking||analyzeFeatureUsage(r,/\byyvstack\b/g,0),t.actionsUseValueTracking=t.actionsUseValueTracking||analyzeFeatureUsage(r,/\.value_stack\b/g,0),t.actionsUseLocationTracking=t.actionsUseLocationTracking||analyzeFeatureUsage(r,/\byylstack\b/g,0),t.actionsUseLocationTracking=t.actionsUseLocationTracking||analyzeFeatureUsage(r,/\.location_stack\b/g,0),t.actionsUseYYSTACK=t.actionsUseYYSTACK||analyzeFeatureUsage(r,/\byystack\b/g,0),t.actionsUseYYSTACK=t.actionsUseYYSTACK||analyzeFeatureUsage(r,/\.symbol_stack\b/g,0),t.actionsUseYYSSTACK=t.actionsUseYYSSTACK||analyzeFeatureUsage(r,/\byysstack\b/g,0),t.actionsUseYYSSTACK=t.actionsUseYYSSTACK||analyzeFeatureUsage(r,/\.state_stack\b/g,0),t.actionsUseYYSTACKPOINTER=t.actionsUseYYSTACKPOINTER||analyzeFeatureUsage(r,/\byysp\b/g,0),t.actionsUseYYSTACKPOINTER=t.actionsUseYYSTACKPOINTER||analyzeFeatureUsage(r,/\.stack_pointer\b/g,0),t.actionsUseYYMERGELOCATIONINFO=t.actionsUseYYMERGELOCATIONINFO||analyzeFeatureUsage(r,/\.yyMergeLocationInfo\b/g,0)}),this.actionsUseLocationAssignment=this.actionsUseLocationAssignment||this.options.actionsUseLocationAssignment,this.actionsUseLocationTracking=this.actionsUseLocationTracking||this.options.actionsUseLocationTracking,this.actionsUseParseError=this.actionsUseParseError||this.options.actionsUseParseError,this.actionsUseValueAssignment=this.actionsUseValueAssignment||this.options.actionsUseValueAssignment,this.actionsUseValueTracking=this.actionsUseValueTracking||this.options.actionsUseValueTracking,this.actionsUseYYCLEARIN=this.actionsUseYYCLEARIN||this.options.actionsUseYYCLEARIN,this.actionsUseYYERROK=this.actionsUseYYERROK||this.options.actionsUseYYERROK,this.actionsUseYYERROR=this.actionsUseYYERROR||this.options.actionsUseYYERROR,this.actionsUseYYLENG=this.actionsUseYYLENG||this.options.actionsUseYYLENG,this.actionsUseYYLINENO=this.actionsUseYYLINENO||this.options.actionsUseYYLINENO,this.actionsUseYYLOC=this.actionsUseYYLOC||this.options.actionsUseYYLOC,this.actionsUseYYRECOVERING=this.actionsUseYYRECOVERING||this.options.actionsUseYYRECOVERING,this.actionsUseYYRULELENGTH=this.actionsUseYYRULELENGTH||this.options.actionsUseYYRULELENGTH,this.actionsUseYYMERGELOCATIONINFO=this.actionsUseYYMERGELOCATIONINFO||this.options.actionsUseYYMERGELOCATIONINFO,this.actionsUseYYSSTACK=this.actionsUseYYSSTACK||this.options.actionsUseYYSSTACK,this.actionsUseYYSTACK=this.actionsUseYYSTACK||this.options.actionsUseYYSTACK,this.actionsUseYYSTACKPOINTER=this.actionsUseYYSTACKPOINTER||this.options.actionsUseYYSTACKPOINTER,this.actionsUseYYTEXT=this.actionsUseYYTEXT||this.options.actionsUseYYTEXT,this.hasErrorRecovery=this.hasErrorRecovery||this.options.hasErrorRecovery,this.hasErrorReporting=this.hasErrorReporting||this.options.hasErrorReporting,t.options.defaultActionMode[0]){default:this.actionsUseValueTracking=!0,this.actionsUseValueAssignment=!0;case"none":case"skip":}this.actionsUseValueTracking=this.actionsUseValueTracking||this.actionsUseYYLENG||this.actionsUseYYTEXT||this.actionsUseValueAssignment,t.options.defaultActionMode[1],this.actionsUseLocationTracking=this.actionsUseLocationTracking||this.actionsUseYYLINENO||this.actionsUseYYLOC||this.actionsUseLocationAssignment||this.actionsUseYYMERGELOCATIONINFO,this.hasErrorReporting=this.hasErrorReporting||this.actionsUseParseError||this.actionsUseYYERROR,this.performAction=postprocessActionCode(this.performAction),this.actionsAreAllDefault=!1,n++,s=a,a=null;var v=mkParserFeatureHash(this);this.DEBUG&&Jison.print("Optimization analysis:\n",{cycle:n,SAME:s===v,actionsAreAllDefault:this.actionsAreAllDefault,actionsUseYYLENG:this.actionsUseYYLENG,actionsUseYYLINENO:this.actionsUseYYLINENO,actionsUseYYTEXT:this.actionsUseYYTEXT,actionsUseYYLOC:this.actionsUseYYLOC,actionsUseParseError:this.actionsUseParseError,actionsUseYYERROR:this.actionsUseYYERROR,actionsUseYYRECOVERING:this.actionsUseYYRECOVERING,actionsUseYYERROK:this.actionsUseYYERROK,actionsUseYYCLEARIN:this.actionsUseYYCLEARIN,actionsUseValueTracking:this.actionsUseValueTracking,actionsUseValueAssignment:this.actionsUseValueAssignment,actionsUseLocationTracking:this.actionsUseLocationTracking,actionsUseLocationAssignment:this.actionsUseLocationAssignment,actionsUseYYSTACK:this.actionsUseYYSTACK,actionsUseYYSSTACK:this.actionsUseYYSSTACK,actionsUseYYSTACKPOINTER:this.actionsUseYYSTACKPOINTER,actionsUseYYRULELENGTH:this.actionsUseYYRULELENGTH,actionsUseYYMERGELOCATIONINFO:this.actionsUseYYMERGELOCATIONINFO,hasErrorRecovery:this.hasErrorRecovery,hasErrorReporting:this.hasErrorReporting,defaultActionMode:this.options.defaultActionMode,testCompileActionCode:this.options.testCompileActionCode,noTryCatch:this.options.noTryCatch}),a=v}function _(e){return Array.isArray(e)&&(e=e.map(function(e){return""===e||null==e?"ε":e}).join(" ")),""===e&&(e="ε"),e=e.replace(/\*\//g,"*\\/")}function E(e){if(e&&!t.symbols_[e])throw Error('Your action code is trying to reference non-existing symbol "'+e+'"');return t.symbols_[e]||0}function k(e){return" /* "+_(String(e))+" */ "+E(e)}function w(e,t,r){var o=parseInt(e,10);if(o>0){if(o>t)throw Error(`invalid token reference "$${o}" in action code for rule: "${r}"`);return(o=t-o)?` - ${o}`:""}if(o<0)return` - ${t-o}`;if(0!==o)throw Error(`invalid token reference "$${o}" in action code for rule: "${r}"`);return(o=t)?` - ${o}`:""}function x(e){var r,o,n=e.aliases,s=e.handle,a=new XRegExp(`^${ID_REGEX_BASE}$`),l=["case ",e.id,":","\n    /*! Production::    ",_(e.symbol)," : "].concat(_(s.map(function(e){return!e||t.nonterminals[e]||a.test(e)||e===t.EOF?(e||(e="%epsilon"),e):'"'+e.replace(/["]/g,'\\"')+'"'}))," */").join(""),c=preprocessActionCode(e.action||""),f=e.symbol+": "+s.join(" ");if(assert("number"==typeof e.id),assert(e.id>=0),p[e.id]=!0,(c=c.replace(/#([^#\s\r\n]+)#/g,function(e,t){return k(t)})).match(new XRegExp(`(?:[$@#]|##)${ID_REGEX_BASE}`))){var d={},y={},m={},b=function(e){var t=m[e.replace(/[0-9]+$/,"")];y[e]?d[e]++:(y[e]=r+1,d[e]=1),t||(y[e+d[e]]=r+1,d[e+d[e]]=1)},g=function(e){/[0-9]$/.test(e)&&(m[e=e.replace(/[0-9]+$/,"")]=!0)};for(r=0;r<s.length;r++)g(o=n[r]),o!==s[r]&&g(s[r]);for(r=0;r<s.length;r++)b(o=n[r]),o!==s[r]&&b(s[r]);c=c.replace(new XRegExp(`([$@#]|##)(${ID_REGEX_BASE})`,"g"),function(t,r,o){if(y[o]&&1!==d[o])throw Error(`The action block references the ambiguous named alias or term reference "${o}" which is mentioned ${d[o]} times in production "${e.handle}", implicit and explicit aliases included.
You should either provide unambiguous = uniquely named aliases for these terms or use numeric index references (e.g. \`$3\`) as a stop-gap in your action code.`);return y[o]?r+y[o]:t})}var v=analyzeFeatureUsage(c=c.replace(/\$\$/g,"this.$").replace(/@\$/g,"this._$").replace(/#\$/g,function(e){return k(i)}).replace(/\$(-?\d+)\b/g,function(e,t){return"yyvstack[yysp"+w(t,s.length,f)+"]"}).replace(/@(-?\d+)\b/g,function(e,t){return"yylstack[yysp"+w(t,s.length,f)+"]"}).replace(/##(-?\d+)\b/g,function(e,t){return"(yysp"+w(t,s.length,f)+")"}).replace(/##\$/g,function(e){return"yysp"}).replace(/#(-?\d+)\b/g,function(e,t){var r=parseInt(t,10)-1;if(!s[r])throw Error(`invalid token location reference in action code for rule: "${f}" - location reference: "${e}"`);return k(s[r])}),/\bthis\.\$[^\w]/g,0);function E(e,t,r){var o=e,n=e.match(t);return n&&(assert(null!=n[1]),o=n[1]),!!(n=o.match(r))}var x=v&&E(c,/^([^]*?)\bthis\.\$\s*=[^=>]/,/\bthis\.\$[^\w]/g),S=!1,R=!1;t.actionsUseLocationTracking&&(R=(S=analyzeFeatureUsage(c,/\bthis\._\$[^\w]/g,0))&&E(c,/^([^]*?)\bthis\._\$\s*=[^=>]/,/\bthis\._\$[^\w]/g));var A=x||t.actionsUseValueTracking&&!v,O=R||t.actionsUseLocationTracking&&!S,T=[],Y=A?t.options.defaultActionMode[0]:"skip",N=O?t.options.defaultActionMode[1]:"skip",s=e.handle.slice(0),I=s.length;if(s.length)switch(s[s.length-1]){case"$end":case"":s.length--}switch(s.length){case 0:switch(Y){case"classic":case"ast":case"none":T.push("this.$ = undefined;");break;case"skip":break;default:throw Error(`unsupported defaultAction value mode: "${Y}"`)}switch(N){case"classic":case"ast":case"merge":T.push("this._$ = yyparser.yyMergeLocationInfo(null, null, null, null, true);");break;case"none":T.push("this._$ = undefined;");break;case"skip":break;default:throw Error(`unsupported defaultAction location mode: "${N}"`)}break;case 1:switch(Y){case"classic":T.push("this.$ = yyvstack[yysp"+w(1,I,f)+"];");break;case"ast":T.push("this.$ = [yyvstack[yysp"+w(1,I,f)+"]];");break;case"none":T.push("this.$ = undefined;");break;case"skip":break;default:throw Error(`unsupported defaultAction value mode: "${Y}"`)}switch(N){case"classic":case"ast":case"merge":T.push("this._$ = yylstack[yysp"+w(1,I,f)+"];");break;case"none":T.push("this._$ = undefined;");break;case"skip":break;default:throw Error(`unsupported defaultAction location mode: "${N}"`)}break;default:switch(Y){case"classic":T.push("this.$ = yyvstack[yysp"+w(1,I,f)+"];");break;case"ast":var C=1-I+s.length;T.push("this.$ = yyvstack.slice(yysp"+w(1,I,f)+", yysp"+(0===C?"":" + "+C)+");");break;case"none":T.push("this.$ = undefined;");break;case"skip":break;default:throw Error(`unsupported defaultAction value mode: "${Y}"`)}switch(N){case"classic":case"ast":case"merge":T.push("this._$ = yyparser.yyMergeLocationInfo(yysp"+w(1,I,f)+", yysp);");break;case"none":T.push("this._$ = undefined;");break;case"skip":break;default:throw Error(`unsupported defaultAction location mode: "${N}"`)}}if(T.length>0){var U=[s.length,t.actionsUseValueTracking?"VT":"-",t.actionsUseValueAssignment?"VA":"-",v?"VU":"-",x?"VUbA":"-",t.actionsUseLocationTracking?"LT":"-",t.actionsUseLocationAssignment?"LA":"-",S?"LU":"-",R?"LUbA":"-"].join(",");T.unshift(`// default action (generated by JISON mode ${t.options.defaultActionMode[0]}/${t.options.defaultActionMode[1]} :: ${U}):`),T.push(`// END of default action (generated by JISON mode ${t.options.defaultActionMode[0]}/${t.options.defaultActionMode[1]} :: ${U})`),""!==c.trim()&&T.push("\n",c),c=T.join("\n")}var L=mkHashIndex(c=reindentCodeBlock(c,4));L in u?u[L].push(l):(u[L]=[l],h[L]=c)}this.moduleInclude=postprocessActionCode(r),this.moduleInit=o.map(function(e){return assert(e.qualifier),assert("string"==typeof e.include),e.include=postprocessActionCode(e.include),e}),assert(Array.isArray(this.moduleInit)),(o=this.moduleInit).__consumedInitCodeSlots__=[],o.getInitCodeSection=function(e){for(var t=[],r=0,o=this.length;r<o;r++){var n=this[r];n.qualifier===e&&(n.include.trim()&&t.push(n.include),this.__consumedInitCodeSlots__[r]=!0)}return t},o.getRemainingInitCodeSections=function(){for(var e=[],t=0,r=this.length;t<r;t++){var o=this[t];this.__consumedInitCodeSlots__[t]||(e.push(rmCommonWS$1`

                    // START code section "${o.qualifier}"
                    ${o.include}
                    // END code section "${o.qualifier}"

                `),this.__consumedInitCodeSlots__[t]=!0)}return e}},generator.createParser=function(){throw Error("Calling abstract method.")},generator.createLexer=function(){throw Error("Calling abstract method.")},generator.trace=Function("","function no_op_trace() { }\nreturn no_op_trace;")(),generator.warn=function(){var e=Array.prototype.slice.call(arguments,0);Jison.print.call(null,e.join(""))},generator.error=function(e){throw Error(e)},generator.reportGrammarInformation=function(){if(this.unused_productions.length&&this.warn("\nUnused productions in your grammar:\n  "+this.unused_productions.join("\n  ")+"\n\n"),this.options.reportStats){var e,t,r,o=0,n=0,s={};for(e=0,r=this.table.length;e<r;e++)for(t in o++,this.table[e])!s[t]&&(s[t]=!0,n++);var a=0,i={};for(t in this.defaultActions)!i[t]&&(i[t]=!0,a++);var l=0;for(var c in this.nonterminals)l++;this.warn("Number of productions in parser:........ "+this.productions_.length),this.warn("Number of non-terminals in grammar:..... "+l),this.warn("Number of states:....................... "+this.states.size()),this.warn("Number of rows (states) in table:....... "+this.table.length),this.warn("Number of rows in table:................ "+o),this.warn("Number of columns in table:............. "+n),this.warn("Number of defaulted rows in table:...... "+a),this.warn("Number of unresolvable conflicts:....... "+this.conflicts),this.warn("\n")}};let debugTraceSrc=`
function debug_trace() {
    if (typeof Jison !== 'undefined' && Jison.print) {
        Jison.print.apply(null, arguments);
    } else if (typeof print !== 'undefined') {
        print.apply(null, arguments);
    } else if (typeof console !== 'undefined' && console.log) {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift('');           // prevent \`%.\` printf-style expansions; see https://nodejs.org/api/console.html#console_console_log_data_args
        console.log.apply(null, args);
    }
}
`;var generatorDebug={trace:Function("",debugTraceSrc+`
        return debug_trace;`)(),beforeprocessGrammar:function(){this.trace("Processing grammar.")},afteraugmentGrammar:function(){var e=this.trace;e("\nSymbols:\n"),each(this.symbols,function(t,r){e(t+"("+r+")")}),e("\n")}},lookaheadMixin={};lookaheadMixin.computeLookaheads=function(){this.DEBUG&&this.mix(lookaheadDebug),this.computeLookaheads=function(){},this.nullableSets(),this.firstSets(),this.followSets()},lookaheadMixin.displayFollowSets=function(){var e=this,t={};for(var r in this.productions.forEach(function(r,o){var n="prod-"+o+":  "+r.symbol+" := "+r.handle.join(" "),s="["+e.nonterminals[r.symbol].follows.join("]  [")+"]";t[s]||(t[s]={}),t[s][n]?(assert(0),t[s][n]++):t[s][n]=1}),t){var o=[];for(var n in t[r])o.push(n);e.trace("Symbol/Follows:\n   ",o.join("\n    ")," --\x3e\n        ",r)}},lookaheadMixin.followSets=function(){for(var e=this.productions,t=this.nonterminals,r=this,o=!0;o;)o=!1,e.forEach(function(e,n){for(var s,a,i=!!r.go_,l=0;a=e.handle[l];++l)if(t[a]){i&&(s=r.go_(e.symbol,e.handle.slice(0,l)));var c,u=!i||s===r.nterms_[a];if(l===e.handle.length-1&&u)c=t[e.symbol].follows;else{var h=e.handle.slice(l+1);c=r.first(h),r.nullable(h)&&u&&(assert(t[e.symbol].follows),c.push.apply(c,t[e.symbol].follows))}var p=t[a].follows,f=p.length;p=union(p,c),f!==p.length&&(o=!0),t[a].follows=p}});this.DEBUG&&this.displayFollowSets()},lookaheadMixin.first=function(e){if(""===e)return[];if(e instanceof Array){for(var t,r=[],o=0;(t=e[o])&&(this.nonterminals[t]?r=union(r,this.nonterminals[t].first):-1===r.indexOf(t)&&r.push(t),this.nullable(t));++o);return r}return this.nonterminals[e]?this.nonterminals[e].first:[e]},lookaheadMixin.firstSets=function(){for(var e,t,r=this.productions,o=this.nonterminals,n=this,s=!0;s;)for(e in s=!1,r.forEach(function(e,t){var r=n.first(e.handle);r.length!==e.first.length&&(e.first=r,s=!0)}),o)t=[],o[e].productions.forEach(function(e){t=union(t,e.first)}),t.length!==o[e].first.length&&(o[e].first=t,s=!0)},lookaheadMixin.nullableSets=function(){for(var e=this.nonterminals,t=this,r=!0;r;)for(var o in r=!1,this.productions.forEach(function(e,o){if(!e.nullable){for(var n,s=0,a=0;n=e.handle[s];++s)t.nullable(n)&&a++;a===s&&(e.nullable=r=!0)}}),e)if(!this.nullable(o))for(var n,s=0;n=e[o].productions.item(s);s++)n.nullable&&(e[o].nullable=r=!0)},lookaheadMixin.nullable=function(e){if(""===e)return!0;if(e instanceof Array){for(var t,r=0;t=e[r];++r)if(!this.nullable(t))return!1;return!0}return!!this.nonterminals[e]&&this.nonterminals[e].nullable};var lookaheadDebug={beforenullableSets:function(){this.trace("Computing Nullable sets.")},beforefirstSets:function(){this.trace("Computing First sets.")},beforefollowSets:function(){this.trace("Computing Follow sets.")},afterfollowSets:function(){var e=this.trace;e("\nNonterminals:\n"),each(this.nonterminals,function(t,r){e(t.toString(),"\n")}),e("\n")}},lrGeneratorMixin={};let NONASSOC=0,SHIFT=1,REDUCE=2,ACCEPT=3;function findDefaults(e,t){var r={};return e.forEach(function(e,o){var n,s,a,i=0,l={};for(s in e){if(assert(({}).hasOwnProperty.call(e,s)),2===s)return;if("number"!=typeof(a=e[s])){if(a[0]!==REDUCE)return;var c=a[1];l[c]||(l[c]=!0,i++,n=s)}else if(a===NONASSOC)return}if(1===i&&(r[o]=e[n][1],!t))for(s in e)"number"!=typeof(a=e[s])&&delete e[s]}),r}function cleanupTable(e){e.forEach(function(e,t){var r;for(r in e)e[r]===NONASSOC&&delete e[r]})}function resolveConflict(e,t,r,o){var n={production:e,operator:t,r:r,s:o,msg:null,action:null,bydefault:!1};return o[0]===REDUCE?(n.msg="Resolved R/R conflict: use first production declared in grammar.",n.action=o[1]<r[1]?o:r,o[1]!==r[1]&&(n.bydefault=!0)):0!==e.precedence&&t?e.precedence<t.precedence?(n.msg="Resolved S/R conflict: shift for higher precedent operator.",n.action=o):e.precedence===t.precedence?"right"===t.assoc?(n.msg="Resolved S/R conflict: shift for right associative operator.",n.action=o):"left"===t.assoc?(n.msg="Resolved S/R conflict: reduce for left associative operator.",n.action=r):"nonassoc"===t.assoc&&(n.msg="Resolved S/R conflict: no action for non-associative operator.",n.action=NONASSOC):(n.msg="Resolved conflict: reduce for higher precedent production.",n.action=r):(n.msg="Resolved S/R conflict: shift by default.",n.bydefault=!0,n.action=o),n}lrGeneratorMixin.buildTable=function(){this.DEBUG&&this.mix(lrGeneratorDebug),this.states=this.canonicalCollection(),this.DEBUG&&(Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER canonicalCollection:"),this.displayFollowSets(),Jison.print("\n")),this.table=this.parseTable(this.states),this.DEBUG&&(Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER parseTable:"),this.displayFollowSets(),Jison.print("\n")),this.defaultActions=findDefaults(this.table,this.hasErrorRecovery),cleanupTable(this.table),traceStates(this.trace,this.states,"at the end of LR::buildTable(), after cleanupTable()")},lrGeneratorMixin.Item=typal.construct({constructor:function(e,t,r,o){this.production=e,this.dotPosition=t||0,this.follows=r||[],this.predecessor=o,this.id=e.id+"#"+this.dotPosition,this.markedSymbol=this.production.handle[this.dotPosition]},remainingHandle:function(){return this.production.handle.slice(this.dotPosition+1)},eq:function(e){return e.id===this.id},handleToString:function(){var e=this.production.handle.slice(0);return e[this.dotPosition]="."+(e[this.dotPosition]||""),e.join(" ")},toString:function(){var e=this.production.handle.slice(0);e[this.dotPosition]="."+(e[this.dotPosition]||"");var t=this.production.symbol+" -> "+e.join(" "),r=Array(Math.max(4,40-t.length));return this.follows.length&&(t+=r.join(" ")+"#lookaheads= ["+this.follows.join("]  [")+"]",r=[,,]),this.reductions&&this.reductions.length&&(t+=r.join(" ")+"#reductions= ["+this.reductions.join("]  [")+"]",r=[,,]),t}}),lrGeneratorMixin.ItemSet=Set.prototype.construct({afterconstructor:function(){this.reductions=[],this.goes={},this.edges={},this.shifts=!1,this.inadequate=!1,this.hash_={};for(var e=this._items.length-1;e>=0;e--)this.hash_[this._items[e].id]=!0},concat:function(e){for(var t=e._items||e,r=t.length-1;r>=0;r--)this.hash_[t[r].id]=!0;return this._items.push.apply(this._items,t),this},push:function(e){return this.hash_[e.id]=!0,this._items.push(e)},contains:function(e){return this.hash_[e.id]},valueOf:function(){var e=this._items.map(function(e){return e.id}).sort().join("|");return this.valueOf=function(){return e},e}}),lrGeneratorMixin.closureOperation=function(e){var t,r=new this.ItemSet,o=this,n=e,s={};do t=new Set,r=r.concat(n),n.forEach(function(e){var n=e.markedSymbol;n&&o.nonterminals[n]?s[n]||(o.nonterminals[n].productions.forEach(function(e){var n=new o.Item(e,0);r.contains(n)||t.push(n)}),s[n]=!0):n?(r.shifts=!0,r.inadequate=r.reductions.length>0):(r.reductions.push(e),r.inadequate=r.reductions.length>1||r.shifts)}),n=t;while(!t.isEmpty());return r},lrGeneratorMixin.gotoOperation=function(e,t){var r=new this.ItemSet,o=this;return e.forEach(function(e,n){e.markedSymbol===t&&r.push(new o.Item(e.production,e.dotPosition+1,e.follows,n))}),r},lrGeneratorMixin.canonicalCollection=function(){var e,t,r=new this.Item(this.productions[0],0,[this.EOF]),o=new this.ItemSet(r),n=new Set(this.closureOperation(o)),s=0,a=this;for(n.has={},n.has[o.valueOf()]=0;s!==n.size();)e=n.item(s),t={},e.forEach(function(r){r.markedSymbol&&!t[r.markedSymbol]&&r.markedSymbol!==a.EOF&&(t[r.markedSymbol]=!0,a.canonicalCollectionInsert(r.markedSymbol,e,n,s))}),s++;return n},lrGeneratorMixin.canonicalCollectionInsert=function(e,t,r,o){var n=this.gotoOperation(t,e),s=r.has[n.valueOf()];void 0!==s?(t.edges[e]=s,r.item(s).predecessors[e].push(o)):n.isEmpty()||(r.has[n.valueOf()]=r.size(),(n=this.closureOperation(n)).predecessors||(n.predecessors={}),t.edges[e]=r.size(),r.push(n),n.predecessors[e]=[o])},lrGeneratorMixin.parseTable=function(e){var t=[],r=this.nonterminals,o=this.operators,n={},s=this;return e.forEach(function(e,a){var i,l,c=t[a*=1]={};for(l in e.edges)e.forEach(function(t,o){if(t.markedSymbol===l){var n=e.edges[l];assert(n),r[l]?c[s.symbols_[l]]=n:c[s.symbols_[l]]=[SHIFT,n]}});e.forEach(function(e,t){e.markedSymbol===s.EOF&&(c[s.symbols_[s.EOF]]=[ACCEPT])});var u=!s.lookAheads&&s.terminals;e.reductions.forEach(function(t,r){(u||s.lookAheads(e,t)).forEach(function(e){i=c[s.symbols_[e]];var r=o[e];if(i){var l=resolveConflict(t.production,r,[REDUCE,t.production.id],i[0]instanceof Array?i[0]:i);s.resolutions.push([a,e,l]),l.bydefault?(s.conflicts++,s.conflict_fixing_round&&s.options.hasPartialLrUpgradeOnConflict&&!s.conflict_productions_LU[t.production.id]&&(s.new_conflicts_found_this_round++,s.conflict_fixing_round=!1,s.enableDebugLogs&&s.warn("RESET conflict fixing: we need another round to see us through...")),!s.conflict_fixing_round&&s.options.hasPartialLrUpgradeOnConflict&&(s.conflict_productions_LU[t.production.id]=!0,s.conflict_states_LU[a]=!0),s.enableDebugLogs&&s.warn("Conflict in grammar: multiple actions possible when lookahead token is ",e," in state ",a,"\n- ",printAction(l.r,s),"\n- ",printAction(l.s,s),"\n  (",l.msg,")"),n[a]={reduction:t,symbol:e,resolution:l,state:a},s.options.noDefaultResolve&&(i[0]instanceof Array||(i=[i]),i.push(l.r))):i=l.action}else i=[REDUCE,t.production.id];i&&i.length?c[s.symbols_[e]]=i:i===NONASSOC&&(c[s.symbols_[e]]=NONASSOC)})})}),s.conflicting_states=n,s.conflicts>0&&(this.numExpectedConflictStates!==s.conflicts||s.enableDebugLogs)&&(s.warn("\nStates with conflicts:"),each(n,function(t,r){s.warn("\nState "+r,"    ("+t.symbol+" @ "+t.reduction.production.symbol+" -> "+t.reduction.handleToString()+")\n"),s.warn("  ",e.item(r).join("\n  "))}),s.warn("\n")),t};var generatorMixin={};function removeUnusedKernelFeatures(e,t){var r=t.performAction;return t.actionsAreAllDefault&&(r="",e=e.replace(/\s+r = this\.performAction\.call[^)]+\)\;/g,"").replace(/\s+if \(typeof r !== 'undefined'\) \{[^}]+\}/g,"")),t.actionsUseYYTEXT||(e=e.replace(/, yytext\b/g,"").replace(/^.*?\bvar yytext\b.*?$/gm,"").replace(/^.*[^.]\byytext = .+$/gm,"").replace(/^.+ = yytext\b.+$/gm,"")),t.actionsUseYYLENG||(r=r.replace(/, yyleng\b/g,""),e=e.replace(/, yyleng\b/g,"").replace(/^.*?\bvar yyleng\b.*?$/gm,"").replace(/\s+if\b.*?\.yyleng\b.*?\{[^}]+\}/g,"\n").replace(/^.*?\byyleng = .+$/gm,"").replace(/^.*?\byyleng\b.*?=.*?\byyleng\b.*?$/gm,"")),t.actionsUseYYLINENO||(r=r.replace(/, yylineno\b/g,""),e=e.replace(/\bvar yylineno\b.*?$/gm,"").replace(/, yylineno\b/g,"").replace(/^.*?\byylineno\b.*?=.*?\byylineno\b.*?$/gm,"")),t.actionsUseYYSTACK||(r=r.replace(/, yystack\b/g,""),e=e.replace(/, stack\b/g,"")),t.actionsUseYYSSTACK||(r=r.replace(/, yysstack\b/g,""),e=e.replace(/, sstack\b/g,"")),t.actionsUseYYRULELENGTH||(r=r.replace(/, yyrulelength\b/g,""),e=e.replace(/, yyrulelen\b/g,"")),t.actionsUseYYSTACKPOINTER||(r=r.replace(/, yysp\b/g,""),e=e.replace(/, sp - 1\b/g,"")),t.actionsUseYYMERGELOCATIONINFO||(e=e.replace(/\n.*?merge yylloc info into a new yylloc instance[^]*?\bthis\.yyMergeLocationInfo\b[^]*?\};[^]*?\n/g,Array(134).join("\n")).replace(/\n.*?\bthis\.yyMergeLocationInfo\b[^\n]+\n/g,"\n")),t.actionsUseLocationTracking||(r=r.replace(/\byyloc, (.*?), yylstack\b/g,"$1"),e=e.replace(/\byyloc, (.*?), lstack\b/g,"$1").replace(/\s+yyval\._\$\s*=\s*.+$/gm,"\n").replace(/^.*?\blstack\b.*$/gm,"").replace(/^.*?\byyloc\b.*?$/gm,"").replace(/^.*?\byylloc\b.*?$/gm,"").replace(/^\s*_\$:\s+undefined\s*$/gm,"").replace(/\s+function\s+copy_yylloc\b[^]*?return\s+rv[^}]+\}/g,"").replace(/^.*?\bcopy_yylloc\b.*?$/gm,"").replace(/^.*?\blocation_stack\b.*?$/gm,"")),!t.actionsUseValueTracking&&(r=r.replace(/, yyvstack\b/g,""),e=(e=(e=(e=e.replace(/, vstack\b/g,"")).replace(/\s+\/\/ Return the \`\$accept\` rule's \`\$\$\` result[\s\S]+?if \((?:sp\b.*?)?typeof vstack\[sp\] !== 'undefined'\)[^\}]+\}[^\n]*\n/g,"\n\n\n\n\n\n")).replace(/[^\n]+if \(errStr\) \{\s*\n.*?\.value_stack\b[^]*?\};[^]*?\} else \{\s*\n.*?\.value_stack\b[^]*?\};[^}]*\}[^\n]*\n/g,"\n\n\n\n\n\n\n\n\n\n\n\n").replace(/[^\n]+\.value_stack\b[^n]*\n/g,"\n")).replace(/^.*?\bvstack\b.*$/gm,""),t.actionsAreAllDefault&&(e=e.replace(/\s+var yyval =[\s\S]+?\};[^\n]*\n/g,"\n\n\n\n\n\n"))),t.DEBUG||(e=e.replace(/\s+var yydebug = [\s\S]+?self\.trace[\s\S]+?};[^}]+}/g,"\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n").replace(/\n\s+if\s+\(yydebug\)\s+yydebug\([^]+?['}]\);[^\r\n]*?/g,"\n\n\n\n\n\n\n\n\n").replace(/^.*?\byydebug\b[^;]+?\);[^\r\n]*?$/gm,"").replace(/\n\s+\/\/\s*disable\s*debugging.*?[\r\n]+\s+if\s+\(sharedState_yy\.yydebug[^]+?\}/g,"\n\n\n\n")),t.actionsUseYYERROK||t.actionsUseYYRECOVERING||t.actionsUseYYCLEARIN||t.actionsUseYYERROR||(e=e.replace(/\s+\/\/.*setup `yyError`, `YYRECOVERING`, `yyErrOk` and `yyClearIn` functions[^\0]+?\n\s+if \(/g,"\n\n\n\n\n  if (")),t.actionsUseYYERROR||(e=e.replace(/\s+if \(this\.yyError\) \{[^\0]+?\};\n\s+\}\n/g,"\n\n\n\n\n")),t.actionsUseYYRECOVERING||(e=e.replace(/\s+if \(this\.yyRecovering\) \{[^\0]+?\};\n\s+\}\n/g,"\n\n\n\n\n")),t.actionsUseYYERROK||(e=e.replace(/\s+if \(this\.yyErrOk\) \{[^\0]+?\};\n\s+\}\n/g,"\n\n\n\n\n")),t.actionsUseYYCLEARIN||(e=e.replace(/\s+if \(this\.yyClearIn\) \{[^\0]+?[^{]\};\n\s+\}\n/g,"\n\n\n\n\n\n")),t.options.noTryCatch&&(e=e.replace(/\s+try \{([\s\r\n]+this\.__reentrant_call_depth[\s\S]+?)\} catch \(ex\) \{[\s\S]+?\} finally \{([^]+?)\}\s+\/\/\s+\/finally/,function(e,t,r){return"\n"+(t=t.replace(/^        /mg,"    "))+"\n    // ... AND FINALLY ...\n"+(r=r.replace(/^        /mg,"    "))}).replace(/^[^\n]+\b__reentrant_call_depth\b[^\n]+$/gm,"\n")),t.actionsUseYYTEXT||(r=r.replace(/\(\byytext\b(,\s*)?/g,"(")),analyzeFeatureUsage(e,/\bshallowCopyErrorInfo\b/g,1)||(e=e.replace(/\n[^\n]*?clone some parts of the[^\n]*?errorInfo object[^]*?\bshallowCopyErrorInfo\b[^]*?return rv;[^}]*\};[^\n]*/g,"\n\n\n\n\n\n\n\n\n\n\n")),analyzeFeatureUsage(e,/\bshallow_copy\b/g,1)||(e=e.replace(/\n[^\n]*?shallow clone objects, straight copy[^]*?\bshallow_copy\b[^]*?return src;[^}]*\}[^\n]*/g,"\n\n\n\n\n\n")),t.performAction=r,e}function expandParseArguments(e,t){var r=t.parseParams;return e=r&&0!==r.length?(e=(e=e.replace(/, parseParams\b/g,", "+r.join(", "))).replace(/\bparseParams\b/g,r.join(", "))).replace(/,\s*[\r\n]+(\s*)parseParamsAsMembers:\s+parseParamsAsMembers\b/g,function(e,t){for(var o=",",n=0,s=0,a=r.length;s<a;s++){var i=r[s];n=Math.max(n,i.length)}for(var l=Array(n+1).join(" "),s=0,a=r.length;s<a;s++){var i=r[s];o+="\n"+t+i+": "+i+(s<a-1?","+l.substr(0,n-i.length-1):l.substr(0,n-i.length))+"  // parseParams::"+i}return o}):(e=(e=e.replace(/, parseParams\b/g,"")).replace(/\bparseParams\b/g,"")).replace(/,\s*[\r\n]+\s*parseParamsAsMembers:\s+parseParamsAsMembers\b/g,"")}function expandConstantsInGeneratedCode(e,t){return e=e.replace(/\bYY_ERROR_RECOVERY_COMBINE_ID\b/g,""+t.table.length).replace(/\nYY_REMAINING_INIT_CODE_SECTIONS_GO_HERE\n/g,t.moduleInit.getRemainingInitCodeSections().join("\n"))}function pickOneOfTwoCodeAlternatives(e,t,r,o,n){return e.replace(RegExp("("+r+"[^\\n]*\\n)([^\\0]*?)("+o+"[^\\n]*\\n)([^\\0]*?)("+n+"[^\\n]*\\n)","g"),function(e,r,o,n,s,a){return t?o:s})}function addOrRemoveTokenStack(e,t){var r=e;return(r=pickOneOfTwoCodeAlternatives(r,!t,"//_lexer_without_token_stack:","//_lexer_with_token_stack:","//_lexer_with_token_stack_end:"),t)?r.replace(/\btokenStackLex\b/g,"lex"):r.replace(/^.*?\btstack\b.*$/gm,"")}function pickErrorHandlingChunk(e,t){var r=e;return r=pickOneOfTwoCodeAlternatives(r,t,"//_handle_error_with_recovery:","//_handle_error_no_recovery:","//_handle_error_end_of_section:"),t||(r=r.replace(/^\s*var recovering.*$/gm,"").replace(/, recovering: recovering/g,"").replace(/^.*?recovering =.*$/gm,"").replace(/^\s+recovering[,]?\s*$/gm,"").replace(/[ \t]*if \(recovering[^\)]+\) \{[^\0]+?\}\n/g,"\n\n\n\n\n").replace(/\s+if[^a-z]+preErrorSymbol.*?\{\s*\/\/[^\n]+([\s\S]+?)\} else \{[\s\S]+?\}\n\s+\}\n/g,"\n$1\n\n\n\n").replace(/^\s+(?:var )?preErrorSymbol = .*$/gm,"").replace(/^.*?\bpreErrorSymbol =.*$/gm,"").replace(/^\s*var lastEofErrorStateDepth.*$/gm,"")),r}generatorMixin.__prepareOptions=function(e){if(prepExportStructures(e=mkStdOptions(this.options,e)),this.options=e,this.DEBUG=!!e.debug,!e.moduleName||!e.moduleName.match(/^[a-zA-Z_$][a-zA-Z0-9_$\.]*?[a-zA-Z0-9_$]$/)){if(e.moduleName){var t='WARNING: The specified moduleName "'+e.moduleName+'" is illegal (only characters [a-zA-Z0-9_$] and "." dot are accepted); using the default moduleName "parser" instead.';if("function"==typeof e.warn_cb)e.warn_cb(t);else if(e.warn_cb)Jison.print(t);else throw Error(t)}e.moduleName=e.defaultModuleName}return e},generatorMixin.generateGenericHeaderComment=function(){return`
/* parser generated by jison ${version$1} */

/*
 * Returns a Parser object of the following structure:
 *
 *  Parser: {
 *    yy: {}     The so-called "shared state" or rather the *source* of it;
 *               the real "shared state" \`yy\` passed around to
 *               the rule actions, etc. is a derivative/copy of this one,
 *               not a direct reference!
 *  }
 *
 *  Parser.prototype: {
 *    yy: {},
 *    EOF: 1,
 *    TERROR: 2,
 *
 *    trace: function(errorMessage, ...),
 *
 *    JisonParserError: function(msg, hash),
 *
 *    quoteName: function(name),
 *               Helper function which can be overridden by user code later on: put suitable
 *               quotes around literal IDs in a description string.
 *
 *    originalQuoteName: function(name),
 *               The basic quoteName handler provided by JISON.
 *               \`cleanupAfterParse()\` will clean up and reset \`quoteName()\` to reference this function
 *               at the end of the \`parse()\`.
 *
 *    describeSymbol: function(symbol),
 *               Return a more-or-less human-readable description of the given symbol, when
 *               available, or the symbol itself, serving as its own 'description' for lack
 *               of something better to serve up.
 *
 *               Return NULL when the symbol is unknown to the parser.
 *
 *    symbols_: {associative list: name ==> number},
 *    terminals_: {associative list: number ==> name},
 *    nonterminals: {associative list: rule-name ==> {associative list: number ==> rule-alt}},
 *    terminal_descriptions_: (if there are any) {associative list: number ==> description},
 *    productions_: [...],
 *
 *    performAction: function parser__performAction(yytext, yyleng, yylineno, yyloc, yystate, yysp, yyvstack, yylstack, yystack, yysstack),
 *
 *               The function parameters and \`this\` have the following value/meaning:
 *               - \`this\`    : reference to the \`yyval\` internal object, which has members (\`$\` and \`_$\`)
 *                             to store/reference the rule value \`$$\` and location info \`@$\`.
 *
 *                 One important thing to note about \`this\` a.k.a. \`yyval\`: every *reduce* action gets
 *                 to see the same object via the \`this\` reference, i.e. if you wish to carry custom
 *                 data from one reduce action through to the next within a single parse run, then you
 *                 may get nasty and use \`yyval\` a.k.a. \`this\` for storing you own semi-permanent data.
 *
 *                 \`this.yy\` is a direct reference to the \`yy\` shared state object.
 *
 *                 \`%parse-param\`-specified additional \`parse()\` arguments have been added to this \`yy\`
 *                 object at \`parse()\` start and are therefore available to the action code via the
 *                 same named \`yy.xxxx\` attributes (where \`xxxx\` represents a identifier name from
 *                 the %parse-param\` list.
 *
 *               - \`yytext\`  : reference to the lexer value which belongs to the last lexer token used
 *                             to match this rule. This is *not* the look-ahead token, but the last token
 *                             that's actually part of this rule.
 *
 *                 Formulated another way, \`yytext\` is the value of the token immediately preceeding
 *                 the current look-ahead token.
 *                 Caveats apply for rules which don't require look-ahead, such as epsilon rules.
 *
 *               - \`yyleng\`  : ditto as \`yytext\`, only now for the lexer.yyleng value.
 *
 *               - \`yylineno\`: ditto as \`yytext\`, only now for the lexer.yylineno value.
 *
 *               - \`yyloc\`   : ditto as \`yytext\`, only now for the lexer.yylloc lexer token location info.
 *
 *                               WARNING: since jison 0.4.18-186 this entry may be NULL/UNDEFINED instead
 *                               of an empty object when no suitable location info can be provided.
 *
 *               - \`yystate\` : the current parser state number, used internally for dispatching and
 *                               executing the action code chunk matching the rule currently being reduced.
 *
 *               - \`yysp\`    : the current state stack position (a.k.a. 'stack pointer')
 *
 *                 This one comes in handy when you are going to do advanced things to the parser
 *                 stacks, all of which are accessible from your action code (see the next entries below).
 *
 *                 Also note that you can access this and other stack index values using the new double-hash
 *                 syntax, i.e. \`##$ === ##0 === yysp\`, while \`##1\` is the stack index for all things
 *                 related to the first rule term, just like you have \`$1\`, \`@1\` and \`#1\`.
 *                 This is made available to write very advanced grammar action rules, e.g. when you want
 *                 to investigate the parse state stack in your action code, which would, for example,
 *                 be relevant when you wish to implement error diagnostics and reporting schemes similar
 *                 to the work described here:
 *
 *                 + Pottier, F., 2016. Reachability and error diagnosis in LR(1) automata.
 *                   In Journ\xe9es Francophones des Languages Applicatifs.
 *
 *                 + Jeffery, C.L., 2003. Generating LR syntax error messages from examples.
 *                   ACM Transactions on Programming Languages and Systems (TOPLAS), 25(5), pp.631–640.
 *
 *               - \`yyrulelength\`: the current rule's term count, i.e. the number of entries occupied on the stack.
 *
 *                 This one comes in handy when you are going to do advanced things to the parser
 *                 stacks, all of which are accessible from your action code (see the next entries below).
 *
 *               - \`yyvstack\`: reference to the parser value stack. Also accessed via the \`$1\` etc.
 *                             constructs.
 *
 *               - \`yylstack\`: reference to the parser token location stack. Also accessed via
 *                             the \`@1\` etc. constructs.
 *
 *                             WARNING: since jison 0.4.18-186 this array MAY contain slots which are
 *                             UNDEFINED rather than an empty (location) object, when the lexer/parser
 *                             action code did not provide a suitable location info object when such a
 *                             slot was filled!
 *
 *               - \`yystack\` : reference to the parser token id stack. Also accessed via the
 *                             \`#1\` etc. constructs.
 *
 *                 Note: this is a bit of a **white lie** as we can statically decode any \`#n\` reference to
 *                 its numeric token id value, hence that code wouldn't need the \`yystack\` but *you* might
 *                 want access this array for your own purposes, such as error analysis as mentioned above!
 *
 *                 Note that this stack stores the current stack of *tokens*, that is the sequence of
 *                 already parsed=reduced *nonterminals* (tokens representing rules) and *terminals*
 *                 (lexer tokens *shifted* onto the stack until the rule they belong to is found and
 *                 *reduced*.
 *
 *               - \`yysstack\`: reference to the parser state stack. This one carries the internal parser
 *                             *states* such as the one in \`yystate\`, which are used to represent
 *                             the parser state machine in the *parse table*. *Very* *internal* stuff,
 *                             what can I say? If you access this one, you're clearly doing wicked things
 *
 *               - \`...\`     : the extra arguments you specified in the \`%parse-param\` statement in your
 *                             grammar definition file.
 *
 *    table: [...],
 *               State transition table
 *               ----------------------
 *
 *               index levels are:
 *               - \`state\`  --> hash table
 *               - \`symbol\` --> action (number or array)
 *
 *                 If the \`action\` is an array, these are the elements' meaning:
 *                 - index [0]: 1 = shift, 2 = reduce, 3 = accept
 *                 - index [1]: GOTO \`state\`
 *
 *                 If the \`action\` is a number, it is the GOTO \`state\`
 *
 *    defaultActions: {...},
 *
 *    parseError: function(str, hash, ExceptionClass),
 *    yyError: function(str, ...),
 *    yyRecovering: function(),
 *    yyErrOk: function(),
 *    yyClearIn: function(),
 *
 *    constructParseErrorInfo: function(error_message, exception_object, expected_token_set, is_recoverable),
 *               Helper function **which will be set up during the first invocation of the \`parse()\` method**.
 *               Produces a new errorInfo 'hash object' which can be passed into \`parseError()\`.
 *               See it's use in this parser kernel in many places; example usage:
 *
 *                   var infoObj = parser.constructParseErrorInfo('fail!', null,
 *                                     parser.collect_expected_token_set(state), true);
 *                   var retVal = parser.parseError(infoObj.errStr, infoObj, parser.JisonParserError);
 *
 *    originalParseError: function(str, hash, ExceptionClass),
 *               The basic \`parseError\` handler provided by JISON.
 *               \`cleanupAfterParse()\` will clean up and reset \`parseError()\` to reference this function
 *               at the end of the \`parse()\`.
 *
 *    options: { ... parser %options ... },
 *
 *    parse: function(input[, args...]),
 *               Parse the given \`input\` and return the parsed value (or \`true\` when none was provided by
 *               the root action, in which case the parser is acting as a *matcher*).
 *               You MAY use the additional \`args...\` parameters as per \`%parse-param\` spec of this grammar:
 *               these extra \`args...\` are added verbatim to the \`yy\` object reference as member variables.
 *
 *               WARNING:
 *               Parser's additional \`args...\` parameters (via \`%parse-param\`) MAY conflict with
 *               any attributes already added to \`yy\` by the jison run-time;
 *               when such a collision is detected an exception is thrown to prevent the generated run-time
 *               from silently accepting this confusing and potentially hazardous situation!
 *
 *               The lexer MAY add its own set of additional parameters (via the \`%parse-param\` line in
 *               the lexer section of the grammar spec): these will be inserted in the \`yy\` shared state
 *               object and any collision with those will be reported by the lexer via a thrown exception.
 *
 *    cleanupAfterParse: function(resultValue, invoke_post_methods, do_not_nuke_errorinfos),
 *               Helper function **which will be set up during the first invocation of the \`parse()\` method**.
 *               This helper API is invoked at the end of the \`parse()\` call, unless an exception was thrown
 *               and \`%options no-try-catch\` has been defined for this grammar: in that case this helper MAY
 *               be invoked by calling user code to ensure the \`post_parse\` callbacks are invoked and
 *               the internal parser gets properly garbage collected under these particular circumstances.
 *
 *    yyMergeLocationInfo: function(first_index, last_index, first_yylloc, last_yylloc, dont_look_back),
 *               Helper function **which will be set up during the first invocation of the \`parse()\` method**.
 *               This helper API can be invoked to calculate a spanning \`yylloc\` location info object.
 *
 *               Note: %epsilon rules MAY specify no \`first_index\` and \`first_yylloc\`, in which case
 *               this function will attempt to obtain a suitable location marker by inspecting the location stack
 *               backwards.
 *
 *               For more info see the documentation comment further below, immediately above this function's
 *               implementation.
 *
 *    lexer: {
 *        yy: {...},           A reference to the so-called "shared state" \`yy\` once
 *                             received via a call to the \`.setInput(input, yy)\` lexer API.
 *        EOF: 1,
 *        ERROR: 2,
 *        JisonLexerError: function(msg, hash),
 *        parseError: function(str, hash, ExceptionClass),
 *        setInput: function(input, [yy]),
 *        input: function(),
 *        unput: function(str),
 *        more: function(),
 *        reject: function(),
 *        less: function(n),
 *        pastInput: function(n),
 *        upcomingInput: function(n),
 *        showPosition: function(),
 *        test_match: function(regex_match_array, rule_index, ...),
 *        next: function(...),
 *        lex: function(...),
 *        begin: function(condition),
 *        pushState: function(condition),
 *        popState: function(),
 *        topState: function(),
 *        _currentRules: function(),
 *        stateStackSize: function(),
 *        cleanupAfterLex: function()
 *
 *        options: { ... lexer %options ... },
 *
 *        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START, ...),
 *        rules: [...],
 *        conditions: {associative list: name ==> set},
 *    }
 *  }
 *
 *
 *  token location info (@$, _$, etc.): {
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
 * The \`parseError\` function receives a 'hash' object with these members for lexer and
 * parser errors:
 *
 *  {
 *    text:        (matched text)
 *    token:       (the produced terminal token, if any)
 *    token_id:    (the produced terminal token numeric ID, if any)
 *    line:        (yylineno)
 *    loc:         (yylloc)
 *  }
 *
 * parser (grammar) errors will also provide these additional members:
 *
 *  {
 *    expected:    (array describing the set of expected tokens;
 *                  may be UNDEFINED when we cannot easily produce such a set)
 *    state:       (integer (or array when the table includes grammar collisions);
 *                  represents the current internal state of the parser kernel.
 *                  can, for example, be used to pass to the \`collect_expected_token_set()\`
 *                  API to obtain the expected token set)
 *    action:      (integer; represents the current internal action which will be executed)
 *    new_state:   (integer; represents the next/planned internal state, once the current
 *                  action has executed)
 *    recoverable: (boolean: TRUE when the parser MAY have an error recovery rule
 *                  available for this particular error)
 *    state_stack: (array: the current parser LALR/LR internal state stack; this can be used,
 *                  for instance, for advanced error analysis and reporting)
 *    value_stack: (array: the current parser LALR/LR internal \`$$\` value stack; this can be used,
 *                  for instance, for advanced error analysis and reporting)
 *    location_stack: (array: the current parser LALR/LR internal location stack; this can be used,
 *                  for instance, for advanced error analysis and reporting)
 *    yy:          (object: the current parser internal "shared state" \`yy\`
 *                  as is also available in the rule actions; this can be used,
 *                  for instance, for advanced error analysis and reporting)
 *    lexer:       (reference to the current lexer instance used by the parser)
 *    parser:      (reference to the current parser instance)
 *  }
 *
 * while \`this\` will reference the current parser instance.
 *
 * When \`parseError\` is invoked by the lexer, \`this\` will still reference the related *parser*
 * instance, while these additional \`hash\` fields will also be provided:
 *
 *  {
 *    lexer:       (reference to the current lexer instance which reported the error)
 *  }
 *
 * When \`parseError\` is invoked by the parser due to a **JavaScript exception** being fired
 * from either the parser or lexer, \`this\` will still reference the related *parser*
 * instance, while these additional \`hash\` fields will also be provided:
 *
 *  {
 *    exception:   (reference to the exception thrown)
 *  }
 *
 * Please do note that in the latter situation, the \`expected\` field will be omitted as
 * this type of failure is assumed not to be due to *parse errors* but rather due to user
 * action code in either parser or lexer failing unexpectedly.
 *
 * ---
 *
 * You can specify parser options by setting / modifying the \`.yy\` object of your Parser instance.
 * These options are available:
 *
 * ### options which are global for all parser instances
 *
 *  Parser.pre_parse: function(yy)
 *                 optional: you can specify a pre_parse() function in the chunk following
 *                 the grammar, i.e. after the last \`%%\`.
 *  Parser.post_parse: function(yy, retval, parseInfo) { return retval; }
 *                 optional: you can specify a post_parse() function in the chunk following
 *                 the grammar, i.e. after the last \`%%\`. When it does not return any value,
 *                 the parser will return the original \`retval\`.
 *
 * ### options which can be set up per parser instance
 *
 *  yy: {
 *      pre_parse:  function(yy)
 *                 optional: is invoked before the parse cycle starts (and before the first
 *                 invocation of \`lex()\`) but immediately after the invocation of
 *                 \`parser.pre_parse()\`).
 *      post_parse: function(yy, retval, parseInfo) { return retval; }
 *                 optional: is invoked when the parse terminates due to success ('accept')
 *                 or failure (even when exceptions are thrown).
 *                 \`retval\` contains the return value to be produced by \`Parser.parse()\`;
 *                 this function can override the return value by returning another.
 *                 When it does not return any value, the parser will return the original
 *                 \`retval\`.
 *                 This function is invoked immediately before \`parser.post_parse()\`.
 *
 *      parseError: function(str, hash, ExceptionClass)
 *                 optional: overrides the default \`parseError\` function.
 *      quoteName: function(name),
 *                 optional: overrides the default \`quoteName\` function.
 *  }
 *
 *  parser.lexer.options: {
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
 *                 \`XRegExp\` library. When this \`%option\` has not been specified at compile time, all lexer
 *                 rule regexes have been written as standard JavaScript RegExp expressions.
 *  }
 */
`},generatorMixin.generate=function(e){e=this.__prepareOptions(e);var t="";switch(e.moduleType){case"js":t=this.generateModule(e);break;case"amd":t=this.generateAMDModule(e);break;case"es":t=this.generateESModule(e);break;case"commonjs":t=this.generateCommonJSModule(e);break;default:throw Error("unsupported moduleType: "+e.moduleType)}return t},generatorMixin.generateAMDModule=function(e){e=this.__prepareOptions(e);var t=this.generateModule_(),r=[this.generateGenericHeaderComment(),"","define(function (require) {",t.initCode,t.commonCode,"","var parser = "+t.moduleCode,t.modulePostlude];if(this.lexer&&this.lexer.generateModule){var o=this.lexer.generateModule();e.exportSourceCode.lexer=o,r.push(o),r.push("parser.lexer = lexer;")}r.push("",t.moduleInclude,"","return parser;"),r.push("});");var n=r.join("\n")+"\n";return e.exportSourceCode.all=n,n},lrGeneratorMixin.generateESModule=function(e){e=this.__prepareOptions(e);var t=this.generateModule_(),r=[this.generateGenericHeaderComment(),"",t.initCode,t.commonCode,"","var parser = "+t.moduleCode,t.modulePostlude];if(this.lexer&&this.lexer.generateModule){var o=this.lexer.generateModule();e.exportSourceCode.lexer=o,r.push(this.lexer.generateModule()),r.push("parser.lexer = lexer;")}r.push("",t.moduleInclude,"");var n="",s="";if(!e.noMain){var a=String(e.moduleMain||commonJsMain),i=String(e.moduleMainImports||commonJsMainImports);r.push(rmCommonWS$1`

            ${i}

            var yymain = ${a.trim()};

            function yyExecMain() {
              yymain(process.argv.slice(1));
            }
        `),n="main: yyExecMain,",s=rmCommonWS$1`
            // IFF this is the main module executed by NodeJS,
            // then run 'main()' immediately:
            if (typeof module !== 'undefined' && require.main === module) {
              yyExecMain();
            }
        `}r.push(rmCommonWS$1`
        function Parser() {
            this.yy = {};
        }
        Parser.prototype = parser;
        parser.Parser = Parser;

        function yyparse() {
            return parser.parse.apply(parser, arguments);
        }

        ${s}

        export default {
            parser,
            Parser,
            parse: yyparse,
            ${n}
        };
    `);var l=r.join("\n")+"\n";return e.exportSourceCode.all=l,l},generatorMixin.generateCommonJSModule=function(e){var t=(e=this.__prepareOptions(e)).moduleName,r="";if(!e.noMain){var o=String(e.moduleMain||commonJsMain),n=String(e.moduleMainImports||commonJsMainImports);r=rmCommonWS$1`

            ${n}

            exports.main = ${o.trim()};

            // IFF this is the main module executed by NodeJS,
            // then run 'main()' immediately:
            if (typeof module !== 'undefined' && require.main === module) {
              exports.main(process.argv.slice(1));
            }
        `}var s=this.generateModule(e)+rmCommonWS$1`


        if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
          exports.parser = ${t};
          exports.Parser = ${t}.Parser;
          exports.parse = function () {
            return ${t}.parse.apply(${t}, arguments);
          };
          ${r}
        }
        `;return e.exportSourceCode.all=s,s},generatorMixin.generateModule=function(e){var t=(e=this.__prepareOptions(e)).moduleName,r=this.generateGenericHeaderComment(),o=this;function n(e,t,r){var o=e.shift();if(null!=o){var s=null==t?o:t+"."+o;return e.length>0?"var "+o+";\n(function ("+o+") {\n"+n(e,o,r)+"\n})("+o+(null==t?"":" = "+s)+" || ("+s+" = {}));\n":r(s)}return""}var s=o.generateModuleExpr();return r+=`
        ${s.init}
    `,r+=n(t.split("."),null,function(e){var t=e.match(/\./)?e:"var "+e;return`
            ${t} = ${s.src}
        `}),e.exportSourceCode.all=r,r},generatorMixin.generateModuleExpr=function(){var e,t=this.__prepareOptions(),r=this.generateModule_();if(e=["(function () {",r.commonCode,"","var parser = "+r.moduleCode,r.modulePostlude],this.lexer&&this.lexer.generateModule){var o=this.lexer.generateModule();t.exportSourceCode.lexer=o,e.push(o),e.push("parser.lexer = lexer;")}var n=(e=e.concat(["",r.moduleInclude,"","function Parser() {","  this.yy = {};","}","Parser.prototype = parser;","parser.Parser = Parser;","","return new Parser();","})();"])).join("\n")+"\n";return t.exportSourceCode.all=n,{src:n,init:r.initCode}},lrGeneratorMixin.generateModule_=function(){var e,t=String(parser.parse);t=expandParseArguments(t=removeUnusedKernelFeatures(t=addOrRemoveTokenStack(t=pickErrorHandlingChunk(t,this.hasErrorRecovery),this.options.tokenStack),this),this);var r=this.generateErrorClass(),o=this.options.exportAllTables;assert(o),o.parseTable=this.table,o.defaultParseActions=this.defaultActions,o.parseProductions=this.productions_;var n=this.options.exportSourceCode;switch(assert(n),0|this.options.compressTables){case 0:e=this.generateTableCode0(this.table,this.defaultActions,this.productions_);break;default:case 1:e=this.generateTableCode1(this.table,this.defaultActions,this.productions_);break;case 2:e=this.options.noDefaultResolve&&this.conflicts>0?this.generateTableCode1(this.table,this.defaultActions,this.productions_):this.generateTableCode2(this.table,this.defaultActions,this.productions_)}var s=[].concat(this.moduleInit.getInitCodeSection("imports"),this.moduleInit.getInitCodeSection("init")),a=[].concat(this.moduleInit.getInitCodeSection("required"),r.commonCode,r.moduleCode,["\nYY_REMAINING_INIT_CODE_SECTIONS_GO_HERE\n"],e.commonCode);function i(e){var t,r=Object.keys(e);r.sort();for(var o={},n=0,s=r.length;n<s;n++)"$eof"!==(t=r[n])&&(o[t]=e[t]);return o}function l(e){for(var t,r=Object.keys(e),o={},n=0,s=r.length;n<s;n++)o[e[t=r[n]]]=+t;return i(o)}function c(e,t,r){function o(e){var t=e.split(":");if(1===t.length||""===t[0])return{state:-1,symbol:e};var r=t[0];return t.shift(),{state:+r,symbol:t.join(":")}}function n(e){for(var t={},r=0,n=e.length;r<n;r++){var s=o(e[r]);t[s.symbol]=s.state}return Object.keys(t)}var s,a=this.nonterminals,i=this.symbols_||t;if(e.outputDebugTables||e.exportAllTables.enabled){var l={ids:{},states:{},rules:{},nonterminals:{},symbols:{},first:{},follows:{}},u=this;for(var h in this.productions.forEach(function(e,t){var r=e.symbol;l.states[t]=r,l.ids[r]=i[r];var o=l.rules[r]||{};o[t]=g(e,t,!1,t,!0),l.rules[r]=o}),a)l.nonterminals[h]=b(a[h]);this.nterms_&&(l.nterms_=this.nterms_),this.states&&(l.lalr_states=[],this.states.forEach(function(e,t){e.forEach(function(r,o){var s=u.nonterminals[r.production.symbol].first,a={state:t,item_index:o,is_reduce_state:r.dotPosition===r.production.handle.length,dot_position:r.dotPosition,state_inadequate:!!e.inadequate||void 0,item_inadequate:!!r.inadequate||void 0,production:g(r.production,o,r.dotPosition,t,!0),follows:r.follows,base_follows:n(r.follows),nterm_first:s,base_nterm_first:n(s),prod_first:r.production.first,base_prod_first:n(r.production.first)};a.base_follows.join(" ")===a.follows.join(" ")&&delete a.base_follows,a.base_nterm_first.join(" ")===a.nterm_first.join(" ")&&delete a.base_nterm_first,a.base_prod_first.join(" ")===a.prod_first.join(" ")&&delete a.base_prod_first,l.lalr_states.push(a)})}));var p=a;for(s in p){var f=o(s),d=p[s],y=d.first,m=d.follows;l.symbols[f.symbol]||(l.symbols[f.symbol]=f.state),l.first[f.symbol]?l.first[f.symbol]=l.first[f.symbol].concat(y):l.first[f.symbol]=y,l.follows[f.symbol]?l.follows[f.symbol]=l.follows[f.symbol].concat(m):l.follows[f.symbol]=m}for(s in l.first)l.first[s]=n(l.first[s]);for(s in l.follows)l.follows[s]=n(l.follows[s]);return this.newg&&(l.newg=c.call(this.newg,e,i,l)),l}function b(e){var t=e.productions._items.map(function(e,t){return g(e,t,!1,!1,!1)}),r={symbol:e.symbol,productions:t,first:e.first,base_first:n(e.first),follows:e.follows,base_follows:n(e.follows),nullable:e.nullable};return r.base_first.join(" ")===r.first.join(" ")&&delete r.base_first,r.base_follows.join(" ")===r.follows.join(" ")&&delete r.base_follows,r}function g(e,t,s,a,i){var c,u,h=e.symbol,p=e.handle.length,f=e.handle.map(function(e,t){return e||(e="%epsilon"),s===t&&(e="⬤"+e),e}).join(" ");s===p&&(f+=" ⬤");var d=e.handle.map(function(e){return e||(e="%epsilon"),e=o(e).symbol}).join(" "),y={symbol:h,base_symbol:o(h).symbol,handle:f,base_handle:d,nullable:e.nullable,id:e.id,index:t,state:!1!==a?a:-1,base_state:-1,first:e.first,base_first:n(e.first),follows:e.follows,base_follows:n(e.follows),precedence:e.precedence,reachable:e.reachable},m=l.rules[h];for(u in c=y.symbol+" : "+y.handle,m){var b=m[u*=1];if(b&&b.symbol+" : "+b.handle===c){assert(-1===y.state),y.state=u;break}}if(c=y.base_symbol+" : "+y.base_handle,r&&r.rules){var g=r.rules[y.base_symbol];for(u in g){var v=g[u];if(v.symbol+" : "+v.handle===c){assert(-1===y.base_state),y.base_state=v.state,i&&(v.newg_states=v.newg_states||[],v.newg_states.push(y.index));break}}}return y.base_symbol===y.symbol&&delete y.base_symbol,y.base_handle===y.handle&&delete y.base_handle,y.base_first.join(" ")===y.first.join(" ")&&delete y.base_first,y.base_follows.join(" ")===y.follows.join(" ")&&delete y.base_follows,-1===y.base_state&&delete y.base_state,y}}function u(e){var t={},r={type:0,debug:!e.debug,enableDebugLogs:1,numExpectedConflictStates:1,dumpSourceCodeOnFailure:1,throwErrorOnCompileFailure:1,json:1,_:1,noMain:1,moduleMain:1,moduleMainImports:1,noDefaultResolve:1,defaultActionMode:1,testCompileActionCode:1,noTryCatch:1,hasPartialLrUpgradeOnConflict:0,compressTables:1,outputDebugTables:1,reportStats:1,file:1,outfile:1,inputPath:1,inputFilename:1,lexfile:1,defaultModuleName:1,moduleName:1,moduleType:1,exportAllTables:1,exportSourceCode:1,tokenStack:0,parserErrorsAreRecoverable:0,lexerErrorsAreRecoverable:1,showSource:1,exportAST:1,prettyCfg:1,errorRecoveryTokenDiscardCount:0,warn_cb:0,parseParams:1,ranges:0};for(var o in e)if(!r[o]&&null!=e[o]&&!1!==e[o]){if("string"==typeof e[o]){var n=parseFloat(e[o]);if(n==e[o]){t[o]=n;continue}}t[o]=e[o]}t.hasPartialLrUpgradeOnConflict||delete t.hasPartialLrUpgradeOnConflict;var s=t.pre_parse,a=t.post_parse;s&&(t.pre_parse=!0),a&&(t.post_parse=!0);var i=JSON.stringify(t,null,2);return(i=(i=i.replace(new XRegExp(`  "(${ID_REGEX_BASE})": `,"g"),"  $1: ")).replace(/^( +)pre_parse: true(,)?$/gm,function(e,t,r){return t+"pre_parse: "+String(s)+(r||"")})).replace(/^( +)post_parse: true(,)?$/gm,function(e,t,r){return t+"post_parse: "+String(a)+(r||"")})}var h=function(e,t){var r={},o=0;for(var n in e){var s=e[n],a=t[n];a&&s&&s!==a&&(r[a]=s,o++)}return o?r:void 0}(this.descriptions_,this.symbols_);o.terminalDescriptions=h;var p=JSON.stringify(h,null,2);p&&(p=p.replace(/"([0-9]+)":/g,"$1:"));var f=c.call(this,this.options);o.parseRules=f;var d=this.options.outputDebugTables||this.options.exportAllTables.enabled?JSON.stringify(f,null,2):void 0;d&&(d=d.replace(/"([0-9]+)":/g,"$1:").replace(/^(\s+)"([a-z_][a-z_0-9]*)":/gmi,"$1$2:"));var y=i(this.symbols_);o.symbolTable=y,o.terminalTable=l(this.terminals_);var m=`{
    // Code Generator Information Report
    // ---------------------------------
    //
    // Options:
    //
    //   default action mode: ............. ${JSON.stringify(this.options.defaultActionMode)}
    //   test-compile action mode: ........ ${JSON.stringify(this.options.testCompileActionCode)}
    //   try..catch: ...................... ${!this.options.noTryCatch}
    //   default resolve on conflict: ..... ${!this.options.noDefaultResolve}
    //   on-demand look-ahead: ............ ${this.onDemandLookahead}
    //   error recovery token skip maximum: ${this.options.errorRecoveryTokenDiscardCount}
    //   yyerror in parse actions is: ..... ${this.options.parserErrorsAreRecoverable?"recoverable":"NOT recoverable"},
    //   yyerror in lexer actions and other non-fatal lexer are:
    //   .................................. ${this.options.lexerErrorsAreRecoverable?"recoverable":"NOT recoverable"},
    //   debug grammar/output: ............ ${this.options.debug}
    //   has partial LR conflict upgrade:   ${this.options.hasPartialLrUpgradeOnConflict}
    //   rudimentary token-stack support:   ${this.options.tokenStack}
    //   parser table compression mode: ... ${this.options.compressTables}
    //   export debug tables: ............. ${this.options.outputDebugTables}
    //   export *all* tables: ............. ${this.options.exportAllTables.enabled}
    //   module type: ..................... ${this.options.moduleType}
    //   parser engine type: .............. ${this.options.type}
    //   output main() in the module: ..... ${this.options.noMain}
    //   has user-specified main(): ....... ${!!this.options.moduleMain}
    //   has user-specified require()/import modules for main():
    //   .................................. ${!!this.options.moduleMainImports}
    //   number of expected conflicts: .... ${this.options.numExpectedConflictStates}
    //
    //
    // Parser Analysis flags:
    //
    //   no significant actions (parser is a language matcher only):
    //   .................................. ${this.actionsAreAllDefault}
    //   uses yyleng: ..................... ${this.actionsUseYYLENG}
    //   uses yylineno: ................... ${this.actionsUseYYLINENO}
    //   uses yytext: ..................... ${this.actionsUseYYTEXT}
    //   uses yylloc: ..................... ${this.actionsUseYYLOC}
    //   uses ParseError API: ............. ${this.actionsUseParseError}
    //   uses YYERROR: .................... ${this.actionsUseYYERROR}
    //   uses YYRECOVERING: ............... ${this.actionsUseYYRECOVERING}
    //   uses YYERROK: .................... ${this.actionsUseYYERROK}
    //   uses YYCLEARIN: .................. ${this.actionsUseYYCLEARIN}
    //   tracks rule values: .............. ${this.actionsUseValueTracking}
    //   assigns rule values: ............. ${this.actionsUseValueAssignment}
    //   uses location tracking: .......... ${this.actionsUseLocationTracking}
    //   assigns location: ................ ${this.actionsUseLocationAssignment}
    //   uses yystack: .................... ${this.actionsUseYYSTACK}
    //   uses yysstack: ................... ${this.actionsUseYYSSTACK}
    //   uses yysp: ....................... ${this.actionsUseYYSTACKPOINTER}
    //   uses yyrulelength: ............... ${this.actionsUseYYRULELENGTH}
    //   uses yyMergeLocationInfo API: .... ${this.actionsUseYYMERGELOCATIONINFO}
    //   has error recovery: .............. ${this.hasErrorRecovery}
    //   has error reporting: ............. ${this.hasErrorReporting}
    //
    // --------- END OF REPORT -----------

`;m+=["trace: "+String(this.trace||parser.trace),"JisonParserError: JisonParserError","yy: {}","options: "+u(this.options),"symbols_: "+JSON.stringify(y,null,2),"terminals_: "+JSON.stringify(this.terminals_,null,2).replace(/"([0-9]+)":/g,"$1:")].concat(d?"nonterminals_: "+d:[]).concat(p?"terminal_descriptions_: "+p:[]).concat([define_parser_APIs_1.trim(),"productions_: "+e.productionsCode]).concat(""!==String(this.performAction).trim()?"performAction: "+String(this.performAction):[]).concat(["table: "+e.tableCode,"defaultActions: "+e.defaultActionsCode,"parseError: "+String(this.parseError||parseErrorSourceCode).trim(),"parse: "+t.trim()]).concat(this.actionsUseYYERROR?"yyError: 1":[]).concat(this.actionsUseYYRECOVERING?"yyRecovering: 1":[]).concat(this.actionsUseYYERROK?"yyErrOk: 1":[]).concat(this.actionsUseYYCLEARIN?"yyClearIn: 1":[]).join(",\n"),m+="\n};";var n=this.options.exportSourceCode;return assert(n),n.parserChunks={initCode:expandConstantsInGeneratedCode(s.join("\n"),this),commonCode:expandConstantsInGeneratedCode(a.join("\n"),this),moduleCode:expandConstantsInGeneratedCode(m,this),modulePostlude:"parser.originalParseError = parser.parseError;\nparser.originalQuoteName = parser.quoteName;",moduleInclude:expandConstantsInGeneratedCode(this.moduleInclude,this)},n.parserChunks},lrGeneratorMixin.generateErrorClass=function(){return{commonCode:"",moduleCode:`
// See also:
// http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript/#35881508
// but we keep the prototype.constructor and prototype.name assignment lines too for compatibility
// with userland code which might access the derived class in a 'classic' way.
function JisonParserError(msg, hash) {
    Object.defineProperty(this, 'name', {
        enumerable: false,
        writable: false,
        value: 'JisonParserError'
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
        if (Error.hasOwnProperty('captureStackTrace')) {        // V8/Chrome engine
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
    Object.setPrototypeOf(JisonParserError.prototype, Error.prototype);
} else {
    JisonParserError.prototype = Object.create(Error.prototype);
}
JisonParserError.prototype.constructor = JisonParserError;
JisonParserError.prototype.name = 'JisonParserError';
`}},lrGeneratorMixin.generateTableCode0=function(e,t,r){var o=JSON.stringify(e,null,2),n=JSON.stringify(t,null,2).replace(/"([0-9]+)":/g,"$1:"),s=JSON.stringify(r,null,2);return{commonCode:"",tableCode:o=o.replace(/"([0-9]+)"(?=:)/g,"$1"),defaultActionsCode:n,productionsCode:s}};var compressor1ObjectCode=`
function x(k, v, o) {
  o = o || {};
  for (var l = k.length; l--; ) {
    o[k[l]] = v;
  }
  return o;
}
`;lrGeneratorMixin.generateTableCode1=function(e,t,r){var o,n=JSON.stringify(e,null,2),s=JSON.stringify(t,null,2).replace(/"([0-9]+)":/g,"$1:"),a=JSON.stringify(r,null,2),i=!1;n=(n=n.replace(/"([0-9]+)"(?=:)/g,"$1")).replace(/\{[\s\r\n]*\d+:[^\}]+,[\s\r\n]*\d+:[^\}]+\}/g,function(e){for(var t,r,o,n,s,a={},l=0,c=[],u=/(\d+):[\s\r\n]*([^:\}]+)(?=,[\s\r\n]*\d+:|\})/g;s=u.exec(e);)o=s[1],t=s[2].trim(),n=1,t in a?n=a[t].push(o):a[t]=[o],n>l&&(l=n,r=t);if(l>1){for(t in a)if(t!==r)for(var h=a[t],p=0,f=h.length;p<f;p++)c.push(h[p]+":"+t);c=c.length?", {"+c.join(",")+"}":"",e="x(["+a[r].join(",")+"], "+r+c+")",i=!0}return e});for(var l={},c=/\[[0-9,]+\]/g,u=[];o=c.exec(n);)l[o]=(l[o]||0)+1;n=n.replace(c,function(e){var t=l[e];return"number"==typeof t&&(1===t?l[e]=t=e:(l[e]=t="u["+u.length+"]",u.push(e))),t});var h=[];return i&&(h.push(compressor1ObjectCode),h.push("")),u.length>0&&(h.push("var u = [\n    "+u.join(",\n    ")+"\n];"),h.push("")),{commonCode:h.join("\n"),tableCode:n,defaultActionsCode:s,productionsCode:a}},lrGeneratorMixin.generateTableCode2=function(e,t,r){if(this.options.noDefaultResolve&&this.conflicts>0)throw Error("Table Compression mode 2 corrupts the table when the 'noDefaultResolve' option is turned on and one or more conflicts occur. Please use a different compression mode and/or disable this option.");var o=JSON.stringify(e,null,2),n=JSON.stringify(t,null,2).replace(/"([0-9]+)":/g,"$1:"),s=JSON.stringify(r,null,2);function a(e){var t,r,o,n,s,a,i,l=[];for(r in o=0,e)o=Math.max(o,e[r].length);var c=6,u=4;function h(e,t){var r="        "+e;return r.substr(r.length-t)}var p={},f=[];for(n in f.push("║"),e)r=h(n,c),s=h("∆",u),f.push(r),f.push("┊"),f.push(s),f.push("║"),p[n]=1e7;for(l.push(f.join("")),t=0;t<o;t++){for(n in(f=[]).push("║"),e){var d=e[n];d.length>t?((i=(a=d[t]||0)-p[n])<0&&(i=-a-1),p[n]=a):(a=".",i="."),r=h(a,c),s=h(i,u),f.push(r),f.push("┊"),f.push(s),f.push("║")}l.push(f.join(""))}return"\n\n\n// ------------------------------\n\n\n// "+l.join("\n// ")+"\n\n\n// ------------------\n\n\n"}function i(e){var t,r=[],o=[],n=[],s=e.length;for(t=0;t<s;t++){var a=e[t];r.push(a.length),assert(a.length<=2),assert(a.length>0),assert(2===a.length),o.push(a[0]),n.push(a[1])}return{len:r,pop:o,rule:n}}function l(e){var t,r=[],o=[];for(t in e){var n=e[t*=1];r.push(t),assert("number"==typeof n),o.push(n)}return{idx:r,goto:o}}o=o.replace(/"([0-9]+)"(?=:)/g,"$1");var c=!1;function u(e,t){var r,o,n,s,a=[];for(r=0,n=t.length;r<n;r++){var i=t[r];for(o=r+1;o<n&&t[o]===i;o++);var l=o-r,u=t[r+1]-i,h=0;if(0!==u){for(o=r+2;o<n&&t[o]-t[o-1]===u;o++);h=o-r}var p=0,f=0,d=r-2;for(o=0;o<d;o++){for(s=0;t[o+s]===t[r+s];s++);s>=f&&(f=s,p=r-o)}var y=[l-2,h-3,f-2],m=Math.max.apply(null,y);m<=0?a.push(i):m===y[0]?(a.push("s","["+i+", "+l+"]"),r+=l-1):m===y[1]?(a.push("s","["+i+", "+h+", "+u+"]"),r+=h-1):m===y[2]?(a.push("c","["+p+", "+f+"]"),r+=f-1):a.push(i),m>0&&(c=!0)}return"  "+e+": u([\n  "+a.join(",\n  ")+"\n])"}function h(e){return["bp({",u("pop",e.pop)+",",u("rule",e.rule),"})"].join("\n")}function p(e){return["bda({",u("idx",e.idx)+",",u("goto",e.goto),"})"].join("\n")}function f(e){return["bt({",u("len",e.len)+",",u("symbol",e.symbol)+",",u("type",e.type)+",",u("state",e.state)+",",u("mode",e.mode)+",",u("goto",e.goto),"})"].join("\n")}var d=function(e){for(var t=[],r=[],o=[],n=[],s=[],a=[],i=e.length,l=0;l<i;l++){var c,u=e[l],h=0;for(c in u){c*=1,r.push(c);var p=u[c];p&&p.length?(assert(2===p.length||1===p.length),assert(1!==p.length||3===p[0]),o.push(p.length),p.length>1&&(s.push(p[0]),a.push(p[1]))):p?(o.push(0),n.push(p)):(assert(0),o.push(666),n.push(typeof p+l+"/"+c)),h++}t.push(h)}return{len:t,symbol:r,type:o,state:n,mode:s,goto:a}}(e),y=l(t),m=i(r);let b=`
        // helper: reconstruct the productions[] table
        function bp(s) {
            var rv = [];
            var p = s.pop;
            var r = s.rule;
            for (var i = 0, l = p.length; i < l; i++) {
                rv.push([
                    p[i],
                    r[i]
                ]);
            }
            return rv;
        }
    `,g=`
        // helper: reconstruct the defaultActions[] table
        function bda(s) {
            var rv = {};
            var d = s.idx;
            var g = s.goto;
            for (var i = 0, l = d.length; i < l; i++) {
                var j = d[i];
                rv[j] = g[i];
            }
            return rv;
        }
    `,v=`
        // helper: reconstruct the 'goto' table
        function bt(s) {
            var rv = [];
            var d = s.len;
            var y = s.symbol;
            var t = s.type;
            var a = s.state;
            var m = s.mode;
            var g = s.goto;
            for (var i = 0, l = d.length; i < l; i++) {
                var n = d[i];
                var q = {};
                for (var j = 0; j < n; j++) {
                    var z = y.shift();
                    switch (t.shift()) {
                    case 2:
                        q[z] = [
                            m.shift(),
                            g.shift()
                        ];
                        break;

                    case 0:
                        q[z] = a.shift();
                        break;

                    default:
                        // type === 1: accept
                        q[z] = [
                            3
                        ];
                    }
                }
                rv.push(q);
            }
            return rv;
        }
    `,_=`
        // helper: runlength encoding with increment step: code, length: step (default step = 0)
        // \`this\` references an array
        function s(c, l, a) {
            a = a || 0;
            for (var i = 0; i < l; i++) {
                this.push(c);
                c += a;
            }
        }

        // helper: duplicate sequence from *relative* offset and length.
        // \`this\` references an array
        function c(i, l) {
            i = this.length - i;
            for (l += i; i < l; i++) {
                this.push(this[i]);
            }
        }

        // helper: unpack an array using helpers and data, all passed in an array argument 'a'.
        function u(a) {
            var rv = [];
            for (var i = 0, l = a.length; i < l; i++) {
                var e = a[i];
                // Is this entry a helper function?
                if (typeof e === 'function') {
                    i++;
                    e.apply(rv, a[i]);
                } else {
                    rv.push(e);
                }
            }
            return rv;
        }
    `;c=!1;var E=f(d),k=c;c=!1;var w=p(y),x=c;c=!1;var S=h(m),R=c,A=R||x||k;o=(this.DEBUG||devDebug?a(d):"")+(k?E:o),n=(this.DEBUG||devDebug?a(y):"")+(x?w:n),s=(this.DEBUG||devDebug?a(m):"")+(R?S:s);var O=["",R?b:"","",x?g:"","",k?v:"","",_];return A||(O=[]),{commonCode:O.join("\n"),tableCode:o,defaultActionsCode:n,productionsCode:s}};let commonJsMain=`
function (args) {
    // When the parser comes with its own \`main\` function, then use that one:
    if (typeof exports.parser.main === 'function') {
      return exports.parser.main(args);
    }

    if (!args[1]) {
        console.log('Usage:', path.basename(args[0]) + ' FILE');
        process.exit(1);
    }
    var source = fs.readFileSync(path.normalize(args[1]), 'utf8');
    var dst = exports.parser.parse(source);
    console.log('parser output:\\n\\n', {
        type: typeof dst,
        value: dst
    });
    try {
        console.log("\\n\\nor as JSON:\\n", JSON.stringify(dst, null, 2));
    } catch (e) { /* ignore crashes; output MAY not be serializable! We are a generic bit of code, after all... */ }
    var rv = 0;
    if (typeof dst === 'number' || typeof dst === 'boolean') {
        rv = dst;
    }
    return dst;
}
`,commonJsMainImports=`
var fs = require('fs');
var path = require('path');
`;function printAction(e,t){return e[0]===SHIFT?"shift token (then go to state "+e[1]+")":e[0]===REDUCE?"reduce by rule: "+t.productions[e[1]]:e[0]===ACCEPT?"accept":"UNDEFINED ACTION: "+e[0]}function traceStates(e,t,r){e("\nItem sets -- "+r+"\n------"),t.forEach(function(t,r){e("\nitem set",r,"\n"+t.join("\n"),"\ntransitions -> ",JSON.stringify(t.edges))}),e("\n")}var lrGeneratorDebug={beforeparseTable:function(){this.trace("Building parse table.")},afterparseTable:function(){var e=this.trace,t=this;this.conflicts>0&&(e("\nConflicts:\n"),this.resolutions.forEach(function(r,o){r[2].bydefault&&e("Conflict at state: ",r[0],", token: ",r[1],"\n  ",printAction(r[2].r,t),"\n  ",printAction(r[2].s,t))}),e("\n"+this.conflicts+" Conflict(s) found in grammar.")),e("Done.\n")},aftercanonicalCollection:function(e){traceStates(this.trace,e,"as produced by LR::canonicalCollection()")}},parser=typal.beget();generatorMixin.createParser=function createParser(){var sourceCodeDef=this.generateModuleExpr(),sourcecode=rmCommonWS$1`
        ${sourceCodeDef.init}

        var yy__parser = ${sourceCodeDef.src};

        // produce the generated parser function/class as the last value
        // in this chunk of code so that we can be sure to produce *that*
        // one as the 'return value' of the \`eval()\` call we'll submit
        // this code to.
        //
        // See also: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval

        yy__parser;
    `,p=code_exec(sourcecode,function generated_code_exec_wrapper_jison(sourcecode){chkBugger(sourcecode);var rv=eval(sourcecode);return rv},mkStdOptions(this.options,{dumpSourceCodeOnFailure:this.DEBUG,throwErrorOnCompileFailure:!0}),"parser");assert("object"==typeof p),assert("function"==typeof p.parse),assert(void 0===p.parser),assert("function"==typeof p.Parser),assert("object"==typeof p.yy),assert("number"==typeof p.EOF),assert("number"==typeof p.TERROR),assert("function"==typeof p.JisonParserError),assert("function"==typeof p.quoteName),assert("function"==typeof p.originalQuoteName),assert("function"==typeof p.describeSymbol),assert("object"==typeof p.symbols_),assert("object"==typeof p.terminals_),assert("function"==typeof p.performAction),assert("object"==typeof p.table),assert("function"==typeof p.parseError),assert("object"==typeof p.constructParseErrorInfo),assert("function"==typeof p.originalParseError),assert("object"==typeof p.options),assert("object"==typeof p.cleanupAfterParse),assert("object"==typeof p.yyMergeLocationInfo),assert("object"==typeof p.lexer||void 0===p.lexer),p.productions=this.productions,p.unused_productions=this.unused_productions,p.conflicts=this.conflicts,p.conflicts&&this.options.hasPartialLrUpgradeOnConflict&&(p.conflicts_have_been_fixed=this.conflict_fixing_round,p.conflict_productions_LU=this.conflict_productions_LU,p.conflict_states_LU=this.conflict_states_LU),p.sourceCode=sourceCodeDef;var self=this;function bind(e){return function(){return self.lexer=p.lexer,e.apply(self,arguments)}}return p.lexer=this.lexer,p.generate=bind(this.generate),p.generateAMDModule=bind(this.generateAMDModule),p.generateModule=bind(this.generateModule),p.generateCommonJSModule=bind(this.generateCommonJSModule),this.reportGrammarInformation(),p},parser.trace=generator.trace,parser.warn=generator.warn,parser.error=generator.error;let parseErrorSourceCode=`
function parseError(str, hash, ExceptionClass) {
    if (hash.recoverable) {
        if (typeof this.trace === 'function') {
            this.trace(str);
        }
        hash.destroy();             // destroy... well, *almost*!
    } else {
        if (typeof this.trace === 'function') {
            this.trace(str);
        }
        if (!ExceptionClass) {
            ExceptionClass = this.JisonParserError;
        }
        throw new ExceptionClass(str, hash);
    }
}
`;chkBugger(parseErrorSourceCode),parser.parseError=lrGeneratorMixin.parseError=eval(parseErrorSourceCode+"\n\nparseError;"),generatorMixin.createLexer=function(e,t,r,o){return new Lexer(e,t,r,o)};let define_parser_APIs_1=`
    TERROR: 2,
    EOF: 1,

    // internals: defined here so the object *structure* doesn't get modified by parse() et al,
    // thus helping JIT compilers like Chrome V8.
    originalQuoteName: null,
    originalParseError: null,
    cleanupAfterParse: null,
    constructParseErrorInfo: null,
    yyMergeLocationInfo: null,

    __reentrant_call_depth: 0,      // INTERNAL USE ONLY
    __error_infos: [],              // INTERNAL USE ONLY: the set of parseErrorInfo objects created since the last cleanup
    __error_recovery_infos: [],     // INTERNAL USE ONLY: the set of parseErrorInfo objects created since the last cleanup

    // APIs which will be set up depending on user action code analysis:
    //yyRecovering: 0,
    //yyErrOk: 0,
    //yyClearIn: 0,

    // Helper APIs
    // -----------

    // Helper function which can be overridden by user code later on: put suitable quotes around
    // literal IDs in a description string.
    quoteName: function parser_quoteName(id_str) {
        return '"' + id_str + '"';
    },

    // Return the name of the given symbol (terminal or non-terminal) as a string, when available.
    //
    // Return NULL when the symbol is unknown to the parser.
    getSymbolName: function parser_getSymbolName(symbol) {
        if (this.terminals_[symbol]) {
            return this.terminals_[symbol];
        }

        // Otherwise... this might refer to a RULE token i.e. a non-terminal: see if we can dig that one up.
        //
        // An example of this may be where a rule's action code contains a call like this:
        //
        //      parser.getSymbolName(#$)
        //
        // to obtain a human-readable name of the current grammar rule.
        var s = this.symbols_;
        for (var key in s) {
            if (s[key] === symbol) {
                return key;
            }
        }
        return null;
    },

    // Return a more-or-less human-readable description of the given symbol, when available,
    // or the symbol itself, serving as its own 'description' for lack of something better to serve up.
    //
    // Return NULL when the symbol is unknown to the parser.
    describeSymbol: function parser_describeSymbol(symbol) {
        if (symbol !== this.EOF && this.terminal_descriptions_ && this.terminal_descriptions_[symbol]) {
            return this.terminal_descriptions_[symbol];
        }
        else if (symbol === this.EOF) {
            return 'end of input';
        }
        var id = this.getSymbolName(symbol);
        if (id) {
            return this.quoteName(id);
        }
        return null;
    },

    // Produce a (more or less) human-readable list of expected tokens at the point of failure.
    //
    // The produced list may contain token or token set descriptions instead of the tokens
    // themselves to help turning this output into something that easier to read by humans
    // unless \`do_not_describe\` parameter is set, in which case a list of the raw, *numeric*,
    // expected terminals and nonterminals is produced.
    //
    // The returned list (array) will not contain any duplicate entries.
    collect_expected_token_set: function parser_collect_expected_token_set(state, do_not_describe) {
        var TERROR = this.TERROR;
        var tokenset = [];
        var check = {};
        // Has this (error?) state been outfitted with a custom expectations description text for human consumption?
        // If so, use that one instead of the less palatable token set.
        if (!do_not_describe && this.state_descriptions_ && this.state_descriptions_[state]) {
            return [
                this.state_descriptions_[state]
            ];
        }
        for (var p in this.table[state]) {
            p = +p;
            if (p !== TERROR) {
                var d = do_not_describe ? p : this.describeSymbol(p);
                if (d && !check[d]) {
                    tokenset.push(d);
                    check[d] = true;        // Mark this token description as already mentioned to prevent outputting duplicate entries.
                }
            }
        }
        return tokenset;
    }
`;var api_set=Function("","return { "+define_parser_APIs_1+" };")();for(var api in api_set)parser[api]=api_set[api];parser.parse=`
function parse(input, parseParams) {
    var self = this;
    var stack = new Array(128);         // token stack: stores token which leads to state at the same index (column storage)
    var sstack = new Array(128);        // state stack: stores states (column storage)
    var tstack = [];                    // token stack (only used when \`%options token_stack\` support has been enabled)
    var vstack = new Array(128);        // semantic value stack
    var lstack = new Array(128);        // location stack
    var table = this.table;
    var sp = 0;                         // 'stack pointer': index into the stacks
    var yyloc;
    var yytext;
    var yylineno;
    var yyleng;

    var symbol = 0;
    var preErrorSymbol = 0;
    var lastEofErrorStateDepth = Infinity;
    var recoveringErrorInfo = null;
    var recovering = 0;                 // (only used when the grammar contains error recovery rules)
    var TERROR = this.TERROR;
    var EOF = this.EOF;
    var ERROR_RECOVERY_TOKEN_DISCARD_COUNT = (this.options.errorRecoveryTokenDiscardCount | 0) || 3;
    var NO_ACTION = [0, YY_ERROR_RECOVERY_COMBINE_ID /* === table.length :: ensures that anyone using this new state will fail dramatically! */];

    var lexer;
    if (this.__lexer__) {
        lexer = this.__lexer__;
    } else {
        lexer = this.__lexer__ = Object.create(this.lexer);
    }

    var sharedState_yy = {
        parseError: undefined,
        quoteName: undefined,
        lexer: undefined,
        parser: undefined,
        pre_parse: undefined,
        post_parse: undefined,
        pre_lex: undefined,
        post_lex: undefined,
        parseParamsAsMembers: parseParamsAsMembers      // WARNING: must be written this way for the code expanders to work correctly in both ES5 and ES6 modes!
    };

    var ASSERT;
    if (typeof assert !== 'function') {
        ASSERT = function JisonAssert(cond, msg) {
            if (!cond) {
                throw new Error('assertion failed: ' + (msg || '***'));
            }
        };
    } else {
        ASSERT = assert;
    }

    this.yyGetSharedState = function yyGetSharedState() {
        return sharedState_yy;
    };

//_handle_error_with_recovery:                    // run this code when the grammar includes error recovery rules

    this.yyGetErrorInfoTrack = function yyGetErrorInfoTrack() {
        return recoveringErrorInfo;
    };

//_handle_error_no_recovery:                      // run this code when the grammar does not include any error recovery rules
//_handle_error_end_of_section:                   // this concludes the error recovery / no error recovery code section choice above

    // shallow clone objects, straight copy of simple \`src\` values
    // e.g. \`lexer.yytext\` MAY be a complex value object,
    // rather than a simple string/value.
    function shallow_copy(src) {
        if (typeof src === 'object') {
            var dst = {};
            for (var k in src) {
                if (Object.prototype.hasOwnProperty.call(src, k)) {
                    dst[k] = src[k];
                }
            }
            return dst;
        }
        return src;
    }
    function shallow_copy_noclobber(dst, src) {
        for (var k in src) {
            if (typeof dst[k] === 'undefined' && Object.prototype.hasOwnProperty.call(src, k)) {
                dst[k] = src[k];
            }
        }
    }
    function copy_yylloc(loc) {
        var rv = shallow_copy(loc);
        if (rv && rv.range) {
            rv.range = rv.range.slice(0);
        }
        return rv;
    }

    // copy state
    shallow_copy_noclobber(sharedState_yy, this.yy);

    sharedState_yy.lexer = lexer;
    sharedState_yy.parser = this;

    var yydebug = false;
    if (this.options.debug) {
        yydebug = function yydebug_impl(msg, obj) {
            var ref_list;
            var ref_names;

            function deepClone(from, sub) {
                if (sub == null) {
                    ref_list = [];
                    ref_names = [];
                    sub = 'root';
                }
                if (typeof from === 'function') return '[Function]';
                if (from == null || typeof from !== 'object') return from;
                if (from.constructor !== Object && from.constructor !== Array) {
                    return from;
                }

                for (var i = 0, len = ref_list.length; i < len; i++) {
                    if (ref_list[i] === from) {
                        return '[Circular/Xref:' + ref_names[i] + ']';   // circular or cross reference
                    }
                }
                ref_list.push(from);
                ref_names.push(sub);

                var to = new from.constructor();
                for (var name in from) {
                    if (name === 'parser') continue;
                    if (name === 'lexer') continue;
                    to[name] = deepClone(from[name], name);
                }
                return to;
            }

            obj = obj || {};
            if (obj.symbol) {
                obj.local_yytext = yytext;
                obj.lexer_yytext = lexer.yytext;
                obj.lexer_yylloc = lexer.yylloc;
                obj.lexer_yyllineno = lexer.yyllineno;
            }

            // warning: here we fetch from closure (stack et al)
            obj.symbol_stack = stack;
            obj.state_stack = sstack;
            obj.value_stack = vstack;
            obj.location_stack = lstack;
            obj.stack_pointer = sp;

            // ready the object for printing:
            obj = deepClone(obj);

            // wrap try/catch in a function to help the V8 JIT compiler...
            function yydebug_cvt(obj) {
                var js;
                try {
                    var re1;
                    if (typeof XRegExp === 'undefined') {
                        re1 = /  \\"([a-z_][a-z_0-9. ]*)\\": /ig;
                    } else {
                        re1 = new XRegExp('  \\"([\\\\p{Alphabetic}_][\\\\p{Alphabetic}\\\\p{Number}_. ]*)\\": ', 'g');
                    }
                    js = JSON.stringify(obj, null, 2)
                    .replace(re1, '  $1: ')
                    .replace(/[\\n\\s]+/g, ' ')
                    // shorten yylloc object dumps too:
                    .replace(/\\{ first_line: (\\d+), first_column: (\\d+), last_line: (\\d+), last_column: (\\d+)/g, '{L/C: ($1,$2)..($3,$4)');
                } catch (ex) {
                    js = String(obj);
                }
                return js;
            }

            self.trace(msg, yydebug_cvt(obj), '\\n');
        };
    }

    // disable debugging at run-time ANYWAY when you've *explicitly* set "yy.yydebug = false":
    if (sharedState_yy.yydebug === false) {
        yydebug = undefined;
    }

    // *Always* setup \`yyError\`, \`YYRECOVERING\`, \`yyErrOk\` and \`yyClearIn\` functions as it is paramount
    // to have *their* closure match ours -- if we only set them up once,
    // any subsequent \`parse()\` runs will fail in very obscure ways when
    // these functions are invoked in the user action code block(s) as
    // their closure will still refer to the \`parse()\` instance which set
    // them up. Hence we MUST set them up at the start of every \`parse()\` run!
    if (this.yyError) {
        this.yyError = function yyError(str /*, ...args */) {
            if (yydebug) yydebug('yyerror: ', { message: str, args: arguments, symbol: symbol, state: state, newState: newState, recovering: recovering, action: action });

//_handle_error_with_recovery:                    // run this code when the grammar includes error recovery rules

            var error_rule_depth = (this.options.parserErrorsAreRecoverable ? locateNearestErrorRecoveryRule(state) : -1);
            var expected = this.collect_expected_token_set(state);
            var hash = this.constructParseErrorInfo(str, null, expected, (error_rule_depth >= 0));
            // append to the old one?
            if (recoveringErrorInfo) {
                var esp = recoveringErrorInfo.info_stack_pointer;

                recoveringErrorInfo.symbol_stack[esp] = symbol;
                var v = this.shallowCopyErrorInfo(hash);
                v.yyError = true;
                v.errorRuleDepth = error_rule_depth;
                v.recovering = recovering;
                // v.stackSampleLength = error_rule_depth + EXTRA_STACK_SAMPLE_DEPTH;

                recoveringErrorInfo.value_stack[esp] = v;
                recoveringErrorInfo.location_stack[esp] = copy_yylloc(lexer.yylloc);
                recoveringErrorInfo.state_stack[esp] = newState || NO_ACTION[1];

                ++esp;
                recoveringErrorInfo.info_stack_pointer = esp;
            } else {
                recoveringErrorInfo = this.shallowCopyErrorInfo(hash);
                recoveringErrorInfo.yyError = true;
                recoveringErrorInfo.errorRuleDepth = error_rule_depth;
                recoveringErrorInfo.recovering = recovering;
            }

//_handle_error_no_recovery:                      // run this code when the grammar does not include any error recovery rules

            var expected = this.collect_expected_token_set(state);
            var hash = this.constructParseErrorInfo(str, null, expected, false);

//_handle_error_end_of_section:                   // this concludes the error recovery / no error recovery code section choice above

            // Add any extra args to the hash under the name \`extra_error_attributes\`:
            var args = Array.prototype.slice.call(arguments, 1);
            if (args.length) {
                hash.extra_error_attributes = args;
            }

            return this.parseError(str, hash, this.JisonParserError);
        };
    }

//_handle_error_with_recovery:                    // run this code when the grammar includes error recovery rules

    if (this.yyRecovering) {
        this.yyRecovering = function yyRecovering() {
            if (yydebug) yydebug('yyrecovering: ', { symbol: symbol, state: state, newState: newState, recovering: recovering, action: action });
            return recovering;
        };
    }

    if (this.yyErrOk) {
        this.yyErrOk = function yyErrOk() {
            if (yydebug) yydebug('yyerrok: ', { symbol: symbol, state: state, newState: newState, recovering: recovering, action: action });
            recovering = 0;

            // DO NOT reset/cleanup \`recoveringErrorInfo\` yet: userland code
            // MAY invoke this API before the error is actually fully
            // recovered, in which case the parser recovery code won't be able
            // to append the skipped tokens to this info object.
            // 
            // The rest of the kernel code is safe enough that it won't inadvertedly
            // re-use an old \`recoveringErrorInfo\` chunk so we'ld better wait
            // with destruction/cleanup until the end of the parse or until another
            // fresh parse error rears its ugly head...
            //
            // if (recoveringErrorInfo && typeof recoveringErrorInfo.destroy === 'function') {
            //     recoveringErrorInfo.destroy();
            //     recoveringErrorInfo = undefined;
            // }
        };
    }

    if (this.yyClearIn) {
        this.yyClearIn = function yyClearIn() {
            if (yydebug) yydebug('yyclearin: ', { symbol: symbol, newState: newState, recovering: recovering, action: action, preErrorSymbol: preErrorSymbol });
            if (symbol === TERROR) {
                symbol = 0;
                yytext = null;
                yyleng = 0;
                yyloc = undefined;
            }
            preErrorSymbol = 0;
        };
    }

//_handle_error_no_recovery:                      // run this code when the grammar does not include any error recovery rules
//_handle_error_end_of_section:                   // this concludes the error recovery / no error recovery code section choice above

    // Does the shared state override the default \`parseError\` that already comes with this instance?
    if (typeof sharedState_yy.parseError === 'function') {
        this.parseError = function parseErrorAlt(str, hash, ExceptionClass) {
            if (!ExceptionClass) {
                ExceptionClass = this.JisonParserError;
            }
            return sharedState_yy.parseError.call(this, str, hash, ExceptionClass);
        };
    } else {
        this.parseError = this.originalParseError;
    }

    // Does the shared state override the default \`quoteName\` that already comes with this instance?
    if (typeof sharedState_yy.quoteName === 'function') {
        this.quoteName = function quoteNameAlt(id_str) {
            return sharedState_yy.quoteName.call(this, id_str);
        };
    } else {
        this.quoteName = this.originalQuoteName;
    }

    // set up the cleanup function; make it an API so that external code can re-use this one in case of
    // calamities or when the \`%options no-try-catch\` option has been specified for the grammar, in which
    // case this parse() API method doesn't come with a \`finally { ... }\` block any more!
    //
    // NOTE: as this API uses parse() as a closure, it MUST be set again on every parse() invocation,
    //       or else your \`sharedState\`, etc. references will be *wrong*!
    this.cleanupAfterParse = function parser_cleanupAfterParse(resultValue, invoke_post_methods, do_not_nuke_errorinfos) {
        var rv;

        if (invoke_post_methods) {
            var hash;

            if (sharedState_yy.post_parse || this.post_parse) {
                // create an error hash info instance: we re-use this API in a **non-error situation**
                // as this one delivers all parser internals ready for access by userland code.
                hash = this.constructParseErrorInfo(null /* no error! */, null /* no exception! */, null, false);
            }

            if (sharedState_yy.post_parse) {
                rv = sharedState_yy.post_parse.call(this, sharedState_yy, resultValue, hash);
                if (typeof rv !== 'undefined') resultValue = rv;
            }
            if (this.post_parse) {
                rv = this.post_parse.call(this, sharedState_yy, resultValue, hash);
                if (typeof rv !== 'undefined') resultValue = rv;
            }

            // cleanup:
            if (hash && hash.destroy) {
                hash.destroy();
            }
        }

        if (this.__reentrant_call_depth > 1) return resultValue;        // do not (yet) kill the sharedState when this is a reentrant run.

        // clean up the lingering lexer structures as well:
        if (lexer.cleanupAfterLex) {
            lexer.cleanupAfterLex(do_not_nuke_errorinfos);
        }

        // prevent lingering circular references from causing memory leaks:
        if (sharedState_yy) {
            sharedState_yy.lexer = undefined;
            sharedState_yy.parser = undefined;
            if (lexer.yy === sharedState_yy) {
                lexer.yy = undefined;
            }
        }
        sharedState_yy = undefined;
        this.parseError = this.originalParseError;
        this.quoteName = this.originalQuoteName;

        // nuke the vstack[] array at least as that one will still reference obsoleted user values.
        // To be safe, we nuke the other internal stack columns as well...
        stack.length = 0;               // fastest way to nuke an array without overly bothering the GC
        sstack.length = 0;
        lstack.length = 0;
        vstack.length = 0;
        sp = 0;

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

//_handle_error_with_recovery:                    // run this code when the grammar includes error recovery rules

            for (var i = this.__error_recovery_infos.length - 1; i >= 0; i--) {
                var el = this.__error_recovery_infos[i];
                if (el && typeof el.destroy === 'function') {
                    el.destroy();
                }
            }
            this.__error_recovery_infos.length = 0;

            // \`recoveringErrorInfo\` is also part of the \`__error_recovery_infos\` array,
            // hence has been destroyed already: no need to do that *twice*.
            if (recoveringErrorInfo) {
                recoveringErrorInfo = undefined;
            }

//_handle_error_no_recovery:                      // run this code when the grammar does not include any error recovery rules
//_handle_error_end_of_section:                   // this concludes the error recovery / no error recovery code section choice above

        }

        return resultValue;
    };

    // merge yylloc info into a new yylloc instance.
    //
    // \`first_index\` and \`last_index\` MAY be UNDEFINED/NULL or these are indexes into the \`lstack[]\` location stack array.
    //
    // \`first_yylloc\` and \`last_yylloc\` MAY be UNDEFINED/NULL or explicit (custom or regular) \`yylloc\` instances, in which
    // case these override the corresponding first/last indexes.
    //
    // \`dont_look_back\` is an optional flag (default: FALSE), which instructs this merge operation NOT to search
    // through the parse location stack for a location, which would otherwise be used to construct the new (epsilon!)
    // yylloc info.
    //
    // Note: epsilon rule's yylloc situation is detected by passing both \`first_index\` and \`first_yylloc\` as UNDEFINED/NULL.
    this.yyMergeLocationInfo = function parser_yyMergeLocationInfo(first_index, last_index, first_yylloc, last_yylloc, dont_look_back) {
        var i1 = first_index | 0,
            i2 = last_index | 0;
        var l1 = first_yylloc,
            l2 = last_yylloc;
        var rv;

        // rules:
        // - first/last yylloc entries override first/last indexes

        if (!l1) {
            if (first_index != null) {
                for (var i = i1; i <= i2; i++) {
                    l1 = lstack[i];
                    if (l1) {
                        break;
                    }
                }
            }
        }

        if (!l2) {
            if (last_index != null) {
                for (var i = i2; i >= i1; i--) {
                    l2 = lstack[i];
                    if (l2) {
                        break;
                    }
                }
            }
        }

        // - detect if an epsilon rule is being processed and act accordingly:
        if (!l1 && first_index == null) {
            // epsilon rule span merger. With optional look-ahead in l2.
            if (!dont_look_back) {
                for (var i = (i1 || sp) - 1; i >= 0; i--) {
                    l1 = lstack[i];
                    if (l1) {
                        break;
                    }
                }
            }
            if (!l1) {
                if (!l2) {
                    // when we still don't have any valid yylloc info, we're looking at an epsilon rule
                    // without look-ahead and no preceding terms and/or \`dont_look_back\` set:
                    // in that case we ca do nothing but return NULL/UNDEFINED:
                    return undefined;
                } else {
                    // shallow-copy L2: after all, we MAY be looking
                    // at unconventional yylloc info objects...
                    rv = shallow_copy(l2);
                    if (rv.range) {
                        // shallow copy the yylloc ranges info to prevent us from modifying the original arguments' entries:
                        rv.range = rv.range.slice(0);
                    }
                    return rv;
                }
            } else {
                // shallow-copy L1, then adjust first col/row 1 column past the end.
                rv = shallow_copy(l1);
                rv.first_line = rv.last_line;
                rv.first_column = rv.last_column;
                if (rv.range) {
                    // shallow copy the yylloc ranges info to prevent us from modifying the original arguments' entries:
                    rv.range = rv.range.slice(0);
                    rv.range[0] = rv.range[1];
                }

                if (l2) {
                    // shallow-mixin L2, then adjust last col/row accordingly.
                    shallow_copy_noclobber(rv, l2);
                    rv.last_line = l2.last_line;
                    rv.last_column = l2.last_column;
                    if (rv.range && l2.range) {
                        rv.range[1] = l2.range[1];
                    }
                }
                return rv;
            }
        }

        if (!l1) {
            l1 = l2;
            l2 = null;
        }
        if (!l1) {
            return undefined;
        }

        // shallow-copy L1|L2, before we try to adjust the yylloc values: after all, we MAY be looking
        // at unconventional yylloc info objects...
        rv = shallow_copy(l1);

        // first_line: ...,
        // first_column: ...,
        // last_line: ...,
        // last_column: ...,
        if (rv.range) {
            // shallow copy the yylloc ranges info to prevent us from modifying the original arguments' entries:
            rv.range = rv.range.slice(0);
        }

        if (l2) {
            shallow_copy_noclobber(rv, l2);
            rv.last_line = l2.last_line;
            rv.last_column = l2.last_column;
            if (rv.range && l2.range) {
                rv.range[1] = l2.range[1];
            }
        }

        return rv;
    };

    // NOTE: as this API uses parse() as a closure, it MUST be set again on every parse() invocation,
    //       or else your \`lexer\`, \`sharedState\`, etc. references will be *wrong*!
    this.constructParseErrorInfo = function parser_constructParseErrorInfo(msg, ex, expected, recoverable) {
        var pei = {
            errStr: msg,
            exception: ex,
            text: lexer.match,
            value: lexer.yytext,
            token: this.describeSymbol(symbol) || symbol,
            token_id: symbol,
            line: lexer.yylineno,
            loc: copy_yylloc(lexer.yylloc),
            expected: expected,
            recoverable: recoverable,
            state: state,
            action: action,
            new_state: newState,
            symbol_stack: stack,
            state_stack: sstack,
            value_stack: vstack,
            location_stack: lstack,
            stack_pointer: sp,
            yy: sharedState_yy,
            lexer: lexer,
            parser: this,

            // and make sure the error info doesn't stay due to potential
            // ref cycle via userland code manipulations.
            // These would otherwise all be memory leak opportunities!
            //
            // Note that only array and object references are nuked as those
            // constitute the set of elements which can produce a cyclic ref.
            // The rest of the members is kept intact as they are harmless.
            destroy: function destructParseErrorInfo() {
                // remove cyclic references added to error info:
                // info.yy = null;
                // info.lexer = null;
                // info.value = null;
                // info.value_stack = null;
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
    };

    // clone some parts of the (possibly enhanced!) errorInfo object
    // to give them some persistence.
    this.shallowCopyErrorInfo = function parser_shallowCopyErrorInfo(p) {
        var rv = shallow_copy(p);

        // remove the large parts which can only cause cyclic references
        // and are otherwise available from the parser kernel anyway.
        delete rv.sharedState_yy;
        delete rv.parser;
        delete rv.lexer;

        // lexer.yytext MAY be a complex value object, rather than a simple string/value:
        rv.value = shallow_copy(rv.value);

        // yylloc info:
        rv.loc = copy_yylloc(rv.loc);

        // the 'expected' set won't be modified, so no need to clone it:
        //rv.expected = rv.expected.slice(0);

        //symbol stack is a simple array:
        rv.symbol_stack = rv.symbol_stack.slice(0);
        // ditto for state stack:
        rv.state_stack = rv.state_stack.slice(0);
        // clone the yylloc's in the location stack?:
        rv.location_stack = rv.location_stack.map(copy_yylloc);
        // and the value stack may carry both simple and complex values:
        // shallow-copy the latter.
        rv.value_stack = rv.value_stack.map(shallow_copy);

        // and we don't bother with the sharedState_yy reference:
        //delete rv.yy;

        // now we prepare for tracking the COMBINE actions
        // in the error recovery code path:
        //
        // as we want to keep the maximum error info context, we
        // *scan* the state stack to find the first *empty* slot.
        // This position will surely be AT OR ABOVE the current
        // stack pointer, but we want to keep the 'used but discarded'
        // part of the parse stacks *intact* as those slots carry
        // error context that may be useful when you want to produce
        // very detailed error diagnostic reports.
        //
        // ### Purpose of each stack pointer:
        //
        // - stack_pointer: points at the top of the parse stack
        //                  **as it existed at the time of the error
        //                  occurrence, i.e. at the time the stack
        //                  snapshot was taken and copied into the
        //                  errorInfo object.**
        // - base_pointer:  the bottom of the **empty part** of the
        //                  stack, i.e. **the start of the rest of
        //                  the stack space /above/ the existing
        //                  parse stack. This section will be filled
        //                  by the error recovery process as it
        //                  travels the parse state machine to
        //                  arrive at the resolving error recovery rule.**
        // - info_stack_pointer:
        //                  this stack pointer points to the **top of
        //                  the error ecovery tracking stack space**, i.e.
        //                  this stack pointer takes up the role of
        //                  the \`stack_pointer\` for the error recovery
        //                  process. Any mutations in the **parse stack**
        //                  are **copy-appended** to this part of the
        //                  stack space, keeping the bottom part of the
        //                  stack (the 'snapshot' part where the parse
        //                  state at the time of error occurrence was kept)
        //                  intact.
        // - root_failure_pointer:
        //                  copy of the \`stack_pointer\`...
        //
        for (var i = rv.stack_pointer; typeof rv.state_stack[i] !== 'undefined'; i++) {
            // empty
        }
        rv.base_pointer = i;
        rv.info_stack_pointer = i;

        rv.root_failure_pointer = rv.stack_pointer;

        // track this instance so we can \`destroy()\` it once we deem it superfluous and ready for garbage collection!
        this.__error_recovery_infos.push(rv);

        return rv;
    };

    function getNonTerminalFromCode(symbol) {
        var tokenName = self.getSymbolName(symbol);
        if (!tokenName) {
            tokenName = symbol;
        }
        return tokenName;
    }

//_lexer_without_token_stack:

    function stdLex() {
        var token = lexer.lex();
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }

        return token || EOF;
    }

    function fastLex() {
        var token = lexer.fastLex();
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }

        return token || EOF;
    }

    var lex = stdLex;

//_lexer_with_token_stack:

    // lex function that supports token stacks
    function tokenStackLex() {
        var token;
        token = tstack.pop() || lexer.lex() || EOF;
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            if (token instanceof Array) {
                tstack = token;
                token = tstack.pop();
            }
            // if token isn't its numeric value, convert
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
        }

        return token || EOF;
    }

//_lexer_with_token_stack_end:

    var state, action, r, t;
    var yyval = {
        $: true,
        _$: undefined,
        yy: sharedState_yy
    };
    var p;
    var yyrulelen;
    var this_production;
    var newState;
    var retval = false;

//_handle_error_with_recovery:                    // run this code when the grammar includes error recovery rules

    // Return the rule stack depth where the nearest error rule can be found.
    // Return -1 when no error recovery rule was found.
    function locateNearestErrorRecoveryRule(state) {
        var stack_probe = sp - 1;
        var depth = 0;

        // try to recover from error
        while (stack_probe >= 0) {
            // check for error recovery rule in this state
            if (yydebug) yydebug('locateNearestErrorRecoveryRule #test#: ', { symbol: symbol, state: state, depth: depth, stackidx: sp - 1 - depth, lastidx: lastEofErrorStateDepth });
            var t = table[state][TERROR] || NO_ACTION;
            if (t[0]) {
                // We need to make sure we're not cycling forever:
                // once we hit EOF, even when we \`yyerrok()\` an error, we must
                // prevent the core from running forever,
                // e.g. when parent rules are still expecting certain input to
                // follow after this, for example when you handle an error inside a set
                // of braces which are matched by a parent rule in your grammar.
                //
                // Hence we require that every error handling/recovery attempt
                // *after we've hit EOF* has a diminishing state stack: this means
                // we will ultimately have unwound the state stack entirely and thus
                // terminate the parse in a controlled fashion even when we have
                // very complex error/recovery code interplay in the core + user
                // action code blocks:
                if (yydebug) yydebug('locateNearestErrorRecoveryRule #found#: ', { symbol: symbol, state: state, depth: depth, stackidx: sp - 1 - depth, lastidx: lastEofErrorStateDepth });
                if (symbol === EOF) {
                    if (lastEofErrorStateDepth > sp - 1 - depth) {
                        lastEofErrorStateDepth = sp - 1 - depth;
                    } else {
                        if (yydebug) yydebug('locateNearestErrorRecoveryRule #skip#: ', { symbol: symbol, state: state, depth: depth, stackidx: sp - 1 - depth, lastidx: lastEofErrorStateDepth });
                        --stack_probe; // popStack(1): [symbol, action]
                        state = sstack[stack_probe];
                        ++depth;
                        continue;
                    }
                }
                return depth;
            }
            if (state === 0 /* $accept rule */ || stack_probe < 1) {
                if (yydebug) yydebug('locateNearestErrorRecoveryRule #end=NIL#: ', { symbol: symbol, state: state, depth: depth, stackidx: sp - 1 - depth, lastidx: lastEofErrorStateDepth });
                return -1; // No suitable error recovery rule available.
            }
            --stack_probe; // popStack(1): [symbol, action]
            state = sstack[stack_probe];
            ++depth;
        }
        if (yydebug) yydebug('locateNearestErrorRecoveryRule #EMPTY#: ', { symbol: symbol, state: state, depth: depth, stackidx: sp - 1 - depth, lastidx: lastEofErrorStateDepth });
        return -1; // No suitable error recovery rule available.
    }

//_handle_error_no_recovery:                      // run this code when the grammar does not include any error recovery rules
//_handle_error_end_of_section:                   // this concludes the error recovery / no error recovery code section choice above

    try {
        this.__reentrant_call_depth++;

        lexer.setInput(input, sharedState_yy);

        // NOTE: we *assume* no lexer pre/post handlers are set up *after* 
        // this initial \`setInput()\` call: hence we can now check and decide
        // whether we'll go with the standard, slower, lex() API or the
        // \`fast_lex()\` one:
        if (typeof lexer.canIUse === 'function') {
            var lexerInfo = lexer.canIUse();
            if (lexerInfo.fastLex && typeof fastLex === 'function') {
                lex = fastLex;
            }
        } 

        yyloc = lexer.yylloc;
        lstack[sp] = yyloc;
        vstack[sp] = null;
        sstack[sp] = 0;
        stack[sp] = 0;
        ++sp;

        yytext = lexer.yytext;
        yylineno = lexer.yylineno;
        yyleng = lexer.yyleng;

        if (this.pre_parse) {
            this.pre_parse.call(this, sharedState_yy);
        }
        if (sharedState_yy.pre_parse) {
            sharedState_yy.pre_parse.call(this, sharedState_yy);
        }

        newState = sstack[sp - 1];
        for (;;) {
            // retrieve state number from top of stack
            state = newState;               // sstack[sp - 1];

            // use default actions if available
            if (this.defaultActions[state]) {
                action = 2;
                newState = this.defaultActions[state];
            } else {
                // The single \`==\` condition below covers both these \`===\` comparisons in a single
                // operation:
                //
                //     if (symbol === null || typeof symbol === 'undefined') ...
                if (!symbol) {
                    symbol = lex();
                }
                // read action for current state and first input
                t = (table[state] && table[state][symbol]) || NO_ACTION;
                newState = t[1];
                action = t[0];

                if (yydebug) yydebug('after FETCH/LEX: ', { symbol: symbol, symbolID: this.terminals_ && this.terminals_[symbol], state: state, newState: newState, recovering: recovering, action: action });

//_handle_error_with_recovery:                // run this code when the grammar includes error recovery rules

                // handle parse error
                if (!action) {
                    // first see if there's any chance at hitting an error recovery rule:
                    var error_rule_depth = locateNearestErrorRecoveryRule(state);
                    var errStr = null;
                    var errSymbolDescr = (this.describeSymbol(symbol) || symbol);
                    var expected = this.collect_expected_token_set(state);

                    if (!recovering) {
                        // Report error
                        if (typeof lexer.yylineno === 'number') {
                            errStr = 'Parse error on line ' + (lexer.yylineno + 1) + ': ';
                        } else {
                            errStr = 'Parse error: ';
                        }

                        if (typeof lexer.showPosition === 'function') {
                            errStr += '\\n' + lexer.showPosition(79 - 10, 10) + '\\n';
                        }
                        if (expected.length) {
                            errStr += 'Expecting ' + expected.join(', ') + ', got unexpected ' + errSymbolDescr;
                        } else {
                            errStr += 'Unexpected ' + errSymbolDescr;
                        }

                        p = this.constructParseErrorInfo(errStr, null, expected, (error_rule_depth >= 0));

                        // DO NOT cleanup the old one before we start the new error info track:
                        // the old one will *linger* on the error stack and stay alive until we 
                        // invoke the parser's cleanup API!
                        recoveringErrorInfo = this.shallowCopyErrorInfo(p);

                        if (yydebug) yydebug('error recovery rule detected: ', { error_rule_depth: error_rule_depth, error: p.errStr, error_hash: p });

                        r = this.parseError(p.errStr, p, this.JisonParserError);
                        if (typeof r !== 'undefined') {
                            retval = r;
                            break;
                        }

                        // Protect against overly blunt userland \`parseError\` code which *sets*
                        // the \`recoverable\` flag without properly checking first:
                        // we always terminate the parse when there's no recovery rule available anyhow!
                        if (!p.recoverable || error_rule_depth < 0) {
                            break;
                        } else {
                            // TODO: allow parseError callback to edit symbol and or state at the start of the error recovery process...
                        }
                    }

                    if (yydebug) yydebug('after ERROR DETECT: ', { error_rule_depth: error_rule_depth, error: p.errStr, error_hash: p });

                    var esp = recoveringErrorInfo.info_stack_pointer;

                    // just recovered from another error
                    if (recovering === ERROR_RECOVERY_TOKEN_DISCARD_COUNT && error_rule_depth >= 0) {
                        // SHIFT current lookahead and grab another
                        recoveringErrorInfo.symbol_stack[esp] = symbol;
                        recoveringErrorInfo.value_stack[esp] = shallow_copy(lexer.yytext);
                        recoveringErrorInfo.location_stack[esp] = copy_yylloc(lexer.yylloc);
                        recoveringErrorInfo.state_stack[esp] = newState; // push state
                        ++esp;

                        // Pick up the lexer details for the current symbol as that one is not 'look-ahead' any more:
                        yyleng = lexer.yyleng;
                        yytext = lexer.yytext;
                        yylineno = lexer.yylineno;
                        yyloc = lexer.yylloc;

                        preErrorSymbol = 0;
                        symbol = lex();

                        if (yydebug) yydebug('after ERROR RECOVERY-3: ', { symbol: symbol, symbolID: this.terminals_ && this.terminals_[symbol] });
                    }

                    // try to recover from error
                    if (error_rule_depth < 0) {
                        ASSERT(recovering > 0, "line 897");
                        recoveringErrorInfo.info_stack_pointer = esp;

                        // barf a fatal hairball when we're out of look-ahead symbols and none hit a match
                        // while we are still busy recovering from another error:
                        var po = this.__error_infos[this.__error_infos.length - 1];

                        // Report error
                        if (typeof lexer.yylineno === 'number') {
                            errStr = 'Parsing halted on line ' + (lexer.yylineno + 1) + ' while starting to recover from another error';
                        } else {
                            errStr = 'Parsing halted while starting to recover from another error';
                        }

                        if (po) {
                            errStr += ' -- previous error which resulted in this fatal result: ' + po.errStr;
                        } else {
                            errStr += ': ';
                        }

                        if (typeof lexer.showPosition === 'function') {
                            errStr += '\\n' + lexer.showPosition(79 - 10, 10) + '\\n';
                        }
                        if (expected.length) {
                            errStr += 'Expecting ' + expected.join(', ') + ', got unexpected ' + errSymbolDescr;
                        } else {
                            errStr += 'Unexpected ' + errSymbolDescr;
                        }

                        p = this.constructParseErrorInfo(errStr, null, expected, false);
                        if (po) {
                            p.extra_error_attributes = po;
                        }

                        r = this.parseError(p.errStr, p, this.JisonParserError);
                        if (typeof r !== 'undefined') {
                            retval = r;
                        }
                        break;
                    }

                    preErrorSymbol = (symbol === TERROR ? 0 : symbol); // save the lookahead token
                    symbol = TERROR;            // insert generic error symbol as new lookahead

                    const EXTRA_STACK_SAMPLE_DEPTH = 3;

                    // REDUCE/COMBINE the pushed terms/tokens to a new ERROR token:
                    recoveringErrorInfo.symbol_stack[esp] = preErrorSymbol;
                    if (errStr) {
                        recoveringErrorInfo.value_stack[esp] = {
                            yytext: shallow_copy(lexer.yytext),
                            errorRuleDepth: error_rule_depth,
                            errStr: errStr,
                            errorSymbolDescr: errSymbolDescr,
                            expectedStr: expected,
                            stackSampleLength: error_rule_depth + EXTRA_STACK_SAMPLE_DEPTH
                        };
                        if (yydebug) yydebug('Error recovery process: pushed error info item on the info stack: ', {
                            item: vstack[sp],
                            sp,
                            esp,
                            vstack,
                            stack,
                            sstack,
                            combineState: NO_ACTION[1]
                        });
                    } else {
                        recoveringErrorInfo.value_stack[esp] = {
                            yytext: shallow_copy(lexer.yytext),
                            errorRuleDepth: error_rule_depth,
                            stackSampleLength: error_rule_depth + EXTRA_STACK_SAMPLE_DEPTH
                        };
                    }
                    recoveringErrorInfo.location_stack[esp] = copy_yylloc(lexer.yylloc);
                    recoveringErrorInfo.state_stack[esp] = newState || NO_ACTION[1];

                    ++esp;
                    recoveringErrorInfo.info_stack_pointer = esp;

                    yyval.$ = recoveringErrorInfo;
                    yyval._$ = undefined;

                    yyrulelen = error_rule_depth;

                    if (yydebug) yydebug('Error recovery process: performAction: COMBINE: ', {
                        yyval, yytext, sp, pop_size: yyrulelen, vstack, stack, sstack,
                        combineState: NO_ACTION[1]
                    });
                    r = this.performAction.call(yyval, yytext, yyleng, yylineno, yyloc, NO_ACTION[1], sp - 1, yyrulelen, vstack, lstack, stack, sstack);

                    if (typeof r !== 'undefined') {
                        retval = r;
                        break;
                    }

                    // pop off stack
                    sp -= yyrulelen;

                    // and move the top entries + discarded part of the parse stacks onto the error info stack:
                    for (var idx = sp - EXTRA_STACK_SAMPLE_DEPTH, top = idx + yyrulelen; idx < top; idx++, esp++) {
                        recoveringErrorInfo.symbol_stack[esp] = stack[idx];
                        recoveringErrorInfo.value_stack[esp] = shallow_copy(vstack[idx]);
                        recoveringErrorInfo.location_stack[esp] = copy_yylloc(lstack[idx]);
                        recoveringErrorInfo.state_stack[esp] = sstack[idx];
                    }

                    recoveringErrorInfo.symbol_stack[esp] = TERROR;
                    recoveringErrorInfo.value_stack[esp] = shallow_copy(yyval.$);
                    recoveringErrorInfo.location_stack[esp] = copy_yylloc(yyval._$);

                    // goto new state = table[STATE][NONTERMINAL]
                    newState = sstack[sp - 1];

                    if (this.defaultActions[newState]) {
                        recoveringErrorInfo.state_stack[esp] = this.defaultActions[newState];
                    } else {
                        t = (table[newState] && table[newState][symbol]) || NO_ACTION;
                        recoveringErrorInfo.state_stack[esp] = t[1];
                    }

                    ++esp;
                    recoveringErrorInfo.info_stack_pointer = esp;

                    // allow N (default: 3) real symbols to be shifted before reporting a new error
                    recovering = ERROR_RECOVERY_TOKEN_DISCARD_COUNT;

                    if (yydebug) yydebug('after ERROR POP: ', { error_rule_depth: error_rule_depth, symbol: symbol, preErrorSymbol: preErrorSymbol });

                    // Now duplicate the standard parse machine here, at least its initial
                    // couple of rounds until the TERROR symbol is **pushed onto the parse stack**,
                    // as we wish to push something special then!
                    //
                    // Run the state machine in this copy of the parser state machine
                    // until we *either* consume the error symbol (and its related information)
                    // *or* we run into another error while recovering from this one
                    // *or* we execute a \`reduce\` action which outputs a final parse
                    // result (yes, that MAY happen!).
                    //
                    // We stay in this secondary parse loop until we have completed
                    // the *error recovery phase* as the main parse loop (further below)
                    // is optimized for regular parse operation and DOES NOT cope with
                    // error recovery *at all*.
                    //
                    // We call the secondary parse loop just below the "slow parse loop",
                    // while the main parse loop, which is an almost-duplicate of this one,
                    // yet optimized for regular parse operation, is called the "fast
                    // parse loop".
                    //
                    // Compare this to \`bison\` & (vanilla) \`jison\`, both of which have
                    // only a single parse loop, which handles everything. Our goal is
                    // to eke out every drop of performance in the main parse loop...

                    ASSERT(recoveringErrorInfo, "line 1049");
                    ASSERT(symbol === TERROR, "line 1050");
                    ASSERT(!action, "line 1051");
                    var errorSymbolFromParser = true;
                    for (;;) {
                        // retrieve state number from top of stack
                        state = newState;               // sstack[sp - 1];

                        // use default actions if available
                        if (this.defaultActions[state]) {
                            action = 2;
                            newState = this.defaultActions[state];
                        } else {
                            // The single \`==\` condition below covers both these \`===\` comparisons in a single
                            // operation:
                            //
                            //     if (symbol === null || typeof symbol === 'undefined') ...
                            if (!symbol) {
                                symbol = lex();
                                // **Warning: Edge Case**: the *lexer* may produce
                                // TERROR tokens of its own volition: *those* TERROR
                                // tokens should be treated like *regular tokens*
                                // i.e. tokens which have a lexer-provided \`yyvalue\`
                                // and \`yylloc\`:
                                errorSymbolFromParser = false;
                            }
                            // read action for current state and first input
                            t = (table[state] && table[state][symbol]) || NO_ACTION;
                            newState = t[1];
                            action = t[0];

                            if (yydebug) yydebug('after FETCH/LEX: ', { symbol: symbol, symbolID: this.terminals_ && this.terminals_[symbol], state: state, newState: newState, recovering: recovering, action: action });

                            // encountered another parse error? If so, break out to main loop
                            // and take it from there!
                            if (!action) {
                                if (yydebug) yydebug('**NESTED ERROR DETECTED** while still recovering from previous error');

                                ASSERT(recoveringErrorInfo, "line 1087");

                                // Prep state variables so that upon breaking out of
                                // this "slow parse loop" and hitting the \`continue;\`
                                // statement in the outer "fast parse loop" we redo
                                // the exact same state table lookup as the one above
                                // so that the outer=main loop will also correctly
                                // detect the 'parse error' state (\`!action\`) we have
                                // just encountered above.
                                newState = state;
                                break;
                            }
                        }

                        if (yydebug) yydebug('::: SLOW ERROR RECOVERY PHASE CYCLE action: ' + (action === 1 ? 'shift token ' + symbol + ' (then go to state ' + newState + ')' : action === 2 ? 'reduce by rule: ' + newState + (function __print_rule(nt, state) {
                            if (!nt || !nt.states || !nt.rules)
                              return '';
                            var rulename = nt.states[state];
                            var rulespec = nt.rules[rulename][state];
                            return ' (' + rulespec.symbol + ' := ' + rulespec.handle + ')';
                        })(this.nonterminals_, newState) : action === 3 ? 'accept' : '???unexpected???'), { action: action, newState: newState, recovering: recovering, symbol: symbol });

                        switch (action) {
                        // catch misc. parse failures:
                        default:
                            // this shouldn't happen, unless resolve defaults are off
                            //
                            // SILENTLY SIGNAL that the outer "fast parse loop" should
                            // take care of this internal error condition:
                            // prevent useless code duplication now/here.
                            break;

                        // shift:
                        case 1:
                            stack[sp] = symbol;
                            // ### Note/Warning ###
                            //
                            // The *lexer* may also produce TERROR tokens on its own,
                            // so we specifically test for the TERROR we did set up
                            // in the error recovery logic further above!
                            if (symbol === TERROR && errorSymbolFromParser) {
                                // Push a special value onto the stack when we're
                                // shifting the \`error\` symbol that is related to the
                                // error we're recovering from.
                                ASSERT(recoveringErrorInfo, "line 1131");
                                vstack[sp] = recoveringErrorInfo;
                                lstack[sp] = this.yyMergeLocationInfo(null, null, recoveringErrorInfo.loc, lexer.yylloc, true);
                            } else {
                                ASSERT(symbol !== 0, "line 1135");
                                ASSERT(preErrorSymbol === 0, "line 1136");
                                vstack[sp] = lexer.yytext;
                                lstack[sp] = copy_yylloc(lexer.yylloc);
                            }
                            sstack[sp] = newState; // push state

                            ++sp;
                            symbol = 0;
                            // **Warning: Edge Case**: the *lexer* may have produced
                            // TERROR tokens of its own volition: *those* TERROR
                            // tokens should be treated like *regular tokens*
                            // i.e. tokens which have a lexer-provided \`yyvalue\`
                            // and \`yylloc\`:
                            errorSymbolFromParser = false;
                            if (!preErrorSymbol) { // normal execution / no error
                                // Pick up the lexer details for the current symbol as that one is not 'look-ahead' any more:
                                yyleng = lexer.yyleng;
                                yytext = lexer.yytext;
                                yylineno = lexer.yylineno;
                                yyloc = lexer.yylloc;

                                if (recovering > 0) {
                                    recovering--;
                                    if (yydebug) yydebug('... SHIFT:error rule matching: ', { recovering: recovering, symbol: symbol });
                                }
                            } else {
                                // error just occurred, resume old lookahead f/ before error, *unless* that drops us straight back into error mode:
                                ASSERT(recovering > 0, "line 1163");
                                symbol = preErrorSymbol;
                                preErrorSymbol = 0;
                                if (yydebug) yydebug('... SHIFT:error recovery: ', { recovering: recovering, symbol: symbol });
                                // read action for current state and first input
                                t = (table[newState] && table[newState][symbol]) || NO_ACTION;
                                if (!t[0] || symbol === TERROR) {
                                    // forget about that symbol and move forward: this wasn't a 'forgot to insert' error type where
                                    // (simple) stuff might have been missing before the token which caused the error we're
                                    // recovering from now...
                                    //
                                    // Also check if the LookAhead symbol isn't the ERROR token we set as part of the error
                                    // recovery, for then this we would we idling (cycling) on the error forever.
                                    // Yes, this does not take into account the possibility that the *lexer* may have
                                    // produced a *new* TERROR token all by itself, but that would be a very peculiar grammar!
                                    if (yydebug) yydebug('... SHIFT:error recovery: re-application of old symbol doesn\\'t work: instead, we\\'re moving forward now. ', { recovering: recovering, symbol: symbol });
                                    symbol = 0;
                                }
                            }

                            // once we have pushed the special ERROR token value,
                            // we REMAIN in this inner, "slow parse loop" until
                            // the entire error recovery phase has completed.
                            //
                            // ### Note About Edge Case ###
                            //
                            // Userland action code MAY already have 'reset' the
                            // error recovery phase marker \`recovering\` to ZERO(0)
                            // while the error symbol hasn't been shifted onto
                            // the stack yet. Hence we only exit this "slow parse loop"
                            // when *both* conditions are met!
                            ASSERT(preErrorSymbol === 0, "line 1194");
                            if (recovering === 0) {
                                break;
                            }
                            continue;

                        // reduce:
                        case 2:
                            this_production = this.productions_[newState - 1];  // \`this.productions_[]\` is zero-based indexed while states start from 1 upwards...
                            yyrulelen = this_production[1];

                            if (yydebug) yydebug('~~~ REDUCE: ', { pop_size: yyrulelen, newState: newState, recovering: recovering, symbol: symbol });

                            r = this.performAction.call(yyval, yytext, yyleng, yylineno, yyloc, newState, sp - 1, yyrulelen, vstack, lstack, stack, sstack);

                            if (typeof r !== 'undefined') {
                                // signal end of error recovery loop AND end of outer parse loop
                                action = 3;
                                sp = -2;      // magic number: signal outer "fast parse loop" ACCEPT state that we already have a properly set up \`retval\` parser return value.
                                retval = r;
                                break;
                            }

                            // pop off stack
                            sp -= yyrulelen;

                            // don't overwrite the \`symbol\` variable: use a local var to speed things up:
                            var ntsymbol = this_production[0];    // push nonterminal (reduce)
                            stack[sp] = ntsymbol;
                            vstack[sp] = yyval.$;
                            lstack[sp] = yyval._$;
                            // goto new state = table[STATE][NONTERMINAL]
                            newState = table[sstack[sp - 1]][ntsymbol];
                            sstack[sp] = newState;
                            ++sp;
                            if (yydebug) yydebug('REDUCED: ', { newState: newState, recovering: recovering, symbol: symbol });
                            continue;

                        // accept:
                        case 3:
                            retval = true;
                            // Return the \`$accept\` rule's \`$$\` result, if available.
                            //
                            // Also note that JISON always adds this top-most \`$accept\` rule (with implicit,
                            // default, action):
                            //
                            //     $accept: <startSymbol> $end
                            //                  %{ $$ = $1; @$ = @1; %}
                            //
                            // which, combined with the parse kernel's \`$accept\` state behaviour coded below,
                            // will produce the \`$$\` value output of the <startSymbol> rule as the parse result,
                            // IFF that result is *not* \`undefined\`. (See also the parser kernel code.)
                            //
                            // In code:
                            //
                            //                  %{
                            //                      @$ = @1;            // if location tracking support is included
                            //                      if (typeof $1 !== 'undefined')
                            //                          return $1;
                            //                      else
                            //                          return true;           // the default parse result if the rule actions don't produce anything
                            //                  %}
                            sp--;
                            if (sp >= 0 && typeof vstack[sp] !== 'undefined') {
                                retval = vstack[sp];
                            }
                            sp = -2;      // magic number: signal outer "fast parse loop" ACCEPT state that we already have a properly set up \`retval\` parser return value.
                            break;
                        }

                        // break out of loop: we accept or fail with error
                        break;
                    }

                    // should we also break out of the regular/outer parse loop,
                    // i.e. did the parser already produce a parse result in here?!
                    // *or* did we hit an unsupported parse state, to be handled
                    // in the \`switch/default\` code further below?
                    ASSERT(action !== 2, "line 1272");
                    if (!action || action === 1) {
                        continue;
                    }
                }

//_handle_error_no_recovery:                  // run this code when the grammar does not include any error recovery rules

                // handle parse error
                if (!action) {
                    var errStr;
                    var errSymbolDescr = (this.describeSymbol(symbol) || symbol);
                    var expected = this.collect_expected_token_set(state);

                    // Report error
                    if (typeof lexer.yylineno === 'number') {
                        errStr = 'Parse error on line ' + (lexer.yylineno + 1) + ': ';
                    } else {
                        errStr = 'Parse error: ';
                    }
                    if (typeof lexer.showPosition === 'function') {
                        errStr += '\\n' + lexer.showPosition(79 - 10, 10) + '\\n';
                    }
                    if (expected.length) {
                        errStr += 'Expecting ' + expected.join(', ') + ', got unexpected ' + errSymbolDescr;
                    } else {
                        errStr += 'Unexpected ' + errSymbolDescr;
                    }
                    // we cannot recover from the error!
                    p = this.constructParseErrorInfo(errStr, null, expected, false);
                    r = this.parseError(p.errStr, p, this.JisonParserError);
                    if (typeof r !== 'undefined') {
                        retval = r;
                    }
                    break;
                }

//_handle_error_end_of_section:                  // this concludes the error recovery / no error recovery code section choice above

            }

            if (yydebug) yydebug('::: MAIN CYCLE action: ' + (action === 1 ? 'shift token ' + symbol + ' (then go to state ' + newState + ')' : action === 2 ? 'reduce by rule: ' + newState + (function __print_rule(nt, state) {
                if (!nt || !nt.states || !nt.rules)
                  return '';
                var rulename = nt.states[state];
                var rulespec = nt.rules[rulename][state];
                return ' (' + rulespec.symbol + ' := ' + rulespec.handle + ')';
            })(this.nonterminals_, newState) : action === 3 ? 'accept' : '???unexpected???'), { action: action, newState: newState, recovering: recovering, symbol: symbol });

            switch (action) {
            // catch misc. parse failures:
            default:
                // this shouldn't happen, unless resolve defaults are off
                if (action instanceof Array) {
                    p = this.constructParseErrorInfo('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol, null, null, false);
                    r = this.parseError(p.errStr, p, this.JisonParserError);
                    if (typeof r !== 'undefined') {
                        retval = r;
                    }
                    break;
                }
                // Another case of better safe than sorry: in case state transitions come out of another error recovery process
                // or a buggy LUT (LookUp Table):
                p = this.constructParseErrorInfo('Parsing halted. No viable error recovery approach available due to internal system failure.', null, null, false);
                r = this.parseError(p.errStr, p, this.JisonParserError);
                if (typeof r !== 'undefined') {
                    retval = r;
                }
                break;

            // shift:
            case 1:
                stack[sp] = symbol;
                vstack[sp] = lexer.yytext;
                lstack[sp] = copy_yylloc(lexer.yylloc);
                sstack[sp] = newState; // push state

                ++sp;
                symbol = 0;

                ASSERT(preErrorSymbol === 0, "line 1352");         // normal execution / no error
                ASSERT(recovering === 0, "line 1353");             // normal execution / no error

                // Pick up the lexer details for the current symbol as that one is not 'look-ahead' any more:
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                continue;

            // reduce:
            case 2:
                ASSERT(preErrorSymbol === 0, "line 1364");         // normal execution / no error
                ASSERT(recovering === 0, "line 1365");             // normal execution / no error

                this_production = this.productions_[newState - 1];  // \`this.productions_[]\` is zero-based indexed while states start from 1 upwards...
                yyrulelen = this_production[1];

                if (yydebug) yydebug('~~~ REDUCE: ', { pop_size: yyrulelen, newState: newState, recovering: recovering, symbol: symbol });

                r = this.performAction.call(yyval, yytext, yyleng, yylineno, yyloc, newState, sp - 1, yyrulelen, vstack, lstack, stack, sstack);

                if (typeof r !== 'undefined') {
                    retval = r;
                    break;
                }

                // pop off stack
                sp -= yyrulelen;

                // don't overwrite the \`symbol\` variable: use a local var to speed things up:
                var ntsymbol = this_production[0];    // push nonterminal (reduce)
                stack[sp] = ntsymbol;
                vstack[sp] = yyval.$;
                lstack[sp] = yyval._$;
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[sstack[sp - 1]][ntsymbol];
                sstack[sp] = newState;
                ++sp;
                if (yydebug) yydebug('REDUCED: ', { newState: newState, recovering: recovering, symbol: symbol });
                continue;

            // accept:
            case 3:
                if (sp !== -2) {
                    retval = true;
                    // Return the \`$accept\` rule's \`$$\` result, if available.
                    //
                    // Also note that JISON always adds this top-most \`$accept\` rule (with implicit,
                    // default, action):
                    //
                    //     $accept: <startSymbol> $end
                    //                  %{ $$ = $1; @$ = @1; %}
                    //
                    // which, combined with the parse kernel's \`$accept\` state behaviour coded below,
                    // will produce the \`$$\` value output of the <startSymbol> rule as the parse result,
                    // IFF that result is *not* \`undefined\`. (See also the parser kernel code.)
                    //
                    // In code:
                    //
                    //                  %{
                    //                      @$ = @1;            // if location tracking support is included
                    //                      if (typeof $1 !== 'undefined')
                    //                          return $1;
                    //                      else
                    //                          return true;           // the default parse result if the rule actions don't produce anything
                    //                  %}
                    sp--;
                    if (typeof vstack[sp] !== 'undefined') {
                        retval = vstack[sp];
                    }
                }
                break;
            }

            // break out of loop: we accept or fail with error
            break;
        }
    } catch (ex) {
        // report exceptions through the parseError callback too, but keep the exception intact
        // if it is a known parser or lexer error which has been thrown by parseError() already:
        if (ex instanceof this.JisonParserError) {
            throw ex;
        }
        else if (lexer && typeof lexer.JisonLexerError === 'function' && ex instanceof lexer.JisonLexerError) {
            throw ex;
        }

        p = this.constructParseErrorInfo('Parsing aborted due to exception.', ex, null, false);
        retval = false;
        r = this.parseError(p.errStr, p, this.JisonParserError);
        if (typeof r !== 'undefined') {
            retval = r;
        }
    } finally {
        retval = this.cleanupAfterParse(retval, true, true);
        this.__reentrant_call_depth--;
    }   // /finally

    return retval;
}
`;var lr0=generator.beget(lookaheadMixin,generatorMixin,lrGeneratorMixin,{type:"LR(0)",afterconstructor:function(){this.buildTable()}}),LR0Generator=Jison.LR0Generator=lr0.construct(),lalr=generator.beget(lookaheadMixin,generatorMixin,lrGeneratorMixin,{type:"LALR(1)",afterconstructor:function(){var e=this;this.DEBUG&&this.mix(lrGeneratorDebug,lalrGeneratorDebug);for(var t=1;;t++){this.states=this.canonicalCollection(),(this.DEBUG||devDebug)&&(Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER canonicalCollection:"),this.displayFollowSets(),Jison.print("\n")),this.terms_={};var r=this.newg=typal.beget(lookaheadMixin,{oldg:this,trace:this.trace,nterms_:{},DEBUG:!1,go_:function(e,t){var r=e.split(":")[0];return assert(r==+r),r*=1,t=t.map(function(e){return e.slice(e.indexOf(":")+1)}),this.oldg.go(r,t,e)}});if(r.nonterminals={},r.productions=[],this.onDemandLookahead=!!this.options.onDemandLookahead,this.DEBUG&&Jison.print("LALR: using on-demand look-ahead: ",this.onDemandLookahead?"yes":"no"),this.buildNewGrammar(),this.DEBUG&&(Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER buildNewGrammar: NEW GRAMMAR"),r.displayFollowSets(),Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER buildNewGrammar: ORIGINAL GRAMMAR"),this.displayFollowSets()),r.computeLookaheads(),each(r.nonterminals,function(t,r){var o,n=t.symbol.split(":");1===n.length||""===n[0]?o=t.symbol:(n.shift(),o=n.join(":")),e.nonterminals[o]&&t.nullable&&(e.nonterminals[o].nullable=!0)}),this.DEBUG&&(Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER computeLookaheads: NEW GRAMMAR"),r.displayFollowSets(),Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER computeLookaheads: ORIGINAL GRAMMAR"),this.displayFollowSets()),this.unionLookaheads(),this.DEBUG&&(Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER unionLookaheads: NEW GRAMMAR"),r.displayFollowSets(),Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER unionLookaheads: ORIGINAL GRAMMAR"),this.displayFollowSets()),this.table=this.parseTable(this.states),this.DEBUG&&(Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER parseTable: NEW GRAMMAR"),r.displayFollowSets(),Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER parseTable: ORIGINAL GRAMMAR"),this.displayFollowSets()),0===this.conflicts||this.conflict_fixing_round||!this.options.hasPartialLrUpgradeOnConflict)break;Jison.print("\n----------------------------------- NOTICE -------------------------------\nAttempting to resolve the unresolved conflicts in partial LR mode...\n\nWhen no conflicts are reported in the next round below, your grammar is\naccepted as mixed LR/LALR and should work as expected.\n--------------------------------------------------------------------------\n\n"),this.conflict_fixing_round=!0,this.conflicts=0,this.new_conflicts_found_this_round=0,this.conflicting_states=[],this.resolutions=[]}this.defaultActions=findDefaults(this.table,this.hasErrorRecovery),cleanupTable(this.table),traceStates(this.trace,this.states,"at the end of the LALR constructor, after cleanupTable() and findDefaults()")},lookAheads:function(e,t){return this.onDemandLookahead&&!e.inadequate?this.terminals:t.follows},go:function(e,t,r){assert("number"==typeof e);for(var o=e,n=0;n<t.length;n++)o=this.states.item(o).edges[t[n]]||o;return o},goPath:function(e,t,r){assert("number"==typeof e);for(var o,n=e,s=[],a=0;a<t.length;a++)(o=t[a]?n+":"+t[a]:"")&&(this.newg.nterms_[o]=n),s.push(o),n=this.states.item(n).edges[t[a]]||n,assert(!o||void 0===this.terms_[o]||this.terms_[o]===t[a]),this.terms_[o]=t[a];return{path:s,endState:n}},buildNewGrammar:function(){var e=this,t=this.newg;this.states.forEach(function(r,o){o*=1,r.forEach(function(r){if(0===r.dotPosition){var n=o+":"+r.production.symbol;assert(void 0===e.terms_[n]||e.terms_[n]===r.production.symbol),e.terms_[n]=r.production.symbol,t.nterms_[n]=o,t.nonterminals[n]||(t.nonterminals[n]=new Nonterminal(n));var s=e.goPath(o,r.production.handle,r.production.symbol),a=new Production(n,s.path,t.productions.length);t.productions.push(a),t.nonterminals[n].productions.push(a);var i=r.production.handle.join(" ");e.conflict_fixing_round&&e.conflict_states_LU[o],e.conflict_fixing_round&&e.conflict_productions_LU[r.production.id]&&(i+=":P"+r.production.id);var l=e.states.item(s.endState).goes;l[i]||(l[i]=[]),l[i].push(n)}})})},unionLookaheads:function(){var e=this,t=this.newg,r=this.states;r.forEach(function(o,n){n*=1;var s=!e.onDemandLookahead||r.inadequate||o.inadequate;o.reductions.length&&s&&o.reductions.forEach(function(r){for(var s={},a=0;a<r.follows.length;a++)s[r.follows[a]]=!0;var i=r.production.handle.join(" ");e.conflict_fixing_round&&e.conflict_states_LU[n],e.conflict_fixing_round&&e.conflict_productions_LU[r.production.id]&&(i+=":P"+r.production.id),o.goes[i]||(o.goes[i]=[]),o.goes[i].forEach(function(o){t.nonterminals[o].follows.forEach(function(t){var o=e.terms_[t];s[o]||(s[o]=!0,r.follows.push(o))})})})})}}),LALRGenerator=Jison.LALRGenerator=lalr.construct(),lalrGeneratorDebug={beforebuildNewGrammar:function(){this.trace(this.states.size()+" states."),this.trace("Building lookahead grammar.")},beforeunionLookaheads:function(){this.trace("Computing lookaheads.")},afterbuildNewGrammar:function(){traceStates(this.trace,this.states,"after LALR::buildNewGrammar()")},afterunionLookaheads:function(){traceStates(this.trace,this.states,"after LALR::unionLookaheads()")},aftercomputeLookaheads:function(){traceStates(this.trace,this.states,"after LALR::computeLookaheads()")},aftercanonicalCollection:function(e){traceStates(this.trace,e,"as produced by LALR::canonicalCollection()")}},lrLookaheadGenerator=generator.beget(lookaheadMixin,generatorMixin,lrGeneratorMixin,{afterconstructor:function(){this.computeLookaheads(),this.DEBUG&&(Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER computeLookaheads:"),this.displayFollowSets(),Jison.print("\n")),this.buildTable()}}),SLRGenerator=Jison.SLRGenerator=lrLookaheadGenerator.construct({type:"SLR(1)",lookAheads:function(e,t){return this.nonterminals[t.production.symbol].follows}}),lr1=lrLookaheadGenerator.beget({type:"Canonical LR(1)",lookAheads:function(e,t){return t.follows},Item:lrGeneratorMixin.Item.prototype.construct({afterconstructor:function(){this.id=this.production.id+"#"+this.dotPosition+"#"+this.follows.sort().join(",")},eq:function(e){return e.id===this.id}}),closureOperation:function(e){var t,r=new this.ItemSet,o=this,n=e;do t=new Set,r=r.concat(n),n.forEach(function(e){var n,s,a=e.markedSymbol;a&&o.nonterminals[a]?(s=e.remainingHandle(),(0===(n=o.first(s)).length||e.production.nullable||o.nullable(s))&&(n=n.concat(e.follows)),o.nonterminals[a].productions.forEach(function(e){var s=new o.Item(e,0,n);r.contains(s)||t.contains(s)||t.push(s)})):a||r.reductions.push(e)}),n=t;while(!t.isEmpty());return r}}),LR1Generator=Jison.LR1Generator=lr1.construct(),ll=generator.beget(lookaheadMixin,generatorMixin,lrGeneratorMixin,{type:"LL(1)",afterconstructor:function(){this.computeLookaheads(),this.DEBUG&&(Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER computeLookaheads:"),this.displayFollowSets()),this.table=this.parseTable(this.productions),this.DEBUG&&(Jison.print("\n-------------------------------------------\nSymbol/Follow sets AFTER parseTable:"),this.displayFollowSets()),this.defaultActions={}},parseTable:function(e){var t={};this.symbols_;var r=this;return e.forEach(function(e,o){var n=t[e.symbol]||{},s=e.first;r.nullable(e.handle)&&(s=union(s,r.nonterminals[e.symbol].follows)),s.forEach(function(e){n[e]?(n[e].push(o),r.conflicts++):n[e]=[o]}),t[e.symbol]=n,e.first=s}),t}}),LLGenerator=Jison.LLGenerator=ll.construct();function Parser(e,t,r){return Jison.Generator(e,t,r).createParser()}Jison.Generator=function(e,t,r){switch(!r&&t&&"string"!=typeof t&&(r=t,t=null),e=autodetectAndConvertToJSONformat(e,t,mkStdOptions(r)),(r=mkStdOptions("NODEFAULT",e.options,r)).type||Jison.defaultJisonOptions.type){case"lr0":return r.hasPartialLrUpgradeOnConflict=!1,new LR0Generator(e,null,r);case"slr":return r.hasPartialLrUpgradeOnConflict=!1,new SLRGenerator(e,null,r);case"lr":case"lr1":return r.hasPartialLrUpgradeOnConflict=!1,new LR1Generator(e,null,r);case"ll":case"ll1":return r.hasPartialLrUpgradeOnConflict=!1,new LLGenerator(e,null,r);case"lalr1":case"lalr":case"":return new LALRGenerator(e,null,r);default:throw Error("Unsupported parser type: "+r.type)}},Jison.Parser=Parser;var rmCommonWS=helpers.rmCommonWS,mkIdentifier=helpers.mkIdentifier;assert(Jison),assert("function"==typeof Jison.prettyPrint),assert(Jison.defaultJisonOptions),assert("function"==typeof Jison.mkStdOptions),assert("function"==typeof Jison.Generator);var version=require("../package.json").version;function getCommandlineOptions(){var e=Jison.defaultJisonOptions,t=nomnom.script("jison").unknownOptionTreatment(!1).produceExplicitOptionsOnly(!0).options({file:{flag:!0,position:0,help:"file containing a grammar."},lexfile:{flag:!0,position:1,help:"file containing a lexical grammar."},json:{abbr:"j",flag:!0,default:e.json,help:"jison will expect a grammar in either JSON/JSON5 or JISON format: the precise format is autodetected."},outfile:{abbr:"o",metavar:"FILE",help:'Filepath and base module name of the generated parser. When terminated with a "/" (dir separator) it is treated as the destination directory where the generated output will be stored.'},debug:{abbr:"t",flag:!0,default:e.debug,help:"Debug mode."},dumpSourceCodeOnFailure:{full:"dump-sourcecode-on-failure",flag:!0,default:e.dumpSourceCodeOnFailure,help:"Dump the generated source code to a special named file when the internal generator tests fail, i.e. when the generated source code does not compile in the JavaScript engine. Enabling this option helps you to diagnose/debug crashes (thrown exceptions) in the code generator due to various reasons: you can, for example, load the dumped sourcecode in another environment (e.g. NodeJS) to get more info on the precise location and cause of the compile failure."},throwErrorOnCompileFailure:{full:"throw-on-compile-failure",flag:!0,default:e.throwErrorOnCompileFailure,help:"Throw an exception when the generated source code fails to compile in the JavaScript engine. **WARNING**: Turning this feature OFF permits the code generator to produce non-working source code and treat that as SUCCESS. This MAY be desirable code generator behaviour, but only rarely."},reportStats:{full:"info",abbr:"I",flag:!0,default:e.reportStats,help:"Report some statistics about the generated parser."},moduleType:{full:"module-type",abbr:"m",default:e.moduleType,metavar:"TYPE",choices:["commonjs","cjs","amd","umd","js","iife","es"],help:"The type of module to generate."},moduleName:{full:"module-name",abbr:"n",metavar:"NAME",default:e.defaultModuleName,help:"The name of the generated parser object, namespace supported."},parserType:{full:"parser-type",abbr:"p",default:e.type,metavar:"TYPE",help:"The type of algorithm to use for the parser. (lr0, slr, lalr, lr, ll)"},compressTables:{full:"compress-tables",abbr:"c",flag:!1,default:e.compressTables,choices:[0,1,2],help:"Output compressed parser tables in generated modules. (0 = no compression, 1 = default compression, 2 = deep compression)"},outputDebugTables:{full:"output-debug-tables",abbr:"T",flag:!0,default:e.outputDebugTables,help:"Output extra parser tables (rules list + look-ahead analysis) in generated modules to assist debugging / diagnostics purposes."},hasDefaultResolve:{full:"default-resolve",abbr:"X",flag:!0,default:!e.noDefaultResolve,help:"Turn this OFF to make jison act another way when a conflict is found in the grammar."},hasPartialLrUpgradeOnConflict:{full:"partial-lr-upgrade-on-conflict",abbr:"Z",flag:!0,default:e.hasPartialLrUpgradeOnConflict,help:"When enabled, the grammar generator attempts to resolve LALR(1) conflicts by, at least for the conflicting rules, moving towards LR(1) behaviour."},noDefaultAction:{flag:!1,callback:function(){return this.help},help:"OBSOLETED. Use '--default-action=[for-value,for-location]' instead. (See below in '--help' output.)"},defaultActionMode:{full:"default-action",flag:!1,default:e.defaultActionMode,callback:function(e){var t=(""+e).split(",");if(t.length>2)return"default-action=yyval,yylloc expects at most 2 modes! You specified "+t.length},transform:function(e){var t=this,r=t.default,o=(""+e).split(",").map(function(e,t){switch(e=e.trim()){case"false":case"0":return"none";case"true":case"1":case"":return r[t];default:return e}});return 1===o.length&&(o[1]=o[0]),o},help:rmCommonWS`
                    Specify the kind of default action that jison should include for every parser rule.

                    You can specify a mode for *value handling* ("$$") and one for *location tracking* ("@$"), separated by a comma, e.g.:
                        --default-action=ast,none

                    Supported value modes:
                    - classic : generate a parser which includes the default
                                    $$ = $1;
                                action for every rule.
                    - ast     : generate a parser which produces a simple AST-like tree-of-arrays structure: every rule produces an array of its production terms' values. Otherwise it is dentical to "classic" mode.
                    - none    : JISON will produce a slightly faster parser but then you are solely responsible for propagating rule action "$$" results. The default rule value is still deterministic though as it is set to "undefined": "$$ = undefined;"
                    - skip    : same as "none" mode, except JISON does NOT INJECT a default value action ANYWHERE, hence rule results are not deterministic when you do not properly manage the "$$" value yourself!

                    Supported location modes:
                    - merge   : generate a parser which includes the default "@$ = merged(@1..@n);" location tracking action for every rule, i.e. the rule\'s production \'location\' is the range spanning its terms.
                    - classic : same as "merge" mode.
                    - ast     : ditto.
                    - none    : JISON will produce a slightly faster parser but then you are solely responsible for propagating rule action "@$" location results. The default rule location is still deterministic though, as it is set to "undefined": "@$ = undefined;"
                    - skip    : same as "none" mode, except JISON does NOT INJECT a default location action ANYWHERE, hence rule location results are not deterministic when you do not properly manage the "@$" value yourself!

                    Notes:
                    - when you do specify a value default mode, but DO NOT specify a location value mode, the latter is assumed to be the same as the former. Hence:
                          --default-action=ast
                      equals:
                          --default-action=ast,ast
                    - when you do not specify an explicit default mode or only a "true"/"1" value, the default is assumed: "ast,merge".
                    - when you specify "false"/"0" as an explicit default mode, "none,none" is assumed. This produces the fastest deterministic parser.
                `},hasTryCatch:{full:"try-catch",flag:!0,default:!e.noTryCatch,help:"Generate a parser which catches exceptions from the grammar action code or parseError error reporting calls using a try/catch/finally code block. When you turn this OFF, it will produce a slightly faster parser at the cost of reduced code safety."},errorRecoveryTokenDiscardCount:{full:"error-recovery-token-discard-count",abbr:"Q",flag:!1,default:e.errorRecoveryTokenDiscardCount,callback:function(e){return e!=parseInt(e)?"count must be an integer":(e=parseInt(e))<2?"count must be >= 2":void 0},transform:function(e){return parseInt(e)},help:"Specify the number of lexed tokens that may be gobbled by an error recovery process before we cry wolf."},exportAllTables:{full:"export-all-tables",abbr:"E",flag:!0,default:e.exportAllTables,help:"Next to producing a grammar source file, also export the symbols, terminals, grammar and parse tables to separate JSON files for further use by other tools. The files' names will be derived from the outputFile name by appending a suffix."},exportAST:{full:"export-ast",optional:!0,metavar:"false|true|FILE",default:e.exportAST,help:"Output grammar AST to file in JSON / JSON5 format (as identified by the file extension, JSON by default).",transform:function(e){switch(e){case"false":case"0":return!1;case"true":case"1":return!0;default:return e}}},prettyCfg:{full:"pretty",flag:!0,metavar:"false|true|CFGFILE",default:e.prettyCfg,help:"Output the generated code pretty-formatted; turning this option OFF will output the generated code as-is a.k.a. 'raw'."},main:{full:"main",abbr:"x",flag:!0,default:!e.noMain,help:"Include .main() entry point in generated commonjs module."},moduleMain:{full:"module-main",abbr:"y",metavar:"NAME",help:"The main module function definition."},version:{abbr:"V",flag:!0,help:"Print version and exit.",callback:function(){console.log(version),process.exit(0)}}}).parse();return t.debug&&console.log("JISON CLI options:\n",t),t}var cli={main:function(e){function t(e){try{return fs.lstatSync(e).isDirectory()}catch(e){return!1}}function r(e){if(!e||"."===e||0===e.length)return!1;try{return fs.mkdirSync(e),!0}catch(o){if("ENOENT"===o.code){var t=path.dirname(e);if(t!==e&&r(t))try{return fs.mkdirSync(e),!0}catch(e){}}}return!1}function o(){var o,n,s,a,i=process.cwd();e.lexfile&&(o=fs.readFileSync(path.normalize(e.lexfile),"utf8"));var l=fs.readFileSync(path.normalize(e.file),"utf8");e.json=".json"===path.extname(e.file)||e.json;var c=e.outfile;"string"==typeof c?/[\\\/]$/.test(c)||t(c)?(e.outfile=null,c=c.replace(/[\\\/]$/,"")):c=path.dirname(c):c=null,c&&c.length>0?c+="/":c="";var u=path.basename(e.outfile||e.file);u=path.basename(u,path.extname(u)),e.outfile=e.outfile||c+u+".js",!e.moduleName&&u&&(e.moduleName=e.defaultModuleName=mkIdentifier(u)),e.exportAST&&("string"==typeof(n=e.exportAST)?/[\\\/]$/.test(n)||t(n)?(e.exportAST=null,n=n.replace(/[\\\/]$/,"")):n=path.dirname(n):n=path.dirname(e.outfile),n=n&&n.length>0?n.replace(/[\\\/]$/,"")+"/":"","string"==typeof e.exportAST?(s=path.basename(e.exportAST),a=path.extname(s),s=path.basename(s,a)):(s=path.basename(e.outfile,path.extname(e.outfile))+"-AST",a=".jison"),e.exportAST=path.normalize(n+s+a));var h=path.dirname(path.normalize(e.file));process.chdir(h);var p=cli.generateParserString(l,o,e);if(process.chdir(i),e.outfile=path.normalize(e.outfile),r(path.dirname(e.outfile)),fs.writeFileSync(e.outfile,p,"utf8"),console.log("JISON output","for module ["+e.moduleName+"] has been written to file:",e.outfile),e.exportAllTables.enabled){var f=path.join(path.dirname(e.outfile),path.basename(e.outfile,path.extname(e.outfile))),d=e.exportAllTables;for(var y in d)if(d.hasOwnProperty(y)&&"enabled"!==y){var m=d[y];if(m){var b=f+"."+y.replace(/[^a-zA-Z0-9_]/g,"_")+".json";fs.writeFileSync(b,JSON.stringify(m,null,2),"utf8"),console.log("JISON table export","for ["+y+"] has been written to file:",b)}}}if(e.exportAST){var m=e.exportedAST,b=e.exportAST,a=path.extname(b);switch(a){case".json5":case".jison":case".y":case".yacc":case".l":case".lex":m=Jison.prettyPrint(m,{format:a.substr(1)});break;default:m=JSON.stringify(m,null,2)}r(path.dirname(b)),fs.writeFileSync(b,m,"utf8"),console.log("Grammar AST export","for module ["+e.moduleName+"] has been written to file:",b)}}function n(e){var t=process.openStdin(),r="";t.setEncoding("utf8"),t.addListener("data",function(e){r+=e}),t.addListener("end",function(){e(r)})}function s(){n(function(t){console.log("",cli.generateParserString(t,null,e))})}e.file?o():s()},generateParserString:function(e,t,r){var o=new Jison.Generator(e,t,r),n=o.generate(r);return o.reportGrammarInformation(),r.exportAllTables=o.options.exportAllTables,r.exportedAST=o.grammar,n}};if(require.main===module){var opts=getCommandlineOptions();cli.main(opts)}export{cli as default};
