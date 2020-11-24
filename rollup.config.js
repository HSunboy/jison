// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';

import base from './rollup.config-template.js';
const outputGlobals = base.output.globals;

export default Object.assign(base, {
  input: 'lib/jison.js',
  //treeshake: false,
  output: [
	  {
	    file: 'dist/jison-cjs.js',
	    format: 'cjs',
	    exports: 'default',
	  },
	  {
	    file: 'dist/jison-es6.js',
	    format: 'es'
	  },
	  {
	    file: 'dist/jison-umd.js',
	    name: 'jison',
	    format: 'umd',
	    exports: 'default',
	    globals: outputGlobals,
	  }
  ],
});

