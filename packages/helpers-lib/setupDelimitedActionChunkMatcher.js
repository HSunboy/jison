
import rmCommonWS from './rmCommonWS';


// Calculate the end marker to match and produce a
// matcher function to match the entire chunk:
function setupDelimitedActionChunkMatcher(marker, lexer) {
    // check the cache first:
    let cache = lexer.__entire_action_block_matchers__ || {};
    let rv = cache[marker];
    if (!rv) {
        const action_end_marker = marker.replace(/\{/g, '}');

        // regex must match content + endMarker, as startMarker has already been consumed before this function got a call:
        const escaped_end_marker = action_end_marker.replace(/\}/g, '\\}');
        const re = new RegExp('^([^]*?)' + escaped_end_marker + '(?!\\})');
        const is_complex_marker = (action_end_marker[0] === '}' && action_end_marker.length > 1);

        const match = function matchDelimitedActionChunk(input) {
            const m = re.exec(input);
            if (!m) {
                return {
                    fault: rmCommonWS`
                        Incorrectly terminated action code block. We're expecting the
                        '${action_end_marker}' end marker to go with the given start marker.
                        Regrettably, it does not exist in the remainder of the input.
                    `,
                    srcCode: '',
                    shiftCount: 0,
                    action_start_marker: marker,
                    action_end_marker,
                };
            }

            let srcCode = m[1];
            let shiftCount = m[0].length;

            // When we have a match, we're not home yet!
            //
            // It MAY be that the marker is a 'complex one', i.e. consisting of multiple '}' closing braces
            // BUT not '%'-delimited, which would allow such fringe cases such as these to pass:
            //
            //     {{{ ... { ... }}}} }}}
            //
            // Note the '}}}}' near the end there, which would be the one matched -- and humanly sensibly so,
            // since we tracked the matching braces with our programmer's eyes -- but in practice this kind
            // of mess should be strongly discouraged as it results in a very confusing *code read*.
            //
            // See also lexer test cases 0105 and onwards for a couple of examples. And then consider that
            // those are simple test examples, so be mindful about what this would allow to pass in daily practice.
            //
            // Hence we check for an 'independent' end marker for all multi-brace markers:
            // 
            if (is_complex_marker && srcCode) {
                let m2 = /[}]$/.test(srcCode);    // no '}' allowed at the very end or you'ld have the fringe scenario above!
                if (m2) {
                    return {
                        fault: rmCommonWS`
                            TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO 

                            Confusingly terminated action code block. We're expecting the
                            '${action_end_marker}' end marker to go with the given start marker.
                            Regrettably, it does not exist in the remainder of the input.
                        `,
                        srcCode,
                        shiftCount,
                        action_start_marker: marker,
                        action_end_marker,
                    };
                }
            }

            return {
                srcCode,
                shiftCount,
                action_start_marker: marker,
                action_end_marker,
            };
        };

        // cache the generated function, as it'll be useful again for the next occurrence of the same start marker:
        cache[marker] = match;
        lexer.__entire_action_block_matchers__ = cache;

        rv = match;
    }
    return rv;
};

export default setupDelimitedActionChunkMatcher;
