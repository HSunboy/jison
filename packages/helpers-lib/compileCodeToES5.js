
import * as babel from '@babel/core';
import assert from 'assert';





function compileCodeToES5(src, options) {
    options = Object.assign({}, {
        ast: true,
        code: true,
        sourceMaps: true,
        comments: true,
        filename: 'compileCodeToES5.js',
        sourceFileName: 'compileCodeToES5.js',
        sourceRoot: '.',
        sourceType: 'module',

        babelrc: false,

        ignore: [
            'node_modules/**/*.js'
        ],
        compact: false,
        retainLines: false,
        presets: [
            [ '@babel/preset-env', {
                targets: {
                    browsers: [ 'last 2 versions' ],
                    node: '8.0'
                }
            } ]
        ]
    }, options);

    return babel.transformSync(src, options); // => { code, map, ast }
}
