#!/usr/bin/env node

// Encodes Jison formatted grammars as JSON

const version = '0.7.0-220';

const path = require('path');
const fs = require('fs');

const jison2json = require('./jison2json');



let opts = require('@gerhobbelt/nomnom')
  .unknownOptionTreatment(false)              // do not accept unknown options!
  .script('json2jison')
  .option('file', {
      flag: true,
      position: 0,
      help: 'file containing a JISON grammar'
  })
  .option('lexfile', {
      flag: true,
      position: 1,
      help: 'optional file containing a JISON lexer'
  })
  .option('outfile', {
      abbr: 'o',
      metavar: 'FILE',
      help: 'Filename and base module name of the generated JSON file'
  })
  .option('version', {
      abbr: 'V',
      flag: true,
      help: 'print version and exit',
      callback: function () {
          return version;
      }
  });


exports.main = function main(opts) {
    let bnf, lex;

    if (opts.file) {
        bnf = fs.readFileSync(path.normalize(opts.file), 'utf8');
        if (opts.lexfile) {
            lex = fs.readFileSync(path.normalize(opts.lexfile), 'utf8');
        }

        let outpath = (opts.outfile || opts.file);
      	let name = path.basename(outpath).replace(/\..*$/g, '');
      	outpath = path.dirname(outpath);

        fs.writeFileSync(path.resolve(outpath, name + '.json'), jison2json.convert(bnf, lex));
    } else {
        input(function (bnf) {
            console.log(jison2json.convert(bnf));
        });
    }
};


function input(cb) {
    let stdin = process.openStdin();
    let data = '';

    stdin.setEncoding('utf8');
    stdin.addListener('data', function (chunk) {
        data += chunk;
    });
    stdin.addListener('end', function () {
        cb(data);
    });
}



if (require.main === module) {
    exports.main(opts.parse());
}

