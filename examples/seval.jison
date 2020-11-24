%start Expression
%% /* Language Grammar */

Expression                  : ConditionalExpression EOF
                                                    { return function(data) {
                                                        if (data === undefined) data = {};
                                                        return $1.eval(data); }; }
                            | EOF                   { return function() { return ''; }; }
                            ;

ConditionalExpression       : LogicalORExpression
                            | LogicalORExpression "?" ConditionalExpression ":" ConditionalExpression
                                                    { $$ = new ConditionalExpressionNode($1, $3, $5); }
                            ;

LogicalORExpression         : LogicalANDExpression
                            | LogicalORExpression "||" LogicalANDExpression
                                                    { $$ = new BinaryExpressionNode($2, $1, $3); }
                            ;

LogicalANDExpression        : BitwiseORExpression
                            | LogicalANDExpression "&&" BitwiseORExpression
                                                    { $$ = new BinaryExpressionNode($2, $1, $3); }
                            ;

BitwiseORExpression         : BitwiseXORExpression
                            | BitwiseORExpression "|" BitwiseXORExpression
                                                    { $$ = new BinaryExpressionNode($2, $1, $3); }
                            ;

BitwiseXORExpression        : BitwiseANDExpression
                            | BitwiseXORExpression "^" BitwiseANDExpression
                                                    { $$ = new BinaryExpressionNode($2, $1, $3); }
                            ;

BitwiseANDExpression        : EqualityExpression
                            | BitwiseANDExpression "&" EqualityExpression
                                                    { $$ = new BinaryExpressionNode($2, $1, $3); }
                            ;

EqualityExpression          : RelationalExpression
                            | EqualityExpression EqualityOperator RelationalExpression
                                                    { $$ = new BinaryExpressionNode($2, $1, $3); }
                            ;

EqualityOperator            : "==="
                            | "!=="
                            | "=="
                            | "!="
                            ;

RelationalExpression        : ShiftExpression
                            | RelationalExpression RelationalOperator ShiftExpression
                                                    { $$ = new BinaryExpressionNode($2, $1, $3); }
                            ;

RelationalOperator          : "<="
                            | "<"
                            | ">="
                            | ">"
                            | "IN"
                            | "INSTANCEOF"
                            ;

ShiftExpression             : AdditiveExpression
                            | ShiftExpression ShiftOperator AdditiveExpression
                                                    { $$ = new BinaryExpressionNode($2, $1, $3); }
                            ;

ShiftOperator               : "<<"
                            | ">>>"
                            | ">>"
                            ;

AdditiveExpression          : MultiplicativeExpression
                            | AdditiveExpression AdditiveOperator MultiplicativeExpression
                                                    { $$ = new BinaryExpressionNode($2, $1, $3); }
                            ;

AdditiveOperator            : "+"
                            | "-"
                            ;

MultiplicativeExpression    : UnaryExpression
                            | MultiplicativeExpression MultiplicativeOperator UnaryExpression
                                                    { $$ = new BinaryExpressionNode($2, $1, $3); }
                            ;

MultiplicativeOperator      : "*"
                            | "/"
                            | "%"
                            ;

UnaryExpression             : CallExpression
                            | MemberExpression
                            | UnaryOperator UnaryExpression
                                                    { $$ = new UnaryExpressionNode($1, $2); }
                            ;

UnaryOperator               : "+"
                            | "-"
                            | "~"
                            | "!"
                            | "TYPEOF"
                            ;

CallExpression              : MemberExpression Arguments
                                                    { $$ = new CallExpressionNode($1, $2); }
                            | CallExpression Arguments
                                                    { $$ = new CallExpressionNode($1, $2); }
                            | CallExpression "[" ConditionalExpression "]"
                                                    { $$ = new MemberExpressionNode($1, $3); }
                            | CallExpression "." "IDENTIFIER"
                                                    { var property = new LiteralNode($3);
                                                      $$ = new MemberExpressionNode($1, property); }
                            ;

MemberExpression            : PrimaryExpression
                            | MemberExpression "[" ConditionalExpression "]"
                                                    { $$ = new MemberExpressionNode($1, $3); }
                            | MemberExpression "." "IDENTIFIER"
                                                    { var property = new LiteralNode($3);
                                                      $$ = new MemberExpressionNode($1, property); }
                            ;

PrimaryExpression           : Literal
                            | "IDENTIFIER"          { $$ = new VariableNode($1); }
                            | "(" ConditionalExpression ")"
                                                    { $$ = $2; }
                            ;

Literal                     : "NULL"                { $$ = new LiteralNode(null); }
                            | "UNDEFINED"           { $$ = new LiteralNode(undefined); }
                            | "TRUE"                { $$ = new LiteralNode(true); }
                            | "FALSE"               { $$ = new LiteralNode(false); }
                            | "STRING"              { $$ = new LiteralNode(parseString(yytext)); }
                            | "NUMBER"              { $$ = new LiteralNode(parseNumber(yytext)); }
                            | "REGEXP"              { $$ = new LiteralNode(parseRegExp(yytext)); }
                            ;

Arguments                   : "(" ")"               { $$ = []; }
                            | "(" ArgumentList ")"  { $$ = $2; }
                            ;

ArgumentList                : ConditionalExpression { $$ = [$1]; }
                            | ArgumentList "," ConditionalExpression
                                                    { $$ = $1.concat($3); }
                            ;

%% /* Utility Functions */

var continuationPattern = /\\(\r\n|\r|\n)/g;

function parseString(literal) {
    return JSON.parse('"' + literal.slice(1, -1).replace(continuationPattern, '') + '"');
}

function parseNumber(literal) {
    if (literal.length > 1 && literal[0] === '0' &&
        literal[1].toLowerCase() !== 'x') {
        return parseInt(literal, 8);
    }
    else {
        return Number(literal);
    }
}

function parseRegExp(literal) {
    var index = literal.lastIndexOf("/"),
        body = literal.substring(1, index),
        flags = literal.substring(index + 1);

    return new RegExp(body, flags);
}

function LiteralNode(value) {
    this.eval = function (data) {
        return value;
    };
}

function VariableNode(name) {
    this.eval = function (data) {
        return data[name];
    };
}

function UnaryExpressionNode(operator, operand) {
    this.eval = function (data) {
        var operandValue = operand.eval(data);
        switch (operator) {
            case '+':           return +operandValue;
            case '-':           return -operandValue;
            case '!':           return !operandValue;
            case '~':           return ~operandValue;
            case 'typeof':      return typeof operandValue;
        }
    };
}

function BinaryExpressionNode(operator, left, right) {
    this.eval = function (data) {
        var leftValue = left.eval(data);
        switch (operator) {
            case '||':          return leftValue || right.eval(data);
            case '&&':          return leftValue && right.eval(data);
        }

        var rightValue = right.eval(data);
        switch (operator) {
            case '|':           return leftValue | rightValue;
            case '^':           return leftValue ^ rightValue;
            case '&':           return leftValue & rightValue;
            case '<<':          return leftValue << rightValue;
            case '>>>':         return leftValue >>> rightValue;
            case '>>':          return leftValue >> rightValue;
            case '===':         return leftValue === rightValue;
            case '!==':         return leftValue !== rightValue;
            case '==':          return leftValue == rightValue;
            case '!=':          return leftValue != rightValue;
            case '<=':          return leftValue <= rightValue;
            case '<':           return leftValue < rightValue;
            case '>=':          return leftValue >= rightValue;
            case '>':           return leftValue > rightValue;
            case '+':           return leftValue + rightValue;
            case '-':           return leftValue - rightValue;
            case '*':           return leftValue * rightValue;
            case '/':           return leftValue / rightValue;
            case 'in':          return leftValue in rightValue;
            case 'instanceof':  return leftValue instanceof rightValue;
        }
    };
}

function ConditionalExpressionNode(condition, consequent, alternate) {
    this.eval = function (data) {
        return condition.eval(data) ? consequent.eval(data) : alternate.eval(data);
    };
}

function CallExpressionNode(callee, args) {
    this.eval = function (data) {
        var argValues = [];
            that = 'object' in callee ? callee.object.eval(data) : null;
        for (var index in args) {
            argValues[index] = args[index].eval(data);
        }

        return callee.eval(data).apply(that, argValues);
    };
}

function MemberExpressionNode(object, property) {
    this.object = object;
    this.eval = function (data) {
        return object.eval(data)[property.eval(data)];
    };
}

