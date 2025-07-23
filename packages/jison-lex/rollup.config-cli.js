// rollup.config.js
const json = require('@rollup/plugin-json').default
const swc = require("rollup-plugin-swc3").default;
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
	  }
  ],
  plugins: [json(), swc({
		minify: true,
		jsc: {
			target:  "es2016"
		}
	})]
};
