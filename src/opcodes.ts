
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

export const opcodes_reverse_map: (string | null)[][] = [
  // Hi/Lo 0 1 2 3 4 5 6 7 8 9 A B C D E F
  /* 0 */ ['clr a',     'mov a,b',   'mov a,c',   'mov a,d',    null,        null,        null,        null,      'mov b,a',  'clr b',    'mov b,c',  'mov b,d',   null,       null,       null,       null],
  /* 1 */ ['mov c,a',   'mov c,b',   'clr c',     'mov c,d',    null,        null,        null,        null,      'mov d,a',  'mov d,b',  'mov d,c',  'clr d',     null,       null,       null,       null],
  /* 2 */ [ null,        null,        null,        null,        null,        null,        null,        null,       null,       null,       null,       null,       null,       null,       null,       null],
  /* 3 */ [ null,        null,        null,        null,        null,        null,        null,        null,       null,       null,       null,       null,       null,       null,       null,       null],
  /* 4 */ ['ldi a,0',   'ldi a,1',   'ldi a,2',   'ldi a,3',   'ldi a,4',   'ldi a,5',   'ldi a,6',   'ldi a,7',  'ldi a,8',  'ldi a,9',  'ldi a,10', 'ldi a,11', 'ldi a,12', 'ldi a,13', 'ldi a,14', 'ldi a,15'],
  /* 5 */ ['ldi a,-16', 'ldi a,-15', 'ldi a,-14', 'ldi a,-13', 'ldi a,-12', 'ldi a,-11', 'ldi a,-10', 'ldi a,-9', 'ldi a,-8', 'ldi a,-7', 'ldi a,-6', 'ldi a,-5', 'ldi a,-4', 'ldi a,-3', 'ldi a,-2', 'ldi a,-1'],
  /* 6 */ ['ldi b,0',   'ldi b,1',   'ldi b,2',   'ldi b,3',   'ldi b,4',   'ldi b,5',   'ldi b,6',   'ldi b,7',  'ldi b,8',  'ldi b,9',  'ldi b,10', 'ldi b,11', 'ldi b,12', 'ldi b,13', 'ldi b,14', 'ldi b,15'],
  /* 7 */ ['ldi b,-16', 'ldi b,-15', 'ldi b,-14', 'ldi b,-13', 'ldi b,-12', 'ldi b,-11', 'ldi b,-10', 'ldi b,-9', 'ldi b,-8', 'ldi b,-7', 'ldi b,-6', 'ldi b,-5', 'ldi b,-4', 'ldi b,-3', 'ldi b,-2', 'ldi b,-1'],
  /* 8 */ ['clr a',     'add',       'inc',       'and',       'orr',       'eor',       'not',       'rol',      'clr d',    'add d',    'inc d',    'and d',    'orr d',    'eor d',    'not d',    'rol d'],
  /* 9 */ [ null,        null,        null,        null,        null,        null,        null,        null,       null,       null,       null,       null,       null,       null,       null,       null],
  /* A */ [ null,        null,        null,        null,        null,        null,        null,        null,       null,       null,       null,       null,       null,       null,       null,       null],
  /* B */ [ null,        null,        null,        null,        null,        null,        null,        null,       null,       null,       null,       null,       null,       null,       null,       null],
  /* C */ ['ldi m,',     null,        null,        null,        null,        null,        null,        null,       null,       null,       null,       null,       null,       null,       null,       null],
  /* D */ [ null,        null,        null,        null,        null,        null,        null,        null,       null,       null,       null,       null,       null,       null,       null,       null],
  /* E */ ['ldi j,',     null,       'bne',        null,       'beq',        null,       'jmp',       'jsr',      'bcs',       null,       null,       null,       null,       null,       null,       null],
  /* F */ ['blt',       'jlt',        null,        null,       'ble',        null,        null,        null,       null,       null,       null,       null,       null,       null,       null,       null]
]

export const opcodes_reverse_class = (opcode: number): { class: string, cycles: number } => {
  switch (true) {
    case (opcode & 0xC0) == 0x00: // MOV8 00dddsss
      return { class: "MOV8", cycles: 1 };
    case (opcode & 0xC0) == 0x04: // SETAB 01rvvvvv
      return { class: "SETAB", cycles: 1 };
    case (opcode & 0xF0) == 0x80: // ALU 1000rfff
      return { class: "ALU", cycles: 1 };
    case (opcode & 0xC0) == 0xC0: // GOTO 11dscznx
      return { class: "GOTO", cycles: 3 };
    default:
      return { class: "MISC", cycles: 1 };
  }
}
