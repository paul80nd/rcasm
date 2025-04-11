export interface Loc { offset: number, line: number, column: number }
export interface SourceLoc { start: Loc, end: Loc }

export interface Node {
  loc: SourceLoc;
}

export interface Program extends Node {
  lines: Line[] | null;
}
export function mkProgram(lines: Line[] | null, loc: SourceLoc): Program {
  return { lines, loc };
}

export interface Line extends Node {
  label: Label | null;
  stmt: Stmt | null;
  scopedStmts: Line[] | null;
}
export function mkAsmLine(
  label: Label | null,
  stmt: Stmt | null,
  scopedStmts: Line[] | null,
  loc: SourceLoc): Line {
  return { label, stmt, scopedStmts, loc };
}

export interface Label extends Node {
  name: string;
}
export function mkLabel(name: string, loc: SourceLoc): Label {
  return { name, loc };
}

export type Stmt
  = StmtInsn
  | StmtSetPC
  | StmtAlign
  | StmtData
  | StmtFill
  | StmtIfElse
  | StmtError
  | StmtFor
  | StmtLet;

export interface StmtSetPC extends Node {
  type: 'setpc';
  pc: Expr;
}
export function mkSetPC(pc: Expr, loc: SourceLoc): StmtSetPC {
  return { type: 'setpc', pc, loc };
}

export interface GetCurPC extends Node {
  type: 'getcurpc';
}
export function mkGetCurPC(loc: SourceLoc): GetCurPC {
  return {
    type: 'getcurpc',
    loc
  }
}

export interface StmtInsn extends Node {
  type: 'insn';
  mnemonic: string;
  p1: Expr | null;
  p2: Expr | null;
}
export function mkInsn(mnemonic: string, p1: Expr | null, p2: Expr | null, loc: SourceLoc): StmtInsn {
  return { type: 'insn', mnemonic, p1, p2, loc };
}

export enum DataSize { Byte, Word }
export interface StmtData extends Node {
  type: 'data';
  dataSize: DataSize;
  values: Expr[];
}
export function mkData(dataSize: DataSize, values: Expr[], loc: SourceLoc): StmtData {
  return {
    type: 'data',
    values,
    dataSize,
    loc
  };
}

export interface StmtFill extends Node {
  type: 'fill';
  numBytes: Expr;
  fillValue: Expr;
}
export function mkFill(numBytes: Expr, fillValue: Expr, loc: SourceLoc): StmtFill {
  return { type: 'fill', numBytes, fillValue, loc }
}

export interface StmtAlign extends Node {
  type: 'align';
  alignBytes: Expr;
}

export function mkAlign(alignBytes: Expr, loc: SourceLoc): StmtAlign {
  return { type: 'align', alignBytes, loc }
}

export interface StmtIfElse extends Node {
  type: 'if';
  cases: [Expr, Line[]][];
  elseBranch: Line[];
}
export function mkIfElse(cases: [Expr, Line[]][], elseBranch: Line[], loc: SourceLoc): StmtIfElse {
  return {
    type: 'if',
    cases,
    elseBranch: elseBranch !== null ? elseBranch : [],
    loc
  }
}

export interface StmtError extends Node {
  type: 'error';
  error: Literal;
}
export function mkError(error: Literal, loc: SourceLoc): StmtError {
  return {
    type: 'error',
    error,
    loc
  }
}

export interface StmtFor extends Node {
  type: 'for',
  index: Ident;
  list: Expr;
  body: Line[];
}
export function mkFor(index: Ident, list: Expr, body: Line[], loc: SourceLoc): StmtFor {
  return {
    type: 'for',
    index,
    list,
    body,
    loc
  }
}

export interface StmtLet extends Node {
  type: 'let',
  name: Ident;
  value: Expr;
}
export function mkLet(name: Ident, value: Expr, loc: SourceLoc): StmtLet {
  return {
    type: 'let',
    name,
    value,
    loc
  }
}


export type Expr
  = Ident
  | ScopeQualifiedIdent
  | Register
  | Literal
  | BinaryOp
  | CallFunc
  | GetCurPC;

export interface CallFunc extends Node {
  type: 'callfunc';
  callee: Expr;
  args: Expr[];
}
export function mkCallFunc(callee: Expr, args: Expr[], loc: SourceLoc): CallFunc {
  return {
    type: 'callfunc',
    callee,
    args: args == null ? [] : args,
    loc
  }
}

export interface Literal extends Node {
  type: 'literal',
  lit: number | string,
  ot: string
}
export function mkLiteral(lit: number | string, ot: string, loc: SourceLoc): Literal {
  return { type: 'literal', lit, ot, loc };
}

export interface Register extends Node {
  type: 'register',
  value: string
}
export function mkRegister(value: string, loc: SourceLoc): Register {
  return { type: 'register', value, loc };
}

export interface ScopeQualifiedIdent extends Node {
  type: 'qualified-ident';
  path: string[];
  absolute: boolean;
}
export function mkScopeQualifiedIdent(path: string[], absolute: boolean, loc: SourceLoc): ScopeQualifiedIdent {
  return { type: 'qualified-ident', path, absolute, loc };
}

export interface Ident extends Node {
  type: 'ident';
  name: string;
}
export function mkIdent(name: string, loc: SourceLoc): Ident {
  return { type: 'ident', name, loc };
}

export interface BinaryOp extends Node {
  type: 'binary';
  op: string;
  left: Expr;
  right: Expr;
}
export function mkBinaryOp(op: string, left: Expr, right: Expr, loc: SourceLoc): BinaryOp {
  return { type: 'binary', op, left, right, loc };
}
