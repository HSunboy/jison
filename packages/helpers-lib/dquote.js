
const unicodeQuotes = `“…” ‘…’ «…» ‹…› 「…」 《…》 〈…〉 •…• ’…’ ”…”`;
const unicodeQuoteSets = unicodeQuotes.split(' ').map((s) => {
    return s.split('…');
});

// properly quote and escape the given input string
export default function dquote(s, options = {}) {
    if (options.preferred) {
        const prefRe = new RegExp(`([${options.preferred || 'x'}])…(.)`, 'g');
        let m;

        while ((m = prefRe.exec(unicodeQuotes)) !== null) {
            if (!s.includes(m[1]) && !s.includes(m[2])) {
                return m[1] + s + m[2];
            }
        }
    }
    if (!options.onlyRegular) {
        // see if we can get away with a couple of Unicode quote pairs:
        for (let p of unicodeQuoteSets) {
            if (s.includes(p[0]) || s.includes(p[1]))
                continue;
            return p[0] + s + p[1];
        }
    }
    const sq = s.includes("'");
    let dq = s.includes('"');
    if (sq && dq) {
        s = s.replace(/"/g, '\\"');
        dq = false;
    }
    if (dq) {
        return '\'' + s + '\'';
    } 
    return '"' + s + '"';
}


