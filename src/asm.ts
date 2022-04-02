// Heavily customised copy of https://github.com/nurpax/c64jasm/blob/master/src/asm.ts

import * as opc from './opcodes'
// import * as path from 'path'
// const importFresh = require('import-fresh');

// import * as fs from 'fs'
// import { toHex16 } from './util'
import * as ast from './ast'
import { SourceLoc } from './ast'
import { Segment, mergeSegments, collectSegmentInfo } from './segment';
// import ParseCache from './parseCache'
// import { DebugInfoTracker } from './debugInfo';

var parser = require('./g_parser')

// type ReadFileFunc = ((filename: string, encoding: string) => string) | ((filename: string, options?: null) => Buffer);

// interface JSCallError extends Error {
//     jsError?: boolean;
// };

// function isJsCallError(e: Error | JSCallError): e is JSCallError {
//     return (e as JSCallError).jsError !== undefined;
// }

// export interface PlatformOptions {
//   name: string;
//   defaultStartPC: number;
// };

// export const platformC64 = {
//   name: 'c64',
//   defaultStartPC: 0x801
// };

// export interface AssemblerOptions {
//     readFileSync: ReadFileFunc;
//     platformOptions?: PlatformOptions;
// }

interface Error {
  loc: SourceLoc,
  msg: string
}

export interface Diagnostic extends Error {
  formatted: string;
};

// interface LabelAddr {
//     addr: number,
//     loc: SourceLoc
// }

// interface EvalValue<T> {
//     value: T;
//     errors: boolean;
//     completeFirstPass: boolean; // fully evaluated in first pass?
// }

// function mkErrorValue<T>(v: T): EvalValue<T> {
//     return { value: v, errors: true, completeFirstPass: false };
// }

// function mkEvalValue<T>(v: T, complete: boolean): EvalValue<T> {
//     return { value: v, errors: false, completeFirstPass: complete };
// }

// function anyErrors(...args: (EvalValue<any> | undefined)[]) {
//     return args.some(e => e !== undefined && e.errors);
// }

// // Compute "computeFirstPass" info for a multiple expression values
// // Any non-first pass value means the result expression is also
// // not evaluatable to a value in the first pass.
// function combineEvalPassInfo(...args: (EvalValue<any> | undefined)[]) {
//     return args.every(e => e !== undefined && e.completeFirstPass);
// }

// class NamedScope<T> {
//     syms: Map<string, T & {seen: number}> = new Map();
//     readonly parent: NamedScope<T> | null = null;
//     readonly name: string;
//     children: Map<string, NamedScope<T>> = new Map();

//     constructor (parent: NamedScope<T> | null, name: string) {
//         this.parent = parent;
//         this.name = name;
//     }

//     newScope(name: string, parent: NamedScope<T>): NamedScope<T> {
//         const s = this.children.get(name);
//         if (s !== undefined) {
//             return s;
//         }
//         const newScope = new NamedScope<T>(parent, name);
//         this.children.set(name, newScope);
//         return newScope;
//     }

//     // Find symbol from current and all parent scopes
//     findSymbol(name: string): T & {seen: number} | undefined {
//         for (let cur: NamedScope<T>|null = this; cur !== null; cur = cur.parent) {
//             const n = cur.syms.get(name);
//             if (n !== undefined) {
//                 return n;
//             }
//         }
//         return undefined;
//     }

//     // Find relative label::path::sym style references from the symbol table
//     findSymbolPath(path: string[]): T & {seen: number} | undefined {
//         if (path.length == 1) {
//             return this.findSymbol(path[0]);
//         }

//         // Go up the scope tree until we find the start of
//         // the relative path.
//         let tab: NamedScope<T> | null | undefined = this;
//         while (tab.children.get(path[0]) == undefined) {
//             tab = tab.parent;
//             if (tab == null) {
//                 return undefined;
//             }
//         }

//         // Go down the tree to match the path to a symbol
//         for (let i = 0; i < path.length-1; i++) {
//             tab = tab.children.get(path[i]);
//             if (tab == undefined) {
//                 return undefined;
//             }
//         }
//         return tab.syms.get(path[path.length-1]);
//     }

//     addSymbol(name: string, val: T, pass: number): void {
//         this.syms.set(name, { ...val, seen: pass });
//     }

//     updateSymbol(name: string, val: T, pass: number) {
//         for (let cur: NamedScope<T>|null = this; cur !== null; cur = cur.parent) {
//             const v = cur.syms.get(name);
//             if (v !== undefined) {
//                 cur.syms.set(name, { ...val, seen: pass });
//                 return;
//             }
//         }
//     }
// }

// type SymEntry  = SymLabel | SymVar | SymMacro | SymSegment;

// interface SymLabel {
//     type: 'label';
//     segment: Segment;
//     data: EvalValue<LabelAddr>;
// }

// interface SymVar {
//     type: 'var';
//     data: EvalValue<any>;
// }

interface SymSegment {
  type: 'segment';
  data: Segment;
}

// interface SymMacro {
//     type: 'macro';
//     macro: ast.StmtMacro;
//     declaredIn: NamedScope<SymEntry>;
// }

// class Scopes {
//     passCount: number = 0;
//     root: NamedScope<SymEntry> = new NamedScope<SymEntry>(null, '');
//     curSymtab = this.root;
//     private anonScopeCount = 0;

//     startPass(pass: number): void {
//         this.curSymtab = this.root;
//         this.anonScopeCount = 0;
//         this.passCount = pass;
//     }

//     withAnonScope(body: () => void, parent?: NamedScope<SymEntry>) {
//         const anonLabel = `__anon_scope_${this.anonScopeCount}`;
//         this.anonScopeCount++;
//         this.withLabelScope(anonLabel, body, parent);
//     }

//     withLabelScope(name: string, body: () => void, parent?: NamedScope<SymEntry>) {
//         const curSym = this.curSymtab;
//         this.curSymtab = this.curSymtab.newScope(name, parent || curSym);
//         body();
//         this.curSymtab = curSym;
//     }

//     findPath(path: string[], absolute: boolean): SymEntry & {seen: number} | undefined {
//         if (absolute) {
//             return this.root.findSymbolPath(path);
//         }
//         return this.curSymtab.findSymbolPath(path);
//     }

//     findQualifiedSym(path: string[], absolute: boolean): SymEntry & {seen: number} | undefined {
//         return this.findPath(path, absolute);
//     }

//     symbolSeen(name: string): boolean {
//         const n = this.curSymtab.syms.get(name);
//         if (n !== undefined) {
//             return n.seen == this.passCount;
//         }
//         return false;
//     }

//     declareLabelSymbol(symbol: ast.Label, codePC: number, segment: Segment): boolean {
//         const { name, loc } = symbol;

//         // As we allow name shadowing, we must look up the name
//         // only from the current scope.  If we lookup parent
//         // scopes for label declarations, we end up
//         // mutating some unrelated, but same-named label names.
//         const prevLabel = this.curSymtab.syms.get(name);
//         if (prevLabel === undefined) {
//             const lblsym: SymLabel = {
//                 type: 'label',
//                 segment,
//                 data: mkEvalValue({ addr: codePC, loc }, false)
//             };
//             this.curSymtab.addSymbol(name, lblsym, this.passCount);
//             return false;
//         }
//         if (prevLabel.type !== 'label') {
//             throw new Error('ICE: declareLabelSymbol should be called only on labels');
//         }
//         const lbl = prevLabel;
//         // If label address has changed change, need one more pass
//         if (lbl.data.value.addr !== codePC) {
//             const newSymValue: SymLabel = {
//                 type: 'label',
//                 segment,
//                 data: {
//                     ...prevLabel.data,
//                     value: {
//                         ...prevLabel.data.value,
//                         addr: codePC
//                     }
//                 }
//             }
//             this.curSymtab.updateSymbol(name, newSymValue, this.passCount);
//             return true;
//         }
//         // Update to mark the label as "seen" in this pass
//         this.curSymtab.updateSymbol(name, prevLabel, this.passCount);
//         return false;
//     }

//     declareVar(name: string, value: EvalValue<any>): void {
//         this.curSymtab.addSymbol(name, {
//             type: 'var',
//             data: value
//         }, this.passCount)
//     }

//     updateVar(symbolName: string, val: EvalValue<any>) {
//         const newVar: SymVar = {
//             type: 'var',
//             data: val
//         };
//         this.curSymtab.updateSymbol(symbolName, newVar, this.passCount);
//     }

//     declareSegment(name: string, seg: Segment): void {
//         this.curSymtab.addSymbol(name, {
//             type: 'segment',
//             data: seg
//         }, this.passCount)
//     }

//     findMacro(path: string[], absolute: boolean): SymMacro & { seen: number } | undefined {
//         const sym = this.findPath(path, absolute);
//         if (sym !== undefined && sym.type == 'macro') {
//             return sym;
//         }
//         return undefined;
//     }

//     declareMacro(name: string, value: ast.StmtMacro): void {
//         this.curSymtab.addSymbol(name, {
//             type: 'macro',
//             macro: value,
//             declaredIn: this.curSymtab
//         }, this.passCount)
//     }

//     dumpLabels(codePC: number, segments: [string, Segment][]): {name: string, addr: number, size: number, segmentName: string}[] {
//         const segmentToName: { [k: number]: string } = {};
//         for (const [n,s] of segments) {
//             segmentToName[s.id] = n;
//         }
//         type StackEntry = {path: string[], sym: NamedScope<SymEntry>};
//         const stack: StackEntry[] = [];
//         const pushScope = (path: string[]|undefined, sym: NamedScope<SymEntry>) => {
//             if (path !== undefined) {
//                 const newPath = [...path, sym.name];
//                 stack.push({ path: newPath, sym });
//             } else {
//                 stack.push({ path: [], sym });
//             }
//         }
//         pushScope(undefined, this.root);

//         const labels = [];
//         while (stack.length > 0) {
//             const s = stack.pop()!;
//             for (let [k,lbl] of s.sym.syms) {
//                 if (lbl.type == 'label') {
//                     labels.push({
//                         path: [...s.path, k],
//                         addr: lbl.data.value.addr,
//                         size: 0,
//                         segmentName: segmentToName[lbl.segment.id]
//                     });
//                 }
//             }
//             for (let [k, sym] of s.sym.children) {
//                 pushScope(s.path, sym);
//             }
//         }

//         const sortedLabels = labels.sort((a, b) => {
//             return a.addr - b.addr;
//         })

//         const numLabels = sortedLabels.length;
//         if (numLabels > 0) {
//             for (let i = 1; i < numLabels; i++) {
//                 sortedLabels[i-1].size = sortedLabels[i].addr - sortedLabels[i-1].addr;
//             }
//             const last = sortedLabels[numLabels-1];
//             last.size = codePC - last.addr;
//         }
//         return sortedLabels.map(({ path, addr, size, segmentName }) => {
//             return { name: path.join('::'), addr, size, segmentName };
//         });
//     }
// }

// function isTrueVal(cond: number | boolean): boolean {
//     return (cond === true || cond != 0);
// }

// function makeCompileLoc(filename: string) {
//     // SourceLoc can be undefined here if parse is executed out of AST
//     // (e.g., source file coming from CLI), so make up an error loc for it.
//     return {
//         source: filename,
//         start: { offset: 0, line: 0, column: 0 },
//         end: { offset: 0, line: 0, column: 0 }
//     };
// }

// // Format "typeof foo" for error messages.  Want 'object' type
// // to return 'array' if it's an Array instance.
// function formatTypename(v: any): string {
//     const typeName = typeof v;
//     if (typeName === 'object') {
//         if (v instanceof Array) {
//             return 'array';
//         }
//     }
//     return typeName;
// }

// function formatSymbolPath(p: ast.ScopeQualifiedIdent): string {
//     return `${p.absolute ? '::' : ''}${p.path.join('::')}`;
// }

// interface BranchOffset {
//     offset: number;
//     loc: SourceLoc;
// }

// const runBinop = (a: EvalValue<number>, b: EvalValue<number>, f: (a: number, b: number) => number | boolean): EvalValue<number> => {
//     const res = f(a.value as number, b.value as number);
//     const firstPassComplete = combineEvalPassInfo(a, b);
//     if (typeof res == 'boolean') {
//         return mkEvalValue(res ? 1 : 0, firstPassComplete);
//     }
//     return mkEvalValue(res, firstPassComplete);
// }

// const runUnaryOp = (a: EvalValue<number>, f: (a: number) => number | boolean): EvalValue<number> => {
//     if (anyErrors(a)) {
//         return mkErrorValue(0);
//     }
//     const res = f(a.value as number);
//     if (typeof res == 'boolean') {
//         return mkEvalValue(res ? 1 : 0, a.completeFirstPass);
//     }
//     return mkEvalValue(res, a.completeFirstPass);
// }

// // true if running in Node.js
// const isRunningNodeJS = typeof process !== 'undefined' &&
//     process.versions != null &&
//     process.versions.node != null;

// function browserRequire(code: Buffer) {
//     let module = { exports: {} };
//     let wrapper = Function("module", code.toString());
//     wrapper(module);
//     return module.exports;
// }

class Assembler {
  //     private parseCache = new ParseCache();
  //     private pluginCache = new Map();

  //     private includeStack: string[] = [];

  private lineLoc: SourceLoc;
  private curSegmentName = '';
  private curSegment: Segment = new Segment(0, 0, false, 0); // invalid, setup at start of pass
  //     private pass = 0;
  //     needPass = false;
  //     private scopes = new Scopes();
  private segments: [string, Segment][] = [];
  private errorList: Error[] = [];
  private warningList: Error[] = [];
  //     outOfRangeBranches: BranchOffset[] = [];

  //     // PC<->source location tracking for debugging support.  Reset on each pass
  //     debugInfo = new DebugInfoTracker();

  //     private platform: PlatformOptions;
  //     private readFileSyncFunc: any;

  constructor() {
    //         this.readFileSyncFunc = options.readFileSync;
    //         this.platform = options.platformOptions || platformC64;
  }

  //     private readFileSync(filename: string, options: string): string;
  //     private readFileSync(filename: string, options?: {} | null): Buffer;
  //     private readFileSync(filename: string, options?: string | null): string | Buffer {
  //         return this.readFileSyncFunc(filename, options);
  //     }

  prg(): Buffer {
    const { startPC, binary } = mergeSegments(this.segments);
    const startLo = startPC & 255;
    const startHi = (startPC >> 8) & 255;
    return Buffer.concat([Buffer.from([startLo, startHi]), binary]);
  }

  //     addJSStackErrors(err: any, loc: SourceLoc) {
  //         // Additional error information from JavaScript exception
  //         if (err.stack) {
  //             const lines = err.stack.split('\n');
  //             if (lines.length > 0) {
  //                 const m = lines[0].match(/(.*):(\d+)/);
  //                 if (m) {
  //                     const jsSource = m[1];
  //                     const line = m[2];
  //                     const rel = path.relative(path.dirname(loc.source), jsSource);
  //                     const r = this.makeSourceRelativePath(rel);
  //                     let err = null;
  //                     for (let i = 1; i < lines.length; i++) {
  //                         const m = lines[i].match(/^([a-zA-Z]*Error:.*)/);
  //                         if (m) {
  //                             err = m[1];
  //                         }
  //                     }
  //                     const jsLoc: SourceLoc = {
  //                         start: { offset: -1, line, column: 1 },
  //                         end: { offset: -1, line, column: 2},
  //                         source: r
  //                     };
  //                     this.addError(`${err ?? 'null'}`, jsLoc);
  //                 } else if (lines.length >= 2) {
  //                     // Errors of below syntax:
  //                     //
  //                     // ReferenceError: arg1 is not defined
  //                     //  at module.exports (/abs/path/test/errors/js_errors2.js:3:19)
  //                     const m0 = lines[0].match(/^([a-zA-Z]*Error:.*)/);
  //                     const m1 = lines[1].match(/^\s*at\s+.+\s+\((.+):(\d+):(\d+)\)/);
  //                     if (m0 && m1) {
  //                         const err = m0[1];
  //                         const jsSource = m1[1];
  //                         const line = m1[2];
  //                         const col = m1[3];
  //                         const rel = path.relative(path.dirname(loc.source), jsSource);
  //                         const source = this.makeSourceRelativePath(rel);
  //                         const jsLoc = {
  //                             start: { offset: -1, line, column: col },
  //                             end: { offset: -1, line, column: col },
  //                             source
  //                         }
  //                         this.addError(`${err}`, jsLoc);
  //                     }
  //                 }
  //             }
  //         }
  //     }

  //     // Cache plugin require's so that we fresh require() them only in the first pass.
  //     // importFresh is somewhat slow because it blows through Node's cache
  //     // intentionally.  We don't want it completely cached because changes to plugin
  //     // code must trigger a recompile and in that case we want the plugins really
  //     // reloaded too.
  //     requirePlugin(fname: string, loc: SourceLoc): EvalValue<any> {
  //         const p = this.pluginCache.get(fname);
  //         if (p !== undefined) {
  //             return p;
  //         }
  //         const sourceRelativePath = this.makeSourceRelativePath(fname);
  //         try {
  //             let newPlugin = undefined;
  //             if (isRunningNodeJS) {
  //                 newPlugin = importFresh(path.resolve(sourceRelativePath));
  //             } else {
  //                 const source = this.guardedReadFileSync(`${sourceRelativePath}.js`, loc);
  //                 if (source !== undefined) {
  //                     newPlugin = browserRequire(source);
  //                 }
  //             }
  //             if (newPlugin === undefined) {
  //                 return mkErrorValue(0);
  //             }
  //             const m = mkEvalValue(newPlugin, true);
  //             this.pluginCache.set(fname, m);
  //             return m;
  //         } catch(err) {
  //             this.addError(`Plugin load failed: ${sourceRelativePath}.js: ${err.message}`, loc);
  //             this.addJSStackErrors(err, loc);
  //             return mkErrorValue(0);
  //         }
  //     }

  //     peekSourceStack (): string {
  //         const len = this.includeStack.length;
  //         return this.includeStack[len-1];
  //     }

  //     pushSource (fname: string): void {
  //         this.includeStack.push(fname);
  //     }

  //     popSource (): void {
  //         this.includeStack.pop();
  //     }

  //     anyErrors (): boolean {
  //         return this.errorList.length !== 0;
  //     }

  private formatErrors(diags: Error[], errType: 'error' | 'warning'): Diagnostic[] {
    // Remove duplicate errors
    const set = new Set(diags.map(v => JSON.stringify(v)));
    return [...set].map((errJson) => {
      const { loc, msg } = JSON.parse(errJson) as Error;
      let formatted = `<unknown>:1:1: ${errType}: ${msg}`
      if (loc) {
        formatted = `${loc.start.line}:${loc.start.column}: ${errType}: ${msg}`
      }
      return {
        loc,
        msg,
        formatted
      }
    })
  }

  errors = () => {
    return this.formatErrors(this.errorList, 'error');
  }

  warnings = () => {
    return this.formatErrors(this.warningList, 'warning');
  }

  addError(msg: string, loc: SourceLoc): void {
    this.errorList.push({ msg, loc });
  }

  addWarning(msg: string, loc: SourceLoc): void {
    this.warningList.push({ msg, loc });
  }

  startPass(pass: number): void {
    //         this.pass = pass;
    //         this.needPass = false;
    this.errorList = [];
    //         this.scopes.startPass(pass);
    //         this.outOfRangeBranches = [];
    //         this.debugInfo = new DebugInfoTracker();

    // Empty segments list and register the 'default' segment
    this.segments = [];
    const segment = this.newSegment('default', 0, undefined, true);
    this.setCurrentSegment({ type: 'segment', data: segment }, 'default');
    // this.scopes.declareSegment('default', this.curSegment);
  }

  setCurrentSegment(sym: SymSegment, segmentName: string) {
    this.curSegmentName = segmentName;
    this.curSegment = sym.data;
  }

  newSegment(name: string, startAddr: number, endAddr: number | undefined, inferStart: boolean): Segment {
    const segment = new Segment(startAddr, endAddr, inferStart, this.segments.length - 1);

    //         // TODO This does not check overlaps with the "default" segment.  It's not
    //         // (?) doable here because the default segment grows.  So need another
    //         // overlap pass when making the final output binary.
    //         for (let i = 1; i < this.segments.length; i++) {
    //             const [n, s] =  this.segments[i];
    //             if (this.segments[i][1].overlaps(segment)) {
    //                 this.addError(`Segment '${name}' (range: ${segment.formatRange()} overlaps with an earlier segment '${n}' (range: ${s.formatRange()})`, this.lineLoc);
    //             }
    //         }
    this.segments.push([name, segment]);
    return segment;
  }

  //     getPC(): number {
  //         return this.curSegment.currentPC();
  //     }

  //     emitBasicHeader () {
  //         this.emit(0x0c);
  //         this.emit(0x08);
  //         this.emit(0x00);
  //         this.emit(0x00);
  //         this.emit(0x9e);
  //         const addr = 0x80d;
  //         const dividers = [10000, 1000, 100, 10, 1];
  //         dividers.forEach((div) => {
  //             if (addr >= div) {
  //                 this.emit(0x30 + ((addr / div) % 10));
  //             }
  //         });
  //         this.emit(0);
  //         this.emit(0);
  //         this.emit(0);
  //     }

  //     emitBinary (ast: ast.StmtBinary): void {
  //         const { kwargs } = ast;
  //         const [evalFname, fnameLoc] = this.evalKwargToString(kwargs, 'file', ast.loc);

  //         let [sizeEv, sizeLoc] = this.evalKwargToIntMaybe(kwargs, 'size', ast.loc);
  //         const [offsetEv, offsetLoc] = this.evalKwargToIntMaybe(kwargs, 'offset', ast.loc);
  //         const size = sizeEv;
  //         const offset = offsetEv ?? mkEvalValue(0, true);
  //         const kwargsOK = this.validateKwargs(kwargs, ['file', 'size', 'offset']);
  //         // Don't try to load or emit anything if there was an error
  //         if (anyErrors(evalFname, offset, size ?? undefined) || !kwargsOK) {
  //             return;
  //         }

  //         // Require that !binary offset and size arguments
  //         // evaluate to a value in the first pass.
  //         if (!offset.completeFirstPass) {
  //             this.addError("!binary 'offset' must evaluate to a value in the first pass", offsetLoc);
  //         }
  //         if (size !== null && !size.completeFirstPass) {
  //             this.addError("!binary 'size' must evaluate to a value in the first pass", sizeLoc);
  //         }

  //         const fname = this.makeSourceRelativePath(evalFname.value);
  //         const buf = this.guardedReadFileSync(fname, ast.loc);
  //         if (buf === undefined) { // can happen if file is not found
  //             return;
  //         }
  //         const numBytes = size !== null ? size.value : buf.byteLength;
  //         // size is truncated in case size+offset reaches beyond the
  //         // end of the binary file.
  //         const truncated = buf.slice(offset.value, offset.value + numBytes);
  //         for (const b of truncated) {
  //             this.emit(b);
  //         }
  //     }

  //     // Type-error checking variant of evalExpr
  //     evalExprType<T>(node: ast.Expr, ty: 'number'|'string'|'object', msg: string): EvalValue<T> {
  //         const res = this.evalExpr(node);
  //         const { errors, value, completeFirstPass } = res;
  //         if (!errors && typeof value !== ty) {
  //             this.addError(`Expecting ${msg} to be '${ty}' type, got '${formatTypename(value)}'`, node.loc);
  //             return {
  //                 errors: true,
  //                 completeFirstPass,
  //                 value
  //             }
  //         }
  //         return res;
  //     }

  //     evalKwargType<T>(kwargs: ast.Kwarg[], argName: string, ty: 'number'|'string'|'object', loc: SourceLoc): [EvalValue<T>, SourceLoc] {
  //         for (const a of kwargs) {
  //             if (a.name.name === argName) {
  //                 const ev = this.evalExprType<T>(a.value, ty, `keyword arg '${argName}'`);
  //                 return [ev, a.loc];
  //             }
  //         }
  //         this.addError(`Missing required keyword arg '${argName}'`, loc);
  //         return [mkErrorValue<T>(0 as any), loc];
  //     }

  //     evalKwargTypeMaybe<T>(kwargs: ast.Kwarg[], argName: string, ty: 'number'|'string'|'object', loc: SourceLoc): [EvalValue<T> | null, SourceLoc] {
  //         for (const a of kwargs) {
  //             if (a.name.name === argName) {
  //                 const ev = this.evalExprType<T>(a.value, ty, `keyword arg '${argName}'`);
  //                 return [ev, a.loc];
  //             }
  //         }
  //         return [null, loc];
  //     }

  //     validateKwargs(kwargs: ast.Kwarg[], knownArgs: string[]): boolean {
  //         let ok = true;
  //         const argHisto: { [name: string]: number } = {};

  //         for (const a of kwargs) {
  //             const n = a.name.name;
  //             if (argHisto[n] === undefined) {
  //                 argHisto[n] = 1;
  //             } else {
  //                 argHisto[n] += 1;
  //             }
  //             if (argHisto[n] > 1) {
  //                 this.addError(`Duplicate keyword arg '${n}'`, a.loc);
  //                 ok = false;
  //             }
  //         }

  //         for (const a of kwargs) {
  //             if (knownArgs.indexOf(a.name.name) < 0) {
  //                 this.addError(`Unexpected keyword arg '${a.name.name}'`, a.loc);
  //                 ok = false;
  //             }
  //         }
  //         return ok;
  //     }

  //     // Type-error checking variant of evalExpr
  //     evalExprToInt(node: ast.Expr, msg: string): EvalValue<number> {
  //         return this.evalExprType(node, 'number', msg);
  //     }

  //     evalExprToString(node: ast.Expr, msg: string): EvalValue<string> {
  //         return this.evalExprType(node, 'string', msg);
  //     }

  //     evalKwargToInt(kwargs: ast.Kwarg[], argName: string, loc: SourceLoc): [EvalValue<number>, SourceLoc] {
  //         return this.evalKwargType(kwargs, argName, 'number', loc);
  //     }

  //     evalKwargToString(kwargs: ast.Kwarg[], argName: string, loc: SourceLoc): [EvalValue<string>, SourceLoc] {
  //         return this.evalKwargType(kwargs, argName, 'string', loc);
  //     }

  //     evalKwargToIntMaybe(kwargs: ast.Kwarg[], argName: string, loc: SourceLoc): [EvalValue<number> | null, SourceLoc] {
  //         return this.evalKwargTypeMaybe(kwargs, argName, 'number', loc);
  //     }

  //     evalExpr(node: ast.Expr): EvalValue<any> {
  //         switch (node.type) {
  //             case 'binary': {
  //                 const left = this.evalExpr(node.left);
  //                 const right = this.evalExpr(node.right);
  //                 if (anyErrors(left, right)) {
  //                     return mkErrorValue(0);
  //                 }
  //                 if (typeof left.value !== typeof right.value) {
  //                     this.addError(`Binary expression operands are expected to be of the same type.  Got: '${formatTypename(left.value)}' (left), '${formatTypename(right.value)}' (right)`, node.loc);
  //                     return mkErrorValue(0);
  //                 }
  //                 if (typeof left.value !== 'string' && typeof left.value !== 'number') {
  //                     this.addError(`Binary expression operands can only operator on numbers or strings.  Got: '${formatTypename(left.value)}'`, node.loc);
  //                     return mkErrorValue(0);
  //                 }
  //                 // Allow only a subset of operators for strings
  //                 if (typeof left.value == 'string') {
  //                     const okOps = ['+', '==', '<', '<=', '>', '>='];
  //                     if (okOps.indexOf(node.op) < 0) {
  //                         this.addError(`'${node.op}' operator is not supported for strings.  Valid operators for strings are: ${okOps.join(', ')}`, node.loc);
  //                         return mkErrorValue(0);
  //                     }
  //                 }
  //                 switch (node.op) {
  //                     case '+': return  runBinop(left, right, (a,b) => a + b)
  //                     case '-': return  runBinop(left, right, (a,b) => a - b)
  //                     case '*': return  runBinop(left, right, (a,b) => a * b)
  //                     case '/': return  runBinop(left, right, (a,b) => a / b)
  //                     case '%': return  runBinop(left, right, (a,b) => a % b)
  //                     case '&': return  runBinop(left, right, (a,b) => a & b)
  //                     case '|': return  runBinop(left, right, (a,b) => a | b)
  //                     case '^': return  runBinop(left, right, (a,b) => a ^ b)
  //                     case '<<': return runBinop(left, right, (a,b) => a << b)
  //                     case '>>': return runBinop(left, right, (a,b) => a >> b)
  //                     case '==': return runBinop(left, right, (a,b) => a == b)
  //                     case '!=': return runBinop(left, right, (a,b) => a != b)
  //                     case '<':  return runBinop(left, right, (a,b) => a <  b)
  //                     case '<=': return runBinop(left, right, (a,b) => a <= b)
  //                     case '>':  return runBinop(left, right, (a,b) => a >  b)
  //                     case '>=': return runBinop(left, right, (a,b) => a >= b)
  //                     case '&&': return runBinop(left, right, (a,b) => a && b)
  //                     case '||': return runBinop(left, right, (a,b) => a || b)
  //                     default:
  //                         throw new Error(`Unhandled binary operator ${node.op}`);
  //                 }
  //             }
  //             case 'unary': {
  //                 const v = this.evalExprToInt(node.expr, 'operand');
  //                 if (v.errors) {
  //                     return v;
  //                 }
  //                 switch (node.op) {
  //                     case '+': return runUnaryOp(v, v => +v);
  //                     case '-': return runUnaryOp(v, v => -v);
  //                     case '~': return runUnaryOp(v, v => ~v);
  //                     default:
  //                         throw new Error(`Unhandled unary operator ${node.op}`);
  //                 }
  //             }
  //             case 'literal': {
  //                 return mkEvalValue(node.lit, true);
  //             }
  //             case 'array': {
  //                 const evals = node.list.map(v => this.evalExpr(v));
  //                 return {
  //                     value: evals.map(e => e.value),
  //                     errors: anyErrors(...evals),
  //                     completeFirstPass: combineEvalPassInfo(...evals)
  //                 }
  //             }
  //             case 'object': {
  //                 const kvs: [string|number, EvalValue<any>][] = node.props.map(p => {
  //                     const v = this.evalExpr(p.val);
  //                     return [p.key.type === 'literal' ? p.key.lit : p.key.name, v];
  //                 });
  //                 return {
  //                     value: kvs.reduce((o, [key, value]) => ({...o, [key]: value.value}), {}),
  //                     errors: anyErrors(...kvs.map(([_, e]) => e)),
  //                     completeFirstPass: combineEvalPassInfo(...kvs.map(([_, e]) => e))
  //                 }
  //             }
  //             case 'ident': {
  //                 throw new Error('should not see an ident here -- if you do, it is probably a wrong type node in parser')
  //             }
  //             case 'qualified-ident': {
  //                 // Namespace qualified ident, like foo::bar::baz
  //                 const sym = this.scopes.findQualifiedSym(node.path, node.absolute);
  //                 if (sym == undefined) {
  //                     if (this.pass >= 1) {
  //                         this.addError(`Undefined symbol '${formatSymbolPath(node)}'`, node.loc)
  //                         return mkErrorValue(0);
  //                     }
  //                     // Return a placeholder that should be resolved in the next pass
  //                     this.needPass = true;
  //                     // Evaluated value is marked as "incomplete in first pass"
  //                     return mkEvalValue(0, false);
  //                 }

  //                 switch (sym.type) {
  //                     case 'label':
  //                         return {
  //                             errors: sym.data.errors,
  //                             value: sym.data.value.addr,
  //                             completeFirstPass: sym.seen == this.pass
  //                         }
  //                     case 'var':
  //                         if (sym.seen < this.pass) {
  //                             this.addError(`Undeclared variable '${formatSymbolPath(node)}'`, node.loc);
  //                         }
  //                         return sym.data;
  //                     case 'macro':
  //                     case 'segment':
  //                         this.addError(`Must have a label or a variable identifier here, got ${sym.type} name`, node.loc);
  //                         return mkErrorValue(0);
  //                     }
  //                 break;
  //             }
  //             case 'member': {
  //                 const evaledObject = this.evalExpr(node.object);
  //                 if (anyErrors(evaledObject)) {
  //                     return mkErrorValue(0);
  //                 }

  //                 const { value: object } = evaledObject;

  //                 if (object == undefined) {
  //                     this.addError(`Cannot access properties of an undefined object`, node.loc);
  //                     return mkErrorValue(0);
  //                 }

  //                 const checkProp = (prop: string|number, loc: SourceLoc) => {
  //                     if (!(prop in object)) {
  //                         this.addError(`Property '${prop}' does not exist in object`, loc);
  //                         return false;
  //                     }
  //                     return true;
  //                 }

  //                 // Eval non-computed access (array, object)
  //                 const evalProperty = (node: ast.Member, typeName: string) => {
  //                     if (node.property.type !== 'ident') {
  //                         this.addError(`${typeName} property must be a string, got ${formatTypename(node.property.type)}`, node.loc);
  //                     } else {
  //                         if (checkProp(node.property.name, node.property.loc)) {
  //                             return mkEvalValue((object as any)[node.property.name], evaledObject.completeFirstPass);
  //                         }
  //                     }
  //                     return mkErrorValue(0);
  //                 }

  //                 if (object instanceof Array) {
  //                     if (!node.computed) {
  //                         return evalProperty(node, 'Array');
  //                     }
  //                     const { errors, value: idx, completeFirstPass } = this.evalExprToInt(node.property, 'array index');
  //                     if (errors) {
  //                         return mkErrorValue(0);
  //                     }
  //                     if (!(idx in object)) {
  //                         this.addError(`Out of bounds array index ${idx}`, node.property.loc)
  //                         return mkErrorValue(0);
  //                     }
  //                     return mkEvalValue(object[idx], evaledObject.completeFirstPass && completeFirstPass);
  //                 }  else if (typeof object == 'object') {
  //                     if (!node.computed) {
  //                         return evalProperty(node, 'Object');
  //                     } else {
  //                         let { errors, value: prop, completeFirstPass } = this.evalExpr(node.property);
  //                         if (errors) {
  //                             return mkErrorValue(0);
  //                         }
  //                         if (typeof prop !== 'string' && typeof prop !== 'number') {
  //                             this.addError(`Object property must be a string or an integer, got ${formatTypename(prop)}`, node.loc);
  //                             return mkErrorValue(0);
  //                         }
  //                         if (checkProp(prop, node.property.loc)) {
  //                             return mkEvalValue(object[prop], completeFirstPass && evaledObject.completeFirstPass);
  //                         }
  //                         return mkErrorValue(0);
  //                     }
  //                 }

  //                 // Don't report errors in first compiler pass because an identifier may
  //                 // still have been unresolved.  These cases should be reported by
  //                 // name resolution in pass 1.
  //                 if (this.pass !== 0) {
  //                     if (!evaledObject.errors) {
  //                         if (node.computed) {
  //                             this.addError(`Cannot use []-operator on non-array/object values`, node.loc)
  //                         } else {
  //                             this.addError(`Cannot use the dot-operator on non-object values`, node.loc)
  //                         }
  //                     }
  //                     return mkErrorValue(0);
  //                 }
  //                 return mkEvalValue(0, false); // dummy value as we couldn't resolve in pass 0
  //             }
  //             case 'callfunc': {
  //                 const callee = this.evalExpr(node.callee);
  //                 const argValues = node.args.map(expr => this.evalExpr(expr));
  //                 if (callee.errors) {
  //                     return mkErrorValue(0); // suppress further errors if the callee is bonkers
  //                 }
  //                 if (typeof callee.value !== 'function') {
  //                     this.addError(`Callee must be a function type.  Got '${formatTypename(callee)}'`, node.loc);
  //                     return mkErrorValue(0);
  //                 }
  //                 if (anyErrors(...argValues)) {
  //                     return mkErrorValue(0);
  //                 }
  //                 try {
  //                     const complete = callee.completeFirstPass && combineEvalPassInfo(...argValues);
  //                     return mkEvalValue(callee.value(...argValues.map(v => v.value)), complete);
  //                 } catch(err) {
  //                     if (node.callee.type == 'qualified-ident') {
  //                         this.addError(`Call to '${formatSymbolPath(node.callee)}' failed with an error: ${err.message}`, node.loc);
  //                     } else {
  //                         // Generic error message as callees that are computed
  //                         // expressions have lost their name once we get here.
  //                         this.addError(`Plugin call failed with an error: ${err.message}`, node.loc);
  //                     }
  //                     // Convert JS call exception info into c64jasm errors that
  //                     // refer to the errored .js file.
  //                     if (isJsCallError(err)) {
  //                         this.addJSStackErrors(err, node.loc);
  //                     }
  //                     return mkErrorValue(0);
  //                 }
  //             }
  //             case 'getcurpc': {
  //                 return mkEvalValue(this.getPC(), true);
  //             }
  //             default:
  //                 break;
  //         }
  //         throw new Error('should be unreachable?');
  //         return mkErrorValue(0); // TODO is this even reachable?
  //     }

  //     topLevelSourceLoc (): SourceLoc {
  //         const topFilename = this.includeStack[0];
  //         return makeCompileLoc(topFilename);
  //     }

  emit(byte: number): void {
    const err = this.curSegment.emit(byte);
    if (err !== undefined) {
      this.addError(err, this.lineLoc); // Use closest line error loc for the error
    }
  }

  //     emit16 (word: number): void {
  //         this.emit(word & 0xff);
  //         this.emit((word>>8) & 0xff);
  //     }

  //     checkSingle (opcode: number | null): boolean {
  //         if (opcode === null) {
  //             return false;
  //         }
  //         this.emit(opcode)
  //         return true;
  //     }

  //     checkImm (param: ast.Expr, opcode: number | null): boolean {
  //         if (opcode === null || param === null) {
  //             return false;
  //         }
  //         const ev = this.evalExprToInt(param, 'immediate');
  //         if (!anyErrors(ev)) {
  //             this.emit(opcode);
  //             this.emit(ev.value);
  //         }
  //         return true;
  //     }

  assembleAluInstr(opc: opc.OpCode, stmt: ast.StmtInsn) {
    // Form: xxx [dest]
    if (stmt.p2) this.addWarning(`Parameter not required`, stmt.p2.loc);

    // Base opcode
    let opcode = opc.op;

    // Optional first parameter
    if (stmt.p1 && opc.p1) {
      let tgt = this.checkRegister(stmt.p1, opc.p1);
      if (tgt == undefined) return;
      opcode |= opc.p1.op(tgt);
    }

    this.emit(opcode);
  }

  assembleClrInstr(opc: opc.OpCode, stmt: ast.StmtInsn) {
    // Form: xxx dest
    if (stmt.p2) this.addWarning(`Parameter not required`, stmt.p2.loc);

    // Base opcode
    let opcode = opc.op;

    // First paramter
    if (!stmt.p1 || !opc.p1) {
      this.addError(`Parameter required`, stmt.loc);
      return;
    }
    let tgt = this.checkRegister(stmt.p1, opc.p1);
    if (tgt == undefined) return;
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
    if (tgt == undefined) return;
    opcode |= opc.p1.op(tgt);

    // Second paramter
    let src = this.checkRegister(stmt.p2, opc.p2);
    if (src == undefined) return;
    opcode |= opc.p2.op(src);

    this.emit(opcode);
  }

  assembleLitOpc(opc: opc.OpCode, stmt: ast.StmtInsn) {
    // Form: xxx opcode
    if (stmt.p2) this.addWarning(`Parameter not required`, stmt.p2.loc);

    // Base opcode
    let opcode = opc.op;

    // First paramter
    if (!stmt.p1 || !opc.p1) {
      this.addError(`Parameter required`, stmt.loc);
      return;
    }
    let val = this.checkLiteral(stmt.p1, 0x00, 0xFF);
    if (val == undefined) return;
    opcode |= opc.p1.op(val);
  }

  checkRegister(given: ast.Operand, available: opc.OpCodeParam): number | undefined {
    if (given.type != 'ident') {
      this.addError(`Register required`, given.loc);
    } else {
      let reg = available.cs![given.name];
      if (reg === undefined) {
        this.addError(`Invalid register (must be one of [${Object.keys(available.cs!).join(',')}])`, given.loc);
      }
      return reg;
    }
    return undefined;
  }

  checkLiteral(given: ast.Operand, min: number, max: number): number | undefined {
    if (given.type != 'literal') {
      this.addError('Literal required', given.loc);
    } else {
      let val = given.value;
      if (val < min || val > max) {
        let dmin = (given.ot === 'b') ? min.toString(2) : (given.ot === 'h') ? min.toString(16) : min.toString();
        let dmax = (given.ot === 'b') ? max.toString(2) : (given.ot === 'h') ? max.toString(16) : max.toString();
        this.addError(`Literal out of range (must be between ${dmin} and ${dmax})`, given.loc);
      } else {
        return val;
      }
    }
    return undefined;
  }

  //     checkAbs (param: ast.Expr, opcode: number | null, bits: number): boolean {
  //         if (opcode === null || param === null) {
  //             return false;
  //         }
  //         const ev = this.evalExprToInt(param, 'absolute address');
  //         if (anyErrors(ev)) {
  //             return true;
  //         }
  //         const { value: v } = ev;
  //         if (bits === 8) {
  //             if (v < 0 || v >= (1<<bits)) {
  //                 return false;
  //             }
  //             this.emit(opcode);
  //             this.emit(v);
  //         } else {
  //             this.emit(opcode);
  //             this.emit16(v);
  //         }
  //         return true
  //     }

  //     checkBranch (param: ast.Expr, opcode: number | null): boolean {
  //         if (opcode === null || param === null) {
  //             return false;
  //         }
  //         const ev = this.evalExpr(param);
  //         if (anyErrors(ev)) {
  //             return true;
  //         }
  //         if (typeof ev.value !== 'number') {
  //             this.addError(`Expecting branch label to evaluate to integer, got ${formatTypename(ev.value)}`, param.loc)
  //             return true;
  //         }
  //         const { value: addr } = ev;
  //         const addrDelta = addr - this.getPC() - 2;
  //         this.emit(opcode);
  //         if (addrDelta > 0x7f || addrDelta < -128) {
  //             // Defer reporting out of 8-bit range branch targets to the end of the
  //             // current pass (or report nothing if we need another pass.)
  //             this.outOfRangeBranches.push({ loc: param.loc, offset: addrDelta });
  //         }
  //         this.emit(addrDelta & 0xff);
  //         return true;
  //     }

  //     handleSetPC (valueExpr: ast.Expr): void {
  //         const ev  = this.evalExprToInt(valueExpr, 'pc');
  //         if (!anyErrors(ev)) {
  //             const { value: v, completeFirstPass } = ev;
  //             if (!completeFirstPass) {
  //                 this.addError('Value for new program counter must evaluate to a value in the first pass', valueExpr.loc);
  //                 return;
  //             }
  //             if (!this.curSegment.empty() && this.curSegment.currentPC() > v) {
  //                 this.addError(`Cannot set program counter to a smaller value than current (current: $${toHex16(this.curSegment.currentPC())}, trying to set $${toHex16(v)})`, valueExpr.loc);
  //             }
  //             const err = this.curSegment.setCurrentPC(v);
  //             if (err !== undefined) {
  //                 this.addError(err, valueExpr.loc);
  //             }
  //         }
  //     }

  //     guardedReadFileSync(fname: string, loc: SourceLoc): Buffer|undefined {
  //         try {
  //             return this.readFileSync(fname);
  //         } catch (err) {
  //             this.addError(`Couldn't open file '${fname}'`, loc);
  //             return undefined;
  //         }
  //     }

  //     fileInclude (inclStmt: ast.StmtInclude): void {
  //         const fnVal = this.evalExprToString(inclStmt.filename, '!include filename');
  //         if (anyErrors(fnVal)) {
  //             return;
  //         }
  //         const v = fnVal.value;
  //         const fname = this.makeSourceRelativePath(v);
  //         this.pushSource(fname);
  //         this.assemble(fname, inclStmt.loc);
  //         this.popSource();
  //     }

  //     fillBytes (n: ast.StmtFill): void {
  //         const numVals = this.evalExprToInt(n.numBytes, '!fill num_bytes');
  //         const fillValue = this.evalExprToInt(n.fillValue, '!fill value');
  //         if (anyErrors(numVals, fillValue)) {
  //             return;
  //         }

  //         const { value: fv } = fillValue;
  //         if (fv < 0 || fv >= 256) {
  //             this.addError(`!fill value to repeat must be in 8-bit range, '${fv}' given`, n.fillValue.loc);
  //             return;
  //         }
  //         const nb = numVals.value;
  //         if (nb < 0) {
  //             this.addError(`!fill repeat count must be >= 0, got ${nb}`, n.numBytes.loc);
  //             return;
  //         }
  //         for (let i = 0; i < nb; i++) {
  //             this.emit(fv);
  //         }
  //     }

  //     alignBytes (n: ast.StmtAlign): void {
  //         const v = this.evalExprToInt(n.alignBytes, 'alignment');
  //         if (anyErrors(v)) {
  //             return;
  //         }
  //         const { value: nb } = v;
  //         if (nb < 1) {
  //             this.addError(`Alignment must be a positive integer, ${nb} given`, n.alignBytes.loc);
  //             return;
  //         }
  //         if ((nb & (nb-1)) != 0) {
  //             this.addError(`Alignment must be a power of two, ${nb} given`, n.loc);
  //             return;
  //         }
  //         while ((this.getPC() & (nb-1)) != 0) {
  //             this.emit(0);
  //         }
  //     }

  //     // Enter anonymous block scope
  //     withAnonScope(name: string | null, compileScope: () => void, parent?: NamedScope<SymEntry>): void {
  //         if (name !== null) {
  //             return this.withLabelScope(name, compileScope, parent);
  //         }
  //         this.scopes.withAnonScope(compileScope, parent);
  //     }

  //     // Enter named scope
  //     withLabelScope (name: string, compileScope: () => void, parent?: NamedScope<SymEntry>): void {
  //         this.scopes.withLabelScope(name, compileScope);
  //     }

  //     emit8or16(v: number, bits: number) {
  //         if (bits == 8) {
  //             this.emit(v);
  //             return;
  //         }
  //         this.emit16(v);
  //     }

  //     emitData (exprList: ast.Expr[], bits: number) {
  //         for (let i = 0; i < exprList.length; i++) {
  //             const ee = this.evalExpr(exprList[i]);
  //             if (anyErrors(ee)) {
  //                 continue;
  //             }
  //             const { value: e } = ee;
  //             if (typeof e == 'number') {
  //                 this.emit8or16(e, bits);
  //             } else if (e instanceof Array) {
  //                 let firstErrorIdx = -1;
  //                 for (let i = 0; i < e.length; i++) {
  //                     const byte = typeof e[i] === 'number' ? e[i] : 0;
  //                     firstErrorIdx = typeof e[i] !== 'number' && firstErrorIdx === -1 ? i : firstErrorIdx;
  //                     this.emit8or16(byte, bits);
  //                 }
  //                 if (firstErrorIdx != -1) {
  //                     this.addError(`Cannot emit non-numeric values.  First non-number at index ${firstErrorIdx}`, exprList[i].loc);
  //                 }
  //             } else {
  //                 this.addError(`Only literal (int constants) or array types can be emitted.  Got ${formatTypename(e)}`, exprList[i].loc);
  //             }
  //         }
  //     }

  //     makeFunction (pluginFunc: Function, loc: SourceLoc) {
  //         return (...args: any[]) => {
  //             try {
  //                 const res = pluginFunc.apply(null, [{
  //                     readFileSync: (fname: string) => this.readFileSync(fname),
  //                     resolveRelative: (fn: string) => this.makeSourceRelativePath(fn)
  //                 }, ...args]);
  //                 return res;
  //             } catch(err) {
  //                 // Mark this exception as a "JS plugin error" so that
  //                 // we know how to turn it into assembler error messages
  //                 // later.
  //                 (err as JSCallError).jsError = true;
  //                 throw err;
  //             }
  //         }
  //     }

  //     bindFunction (name: ast.Ident, pluginModule: any, loc: SourceLoc) {
  //         this.scopes.declareVar(name.name, mkEvalValue(this.makeFunction(pluginModule, loc), true));
  //     }

  //     bindPlugin (node: ast.StmtLoadPlugin, plugin: EvalValue<any>) {
  //         const moduleName = node.moduleName;
  //         if (anyErrors(plugin)) {
  //             this.scopes.declareVar(moduleName.name, mkErrorValue(0));
  //             return;
  //         }
  //         const module = plugin.value;
  //         // Bind default export as function
  //         if (typeof module == 'function') {
  //             this.bindFunction(moduleName, module, node.loc);
  //         }
  //         if (typeof module == 'object') {
  //             const moduleObj: any = {};
  //             const keys = Object.keys(module);
  //             for (let ki in keys) {
  //                 const key = keys[ki];
  //                 const val = module[key];
  //                 if (typeof val === 'function') {
  //                     moduleObj[key] = this.makeFunction(val, node.loc);
  //                 } else {
  //                     moduleObj[key] = val;
  //                 }
  //             }
  //             this.scopes.declareVar(moduleName.name, mkEvalValue(moduleObj, true));
  //         }
  //     }

  //     checkDirectives (node: ast.Stmt, localScopeName: string | null): void {
  //         switch (node.type) {
  //             case 'data': {
  //                 this.emitData(node.values, node.dataSize === ast.DataSize.Byte ? 8 : 16);
  //                 break;
  //             }
  //             case 'fill': {
  //                 this.fillBytes(node);
  //                 break;
  //             }
  //             case 'align': {
  //                 this.alignBytes(node);
  //                 break;
  //             }
  //             case 'setpc': {
  //                 this.handleSetPC(node.pc);
  //                 break;
  //             }
  //             case 'binary': {
  //                 this.emitBinary(node);
  //                 break;
  //             }
  //             case 'include': {
  //                 this.fileInclude(node);
  //                 break;
  //             }
  //             case 'error': {
  //                 const msg = this.evalExprToString(node.error, 'error message');
  //                 if (!anyErrors(msg)) {
  //                     this.addError(msg.value, node.loc);
  //                     return;
  //                 }
  //                 break;
  //             }
  //             case 'if': {
  //                 const { cases, elseBranch } = node
  //                 for (let ci in cases) {
  //                     const [condExpr, body] = cases[ci];
  //                     const condition = this.evalExpr(condExpr);
  //                     // TODO condition.value type must be numeric/boolean
  //                     if (!anyErrors(condition) && isTrueVal(condition.value)) {
  //                         return this.withAnonScope(localScopeName, () => {
  //                             this.assembleLines(body);
  //                         });
  //                     }
  //                 }
  //                 return this.withAnonScope(localScopeName, () => {
  //                     this.assembleLines(elseBranch);
  //                 })
  //                 break;
  //             }
  //             case 'for': {
  //                 const { index, list, body, loc } = node
  //                 const lstVal = this.evalExpr(list);
  //                 if (anyErrors(lstVal)) {
  //                     return;
  //                 }
  //                 const { value: lst } = lstVal;
  //                 if (!(lst instanceof Array)) {
  //                     this.addError(`for-loop range must be an array expression (e.g., a range() or an array)`, list.loc);
  //                     return;
  //                 }
  //                 for (let i = 0; i < lst.length; i++) {
  //                     let scopeName = null;
  //                     if (localScopeName !== null) {
  //                         scopeName = `${localScopeName}__${i}`
  //                     }
  //                     this.withAnonScope(scopeName, () => {
  //                         this.scopes.declareVar(index.name, mkEvalValue(lst[i], lstVal.completeFirstPass));
  //                         return this.assembleLines(body);
  //                     });
  //                 }
  //                 break;
  //             }
  //             case 'macro': {
  //                 const { name, args, body } = node;
  //                 // TODO check for duplicate arg names!
  //                 const prevSym = this.scopes.findQualifiedSym([name.name], false);
  //                 if (prevSym !== undefined && this.scopes.symbolSeen(name.name)) {
  //                     // TODO previous declaration from prevMacro
  //                     this.addError(`Symbol '${name.name}' already defined`, name.loc);
  //                     return;
  //                 }
  //                 this.scopes.declareMacro(name.name, node);
  //                 break;
  //             }
  //             case 'callmacro': {
  //                 const { name, args } = node;
  //                 const macroSym = this.scopes.findMacro(name.path, name.absolute);
  //                 const argValues = args.map(e => this.evalExpr(e));

  //                 if (macroSym == undefined || macroSym.seen < this.pass) {
  //                     this.addError(`Undefined macro '${formatSymbolPath(name)}'`, name.loc);
  //                     return;
  //                 }

  //                 const { macro, declaredIn } = macroSym;

  //                 if (macro.args.length !== args.length) {
  //                     this.addError(`Macro '${formatSymbolPath(name)}' declared with ${macro.args.length} args but called here with ${args.length}`,
  //                         name.loc);
  //                     return;
  //                 }

  //                 this.withAnonScope(localScopeName, () => {
  //                     for (let i = 0; i < argValues.length; i++) {
  //                         const argName = macro.args[i].ident.name;
  //                         this.scopes.declareVar(argName, argValues[i]);
  //                     }
  //                     this.assembleLines(macro.body);
  //                 }, declaredIn);
  //                 break;
  //             }
  //             case 'let': {
  //                 const name = node.name;
  //                 const sym = this.scopes.findQualifiedSym([name.name], false);
  //                 const eres = this.evalExpr(node.value);

  //                 if (sym !== undefined && this.scopes.symbolSeen(name.name)) {
  //                     this.addError(`Variable '${name.name}' already defined`, node.loc);
  //                     return;
  //                 }
  //                 this.scopes.declareVar(name.name, eres);
  //                 break;
  //             }
  //             case 'assign': {
  //                 const name = node.name;
  //                 if (node.name.path.length !== 1 || node.name.absolute) {
  //                     this.addError(`Only symbol names in the current (or owning) scopes are allowed for assignment`, node.loc);
  //                     return;
  //                 }
  //                 const prevValue = this.scopes.findQualifiedSym(node.name.path, node.name.absolute);
  //                 if (prevValue == undefined) {
  //                     this.addError(`Assignment to undeclared variable '${formatSymbolPath(name)}'`, node.loc);
  //                     return;
  //                 }
  //                 if (prevValue.type !== 'var') {
  //                     this.addError(`Assignment to symbol '${formatSymbolPath(name)}' that is not a variable.  Its type is '${prevValue.type}'`, node.loc);
  //                     return;
  //                 }
  //                 const evalValue = this.evalExpr(node.value);
  //                 this.scopes.updateVar(name.path[0], evalValue);
  //                 break;
  //             }
  //             case 'statement-expr': {
  //                 // Eval expression only for its side-effects
  //                 this.evalExpr(node.expr);
  //                 break;
  //             }
  //             case 'load-plugin': {
  //                 const fname = this.evalExprToString(node.filename, 'plugin filename');
  //                 if (anyErrors(fname)) {
  //                     return;
  //                 }
  //                 const module = this.requirePlugin(fname.value, node.loc);
  //                 this.bindPlugin(node, module);
  //                 break;
  //             }
  //             case 'filescope': {
  //                 this.addError(`The !filescope directive is only allowed as the first directive in a source file`, node.loc);
  //                 return;
  //             }
  //             case 'use-segment': {
  //                 const { name, loc } = node
  //                 const sym = this.scopes.findQualifiedSym(name.path, name.absolute);
  //                 if (sym === undefined) {
  //                     this.addError(`Use of undeclared segment '${formatSymbolPath(name)}'`, loc);
  //                     return;
  //                 }
  //                 if (sym.type !== 'segment') {
  //                     this.addError(`Use of segment '${formatSymbolPath(name)}' that is not a declared segment.  Its type is '${sym.type}'`, loc);
  //                     return;
  //                 }
  //                 // TODO should record segment source location and name for later error reporting
  //                 this.setCurrentSegment(sym, formatSymbolPath(name));
  //                 break;
  //             }
  //             case 'break': {
  //                 this.debugInfo.markBreak(this.getPC(), this.curSegmentName);
  //                 break;
  //             }
  //             default:
  //                 this.addError(`unknown directive ${node.type}`, node.loc);
  //                 return;
  //         }
  //     }

  assembleLines(lst: ast.AsmLine[]): void {
    if (lst === null || lst.length == 0) {
      return;
    }
    if (lst.length == 0) {
      return;
    }

    const assemble = (lines: ast.AsmLine[]) => {
      for (let i = 0; i < lines.length; i++) {
        //                 this.debugInfo.startLine(lines[i].loc, this.getPC(), this.curSegment);
        this.assembleLine(lines[i]);
        //                 this.debugInfo.endLine(this.getPC(), this.curSegment);
      }
    }

    // Scan for the first real instruction line to skip
    // comments and empty lines at the start of a file.
    let firstLine = 0;
    while (firstLine < lst.length) {
      const { label, stmt } = lst[firstLine];
      if (label == null && stmt == null) {
        firstLine++;
      } else {
        break;
      }
    }
    if (firstLine >= lst.length) {
      return;
    }


    //         // Handle 'whole file scope' directive !filescope.  This puts everything
    //         // below the first line inside a named scope.
    //         const labelScope = lst[firstLine]!;
    //         if (labelScope.stmt != null && labelScope.stmt.type == 'filescope') {
    //             this.checkAndDeclareLabel(labelScope.stmt.name);
    //             return this.withLabelScope(labelScope.stmt.name.name, () => {
    //                 return assemble(lst.slice(firstLine+1));
    //             });
    //         }
    return assemble(lst);
  }

  //     checkAndDeclareLabel(label: ast.Label) {
  //         if (this.scopes.symbolSeen(label.name)) {
  //             this.addError(`Symbol '${label.name}' already defined`, label.loc);
  //         } else {
  //             const labelChanged = this.scopes.declareLabelSymbol(label, this.getPC(), this.curSegment);
  //             if (labelChanged) {
  //                 this.needPass = true;
  //             }
  //         }
  //     }

  assembleLine(line: ast.AsmLine): void {
    this.lineLoc = line.loc;
    // Empty lines are no-ops
    if (line.label == null && line.stmt == null) {
      return;
    }

    //         if (line.label !== null) {
    //             this.checkAndDeclareLabel(line.label);
    //         }

    //         const scopedStmts = line.scopedStmts;
    //         if (scopedStmts != null) {
    //             if (!line.label) {
    //                 throw new Error('ICE: line.label cannot be undefined');
    //             }
    //             this.withLabelScope(line.label.name, () => {
    //                 this.assembleLines(scopedStmts);
    //             });
    //             return;
    //         }

    if (line.stmt === null) {
      return;
    }

    //         if (line.stmt.type !== 'insn') {
    //             this.checkDirectives(line.stmt, line.label == null ? null : line.label.name);
    //             return;
    //         }

    const stmt = line.stmt;
    // const insn = stmt.insn;
    const op = opc.opcodes[stmt.mnemonic.toLocaleLowerCase()];

    //         // Mark the emitted output address range as
    //         // containing machine code instructions.  This
    //         // is used for smarter disassembly.
    //         const withMarkAsInsn = (f: () => void) => {
    //             const startPC = this.getPC();
    //             f();
    //             const endPC = this.getPC();
    //             this.debugInfo.markAsInstruction(startPC, endPC);
    //         }

    if (op !== undefined) {
      //             withMarkAsInsn(() => {
      //                 let noArgs =
      //                     insn.imm === null
      //                     && insn.abs === null
      //                     && insn.absx === null
      //                     && insn.absy === null
      //                     && insn.absind === null
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
        //                 if (this.checkBranch(insn.abs, op[11])) {
        //                     return;
        //                 }
        default:
          this.addError(`Couldn't encode instruction '${stmt.mnemonic}'`, line.loc);
      }

      //             });
    } else {
      this.addError(`Unknown mnemonic '${stmt.mnemonic}'`, line.loc);
    }
  }

  //     makeSourceRelativePath(filename: string): string {
  //         const curSource = this.peekSourceStack();
  //         return path.join(path.dirname(curSource), filename);
  //     }

  assemble(source: string): void {
    try {
      const astLines = parser.parse(source.toString());
      if (astLines !== undefined) {
        this.assembleLines(astLines);
      }
    } catch (err) {
      if ('name' in err && err.name == 'SyntaxError') {
        this.addError(`Syntax error: ${err.message}`, {
          ...err.location
        })
      } else if ('name' in err && err.name == 'semantic') {
        return;
      } else {
        throw err;
      }
    }
  }

  //     _requireType(e: any, type: string): (any | never) {
  //         if (typeof e == type) {
  //             return e;
  //         }
  //         this.addError(`Expecting a ${type} value, got ${formatTypename(e)}`, e.loc);
  //     }

  //     requireString(e: any): (string | never) { return this._requireType(e, 'string') as string; }
  //     requireNumber(e: ast.Literal): (number | never) { return this._requireType(e, 'number') as number; }

  //     registerPlugins () {
  //         const json = (...args: any[]) => {
  //             const name = this.requireString(args[0]);
  //             const fname = this.makeSourceRelativePath(name);
  //             return JSON.parse(this.readFileSync(fname, 'utf-8'));
  //         }
  //         const range = (...args: any[]) => {
  //             let start = 0;
  //             let end = undefined;
  //             if (args.length == 1) {
  //                 end = this.requireNumber(args[0]);
  //             } else if (args.length == 2) {
  //                 start = this.requireNumber(args[0]);
  //                 end = this.requireNumber(args[1]);
  //             } else {
  //                 throw new Error(`Invalid number of args to 'range'.  Expecting 1 or 2 arguments.`)
  //             }
  //             if (end == start) {
  //                 return [];
  //             }
  //             if (end < start) {
  //                 throw new Error(`range 'end' must be larger or equal to 'start'`)
  //             }
  //             return Array(end-start).fill(null).map((_,idx) => idx + start);
  //         };
  //         const addPlugin = (name: string, handler: any) => {
  //             // TODO what about values from plugin calls?? passinfo missing
  //             this.scopes.declareVar(name, mkEvalValue(handler, false));
  //         }
  //         addPlugin('loadJson', json);
  //         addPlugin('range', range);

  //         // Register all JavaScript Math object properties
  //         // into a built-in Math object.
  //         const math: any = {};
  //         for (let k of Object.getOwnPropertyNames(Math)) {
  //             const props: any = Math;
  //             if (k === 'random') {
  //                 math[k] = () => {
  //                     throw new Error('Math.random() not allowed as it will lead to non-reproducible builds');
  //                 }
  //             } else {
  //                 math[k] = props[k];
  //             }
  //         }
  //         addPlugin('Math', math);
  //     }

  //     dumpLabels() {
  //         return this.scopes.dumpLabels(this.getPC(), this.segments);
  //     }

  collectSegmentInfo() {
    return collectSegmentInfo(this.segments);
  }
}

export function assemble(source: string) {
  const asm = new Assembler();
  //     asm.pushSource(filename);

  let pass = 0;
  //     do {
  asm.startPass(pass);
  //         asm.registerPlugins();
  asm.assemble(source);

  //         if (pass > 0 && asm.anyErrors()) {
  //             return {
  //                 prg: Buffer.from([]),
  //                 labels: [],
  //                 segments: [],
  //                 debugInfo: undefined,
  //                 errors: asm.errors(),
  //                 warnings: asm.warnings()
  //             }
  //         }

  //         const maxPass = 10;
  //         if (pass > maxPass) {
  //             console.error(`Exceeded max pass limit ${maxPass}`);
  //             return;
  //         }
  //         pass += 1;

  //         if (!asm.needPass && asm.outOfRangeBranches.length != 0) {
  //             for (let bidx in asm.outOfRangeBranches) {
  //                 const b = asm.outOfRangeBranches[bidx];
  //                 asm.addError(`Branch target too far (must fit in signed 8-bit range, got ${b.offset})`, b.loc);
  //             }
  //             break;
  //         }
  //     } while(asm.needPass);

  //     asm.popSource();

  return {
    prg: asm.prg(),
    errors: asm.errors(),
    warnings: asm.warnings(),
    //         labels: asm.dumpLabels(),
    segments: asm.collectSegmentInfo(),
    //         debugInfo: asm.debugInfo
  }
}
