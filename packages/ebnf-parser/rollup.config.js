// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';

import base from '../../rollup.config-template.js';
const outputGlobals = base.output.globals;

export default Object.assign(base, {
  input: 'ebnf-parser.js',
  //treeshake: false,
  output: [
	  {
	    file: 'dist/ebnf-parser-cjs.js',
	    format: 'cjs',
	    exports: 'default',
	  },
	  {
	    file: 'dist/ebnf-parser-es6.js',
	    format: 'es'
	  },
	  {
	    file: 'dist/ebnf-parser-umd.js',
	    name: 'ebnf-parser',
	    format: 'umd',
	    exports: 'default',
	    globals: outputGlobals,
	  }
  ],
});

