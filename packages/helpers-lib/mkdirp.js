
import fs from 'fs';
import path from 'path';

// Return `true` when the directory has been created
export default function mkdirp(fp) {
    if (!fp || fp === '.') {
        return false;
    }
    try {
        fs.mkdirSync(fp);
        return true;
    } catch (e) {
        if (e.code === 'ENOENT') {
            let parent = path.dirname(fp);
            // Did we hit the root directory by now? If so, abort!
            // Else, create the parent; iff that fails, we fail too...
            if (parent !== fp && mkdirp(parent)) {
                try {
                    // Retry creating the original directory: it should succeed now
                    fs.mkdirSync(fp);
                    return true;
                } catch (e) {
                    return false;
                }
            }
        }
    }
    return false;
}

