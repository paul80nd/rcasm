
const aluDests: { [index: string]: number } = {
  'a': 0x0,
  'd': 0x1
}

const setDests: { [index: string]: number } = {
  'a': 0x0,
  'b': 0x1,
  'm': 0x2,
  'j': 0x3
}

const movTargets: { [index: string]: number } = {
  'a': 0x0,
  'b': 0x1,
  'c': 0x2,
  'd': 0x3
}

export enum ParamForm {
  AluDst,
  ClrTgt,
  GtoTgt,
  LitOpc,
  MovDstSrc,
  SetTgtVal
}

export interface OpCodeParam {
  cs: { [index: string]: number } | null,
  op: (p: number) => number
}

export interface OpCode {
  op: number,
  pf: ParamForm,
  p1: OpCodeParam | null,
  p2: OpCodeParam | null
}

export const opcodes: { [index: string]: OpCode } = {

  // ALU 1000rfff
  'add': { op: 0x80 | 0x01, pf: ParamForm.AluDst, p1: { cs: aluDests, op: p => p << 3 }, p2: null },
  'inc': { op: 0x80 | 0x02, pf: ParamForm.AluDst, p1: { cs: aluDests, op: p => p << 3 }, p2: null },
  'and': { op: 0x80 | 0x03, pf: ParamForm.AluDst, p1: { cs: aluDests, op: p => p << 3 }, p2: null },
  'orr': { op: 0x80 | 0x04, pf: ParamForm.AluDst, p1: { cs: aluDests, op: p => p << 3 }, p2: null },
  'eor': { op: 0x80 | 0x05, pf: ParamForm.AluDst, p1: { cs: aluDests, op: p => p << 3 }, p2: null },
  'cmp': { op: 0x80 | 0x05, pf: ParamForm.AluDst, p1: { cs: aluDests, op: p => p << 3 }, p2: null },
  'not': { op: 0x80 | 0x06, pf: ParamForm.AluDst, p1: { cs: aluDests, op: p => p << 3 }, p2: null },
  'rol': { op: 0x80 | 0x07, pf: ParamForm.AluDst, p1: { cs: aluDests, op: p => p << 3 }, p2: null },

  // MOV8 00dddsss
  'mov': { op: 0x00 | 0x00, pf: ParamForm.MovDstSrc, p1: { cs: movTargets, op: p => p << 3 }, p2: { cs: movTargets, op: p => p } },
  'clr': { op: 0x00 | 0x00, pf: ParamForm.ClrTgt, p1: { cs: movTargets, op: p => (p << 3) | p }, p2: null },

  // SETAB 01rvvvvv / GOTO 11d00000
  'ldi': {
    op: 0x00 | 0x00, pf: ParamForm.SetTgtVal,
    p1: { cs: setDests, op: p => (((p & 0x2) == 0x2) ? 0xC0 : 0x40) | (p << 5) },
    p2: { cs: null, op: p => p }
  },

  // GOTO 11dscznx
  'jmp': { op: 0xC0 | 0x26, pf: ParamForm.GtoTgt, p1: null, p2: null },
  'jsr': { op: 0xC0 | 0x27, pf: ParamForm.GtoTgt, p1: null, p2: null },
  'bne': { op: 0xC0 | 0x22, pf: ParamForm.GtoTgt, p1: null, p2: null },
  'beq': { op: 0xC0 | 0x24, pf: ParamForm.GtoTgt, p1: null, p2: null },
  'bcs': { op: 0xC0 | 0x28, pf: ParamForm.GtoTgt, p1: null, p2: null },
  'bmi': { op: 0xC0 | 0x30, pf: ParamForm.GtoTgt, p1: null, p2: null },
  'blt': { op: 0xC0 | 0x30, pf: ParamForm.GtoTgt, p1: null, p2: null },
  'ble': { op: 0xC0 | 0x34, pf: ParamForm.GtoTgt, p1: null, p2: null },

  // Literal OpCode
  'opc': { op: 0x00 | 0x00, pf: ParamForm.LitOpc, p1: { cs: null, op: p => p }, p2: null }
};
