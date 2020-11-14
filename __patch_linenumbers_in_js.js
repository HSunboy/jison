
const globby = require('globby');
const fs = require('fs');

 
globby(['*.js', 'lib/*.js', 'tests/**/*.js', 'packages/*/*.js', 'packages/*/tests/**/*.js']).then(paths => {
	var count = 0;

    //console.log(paths);
    paths.forEach(path => {
    	var updated = false;

    	console.log('path: ', path);

    	var src = fs.readFileSync(path, 'utf8');
    	src = src.replace(/(['"])line *\d+['"]/gmi, function repl(s, m1, index) {
            let pre = src.substr(0, index);
            let a = pre.split('\n');
            let lc = a.length;
            //console.log("match:", {s, index, lc});
    		let newsrc = `${m1}Line ${lc}${m1}`;
            updated = (newsrc !== s);
            return newsrc;
    	});

    	if (updated) {
    		count++;
    		console.log('updated: ', path);
	    	fs.writeFileSync(path, src, {
                encoding: 'utf8',
                flags: 'w'
            });
	    }
    });
});
