// rollup.config.js
const json = require('@rollup/plugin-json').default

module.exports = {
  input: 'regexp-lexer.js',
  output: [
  	  {
	    file: 'dist/regexp-lexer-cjs.js',
	    format: 'cjs'
	  },
	  {
	    file: 'dist/regexp-lexer-es6.js',
	    format: 'es'
	  },
	  {
	    file: 'dist/regexp-lexer-umd.js',
	    name: 'regexp-lexer',
	    format: 'umd'
	  }
  ],
  plugins: [json()]
};
