#!/usr/bin/env node

// Converts json grammar format to Jison grammar format

const version = '0.7.0-220';

const path = require('path');
const fs = require('fs');

const json2jison = require('./json2jison');



let opts = require('@gerhobbelt/nomnom')
  .unknownOptionTreatment(false)              // do not accept unknown options!
  .script('json2jison')
  .option('file', {
      flag: true,
      position: 0,
      help: 'file containing a grammar in JSON format'
  })
  .option('outfile', {
      abbr: 'o',
      metavar: 'FILE',
      help: 'Filename and base module name of the generated jison grammar file'
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
    if (opts.file) {
        let raw = fs.readFileSync(path.normalize(opts.file), 'utf8');
	      let outpath = (opts.outfile || opts.file);
    	  let name = path.basename(outpath).replace(/\..*$/g, '');
    	  outpath = path.dirname(outpath);

        let outfile = path.resolve(outpath, name + '.jison');
        console.log('RAW:', raw);
        fs.writeFileSync(outfile, json2jison.convert(raw), 'utf8');
        console.log(`JISON grammar has been written to file "${outfile}"`);
    } else {
        input(function (raw) {
            console.log(json2jison.convert(raw));
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

