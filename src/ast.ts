
export interface Loc {
  offset: number,
  line: number,
  column: number
}

export interface SourceLoc {
  start: Loc,
  end: Loc,
  source: string
}

export interface Node {
  loc: SourceLoc;
}

export interface Label extends Node {
  name: string;
}

export interface AsmLine extends Node {
  label: Label | null;
  stmt: /*Stmt |*/ null;
}

export function mkLabel(name: string, loc: SourceLoc): Label {
  return { name, loc };
}

export function mkAsmLine(
  label: Label | null,
  stmt: /*Stmt |*/ null,
  loc: SourceLoc
): AsmLine {
  return { label, stmt, loc };
}
