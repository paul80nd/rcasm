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

suite('rcasm - Compiler Decls', () => {

  test('data number', function () {
    assertProgram('!byte 254', [0, 0, 0xFE]);
    assertProgram('!byte 0xFE', [0, 0, 0xFE]);
    assertProgram('!byte 11111110b', [0, 0, 0xFE]);
    assertProgram('!word 65244', [0, 0, 0xFE, 0xDC]);
    assertProgram('!word 0xFEDC', [0, 0, 0xFE, 0xDC]);
    assertProgram('!word 1111111011011100b', [0, 0, 0xFE, 0xDC]);
  });

  test('data bad number', function () {
    assertHasError('!byte 256', '1:7: error: Data out of range for 8 bits');
    assertHasError('!byte 0x100', '1:7: error: Data out of range for 8 bits');
    assertHasError('!byte 100000000b', '1:7: error: Data out of range for 8 bits');
    assertHasError('!word 65536', '1:7: error: Data out of range for 16 bits');
    assertHasError('!word 0x10000', '1:7: error: Data out of range for 16 bits');
    assertHasError('!word 10000000000000000b', '1:7: error: Data out of range for 16 bits');
  });

  test('data numbers', function () {
    assertProgram('!byte 254, 253, 252', [0, 0, 0xFE, 0xFD, 0xFC]);
    assertProgram('!byte 254, 0xFE, 11111110b', [0, 0, 0xFE, 0xFE, 0xFE]);
    assertProgram('!word 254, 0xFE, 0xFEDC', [0, 0, 0x00, 0xFE, 0x00, 0xFE, 0xFE, 0xDC]);
  });

  test('data string', function () {
    assertProgram('!byte "test"', [0, 0, 0x74, 0x65, 0x73, 0x74]);
    assertProgram('!word "test"', [0, 0, 0x00, 0x74, 0x00, 0x65, 0x00, 0x73, 0x00, 0x74]);
  });

  test('data bad string', function () {
    assertHasError('!byte "tĕst"', '1:7: error: Data contains character out of range for 8 bits');
  });

  test('data strings', function () {
    assertProgram('!byte "test", "ING"', [0, 0, 0x74, 0x65, 0x73, 0x74, 0x49, 0x4E, 0x47]);
  });

  test('data mix', function () {
    assertProgram('!byte 254, 0xFC, 10001100b, "ING"', [0, 0, 0xFE, 0xFC, 0x8C, 0x49, 0x4E, 0x47]);
  });

  test('data fill', function () {
    assertProgram('!fill 4, 0', [0, 0, 0x00, 0x00, 0x00, 0x00]);
    assertProgram('!fill 3, 0xFE', [0, 0, 0xFE, 0xFE, 0xFE]);
    assertProgram('!fill 2, 11111110b', [0, 0, 0xFE, 0xFE]);
  });
});
