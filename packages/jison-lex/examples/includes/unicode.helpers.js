// helper APIs for testing the unicode*.jisonlex lexer specs

// WARNING: this stuff is purely here so the example(s) will pass the default run test. You mileage will be NIL on these!

let predictive_random_seed = 5;

function getSemiRandomNumber() {
	predictive_random_seed = (predictive_random_seed * 31 + 7) % 51;	
	return predictive_random_seed;
}

// these are used in a three-way test in unicode2 spec:
function is_constant(str) {
	return getSemiRandomNumber() % 3 === 1;
}
function is_function(str) {
	return getSemiRandomNumber() % 3 === 2;
}



const FERR_UNTERMINATED_INLINE_COMMENT = 0x0100;
const FKA_COMMA = 0x0101;
const FKA_FIXED_ROW_OR_COLUMN_MARKER = 0x0102;
const FKA_RANGE_MARKER = 0x0103;
const FKW_ADD = 0x0104;
const FKW_ALMOST_EQUAL = 0x0105;
const FKW_ARRAY_CONCATENATION_OPERATOR = 0x0106;
const FKW_BOOLEAN_AND_OPERATOR = 0x0107;
const FKW_BOOLEAN_NOT_OPERATOR = 0x0108;
const FKW_BOOLEAN_OR_OPERATOR = 0x0109;
const FKW_CUBE_OPERATOR = 0x010A;
const FKW_DATA_MARKER = 0x010B;
const FKW_DEGREES_OPERATOR = 0x010C;
const FKW_DIVIDE = 0x010D;
const FKW_DOT = 0x010E;
const FKW_EQUAL = 0x010F;
const FKW_GREATER_OR_EQUAL = 0x0110;
const FKW_GREATER_THAN = 0x0111;
const FKW_IS_IDENTICAL = 0x0112;
const FKW_LESS_OR_EQUAL = 0x0113;
const FKW_LESS_THAN = 0x0114;
const FKW_MODULO_OPERATOR = 0x0115;
const FKW_MULTIPLY = 0x0116;
const FKW_NOT_EQUAL = 0x0117;
const FKW_NOT_IDENTICAL = 0x0118;
const FKW_POWER = 0x0119;
const FKW_PROMILAGE_OPERATOR = 0x011A;
const FKW_SQRT_OPERATOR = 0x011B;
const FKW_SQUARE_OPERATOR = 0x011C;
const FKW_STRING_CONCATENATION_OPERATOR = 0x011D;
const FKW_SUBTRACT = 0x011E;
const FKW_VALUE = 0x011F;

const FT_BOOLEAN = 0x00100000;
const FT_NUMBER = 0x00200000;
const FT_STRING = 0x00400000;

const FU_ANY = 0x00010000;
const FU_DERIVED = 0x00020000;
const FU_STRING = 0x00040000;



class ASTnode {
	constructor(n) {
		this.id = n;
	}

	setLocationInfo(loc) {
		this._yylloc = loc;
		return this;
	}
	setCommentsIndex(n) {
		this._commentIndex = n;
		return this;
	}
    setLexedText(s) {
    	this._lexedText = s;
		return this;
    }
}

class lexerToken extends ASTnode {
	constructor(n) {
		super(n);
	}
}

class ASTcurrency extends ASTnode {
	constructor(v) {
		super('$');
		this._currency = v;
	}
}

class ASTerror extends ASTnode {
	constructor(e, msg) {
		super('E');
		this._errorCode = e;
		this._errorMessage = msg;
	}
}

class ASTopcode extends ASTnode {
	constructor(n) {
		super('C');
		this.opcode = n;
	}
}

class ASTvalue extends ASTnode {
	constructor(v, a) {
		super('V');
		this._value = v;
		this._attributes = a;
	}
}


const symbolHashTable = {};


const parser = {
	getNextCommentIndex() {
		return getSemiRandomNumber();
	}
	dedupQuotedString(s, q) {
		return s;
	}
	deepCopy(loc) {
		// fake a deep clone with a shallow one:
		return Object.assign({}, loc);
	}
	getSymbol4Currency(s) {
		return '$$$' + s;		
	}
	getSymbol4DefinedConstant(s) {
		if (!symbolHashTable[s]) {
			let n = getSemiRandomNumber();
			symbolHashTable[s] = 'S' + n;
		}
		return symbolHashTable[s];
	}
	pushComment() {
		/**/
	}
}


//----------------------------------------------------------------------
//
// ShEx
// 

const ShExUtil = {
	unescapeText(s, delim) {
	  return s;
	}
};

const Parser = {

};