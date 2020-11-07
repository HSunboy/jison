var fs = require('fs');
var u12s = require("unicode-12.0.0/Binary_Property/ID_Start/symbols.js");
var u4s = require("unicode-4.0.0/Binary_Property/ID_Start/symbols.js");
//var u3s = require("unicode-3.0.0/Binary_Property/ID_Start/symbols.js");

var last_ch = 0;

function padLeft(s, n) {
	let l = s.length;
	n -= l;
	return '0'.repeat(n) + s;
}

function process(u, version) {
	// only ever accept characters in plane 0:
                                                                              
	// construct a set of print lines which are easily comparable between unicode 4 and 12:
	// i % 30 === 0 or similar position modulo approaches don't work due to character insertions
	// so it must be entirely character code based.
	// Unfortunately `charCodeAt % 30 === 0` doesn't deliver either!
	// (Chinese series doesn't get cut up into lines :-S )
	//
	var lines = u.map((e, i) => {
		let ch = e.charCodeAt(0);
		let m = ch & ~0x0F;
		let nl = (m != last_ch);
		last_ch = m;
		let hex = padLeft(ch.toString(16), 4).toUpperCase();
		return nl ? `\n${hex}:  ` + e : e;
	});

	fs.writeFileSync(`ID_Start_symbols_${version}.txt`, lines.join("  "), "utf8");
}

process(u12s, 12);
process(u4s, 4);
//process(u3s, 3);
