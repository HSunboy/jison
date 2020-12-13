
import { convertExceptionToObject } from './safe-code-exec-and-diag';

let cycleref = [];
let cyclerefpath = [];

let linkref = [];
let linkrefpath = [];

let breadcrumbs = [];

function shallow_copy(src) {
    if (typeof src === 'object') {
        if (src instanceof Array) {
            return src.slice();
        }

        let dst = {};
        if (src instanceof Error) {
            dst = convertExceptionToObject(src);
        } else {
            for (let k in src) {
                if (Object.prototype.hasOwnProperty.call(src, k)) {
                    dst[k] = src[k];
                }
            }
        }
        return dst;
    }
    return src;
}


function shallow_copy_and_strip_depth(src, parentKey) {
    if (typeof src === 'object') {
        let dst;

        if (src instanceof Array) {
            dst = src.slice();
            for (let i = 0, len = dst.length; i < len; i++) {
                breadcrumbs.push('[' + i + ']');
                dst[i] = shallow_copy_and_strip_depth(dst[i], parentKey + '[' + i + ']');
                breadcrumbs.pop();
            }
        } else {
            dst = {};
            if (src instanceof Error) {
                dst = convertExceptionToObject(src);
            } else {
                for (let k in src) {
                    if (Object.prototype.hasOwnProperty.call(src, k)) {
                        let el = src[k];
                        if (el && typeof el === 'object') {
                            dst[k] = '[cyclic reference::attribute --> ' + parentKey + '.' + k + ']';
                        } else {
                            dst[k] = src[k];
                        }
                    }
                }
            }
        }
        return dst;
    }
    return src;
}


// strip developer machine specific parts off any paths in a given stacktrace (string)
// to ease cross-platform comparison of these stacktraces.
function stripErrorStackPaths(msg) {
    // strip away devbox-specific paths in error stack traces in the output:
    // and any `nyc` profiler run added trailing cruft has to go too, e.g. ', <anonymous>:1489:27)':
    msg = msg
    .replace(/\bat ([^\r\n(\\\/]+?)\([^)]*?[\\\/]([a-z0-9_-]+\.js):([0-9]+:[0-9]+)\)(?:, <anonymous>:[0-9]+:[0-9]+\))?/gi, 'at $1(/$2:$3)')
    .replace(/\bat [^\r\n ]*?[\\\/]([a-z0-9_-]+\.js):([0-9]+:[0-9]+)/gi, 'at /$1:$2');

    return msg;
}


// strip off the line/position info from any stacktrace as a assert.deepEqual() on these
// will otherwise FAIL due to us running this stuff through both regular `node` and 
// the `nyc` profiler: the latter reformats the sourcecode-under-test, thus producing 
// exceptions and stacktraces which point completely somewhere else and this would b0rk
// our test rigs for the jison subpackages.
function cleanStackTrace4Comparison(obj) {
    if (typeof obj === 'string') {
        // and any `nyc` profiler run added trailing cruft has to go too, e.g. ', <anonymous>:1489:27)':
        let msg = obj
        .replace(/\bat ([^\r\n(\\\/]+?)\([^)]*?[\\\/]([a-z0-9_-]+\.js):([0-9]+:[0-9]+)\)(?:, <anonymous>:[0-9]+:[0-9]+\))?/gi, 'at $1(/$2)')
        .replace(/\bat [^\r\n ]*?[\\\/]([a-z0-9_-]+\.js):([0-9]+:[0-9]+)/gi, 'at /$1');

        return msg;
    }

    if (obj) {
        if (obj.stack) {
            obj.stack = cleanStackTrace4Comparison(obj.stack);
        }
        let keys = Object.keys(obj);
        for (let i in keys) {
            let key = keys[i];
            let el = obj[key];
            cleanStackTrace4Comparison(el);
        }
    }
    return obj;
}






function trim_array_tail(arr) {
    if (arr instanceof Array) {
        let len;
        for (len = arr.length; len > 0; len--) {
            if (arr[len - 1] != null) {
                break;
            }
        }
        if (arr.length !== len) {
            arr.length = len;
        }
    }
}

function treat_value_stack(v) {
    if (v instanceof Array) {
        let idx = cycleref.indexOf(v);
        if (idx >= 0) {
            v = '[cyclic reference to parent array --> ' + cyclerefpath[idx] + ']';
        } else {
            idx = linkref.indexOf(v);
            if (idx >= 0) {
                v = '[reference to sibling array --> ' + linkrefpath[idx] + ', length = ' + v.length + ']';
            } else {
                cycleref.push(v);
                cyclerefpath.push(breadcrumbs.join('.'));
                linkref.push(v);
                linkrefpath.push(breadcrumbs.join('.'));

                v = treat_error_infos_array(v);

                cycleref.pop();
                cyclerefpath.pop();
            }
        }
    } else if (v) {
        v = treat_object(v);
    }
    return v;
}

function treat_error_infos_array(arr) {
    let inf = arr.slice();
    trim_array_tail(inf);
    for (let key = 0, len = inf.length; key < len; key++) {
        let err = inf[key];
        if (err) {
            breadcrumbs.push('[' + key + ']');

            err = treat_object(err);

            if (typeof err === 'object') {
                if (err.lexer) {
                    err.lexer = '[lexer]';
                }
                if (err.parser) {
                    err.parser = '[parser]';
                }
                trim_array_tail(err.symbol_stack);
                trim_array_tail(err.state_stack);
                trim_array_tail(err.location_stack);
                if (err.value_stack) {
                    breadcrumbs.push('value_stack');
                    err.value_stack = treat_value_stack(err.value_stack);
                    breadcrumbs.pop();
                }
            }

            inf[key] = err;

            breadcrumbs.pop();
        }
    }
    return inf;
}

function treat_lexer(l) {
    // shallow copy object:
    l = shallow_copy(l);
    delete l.simpleCaseActionClusters;
    delete l.rules;
    delete l.conditions;
    delete l.__currentRuleSet__;

    if (l.__error_infos) {
        breadcrumbs.push('__error_infos');
        l.__error_infos = treat_value_stack(l.__error_infos);
        breadcrumbs.pop();
    }

    return l;
}

function treat_parser(p) {
    // shallow copy object:
    p = shallow_copy(p);
    delete p.productions_;
    delete p.table;
    delete p.defaultActions;

    if (p.__error_infos) {
        breadcrumbs.push('__error_infos');
        p.__error_infos = treat_value_stack(p.__error_infos);
        breadcrumbs.pop();
    }

    if (p.__error_recovery_infos) {
        breadcrumbs.push('__error_recovery_infos');
        p.__error_recovery_infos = treat_value_stack(p.__error_recovery_infos);
        breadcrumbs.pop();
    }

    if (p.lexer) {
        breadcrumbs.push('lexer');
        p.lexer = treat_lexer(p.lexer);
        breadcrumbs.pop();
    }

    return p;
}

function treat_hash(h) {
    // shallow copy object:
    h = shallow_copy(h);

    if (h.parser) {
        breadcrumbs.push('parser');
        h.parser = treat_parser(h.parser);
        breadcrumbs.pop();
    }

    if (h.lexer) {
        breadcrumbs.push('lexer');
        h.lexer = treat_lexer(h.lexer);
        breadcrumbs.push();
    }

    return h;
}

function treat_error_report_info(e) {
    // shallow copy object:
    e = shallow_copy(e);
    delete e.offending_source_dumpfile;

    if (e.hash) {
        breadcrumbs.push('hash');
        e.hash = treat_hash(e.hash);
        breadcrumbs.pop();
    }

    if (e.parser) {
        breadcrumbs.push('parser');
        e.parser = treat_parser(e.parser);
        breadcrumbs.pop();
    }

    if (e.lexer) {
        breadcrumbs.push('lexer');
        e.lexer = treat_lexer(e.lexer);
        breadcrumbs.pop();
    }

    if (e.__error_infos) {
        breadcrumbs.push('__error_infos');
        e.__error_infos = treat_value_stack(e.__error_infos);
        breadcrumbs.pop();
    }

    if (e.__error_recovery_infos) {
        breadcrumbs.push('__error_recovery_infos');
        e.__error_recovery_infos = treat_value_stack(e.__error_recovery_infos);
        breadcrumbs.pop();
    }

    trim_array_tail(e.symbol_stack);
    trim_array_tail(e.state_stack);
    trim_array_tail(e.location_stack);
    if (e.value_stack) {
        breadcrumbs.push('value_stack');
        e.value_stack = treat_value_stack(e.value_stack);
        breadcrumbs.pop();
    }

    for (let key in e) {
        switch (key) {
        case 'hash':
        case 'parser':
        case 'lexer':
        case '__error_infos':
        case '__error_recovery_infos':
        case 'symbol_stack':
        case 'state_stack':
        case 'location_stack':
        case 'value_stack':
            break;

        default:
            if (e[key] && typeof e[key] === 'object') {
                breadcrumbs.push(key);
                e[key] = treat_object(e[key]);
                breadcrumbs.pop();
            }
            break;
        }
    }

    return e;
}

function treat_object(e) {
    if (e) {
        if (e instanceof Array) {
            e = e.slice();
            for (let key in e) {
                breadcrumbs.push('[' + key + ']');
                e[key] = treat_object(e[key]);
                breadcrumbs.pop();
            }
        } else if (typeof e === 'object') {
            let idx = cycleref.indexOf(e);
            if (idx >= 0) {
                // cyclic reference, most probably an error instance.
                // we still want it to be READABLE in a way, though:
                e = shallow_copy_and_strip_depth(e, cyclerefpath[idx]);
            } else {
                idx = linkref.indexOf(e);
                if (idx >= 0) {
                    e = '[reference to sibling --> ' + linkrefpath[idx] + ']';
                } else {
                    cycleref.push(e);
                    cyclerefpath.push(breadcrumbs.join('.'));
                    linkref.push(e);
                    linkrefpath.push(breadcrumbs.join('.'));

                    e = treat_error_report_info(e);

                    cycleref.pop();
                    cyclerefpath.pop();
                }
            }
        }
    }
    return e;
}


// strip off large chunks from the Error exception object before
// it will be fed to a test log or other output.
//
// Internal use in the unit test rigs.
function trimErrorForTestReporting(e) {
    cycleref.length = 0;
    cyclerefpath.length = 0;
    linkref.length = 0;
    linkrefpath.length = 0;
    breadcrumbs = [ '*' ];

    if (e) {
        e = treat_object(e);
    }

    cycleref.length = 0;
    cyclerefpath.length = 0;
    linkref.length = 0;
    linkrefpath.length = 0;
    breadcrumbs = [ '*' ];

    return e;
}

export {
    trimErrorForTestReporting,
    stripErrorStackPaths,
    cleanStackTrace4Comparison
};
