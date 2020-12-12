//
// title: "rule regexes may be indented one level max"
// test_input: main class extends nat if else for printNat readNat this new var null
//
// ...
//

digit      [0-9]
id         [a-zA-Z_][a-zA-Z0-9_]*

%%

// current heuristic is 8 spaces or 2 tabs or more: action code. Less? rule regex if nothing comes before already.

"//".*           /* ignore comment */
\s+ return 'WS';
main return 'MAIN';
 class return 'CLASS';
  extends return 'EXTENDS';
   nat return 'NATTYPE';
    if return 'IF';
     else return 'ELSE';
      for return 'FOR';
       printNat return 'PRINTNAT';
       readNat return 'READNAT';
       this return 'THIS';
       new return 'NEW';
  var            
            return 'VAR';
null             
        return 'NUL';

// {id}             
//         return 'ID';
//
// when code is within a '{...}' scope, the scope holds it all together:        
{id} {             
return 'ID';
}



[^\s]+ return 'ILLEGAL';

<<EOF>>                         return 'EOF';