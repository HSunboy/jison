// rollup.config.js
const ts = require("rollup-plugin-ts");
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
	  },
	  {
	    file: 'dist/helpers-lib-umd.js',
	    name: 'jison-helpers-lib',
	    format: 'umd'
	  }
  ],
  plugins: [
	ts({
		transpiler: "babel"
	})
  ]
};
