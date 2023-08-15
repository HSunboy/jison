// rollup.config.js

const json = require('@rollup/plugin-json').default
module.exports = {
  input: 'lib/jison.js',
  output: [
  	  {
	    file: 'dist/jison-cjs.js',
	    format: 'cjs'
	  },
	  {
	    file: 'dist/jison-es6.js',
	    format: 'es'
	  },
	  {
	    file: 'dist/jison-umd.js',
	    name: 'jison',
	    format: 'umd'
	  }
  ],
  plugins: [json()]
};
