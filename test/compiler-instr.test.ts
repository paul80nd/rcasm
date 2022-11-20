'use strict';

import * as assert from 'assert';
import * as asm from '../src/asm';

function assertProgram(code: string, data: number[], debug = false) {
  const result = asm.assemble(code);
  if (debug) { console.log(JSON.stringify(result)); }
  assert.deepEqual(result.prg, Uint8Array.from(data));
}

function assertHasError(code: string, error: string, debug = false) {
  const result = asm.assemble(code);
  if (debug) { console.log(JSON.stringify(result)); }
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].formatted, error);
}

function assertHasWarning(code: string, warning: string, debug = false) {
  const result = asm.assemble(code);
  if (debug) { console.log(JSON.stringify(result)); }
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].formatted, warning);
}

suite('rcasm - Compiler Instrs', () => {

  test('parse fails', function () {
    const result = asm.assemble('start: ldi a,');
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].formatted, "1:14: error: Syntax error: Expected identifier, literal, or register but end of input found.");
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
    assertHasError('add g', '1:5: error: Register required');
    assertHasError('add x', '1:5: error: Invalid register - choose one of [a|d]');
    assertHasWarning('inc a,b', '1:7: warning: Parameter not required');
  });

  test('clr ops', function () {
    assertProgram('clr a \n clr b \n clr c \n clr d', [0, 0, 0x00, 0x09, 0x12, 0x1B]);
    assertProgram('clr m1 \n clr m2 \n clr x \n clr y', [0, 0, 0x24, 0x2D, 0x36, 0x3F]);
  });

  test('clr mis-ops', function () {
    assertHasError('clr', '1:1: error: Parameter required');
    assertHasError('clr 45', '1:5: error: Register required');
    assertHasError('clr g', '1:5: error: Register required');
    assertHasError('clr j1', '1:5: error: Invalid register - choose one of [a|b|c|d|m1|m2|x|y]');
    assertHasWarning('clr a,b', '1:7: warning: Parameter not required');
  });

  test('hlt ops', function() {
    assertProgram('hlt', [0, 0, 0xAE]);
    assertProgram('hlr', [0, 0, 0xAF]);
  });

  test('hlt mis-ops', function () {
    assertHasWarning('hlt a', '1:5: warning: Parameter not required');
    assertHasWarning('hlr a', '1:5: warning: Parameter not required');
  });

  test('mov mis-ops', function () {
    assertHasError('mov', '1:1: error: Two parameters required');
    assertHasError('mov a', '1:1: error: Two parameters required');
    assertHasError('mov 45,a', '1:5: error: Register required');
    assertHasError('mov g,a', '1:5: error: Register required');
    assertHasError('mov j1,a', '1:5: error: Invalid register - choose one of [a|b|c|d|m1|m2|x|y]');
    assertHasError('mov a,45', '1:7: error: Register required');
    assertHasError('mov a,g', '1:7: error: Register required');
    assertHasError('mov a,j2', '1:7: error: Invalid register - choose one of [a|b|c|d|m1|m2|x|y]');
  });

  test('mov ops lo', function () {
    assertProgram('mov a,a \n mov a,b \n mov a,c \n mov a,d', [0, 0, 0x00, 0x01, 0x02, 0x03]);
    assertProgram('mov a,m1 \n mov a,m2 \n mov a,x \n mov a,y', [0, 0, 0x04, 0x05, 0x06, 0x07]);
    assertProgram('mov b,a \n mov b,b \n mov b,c \n mov b,d', [0, 0, 0x08, 0x09, 0x0A, 0x0B]);
    assertProgram('mov b,m1 \n mov b,m2 \n mov b,x \n mov b,y', [0, 0, 0x0C, 0x0D, 0x0E, 0x0F]);
    assertProgram('mov c,a \n mov c,b \n mov c,c \n mov c,d', [0, 0, 0x10, 0x11, 0x12, 0x13]);
    assertProgram('mov c,m1 \n mov c,m2 \n mov c,x \n mov c,y', [0, 0, 0x14, 0x15, 0x16, 0x17]);
    assertProgram('mov d,a \n mov d,b \n mov d,c \n mov d,d', [0, 0, 0x18, 0x19, 0x1A, 0x1B]);
    assertProgram('mov d,m1 \n mov d,m2 \n mov d,x \n mov d,y', [0, 0, 0x1C, 0x1D, 0x1E, 0x1F]);
  });

  test('mov ops hi', function () {
    assertProgram('mov m1,a \n mov m1,b \n mov m1,c \n mov m1,d', [0, 0, 0x20, 0x21, 0x22, 0x23]);
    assertProgram('mov m1,m1 \n mov m1,m2 \n mov m1,x \n mov m1,y', [0, 0, 0x24, 0x25, 0x26, 0x27]);
    assertProgram('mov m2,a \n mov m2,b \n mov m2,c \n mov m2,d', [0, 0, 0x28, 0x29, 0x2A, 0x2B]);
    assertProgram('mov m2,m1 \n mov m2,m2 \n mov m2,x \n mov m2,y', [0, 0, 0x2C, 0x2D, 0x2E, 0x2F]);
    assertProgram('mov x,a \n mov x,b \n mov x,c \n mov x,d', [0, 0, 0x30, 0x31, 0x32, 0x33]);
    assertProgram('mov x,m1 \n mov x,m2 \n mov x,x \n mov x,y', [0, 0, 0x34, 0x35, 0x36, 0x37]);
    assertProgram('mov y,a \n mov y,b \n mov y,c \n mov y,d', [0, 0, 0x38, 0x39, 0x3A, 0x3B]);
    assertProgram('mov y,m1 \n mov y,m2 \n mov y,x \n mov y,y', [0, 0, 0x3C, 0x3D, 0x3E, 0x3F]);
  });

  test('opc mis-ops', function () {
    assertHasError('opc', '1:1: error: Parameter required');
    assertHasError('opc a', '1:5: error: Unexpected register');
    assertHasError('opc 111111111b', '1:5: error: Literal out of range (must be between 0x00 and 0xFF)');
    assertHasError('opc 0x1FF', '1:5: error: Literal out of range (must be between 0x00 and 0xFF)');
    assertHasError('opc 256', '1:5: error: Literal out of range (must be between 0x00 and 0xFF)');
  });

  test('opc ops', function () {
    assertProgram('opc 0xFF \n opc 0xAC \n opc 0x52', [0, 0, 0xFF, 0xAC, 0x52]);
    assertProgram('opc 255 \n opc 172 \n opc 82', [0, 0, 0xFF, 0xAC, 0x52]);
    assertProgram('opc 11111111b \n opc 10101100b \n opc 01010010b', [0, 0, 0xFF, 0xAC, 0x52]);
  });

  test('ldi mis-ops', function () {
    assertHasError('ldi', '1:1: error: Two parameters required');
    assertHasError('ldi 56,0', '1:5: error: Register required');
    assertHasError('ldi a,g', '1:7: error: Undefined symbol \'g\'');
    assertHasError('ldi g,3', '1:5: error: Register required');
    assertHasError('ldi x,3', '1:5: error: Invalid register - choose one of [a|b|m|j]');
    assertHasError('ldi a,16', '1:7: error: Literal out of range (must be between -16 and 15)');
    assertHasError('ldi a,-17', '1:7: error: Literal out of range (must be between -16 and 15)');
  });

  test('ldi ops', function () {
    assertProgram('ldi a,0 \n ldi a,5 \n ldi a,10 \n ldi a,15', [0, 0, 0x40, 0x45, 0x4A, 0x4F]);
    assertProgram('ldi b,0 \n ldi b,5 \n ldi b,10 \n ldi b,15', [0, 0, 0x60, 0x65, 0x6A, 0x6F]);
    // TODO: Test negative
    // TODO: Test 16-bit ldi
    assertProgram('one: ldi a,one \n ldi a,one \n two: ldi a,two \n ldi a,two', [0, 0, 0x40, 0x40, 0x42, 0x42]);
  });

});
