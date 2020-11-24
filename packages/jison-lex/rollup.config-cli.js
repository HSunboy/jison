// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';

import base from '../../rollup.config-template.js';
const outputGlobals = base.output.globals;

export default Object.assign(base, {
  input: 'cli.js',
  //treeshake: false,
  output: [
	  {
	    file: 'dist/cli-cjs.js',
	    format: 'cjs',
	    exports: 'default',
	  },
	  {
	    file: 'dist/cli-es6.js',
	    format: 'es'
	  },
	  {
	    file: 'dist/cli-umd.js',
	    name: 'jison-lex',
	    format: 'umd',
	    exports: 'default',
	    globals: outputGlobals,
	  }
  ]
});

