
import fs from 'fs';
import path from 'path';
import JSON5 from '@gerhobbelt/json5';
import assert from 'assert';
import rmCommonWS from './rmCommonWS';


function findSymbolTable(o, sectionName) {
    if (o) {
        let s = o[sectionName];
        if (s && typeof s === 'object' && Object.keys(s).length > 0) {
            return s;
        }
        for (let key in o) {
            let rv = findSymbolTable(o[key]);
            if (rv) return rv;
        }
    }
    return null;
}


export default function extractSymbolTableFromFile(filepath, sectionName) {
    let source;
    let import_error;
    let predefined_symbols;

    sectionName = sectionName || 'symbols_';

    try {
        filepath = path.resolve(filepath);

        source = fs.readFileSync(filepath, 'utf8');
        // It's either a JSON file or a JISON generated output file:
        //
        //     symbols_: {
        //       "symbol": ID, ...
        //     },
        try {
            let obj = JSON5.parse(source);

            // two options: 
            // 
            // 1. symbol table is part of a larger JSON5 file
            // 2. JSON5 file specifies the symbol table only & directly,
            //    i.e. no 'symbols_:' prelude.
            let s = findSymbolTable(obj, sectionName);
            if (!s && obj && typeof obj === 'object' && Object.keys(obj).length > 0) {
                s = obj;
            }
            if (!s) {
                throw new Error(`No symbol table named '${sectionName}' found in the JSON5 file '${filepath}'.`);
            }
            predefined_symbols = s;
        } catch (ex) {
            import_error = ex;

            // attempt to read the file as a JISON-generated parser source instead:
            try {
            	let re = new RegExp(`[\\r\\n](\\s*["']?${sectionName}["']?:\\s*\\{[\\s\\S]*?\\}),?\\s*[\\r\\n]`);
                let m = re.exec(source);
            	//console.error("extractSymbolTableFromFile REGEX match:", {re, m: m && m[1]});
                if (m && m[1]) {
                    source = `
                        {
                            // content extracted from file:
                            ${m[1]}
                        }
                    `;
                    let obj = JSON5.parse(source);
                    let s = findSymbolTable(obj, sectionName);
                    if (!s) {
                        // let this error override anything that came before:
                        import_error = null;
                        throw new Error(`No symbol table found in the extracted '${sectionName}' section of file '${filepath}'.`);
                    }
                    predefined_symbols = s;
                    import_error = null;
                } else {
                    throw new Error(`No potential '${sectionName}' symbol table section found in the file '${filepath}'.`);
                }
            } catch (ex2) {
                if (!import_error) {
                    import_error = ex2;
                }
            }
        }
    } catch (ex3) {
        import_error = ex3;
    }

    assert(predefined_symbols ? !import_error : import_error);
    if (import_error) {
        throw new Error((rmCommonWS`
            Error: '%import symbols <path>' must point to either a JSON file containing 
            a symbol table (hash table) or a previously generated JISON JavaScript file, 
            which contains such a symbol table.

            Expected file format: 
            It's either a JSON file or a JISON generated output file, which contains 
            a section like this:

                ${sectionName}: {
                    "symbol": ID, 
                    ...
                }

            Reported error:
                ${import_error}
        `).trim(), import_error);
    }
    assert(predefined_symbols);
    assert(typeof predefined_symbols === 'object');
    return predefined_symbols;
}

