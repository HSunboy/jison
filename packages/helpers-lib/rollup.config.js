// rollup.config.js
const swc = require("rollup-plugin-swc3").default;

module.exports = {
  input: './src/index.ts',
  output: [
  	  {
	    file: 'dist/helpers-lib-cjs.js',
	    format: 'cjs'
	  },
	  {
	    file: 'dist/helpers-lib-es6.js',
	    format: 'es'
	  }
  ],
  plugins: [
	swc({
		minify: true,
		jsc: {
			target:  "es2016",
			parser: {
				syntax: "typescript",
				"tsx": false,
				"decorators": false,
				"dynamicImport": false
			}
		}
	})
  ]
};
