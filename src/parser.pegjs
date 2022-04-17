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

Lines 
  = head:LineWithComment tail:(EOL LineWithComment)* {
      return ast.mkProgram(buildList(head, tail, 1), loc());
    }

LineWithComment
  = __ line:Line __ COMMENT? { return line }

Line
  = l:LABEL __ s:Statement   { return ast.mkAsmLine(l,s,loc()); }
  / l:LABEL                  { return ast.mkAsmLine(l,null,loc()); }
  / o:ORG                    { return ast.mkAsmLine(null,o,loc()); }
  / s:Statement              { return ast.mkAsmLine(null,s,loc()); }
  / __                       { return ast.mkAsmLine(null,null,loc()); }

Statement
  = drct:Directive   { return drct; }
  / insn:Instruction { return insn; }


Directive
  = size:PSEUDO_BYTE __ values:ExprList  {
      const dataSize = ast.DataSize.Byte;
      return ast.mkData(dataSize, values, loc());
    }

ExprList = head:Expr tail:(__ CMA __ Expr)* { return buildList(head, tail, 1); }

Instruction
  = m:MNEMONIC __ o1:Expr __ CMA __ o2:Expr { return ast.mkInsn(m,o1,o2,loc()); }
  / m:MNEMONIC __ o1:Expr                   { return ast.mkInsn(m,o1,null,loc()); }
  / m:MNEMONIC                              { return ast.mkInsn(m,null,null,loc()); }

Expr
  = (LITERAL / REGISTER / SQIDENTIFIER)

// ----- G.2 Lexical Scanner -----

// Macros

alpha = [a-zA-Z_]
alphanum = [a-zA-Z_0-9]

hexadecimal = [0-9a-f]i+
binary      = [0-1]+
decimal     = [+-]? [0-9]+
ident       = [a-z]i+ [0-9a-z_]i*

A = 'a'i
B = 'b'i
C = 'c'i
D = 'd'i
G = 'g'i
H = 'h'i
J = 'j'i
M = 'm'i
O = 'o'i
R = 'r'i
X = 'x'i
Y = 'y'i

_0 = '0'
_1 = '1'
_2 = '2'

CMA = ','
COL = ':'
SEM = ';'

PSEUDO_BYTE = 'dfb'i { return 'byte'; }

BIN = v:$binary B         { return parseInt(v,2); }
HEX = _0 X v:$hexadecimal { return parseInt(v,16); }
DEC = v:$decimal D?       { return parseInt(v); } 

STR = '"' c:doubleStringCharacter* '"' { return c.join(''); }

doubleStringCharacter = !'"' char:. { return char; }

identNoWS = (alpha+ alphanum*) { return text(); }

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
COMMENT    "comment"     = (SEM (!EOL .)*)

LABEL      "label"       = s:$ident COL       { return ast.mkLabel(s,loc()); }
ORG        "ORG"         = O R G __ v:LITERAL { return ast.mkSetPC(v, loc()); }
MNEMONIC   "mnemonic"    = [a-z]i+            { return text(); }

LITERAL "literal"
  = v:BIN  { return ast.mkLiteral(v, 'b', loc()); }
  / v:HEX  { return ast.mkLiteral(v, 'h', loc()); }
  / v:DEC  { return ast.mkLiteral(v, 'd', loc()); }
  / s:STR  { return ast.mkLiteral(s, 's', loc()); }

SQIDENTIFIER "identifier" 
  = head:identNoWS tail:('::' identNoWS)* { return ast.mkScopeQualifiedIdent(buildList(head, tail, 1), false, loc()); }
  / '::' head:identNoWS tail:('::' identNoWS)* { return ast.mkScopeQualifiedIdent(buildList(head, tail, 1), true, loc()); }

REGISTER "register"
 = name:$( A / B / C / D / M _2 / M _1 / M / X Y / X / Y / J _1 / J _2 / J ) !alpha { return ast.mkRegister(name.toLowerCase(),loc()); }
