// rollup.config.js
const json = require('@rollup/plugin-json').default

module.exports = {
  input: 'cli.js',
  output: [
  	  {
	    file: 'dist/cli-cjs.js',
	    format: 'cjs'
	  },
	  {
	    file: 'dist/cli-es6.js',
	    format: 'es'
	  },
	  {
	    file: 'dist/cli-umd.js',
	    name: 'jison-lex',
	    format: 'umd'
	  }
  ],
  plugins: [json()]
};
