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
  = _ line:Line _ COMMENT? { return line }

Line
  = l:LABEL _ LWING _ sl:Lines _ RWING { return ast.mkAsmLine(l,null,sl,loc()); }
  / l:LABEL _ s:Statement              { return ast.mkAsmLine(l,s,null,loc()); }
  / l:LABEL                            { return ast.mkAsmLine(l,null,null,loc()); }
  / o:ORG                              { return ast.mkAsmLine(null,o,null,loc()); }
  / s:Statement                        { return ast.mkAsmLine(null,s,null,loc()); }
  / _                                  { return ast.mkAsmLine(null,null,null,loc()); }

Statement
  = drct:Directive   { return drct; }
  / insn:Instruction { return insn; }

Directive "directive"
  = size:(PSEUDO_BYTE / PSEUDO_WORD) __ values:ExprList  {
      const dataSize = size == 'byte' ? ast.DataSize.Byte : ast.DataSize.Word;
      return ast.mkData(dataSize, values, loc());
    }
  / PSEUDO_FILL __ numBytes:Expr _ COMMA _ fillValue:Expr {
      return ast.mkFill(numBytes, fillValue, loc());
    }
  / PSEUDO_IF __ LPAR _ condition:Expr _ RPAR _ LWING _ trueBranch:Lines _ RWING
    elifs:Elif*
    elseBody:ElseBody? {
      const conds = [condition, ...elifs.map(e => e.condition)]
      const trueBodies = [trueBranch, ...elifs.map(e => e.trueBranch)]
      const cases = conds.map((c,i) => [c, trueBodies[i]])
      return ast.mkIfElse(cases, elseBody, loc());
    }
  / PSEUDO_FOR __ index:IDENTIFIER __ "in" __ list:Expr _ LWING _ body:Lines _ RWING {
      return ast.mkFor(index, list, body, loc());
    }
  / PSEUDO_LET __ name:IDENTIFIER _ EQU _ value:Expr { return ast.mkLet(name, value, loc()); }
  / PSEUDO_ERROR __ error:STRING {
      return ast.mkError(error, loc());
    }
  / PSEUDO_ALIGN __ alignBytes:Expr {
      return ast.mkAlign(alignBytes, loc());
    }

Elif = _ PSEUDO_ELIF _ LPAR _ condition:Expr _ RPAR _ LWING _ trueBranch:Lines _ RWING {
  return { condition, trueBranch };
}

ElseBody = _ PSEUDO_ELSE _ LWING _ elseBody:Lines _ RWING {
  return elseBody;
}

ExprList = head:Expr tail:(_ COMMA _ Expr)* { return buildList(head, tail, 3); }

Instruction
  = m:MNEMONIC __ o1:Expr _ COMMA _ o2:Expr { return ast.mkInsn(m,o1,o2,loc()); }
  / m:MNEMONIC __ o1:Expr                   { return ast.mkInsn(m,o1,null,loc()); }
  / m:MNEMONIC                              { return ast.mkInsn(m,null,null,loc()); }

Expr = LastExpr

Multiplicative = first:CallOrMemberExpression rest:(_ (STAR / DIV / MOD) _ CallOrMemberExpression)* {
    return rest.reduce(function(memo, curr) {
      return ast.mkBinaryOp(curr[1], memo, curr[3], loc());
    }, first);
  }
  / Primary


Additive = first:Multiplicative rest:(_ (PLUS / MINUS / SECT) _ Multiplicative)* {
    return rest.reduce(function(memo, curr) {
      return ast.mkBinaryOp(curr[1], memo, curr[3], loc());
    }, first);
  }

Relational = first:Additive rest:(_ (LE / GE / LT / GT) _ Additive)* {
    return rest.reduce(function(memo, curr) {
      return ast.mkBinaryOp(curr[1], memo, curr[3], loc());
    }, first);
  }

Equality = first:Relational rest:(_ (EQUEQU / BANGEQU) _ Relational)* {
    return rest.reduce(function(memo, curr) {
      return ast.mkBinaryOp(curr[1], memo, curr[3], loc());
    }, first);
  }

LastExpr = Equality

CallOrMemberExpression
  = CallExpression
  / MemberExpression

MemberExpression = Primary

CallExpression =
  callee:MemberExpression _ LPAR _ args:ExprList? _ RPAR {
    return ast.mkCallFunc(callee, args, loc());
  }

Primary 
  = LITERAL 
  / REGISTER 
  / SQIDENTIFIER 
  / CURRENTPC
  / LPAR _ e:LastExpr _ RPAR { return e; }

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
E = 'e'i
F = 'f'i
G = 'g'i
H = 'h'i
I = 'i'i
J = 'j'i
L = 'l'i
M = 'm'i
N = 'n'i
O = 'o'i
P = 'p'i
R = 'r'i
S = 's'i
T = 't'i
W = 'w'i
X = 'x'i
Y = 'y'i

_0 = '0'
_1 = '1'
_2 = '2'

COMMA   = s:','       { return s; }
DIV     = s:'/'       { return s; }
EQU     = s:'='       { return s; }
MOD     = s:'%'       { return s; }
LT      = s:'<'  ![=] { return s; }
GT      = s:'>'  ![=] { return s; }
LE      = s:'<='      { return s; }
GE      = s:'>='      { return s; }
EQUEQU  = s:'=='      { return s; }
BANGEQU = s:'!='      { return s; }
BANG    = s:'!'  ![=] { return s; }
LPAR    = s:'('       { return s; }
RPAR    = s:')'       { return s; }
LWING   = s:'{'       { return s; }
RWING   = s:'}'       { return s; }
MINUS   = s:'-'       { return s; }
PLUS    = s:'+'       { return s; }
SECT    = s:'§'       { return s; }
STAR    = s:'*'       { return s; }

PSEUDO_ALIGN = BANG A L I G N
PSEUDO_BYTE  = BANG B Y T E { return 'byte'; }
PSEUDO_WORD  = BANG W O R D { return 'word'; }
PSEUDO_FOR   = BANG F O R
PSEUDO_LET   = BANG L E T
PSEUDO_IF    = BANG I F
PSEUDO_ELSE  = E L S E
PSEUDO_ELIF  = E L I F
PSEUDO_ERROR = BANG E R R O R
PSEUDO_FILL  = BANG F I L L

BIN = v:$binary B         { return parseInt(v,2); }
HEX = _0 X v:$hexadecimal { return parseInt(v,16); }
DEC = v:$decimal D?       { return parseInt(v); } 

STR = '"' c:doubleStringCharacter* '"' { return c.join(''); }
STRING = '"' c:doubleStringCharacter* '"' { return ast.mkLiteral(c.join(''), loc()); }

doubleStringCharacter = !'"' char:. { return char; }

identNoWS = (alpha+ alphanum*) { return text(); }
ident = sym:identNoWS          { return sym; }

// Tokens

__ "whitespace" = ws+
_  "whitespace" = ws*
ws "whitespace"
  = '\t'      // tab
  / '\v'      // vertical tab
  / '\f'      // form feed
  / ' '       // space
  / '\u00A0'  // no break space
  / '\uFEFF'  // zero width no break space

EOL        "end of line" = [\n\r]
COMMENT    "comment"     = (';' (!EOL .)*)

LABEL      "label"       = lbl:identNoWS ':'  { return ast.mkLabel(lbl,loc()); }
ORG        "ORG"         = O R G __ v:LITERAL { return ast.mkSetPC(v, loc()); }
MNEMONIC   "mnemonic"    = mne:identNoWS      { return mne; }

LITERAL "literal"
  = v:BIN { return ast.mkLiteral(v, 'b', loc()); }
  / v:HEX { return ast.mkLiteral(v, 'h', loc()); }
  / v:DEC { return ast.mkLiteral(v, 'd', loc()); }
  / s:STR { return ast.mkLiteral(s, 's', loc()); }

SQIDENTIFIER "identifier" 
  = head:identNoWS tail:('::' identNoWS)*      { return ast.mkScopeQualifiedIdent(buildList(head, tail, 1), false, loc()); }
  / '::' head:identNoWS tail:('::' identNoWS)* { return ast.mkScopeQualifiedIdent(buildList(head, tail, 1), true, loc()); }

IDENTIFIER "identifier"
  = ident:ident { return ast.mkIdent(ident, loc()); }

REGISTER "register"
 = name:$( A S / A / B / C / D / M _2 / M _1 / M / P C / X Y / X / Y / J _1 / J _2 / J ) !alpha { return ast.mkRegister(name.toLowerCase(),loc()); }

CURRENTPC "current-pc" = STAR { return ast.mkGetCurPC(loc()); }
