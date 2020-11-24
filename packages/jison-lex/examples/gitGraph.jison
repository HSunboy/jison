

/*
 * Parse following
 * gitGraph:
 *  commit
 *  commit
 *  branch 
 */

%x string
%x options
%options case-insensitive

%%

(\r?\n)+                           return 'NL';
\s+                             /* skip all whitespace */
\#[^\n]*                        /* skip comments */
\%%[^\n]*                       /* skip comments */
"gitGraph"                      return 'GG';
"commit"                        return 'COMMIT';
"branch"                        return 'BRANCH';
"merge"                         return 'MERGE';
"reset"                         return 'RESET';
"checkout"                         return 'CHECKOUT';
"LR"                            return 'DIR';
"BT"                            return 'DIR';
":"                             return ':';
"^"                             return 'CARET'
"options"\r?\n                       this.begin("options");
<options>"end"\r?\n                   this.popState();
<options>[^\n]+\r?\n                 return 'OPT';
["]                             this.begin("string");
<string>["]                     this.popState();
<string>[^"]*                     return 'STR';
[a-zA-Z][a-zA-Z0-9_]+           return 'ID';
<<EOF>>                         return 'EOF';

