
const fs = require('fs');
const path = require('path');
const helpers = require('../helpers-lib');



function patch_import_paths(sourcefile, adjusted_basedir) {
    let count = 0;

    //console.log({sourcefile, adjusted_basedir});

    let src = fs.readFileSync(sourcefile, 'utf8');
    // only patch imports with RELATIVE paths: those always start with . or ..:
    let importRe = new RegExp(`\\bimport\\s+(.*)\\s+from\\s+['"](\\.[^'"]+)['"];?`, 'g');
    src = src.replace(importRe, (m, p1, p2) => {
        let p2a = path.normalize(path.join(adjusted_basedir, p2)).replace(/\\/g, '/');
        console.log(helpers.rmCommonWS`
            :: ${m}
               -->  ${p2}  ==>  ${p2a}
        `);
        count++;
        return `import ${p1} from '${p2a}';`;
    });

    if (count) {
        console.log(`updated ${count} imports: `, sourcefile);
        fs.writeFileSync(sourcefile, src, {
            encoding: 'utf8',
            flags: 'w'
        });
    }
}

const argc = process.argv.length;
const argv = process.argv;
//console.log("ARGV:", { argc, argv });
if (argc !== 4) {
    console.log(helpers.rmCommonWS`
        ${path.basename(argv[1])} <JSfile-to-patch> <basedir-adjustment>

        e.g.

            ${path.basename(argv[1])} examples/output/demo.js ../.. 

        to bump all relative-path 'import' statements in there to travel
        2 more directories down, before proceeding.

        Thus

            import helpers from "../helpers-lib";
        
        would become
        
            import helpers from "../../../helpers-lib";
    `);
    process.exit(1);
}

patch_import_paths(argv[2], argv[3]);
