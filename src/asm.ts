// Heavily customised variant of https://github.com/nurpax/c64jasm/blob/master/src/asm.ts

import * as opc from './opcodes';

import { toHex16 } from './util';
import * as ast from './ast';
import { SourceLoc } from './ast';
import { Segment, mergeSegments, collectSegmentInfo } from './segment';

var parser = require('./g_parser');

interface Error {
  loc: SourceLoc,
  msg: string
}

export interface Diagnostic extends Error {
  formatted: string;
};

interface LabelAddr {
  addr: number,
  loc: SourceLoc
}

interface EvalValue<T> {
  value: T;
  errors: boolean;
  completeFirstPass: boolean; // fully evaluated in first pass?
}

function mkErrorValue<T>(v: T): EvalValue<T> {
  return { value: v, errors: true, completeFirstPass: false };
}

function mkEvalValue<T>(v: T, complete: boolean): EvalValue<T> {
  return { value: v, errors: false, completeFirstPass: complete };
}

function anyErrors(...args: (EvalValue<any> | undefined)[]) {
  return args.some(e => e !== undefined && e.errors);
}

class NamedScope<T> {
  syms: Map<string, T & { seen: number }> = new Map();
  readonly parent: NamedScope<T> | null = null;
  readonly name: string;
  children: Map<string, NamedScope<T>> = new Map();

  constructor(parent: NamedScope<T> | null, name: string) {
    this.parent = parent;
    this.name = name;
  }

  // Find symbol from current and all parent scopes
  findSymbol(name: string): T & { seen: number } | undefined {
    for (let cur: NamedScope<T> | null = this; cur !== null; cur = cur.parent) {
      const n = cur.syms.get(name);
      if (n !== undefined) {
        return n;
      }
    }
    return undefined;
  }

  // Find relative label::path::sym style references from the symbol table
  findSymbolPath(path: string[]): T & { seen: number } | undefined {
    if (path.length === 1) {
      return this.findSymbol(path[0]);
    }

    // Go up the scope tree until we find the start of
    // the relative path.
    let tab: NamedScope<T> | null | undefined = this;
    while (tab.children.get(path[0]) === undefined) {
      tab = tab.parent;
      if (tab === null) {
        return undefined;
      }
    }

    // Go down the tree to match the path to a symbol
    for (let i = 0; i < path.length - 1; i++) {
      tab = tab.children.get(path[i]);
      if (tab === undefined) {
        return undefined;
      }
    }
    return tab.syms.get(path[path.length - 1]);
  }

  addSymbol(name: string, val: T, pass: number): void {
    this.syms.set(name, { ...val, seen: pass });
  }

  updateSymbol(name: string, val: T, pass: number) {
    for (let cur: NamedScope<T> | null = this; cur !== null; cur = cur.parent) {
      const v = cur.syms.get(name);
      if (v !== undefined) {
        cur.syms.set(name, { ...val, seen: pass });
        return;
      }
    }
  }
}

type SymEntry = SymLabel;

interface SymLabel {
  type: 'label';
  segment: Segment;
  data: EvalValue<LabelAddr>;
}

interface SymSegment {
  type: 'segment';
  data: Segment;
}

class Scopes {
  passCount: number = 0;
  root: NamedScope<SymEntry> = new NamedScope<SymEntry>(null, '');
  curSymtab = this.root;
  private anonScopeCount = 0;

  startPass(pass: number): void {
    this.curSymtab = this.root;
    this.anonScopeCount = 0;
    this.passCount = pass;
  }

  findPath(path: string[], absolute: boolean): SymEntry & { seen: number } | undefined {
    if (absolute) {
      return this.root.findSymbolPath(path);
    }
    return this.curSymtab.findSymbolPath(path);
  }

  findQualifiedSym(path: string[], absolute: boolean): SymEntry & { seen: number } | undefined {
    return this.findPath(path, absolute);
  }

  symbolSeen(name: string): boolean {
    const n = this.curSymtab.syms.get(name);
    if (n !== undefined) {
      return n.seen === this.passCount;
    }
    return false;
  }

  declareLabelSymbol(symbol: ast.Label, codePC: number, segment: Segment): boolean {
    const { name, loc } = symbol;

    // As we allow name shadowing, we must look up the name
    // only from the current scope.  If we lookup parent
    // scopes for label declarations, we end up
    // mutating some unrelated, but same-named label names.
    const prevLabel = this.curSymtab.syms.get(name);
    if (prevLabel === undefined) {
      const lblsym: SymLabel = {
        type: 'label',
        segment,
        data: mkEvalValue({ addr: codePC, loc }, false)
      };
      this.curSymtab.addSymbol(name, lblsym, this.passCount);
      return false;
    }
    if (prevLabel.type !== 'label') {
      throw new Error('ICE: declareLabelSymbol should be called only on labels');
    }
    const lbl = prevLabel;
    // If label address has changed change, need one more pass
    if (lbl.data.value.addr !== codePC) {
      const newSymValue: SymLabel = {
        type: 'label',
        segment,
        data: {
          ...prevLabel.data,
          value: {
            ...prevLabel.data.value,
            addr: codePC
          }
        }
      };
      this.curSymtab.updateSymbol(name, newSymValue, this.passCount);
      return true;
    }
    // Update to mark the label as "seen" in this pass
    this.curSymtab.updateSymbol(name, prevLabel, this.passCount);
    return false;
  }

  dumpLabels(codePC: number, segments: [string, Segment][]): { name: string, addr: number, size: number, segmentName: string }[] {
    const segmentToName: { [k: number]: string } = {};
    for (const [n, s] of segments) {
      segmentToName[s.id] = n;
    }
    type StackEntry = { path: string[], sym: NamedScope<SymEntry> };
    const stack: StackEntry[] = [];
    const pushScope = (path: string[] | undefined, sym: NamedScope<SymEntry>) => {
      if (path !== undefined) {
        const newPath = [...path, sym.name];
        stack.push({ path: newPath, sym });
      } else {
        stack.push({ path: [], sym });
      }
    };
    pushScope(undefined, this.root);

    const labels = [];
    while (stack.length > 0) {
      const s = stack.pop()!;
      for (let [k, lbl] of s.sym.syms) {
        if (lbl.type === 'label') {
          labels.push({
            path: [...s.path, k],
            addr: lbl.data.value.addr,
            size: 0,
            segmentName: segmentToName[lbl.segment.id]
          });
        }
      }
      for (let [k, sym] of s.sym.children) {
        pushScope(s.path, sym);
      }
    }

    const sortedLabels = labels.sort((a, b) => {
      return a.addr - b.addr;
    });

    const numLabels = sortedLabels.length;
    if (numLabels > 0) {
      for (let i = 1; i < numLabels; i++) {
        sortedLabels[i - 1].size = sortedLabels[i].addr - sortedLabels[i - 1].addr;
      }
      const last = sortedLabels[numLabels - 1];
      last.size = codePC - last.addr;
    }
    return sortedLabels.map(({ path, addr, size, segmentName }) => {
      return { name: path.join('::'), addr, size, segmentName };
    });
  }
}

// Format "typeof foo" for error messages.  Want 'object' type
// to return 'array' if it's an Array instance.
function formatTypename(v: any): string {
  const typeName = typeof v;
  if (typeName === 'object') {
    if (v instanceof Array) {
      return 'array';
    }
  }
  return typeName;
}

function formatSymbolPath(p: ast.ScopeQualifiedIdent): string {
  return `${p.absolute ? '::' : ''}${p.path.join('::')}`;
}

class Assembler {
  private lineLoc: SourceLoc;
  private curSegmentName = '';
  private curSegment: Segment = new Segment(0, 0, false, 0); // invalid, setup at start of pass
  private pass = 0;
  needPass = false;
  private scopes = new Scopes();
  private segments: [string, Segment][] = [];
  private errorList: Error[] = [];
  private warningList: Error[] = [];

  prg(): Uint8Array {
    const { startPC, binary } = mergeSegments(this.segments);
    const startLo = startPC & 255;
    const startHi = (startPC >> 8) & 255;
    return Uint8Array.from([startLo, startHi, ...binary]);
  }

  anyErrors(): boolean {
    return this.errorList.length !== 0;
  }

  private formatErrors(diags: Error[], errType: 'error' | 'warning'): Diagnostic[] {
    // Remove duplicate errors
    const set = new Set(diags.map(v => JSON.stringify(v)));
    return [...set].map((errJson) => {
      const { loc, msg } = JSON.parse(errJson) as Error;
      let formatted = `<unknown>:1:1: ${errType}: ${msg}`;
      if (loc) {
        formatted = `${loc.start.line}:${loc.start.column}: ${errType}: ${msg}`;
      }
      return {
        loc,
        msg,
        formatted
      };
    });
  }

  errors = () => {
    return this.formatErrors(this.errorList, 'error');
  };

  warnings = () => {
    return this.formatErrors(this.warningList, 'warning');
  };

  addError(msg: string, loc: SourceLoc): void {
    this.errorList.push({ msg, loc });
  }

  addWarning(msg: string, loc: SourceLoc): void {
    this.warningList.push({ msg, loc });
  }

  startPass(pass: number): void {
    this.pass = pass;
    this.needPass = false;
    this.errorList = [];
    this.scopes.startPass(pass);

    // Empty segments list and register the 'default' segment
    this.segments = [];
    const segment = this.newSegment('default', 0, undefined, true);
    this.setCurrentSegment({ type: 'segment', data: segment }, 'default');
  }

  setCurrentSegment(sym: SymSegment, segmentName: string) {
    this.curSegmentName = segmentName;
    this.curSegment = sym.data;
  }

  newSegment(name: string, startAddr: number, endAddr: number | undefined, inferStart: boolean): Segment {
    const segment = new Segment(startAddr, endAddr, inferStart, this.segments.length - 1);

    this.segments.push([name, segment]);
    return segment;
  }

  getPC(): number {
    return this.curSegment.currentPC();
  }

  // Type-error checking variant of evalExpr
  evalExprType<T>(node: ast.Expr, ty: 'number' | 'string' | 'object', msg: string): EvalValue<T> {
    const res = this.evalExpr(node);
    const { errors, value, completeFirstPass } = res;
    if (!errors && typeof value !== ty) {
      this.addError(`Expecting ${msg} to be '${ty}' type, got '${formatTypename(value)}'`, node.loc);
      return {
        errors: true,
        completeFirstPass,
        value
      };
    }
    return res;
  }

  // Type-error checking variant of evalExpr
  evalExprToInt(node: ast.Expr, msg: string): EvalValue<number> {
    return this.evalExprType(node, 'number', msg);
  }

  evalExpr(node: ast.Expr): EvalValue<any> {
    switch (node.type) {
      case 'literal': {
        return mkEvalValue(node.lit, true);
      }
      case 'register': {
        this.addError('Unexpected register', node.loc);
        return mkErrorValue(0);
      }
      case 'ident': {
        throw new Error('should not see an ident here -- if you do, it is probably a wrong type node in parser');
      }
      case 'qualified-ident': {
        // Namespace qualified ident, like foo::bar::baz
        const sym = this.scopes.findQualifiedSym(node.path, node.absolute);
        if (sym === undefined) {
          if (this.pass >= 1) {
            this.addError(`Undefined symbol '${formatSymbolPath(node)}'`, node.loc);
            return mkErrorValue(0);
          }
          // Return a placeholder that should be resolved in the next pass
          this.needPass = true;
          // Evaluated value is marked as "incomplete in first pass"
          return mkEvalValue(0, false);
        }

        switch (sym.type) {
          case 'label':
            return {
              errors: sym.data.errors,
              value: sym.data.value.addr,
              completeFirstPass: sym.seen === this.pass
            };
          //                     case 'var':
          //                         if (sym.seen < this.pass) {
          //                             this.addError(`Undeclared variable '${formatSymbolPath(node)}'`, node.loc);
          //                         }
          //                         return sym.data;
          //                     case 'macro':
          //                     case 'segment':
          //                         this.addError(`Must have a label or a variable identifier here, got ${sym.type} name`, node.loc);
          //                         return mkErrorValue(0);
        }
        break;
      }
      default:
        break;
    }
    throw new Error(`should be unreachable`);
    return mkErrorValue(0); // TODO is this even reachable?
  }

  emit(byte: number): void {
    const err = this.curSegment.emit(byte);
    if (err !== undefined) {
      this.addError(err, this.lineLoc); // Use closest line error loc for the error
    }
  }

  assembleAluInstr(opc: opc.OpCode, stmt: ast.StmtInsn) {
    // Form: xxx [dest]
    if (stmt.p2) { this.addWarning(`Parameter not required`, stmt.p2.loc); }

    // Base opcode
    let opcode = opc.op;

    // Optional first parameter
    if (stmt.p1 && opc.p1) {
      let tgt = this.checkRegister(stmt.p1, opc.p1);
      if (tgt === undefined) { return; }
      opcode |= opc.p1.op(tgt);
    }

    this.emit(opcode);
  }

  assembleClrInstr(opc: opc.OpCode, stmt: ast.StmtInsn) {
    // Form: xxx dest
    if (stmt.p2) { this.addWarning(`Parameter not required`, stmt.p2.loc); }

    // Base opcode
    let opcode = opc.op;

    // First paramter
    if (!stmt.p1 || !opc.p1) {
      this.addError(`Parameter required`, stmt.loc);
      return;
    }
    let tgt = this.checkRegister(stmt.p1, opc.p1);
    if (tgt === undefined) { return; }
    opcode |= opc.p1.op(tgt);

    this.emit(opcode);
  }

  assembleMovInstr(opc: opc.OpCode, stmt: ast.StmtInsn) {
    // Form: xxx dest, src

    if (!stmt.p1 || !opc.p1 || !stmt.p2 || !opc.p2) {
      this.addError(`Two parameters required`, stmt.loc);
      return;
    }

    // Base opcode
    let opcode = opc.op;

    // First paramter
    let tgt = this.checkRegister(stmt.p1, opc.p1);
    if (tgt === undefined) { return; }
    opcode |= opc.p1.op(tgt);

    // Second paramter
    let src = this.checkRegister(stmt.p2, opc.p2);
    if (src === undefined) { return; }
    opcode |= opc.p2.op(src);

    this.emit(opcode);
  }

  assembleLitOpc(opc: opc.OpCode, stmt: ast.StmtInsn) {
    // Form: xxx opcode
    if (stmt.p2) { this.addWarning(`Parameter not required`, stmt.p2.loc); }

    // Base opcode
    let opcode = opc.op;

    // First paramter
    if (!stmt.p1 || !opc.p1) {
      this.addError(`Parameter required`, stmt.loc);
      return;
    }
    let val = this.checkLiteral(stmt.p1, 0x00, 0xFF, 'h');
    if (val === undefined) { return; }
    opcode |= opc.p1.op(val);

    this.emit(opcode);
  }

  assembleSetInstr(opc: opc.OpCode, stmt: ast.StmtInsn) {
    // Form: xxx dest,val OR xxx dest,label
    if (!stmt.p1 || !opc.p1 || !stmt.p2 || !opc.p2) {
      this.addError(`Two parameters required`, stmt.loc);
      return;
    }

    // Base opcode
    let opcode = opc.op;

    // First paramter
    let tgt = this.checkRegister(stmt.p1, opc.p1);
    if (tgt === undefined) { return; }
    opcode |= opc.p1.op(tgt);

    // Second parameter
    if (tgt <= 0x10) {
      // 8 bit ldi
      let val = this.checkLiteral(stmt.p2, -16, 15);
      if (val === undefined) { return; }
      opcode |= opc.p2.op(val);
    } else {
      // 16 bit ldi
    }

    this.emit(opcode);
  }

  checkRegister(given: ast.Expr, available: opc.OpCodeParam): number | undefined {
    if (given.type !== 'register') {
      this.addError(`Register required`, given.loc);
    } else {
      let reg = available.cs![given.value];
      if (reg === undefined) {
        this.addError(`Invalid register - choose one of [${Object.keys(available.cs!).join('|')}]`, given.loc);
      }
      return reg;
    }
    return undefined;
  }

  checkLiteral(given: ast.Expr, min: number, max: number, rangeDisplay: 'b' | 'h' | 'd' = 'd'): number | undefined {
    const ev = this.evalExprToInt(given, 'value');
    if (!anyErrors(ev)) {
      let val = ev.value;
      if (val < min || val > max) {
        let range = '';
        switch (rangeDisplay) {
          case 'b':
            const maxb = max.toString(2);
            const minb = ('0'.repeat(maxb.length) + min.toString(2)).slice(-maxb.length);
            range = `${minb}b and ${maxb}b`;
            break;
          case 'h':
            const maxh = max.toString(16).toUpperCase();
            const minh = ('0'.repeat(maxh.length) + min.toString(16).toUpperCase()).slice(-maxh.length);
            range = `0x${minh} and 0x${maxh}`;
            break;
          default:
            range = `${min} and ${max}`;
        }
        this.addError(`Literal out of range (must be between ${range})`, given.loc);
      } else {
        return val;
      }
    }
    return undefined;
  }

  assembleBranch(opc: opc.OpCode, stmt: ast.StmtInsn) {
    // Form: xxx label
    if (stmt.p2) { this.addWarning(`Parameter not required`, stmt.p2.loc); }
    if (!stmt.p1) {
      this.addError(`Parameter required`, stmt.loc);
      return;
    }
    if (stmt.p1.type !== 'qualified-ident') {
      this.addError(`Identifier required`, stmt.p1.loc);
      return;
    }

    const ev = this.evalExpr(stmt.p1);
    if (anyErrors(ev)) {
      return;
    }
    if (typeof ev.value !== 'number') {
      this.addError(`Expecting branch label to evaluate to integer, got ${formatTypename(ev.value)}`, stmt.p1.loc);
      return;
    }
    const { value: addr } = ev;
    this.emit(opc.op);
    this.emit((addr & 0xff00) >> 8);
    this.emit(addr & 0x00ff);
  }

  handleSetPC(valueExpr: ast.Expr): void {
    const ev = this.evalExprToInt(valueExpr, 'pc');
    if (!anyErrors(ev)) {
      const { value: v, completeFirstPass } = ev;
      if (!completeFirstPass) {
        this.addError('Value for new program counter must evaluate to a value in the first pass', valueExpr.loc);
        return;
      }
      if (!this.curSegment.empty() && this.curSegment.currentPC() > v) {
        this.addError(`Cannot set program counter to a smaller value than current (current: $${toHex16(this.curSegment.currentPC())}, trying to set $${toHex16(v)})`, valueExpr.loc);
      }
      const err = this.curSegment.setCurrentPC(v);
      if (err !== undefined) {
        this.addError(err, valueExpr.loc);
      }
    }
  }

  emit8(v: number) {
    this.emit(v);
    return;
  }

  emitData(exprList: ast.Expr[]) {
    for (let i = 0; i < exprList.length; i++) {
      const ee = this.evalExpr(exprList[i]);
      if (anyErrors(ee)) {
        continue;
      }
      const { value: e } = ee;
      if (typeof e === 'number') {
        this.emit8(e);
      }
    }
  }

  checkDirectives(node: ast.Stmt, localScopeName: string | null): void {
    switch (node.type) {
      case 'data': {
        this.emitData(node.values);
        break;
      }
      case 'setpc': {
        this.handleSetPC(node.pc);
        break;
      }
      default:
        this.addError(`unknown directive ${node.type}`, node.loc);
        return;
    }
  }

  assembleLines(lst: ast.Line[]): void {
    if (lst === null || lst.length === 0) {
      return;
    }
    if (lst.length === 0) {
      return;
    }

    const assemble = (lines: ast.Line[]) => {
      for (let i = 0; i < lines.length; i++) {
        this.assembleLine(lines[i]);
      }
    };

    // Scan for the first real instruction line to skip
    // comments and empty lines at the start of a file.
    let firstLine = 0;
    while (firstLine < lst.length) {
      const { label, stmt } = lst[firstLine];
      if (label === null && stmt === null) {
        firstLine++;
      } else {
        break;
      }
    }
    if (firstLine >= lst.length) {
      return;
    }

    return assemble(lst);
  }

  checkAndDeclareLabel(label: ast.Label) {
    if (this.scopes.symbolSeen(label.name)) {
      this.addError(`Symbol '${label.name}' already defined`, label.loc);
    } else {
      const labelChanged = this.scopes.declareLabelSymbol(label, this.getPC(), this.curSegment);
      if (labelChanged) {
        this.needPass = true;
      }
    }
  }

  assembleLine(line: ast.Line): void {
    this.lineLoc = line.loc;
    // Empty lines are no-ops
    if (line.label === null && line.stmt === null) {
      return;
    }

    if (line.label !== null) {
      this.checkAndDeclareLabel(line.label);
    }

    if (line.stmt === null) {
      return;
    }

    if (line.stmt.type !== 'insn') {
      this.checkDirectives(line.stmt, line.label === null ? null : line.label.name);
      return;
    }

    const stmt = line.stmt;
    const op = opc.opcodes[stmt.mnemonic.toLocaleLowerCase()];

    if (op !== undefined) {
      switch (op.pf) {
        case opc.ParamForm.AluDst:
          this.assembleAluInstr(op, stmt);
          break;
        case opc.ParamForm.ClrTgt:
          this.assembleClrInstr(op, stmt);
          break;
        case opc.ParamForm.MovDstSrc:
          this.assembleMovInstr(op, stmt);
          break;
        case opc.ParamForm.LitOpc:
          this.assembleLitOpc(op, stmt);
          break;
        case opc.ParamForm.SetTgtVal:
          this.assembleSetInstr(op, stmt);
          break;
        case opc.ParamForm.GtoTgt:
          this.assembleBranch(op, stmt);
          break;
        default:
          this.addError(`Couldn't encode instruction '${stmt.mnemonic} '`, line.loc);
      }
    } else {
      this.addError(`Unknown mnemonic '${stmt.mnemonic}'`, stmt.loc);
    }
  }

  assemble(source: string): void {
    try {
      const program = <ast.Program>parser.parse(source.toString());
      if (program !== undefined && program.lines) {
        this.assembleLines(program.lines);
      }
    } catch (err) {
      if ('name' in err && err.name === 'SyntaxError') {
        this.addError(`Syntax error: ${err.message}`, {
          ...err.location
        });
      } else if ('name' in err && err.name === 'semantic') {
        return;
      } else {
        throw err;
      }
    }
  }

  dumpLabels() {
    return this.scopes.dumpLabels(this.getPC(), this.segments);
  }

  collectSegmentInfo() {
    return collectSegmentInfo(this.segments);
  }
}

export function parseOnly(source: string): ast.Program | undefined {
  try {
    return <ast.Program>parser.parse(source.toString());
  } catch {
    return;
  }
}

export function assemble(source: string) {
  const asm = new Assembler();

  let pass = 0;
  do {
    asm.startPass(pass);
    asm.assemble(source);

    if (pass > 0 && asm.anyErrors()) {
      return {
        prg: Uint8Array.from([]),
        labels: [],
        segments: [],
        errors: asm.errors(),
        warnings: asm.warnings()
      };
    }

    pass += 1;
  } while (asm.needPass);

  return {
    prg: asm.prg(),
    errors: asm.errors(),
    warnings: asm.warnings(),
    labels: asm.dumpLabels(),
    segments: asm.collectSegmentInfo()
  };
}
