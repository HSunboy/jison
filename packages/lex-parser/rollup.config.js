// rollup.config.js
const swc = require("rollup-plugin-swc3").default;

module.exports = {
  input: 'lex-parser.js',
  output: [
  	  {
	    file: 'dist/lex-parser-cjs.js',
	    format: 'cjs'
	  },
	  {
	    file: 'dist/lex-parser-es6.js',
	    format: 'es'
	  }
  ],
  plugins: [
	swc({
		minify: true,
		jsc: {
			target:  "es2016"
		}
	})
  ]
};
