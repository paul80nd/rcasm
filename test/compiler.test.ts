'use strict';

import * as assert from 'assert';
import * as asm from '../src/asm'

function assertProgram(code: string, data: number[], debug: boolean = false) {
  let result = asm.assemble(code);
  if (debug) console.log(JSON.stringify(result));
  assert.equal(result.prg.compare(new Uint8Array(data)), 0);
}

function assertHasError(code: string, error: string, debug: boolean = false) {
  let result = asm.assemble(code);
  if (debug) console.log(JSON.stringify(result));
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].formatted, error);
}

function assertHasWarning(code: string, warning: string, debug: boolean = false) {
  let result = asm.assemble(code);
  if (debug) console.log(JSON.stringify(result));
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].formatted, warning);
}

suite('rcasm - Compiler', () => {

  test('parse fails', function () {
    let result = asm.assemble('start: ldi a,');
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].formatted, "1:14: error: Syntax error: Expected identifier or literal but end of input found.");
  });

  test('unknown mnemonic', function () {
    assertHasError('lxx a', "1:1: error: Unknown mnemonic 'lxx'");
  });

  test('alu ops', function () {
    assertProgram('add', [0, 0, 0x81]);
    assertProgram('inc \n inc d', [0, 0, 0x82, 0x8A]);
    assertProgram('and \n orr \n eor \n cmp \n not \n rol', [0, 0, 0x83, 0x84, 0x85, 0x85, 0x86, 0x87]);
    assertProgram('and a \n orr a \n eor a \n cmp a \n not a \n rol a', [0, 0, 0x83, 0x84, 0x85, 0x85, 0x86, 0x87]);
    assertProgram('and d \n orr d \n eor d \n cmp d \n not d \n rol d', [0, 0, 0x8B, 0x8C, 0x8D, 0x8D, 0x8E, 0x8F]);
  });

  test('alu mis-ops', function () {
    assertHasError('add 45', '1:5: error: Register required');
    assertHasError('add g', '1:5: error: Invalid register (must be one of [a,d])');
    assertHasWarning('inc a,b', '1:7: warning: Parameter not required');
  });

  test('clr ops', function () {
    assertProgram('clr a \n clr b \n clr c \n clr d', [0, 0, 0x00, 0x09, 0x12, 0x1B]);
  });

  test('clr mis-ops', function () {
    assertHasError('clr', '1:1: error: Parameter required');
    assertHasError('clr 45', '1:5: error: Register required');
    assertHasError('clr g', '1:5: error: Invalid register (must be one of [a,b,c,d])');
    assertHasWarning('clr a,b', '1:7: warning: Parameter not required');
  });

  test('mov mis-ops', function () {
    assertHasError('mov', '1:1: error: Two parameters required');
    assertHasError('mov a', '1:1: error: Two parameters required');
    assertHasError('mov 45,a', '1:5: error: Register required');
    assertHasError('mov g,a', '1:5: error: Invalid register (must be one of [a,b,c,d])');
    assertHasError('mov a,45', '1:7: error: Register required');
    assertHasError('mov a,g', '1:7: error: Invalid register (must be one of [a,b,c,d])');
  });

  test('mov ops', function () {
    assertProgram('mov a,a \n mov a,b \n mov a,c \n mov a,d', [0, 0, 0x00, 0x01, 0x02, 0x03]);
    assertProgram('mov b,a \n mov b,b \n mov b,c \n mov b,d', [0, 0, 0x08, 0x09, 0x0A, 0x0B]);
    assertProgram('mov c,a \n mov c,b \n mov c,c \n mov c,d', [0, 0, 0x10, 0x11, 0x12, 0x13]);
    assertProgram('mov d,a \n mov d,b \n mov d,c \n mov d,d', [0, 0, 0x18, 0x19, 0x1A, 0x1B]);
  });

  test('opc mis-ops', function () {
    assertHasError('opc', '1:1: error: Parameter required');
    assertHasError('opc a', '1:5: error: Literal required');
    assertHasError('opc 111111111b', '1:5: error: Literal out of range (must be between 0 and 11111111)');
    assertHasError('opc 1FFh', '1:5: error: Literal out of range (must be between 0 and ff)');
    assertHasError('opc 256', '1:5: error: Literal out of range (must be between 0 and 255)');
  });

  test('opc ops', function () {
    assertProgram('opc FFh \n opc ACh \n opc 52h', [0, 0, 0xFF, 0xAC, 0x52]);
    assertProgram('opc 255 \n opc 172 \n opc 82', [0, 0, 0xFF, 0xAC, 0x52]);
    assertProgram('opc 11111111b \n opc 10101100b \n opc 01010010b', [0, 0, 0xFF, 0xAC, 0x52]);
  });

  test('ldi mis-ops', function () {
    assertHasError('ldi', '1:1: error: Two parameters required');
    assertHasError('ldi 56,0', '1:5: error: Register required');
    assertHasError('ldi a,g', '1:7: error: Literal required');
    assertHasError('ldi g,3', '1:5: error: Invalid register (must be one of [a,b,m,j])');
    assertHasError('ldi a,16', '1:7: error: Literal out of range (must be between -16 and 15)');
    assertHasError('ldi a,-17', '1:7: error: Literal out of range (must be between -16 and 15)');
  });

  test('ldi ops', function () {
    assertProgram('ldi a,0 \n ldi a,5 \n ldi a,10 \n ldi a,15', [0, 0, 0x40, 0x45, 0x4A, 0x4F]);
    assertProgram('ldi b,0 \n ldi b,5 \n ldi b,10 \n ldi b,15', [0, 0, 0x60, 0x65, 0x6A, 0x6F]);
    // TODO: Test negative
    // TODO: Test 16-bit ldi
  });


  test('full program', function () {
    const source = [
      ';*****************************************************',
      '; Demo program to calculate Fibonacci series',
      '; Result is placed in A register on each loop',
      '; until calculation overflows. Result is:',
      '; 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233',
      ';*****************************************************',
      '',
      'start:  ldi a,1     ; Inital setup A = B = 1',
      '        mov b,a',
      '',
      'loop:   mov c,b     ; Calculate C = B, B = A then add',
      '        mov b,a',
      '        add',
      '',
      'done:   bcs done    ; infinite loop if overflowed',
      '',
      '        jmp loop    ; otherwise have another go'
    ].join('\n');

    let result = asm.assemble(source);
    console.log(JSON.stringify(result));
  });

});
