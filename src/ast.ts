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
}
export function mkAsmLine(label: Label | null, stmt: Stmt | null, loc: SourceLoc): Line {
  return { label, stmt, loc };
}

export interface Label extends Node {
  name: string;
}
export function mkLabel(name: string, loc: SourceLoc): Label {
  return { name, loc };
}

export type Stmt = StmtInsn | StmtSetPC;

export interface StmtSetPC extends Node {
  type: 'setpc';
  pc: Expr;
}
export function mkSetPC(pc: Expr, loc: SourceLoc): StmtSetPC {
  return { type: 'setpc', pc, loc };
}

export interface StmtInsn extends Node {
  type: 'insn';
  mnemonic: string;
  p1: Operand | null;
  p2: Operand | null;
}
export function mkInsn(mnemonic: string, p1: Operand | null, p2: Operand | null, loc: SourceLoc): StmtInsn {
  return { type: 'insn', mnemonic, p1, p2, loc };
}

export type Operand = Ident | Literal | Register | ScopeQualifiedIdent;
export type Expr = Ident | Literal | ScopeQualifiedIdent;

export interface Ident extends Node {
  type: 'ident';
  name: string;
}

export interface Literal extends Node {
  type: 'literal',
  value: number,
  ot: string
}
export function mkLiteral(value: number, ot: string, loc: SourceLoc): Literal {
  return { type: 'literal', value, ot, loc };
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
