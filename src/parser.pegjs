{
  var ast = require('./ast')  
  function extractList(list, index) {
    return list.map(function(element) { return element[index]; });
  }
  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }
  function loc() {
    return { ...location() }
  }
}

// ----- G.1 Grammer Parser -----

Program
  = ls:Lines { return ast.mkProgram(ls, loc()); }

Lines 
  = head:LineWithComment tail:(EOL LineWithComment)* { return buildList(head, tail, 1); }

LineWithComment
  = __ line:Line COMMENT? { return line }

Line
  = l:LABEL LWING sl:Lines RWING { return ast.mkAsmLine(l,null,sl,loc()); }
  / l:LABEL s:Statement          { return ast.mkAsmLine(l,s,null,loc()); }
  / l:LABEL                      { return ast.mkAsmLine(l,null,null,loc()); }
  / o:ORG                        { return ast.mkAsmLine(null,o,null,loc()); }
  / s:Statement                  { return ast.mkAsmLine(null,s,null,loc()); }
  / __                           { return ast.mkAsmLine(null,null,null,loc()); }

Statement
  = drct:Directive   { return drct; }
  / insn:Instruction { return insn; }

Directive "directive"
  = size:(PSEUDO_BYTE / PSEUDO_WORD) values:ExprList  {
      const dataSize = size == 'byte' ? ast.DataSize.Byte : ast.DataSize.Word;
      return ast.mkData(dataSize, values, loc());
    }
  / PSEUDO_FILL numBytes:Expr COMMA fillValue:Expr {
      return ast.mkFill(numBytes, fillValue, loc());
    }
  / PSEUDO_IF LPAR condition:Expr RPAR LWING trueBranch:Lines RWING
    elifs:Elif*
    elseBody:ElseBody? {
      const conds = [condition, ...elifs.map(e => e.condition)]
      const trueBodies = [trueBranch, ...elifs.map(e => e.trueBranch)]
      const cases = conds.map((c,i) => [c, trueBodies[i]])
      return ast.mkIfElse(cases, elseBody, loc());
    }
  / PSEUDO_FOR index:IDENTIFIER "in" __ list:Expr LWING body:Lines RWING {
      return ast.mkFor(index, list, body, loc());
    }
  / PSEUDO_LET name:IDENTIFIER EQU value:Expr { return ast.mkLet(name, value, loc()); }
  / PSEUDO_ERROR error:STRING {
      return ast.mkError(error, loc());
    }
  / PSEUDO_ALIGN alignBytes:Expr {
      return ast.mkAlign(alignBytes, loc());
    }

Elif = PSEUDO_ELIF LPAR condition:Expr RPAR LWING trueBranch:Lines RWING {
  return { condition, trueBranch };
}

ElseBody = PSEUDO_ELSE LWING elseBody:Lines RWING {
  return elseBody;
}

ExprList = head:Expr tail:(COMMA Expr)* { return buildList(head, tail, 1); }

Instruction
  = m:MNEMONIC o1:Expr COMMA o2:Expr { return ast.mkInsn(m,o1,o2,loc()); }
  / m:MNEMONIC o1:Expr               { return ast.mkInsn(m,o1,null,loc()); }
  / m:MNEMONIC                       { return ast.mkInsn(m,null,null,loc()); }

Expr = LastExpr

Multiplicative = first:CallOrMemberExpression rest:((STAR / DIV / MOD) CallOrMemberExpression)* {
    return rest.reduce(function(memo, curr) {
      return ast.mkBinaryOp(curr[0], memo, curr[1], loc());
    }, first);
  }
  / Primary


Additive = first:Multiplicative rest:((PLUS / MINUS / SECT) Multiplicative)* {
    return rest.reduce(function(memo, curr) {
      return ast.mkBinaryOp(curr[0], memo, curr[1], loc());
    }, first);
  }

Relational = first:Additive rest:((LE / GE / LT / GT) Additive)* {
    return rest.reduce(function(memo, curr) {
      return ast.mkBinaryOp(curr[0], memo, curr[1], loc());
    }, first);
  }

Equality = first:Relational rest:((EQUEQU / BANGEQU) Relational)* {
    return rest.reduce(function(memo, curr) {
      return ast.mkBinaryOp(curr[0], memo, curr[1], loc());
    }, first);
  }

LastExpr = Equality

CallOrMemberExpression
  = CallExpression
  / MemberExpression

MemberExpression = Primary

CallExpression =
  callee:MemberExpression LPAR args:ExprList? RPAR {
    return ast.mkCallFunc(callee, args, loc());
  }

Primary 
  = LITERAL 
  / REGISTER 
  / SQIDENTIFIER 
  / CURRENTPC
  / LPAR e:LastExpr RPAR { return e; }

// ----- G.2 Lexical Scanner -----

// Macros

alpha = [a-zA-Z_]
alphanum = [a-zA-Z_0-9]

hexadecimal = [0-9a-f]i+
binary      = [0-1]+
decimal     = [+-]? [0-9]+

A = 'a'i
B = 'b'i
C = 'c'i
D = 'd'i
G = 'g'i
H = 'h'i
J = 'j'i
M = 'm'i
O = 'o'i
P = 'p'i
R = 'r'i
S = 's'i
X = 'x'i
Y = 'y'i

_0 = '0'
_1 = '1'
_2 = '2'

COMMA   = s:','        WSS { return s; }
DIV     = s:'/'        WSS { return s; }
EQU     = s:'='        WSS { return s; }
MOD     = s:'%'        WSS { return s; }
LT      = s:'<'  ![=]  WSS { return s; }
GT      = s:'>'  ![=]  WSS { return s; }
LE      = s:'<='       WSS { return s; }
GE      = s:'>='       WSS { return s; }
EQUEQU  = s:'=='       WSS { return s; }
BANGEQU = s:'!='       WSS { return s; }
LPAR    = s:'('        WSS { return s; }
RPAR    = s:')'        WSS { return s; }
LWING   = s:'{'        WSS { return s; }
RWING   = s:'}'        WSS { return s; }
MINUS   = s:'-'        WSS { return s; }
PLUS    = s:'+'        WSS { return s; }
SECT    = s:'§'        WSS { return s; }
STAR    = s:'*'        WSS { return s; }

PSEUDO_ALIGN = "!align" __
PSEUDO_BYTE  = "!byte" __ { return 'byte'; }
PSEUDO_WORD  = "!word" __ { return 'word'; }
PSEUDO_FOR   = "!for" __
PSEUDO_LET   = "!let" __
PSEUDO_IF    = "!if" __
PSEUDO_ELSE  = "else" __
PSEUDO_ELIF  = "elif" __
PSEUDO_ERROR = "!error" __
PSEUDO_FILL  = "!fill" __

BIN = v:$binary B         { return parseInt(v,2); }
HEX = _0 X v:$hexadecimal { return parseInt(v,16); }
DEC = v:$decimal D?       { return parseInt(v); } 

STR = '"' c:doubleStringCharacter* '"' { return c.join(''); }
STRING = '"' c:doubleStringCharacter* '"' __ { return ast.mkLiteral(c.join(''), loc()); }

doubleStringCharacter = !'"' char:. { return char; }

identNoWS = (alpha+ alphanum*) { return text(); }
ident = sym:identNoWS __       { return sym; }

// Tokens

__ = WSS
WSS "whitespace" = WS*
WS  "whitespace"
  = '\t'      // tab
  / '\v'      // vertical tab
  / '\f'      // form feed
  / ' '       // space
  / '\u00A0'  // no break space
  / '\uFEFF'  // zero width no break space

EOL        "end of line" = [\n\r]
COMMENT    "comment"     = (';' (!EOL .)*)

LABEL      "label"       = lbl:identNoWS ':' __  { return ast.mkLabel(lbl,loc()); }
ORG        "ORG"         = O R G __ v:LITERAL __ { return ast.mkSetPC(v, loc()); }
MNEMONIC   "mnemonic"    = mne:identNoWS __      { return mne; }

LITERAL "literal"
  = v:BIN __ { return ast.mkLiteral(v, 'b', loc()); }
  / v:HEX __ { return ast.mkLiteral(v, 'h', loc()); }
  / v:DEC __ { return ast.mkLiteral(v, 'd', loc()); }
  / s:STR __ { return ast.mkLiteral(s, 's', loc()); }

SQIDENTIFIER "identifier" 
  = head:identNoWS tail:('::' identNoWS)* __      { return ast.mkScopeQualifiedIdent(buildList(head, tail, 1), false, loc()); }
  / '::' head:identNoWS tail:('::' identNoWS)* __ { return ast.mkScopeQualifiedIdent(buildList(head, tail, 1), true, loc()); }

IDENTIFIER "identifier"
  = ident:ident { return ast.mkIdent(ident, loc()); }

REGISTER "register"
 = name:$( A S / A / B / C / D / M _2 / M _1 / M / P C / X Y / X / Y / J _1 / J _2 / J ) !alpha __ { return ast.mkRegister(name.toLowerCase(),loc()); }

CURRENTPC "current-pc" = STAR { return ast.mkGetCurPC(loc()); }
