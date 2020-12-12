#!/usr/bin/env node

// Encodes Jison formatted grammars as JSON

const version = '0.7.0-220';

const path = require('path');
const fs = require('fs');
const JSON5 = require('@gerhobbelt/JSON5');

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
  .option('json5', {
      flag: true,
      default: true,
      help: 'output in JSON5 format instead of JSON'
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
        bnf = fs.readFileSync(path.resolve(opts.file), 'utf8');
        if (opts.lexfile) {
            lex = fs.readFileSync(path.resolve(opts.lexfile), 'utf8');
        }

        let outpath = (opts.outfile || opts.file);
      	let name = path.basename(outpath).replace(/\..*$/g, '');
      	outpath = path.dirname(outpath);

        let json = jison2json.convert(bnf, lex);
        if (opts.json5) {
            json = JSON5.stringify(json, null, 2);
        } else {
            json = JSON.stringify(json, null, 2);
        }
        fs.writeFileSync(path.resolve(outpath, name + '.json'), json);
    } else {
        input(function (bnf) {
            let json = jison2json.convert(bnf);
            if (opts.json5) {
              json = JSON5.stringify(json, null, 2);
            } else {
              json = JSON.stringify(json, null, 2);
            }

            console.log('', json);
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

