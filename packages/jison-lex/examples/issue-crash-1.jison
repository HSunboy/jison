%%

\s+                   /* skip whitespace */
x                     return 'x'
y                     return 'y'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

