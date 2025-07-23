// rollup.config.js
const json = require('@rollup/plugin-json').default
const swc = require("rollup-plugin-swc3").default;
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
	  }
  ],
  plugins: [json(), swc({
		minify: true,
		jsc: {
			target:  "es2016"
		}
	})]
};
