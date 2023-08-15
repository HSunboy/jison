// rollup.config.js
const json = require('@rollup/plugin-json').default
module.exports = {
  input: 'ebnf-parser.js',
  output: [
  	  {
	    file: 'dist/ebnf-parser-cjs.js',
	    format: 'cjs'
	  },
	  {
	    file: 'dist/ebnf-parser-es6.js',
	    format: 'es'
	  },
	  {
	    file: 'dist/ebnf-parser-umd.js',
	    name: 'ebnf-parser',
	    format: 'umd'
	  }
  ],
  plugins: [json()]
};
