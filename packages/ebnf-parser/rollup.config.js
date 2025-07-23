// rollup.config.js
const json = require('@rollup/plugin-json').default;
const swc = require("rollup-plugin-swc3").default;
module.exports = {
	input: './src/ebnf-parser.ts',
	output: [
		{
			file: 'dist/ebnf-parser-cjs.js',
			format: 'cjs'
		},
		{
			file: 'dist/ebnf-parser-es6.js',
			format: 'es'
		}
	],
	plugins: [
		json(),
		swc({
			minify: true,
			jsc: {
				target: "es2016",
				parser: {
					syntax: "typescript",
					"tsx": false,
					"decorators": false,
					"dynamicImport": false
				}
			}
		}),

	]
};
