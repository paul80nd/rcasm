
export interface Loc {
  offset: number,
  line: number,
  column: number
}

export interface SourceLoc {
  start: Loc,
  end: Loc
}

export interface Node {
  loc: SourceLoc;
}

export interface Label extends Node {
  name: string;
}

export interface Literal extends Node {
   type: 'literal',
   value: number,
   ot: string
 }

export interface Ident extends Node {
  type: 'ident';
  name: string;
}

export function mkLiteral(value: number, ot: string, loc: SourceLoc): Literal {
  return { type: 'literal', value, ot, loc };
 }

export function mkIdent(name: string, loc: SourceLoc): Ident {
  return { type: 'ident', name, loc };
}

export type Operand =
  Ident | Literal

export type Stmt =
  StmtInsn

export interface StmtInsn extends Node {
  type: 'insn';
  mnemonic: string;
  op1: Operand | null;
  op2: Operand | null;
}

export interface AsmLine extends Node {
  label: Label | null;
  stmt: Stmt | null;
}

export function mkLabel(name: string, loc: SourceLoc): Label {
  return { name, loc };
}

export function mkInsn(mnemonic: string, op1: Operand | null, op2: Operand | null, loc: SourceLoc): StmtInsn {
  return { type: 'insn', mnemonic, op1, op2, loc }
}

export function mkAsmLine(label: Label | null, stmt: Stmt | null, loc: SourceLoc): AsmLine {
  return { label, stmt, loc };
}
