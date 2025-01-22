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
    assertProgram('dfb 254', [0, 0, 0xFE]);
    assertProgram('dfb 0xFE', [0, 0, 0xFE]);
    assertProgram('dfb 11111110b', [0, 0, 0xFE]);
    assertProgram('dfw 65244', [0, 0, 0xFE, 0xDC]);
    assertProgram('dfw 0xFEDC', [0, 0, 0xFE, 0xDC]);
    assertProgram('dfw 1111111011011100b', [0, 0, 0xFE, 0xDC]);
  });

  test('data bad number', function () {
    assertHasError('dfb 256', '1:5: error: Data out of range for 8 bits');
    assertHasError('dfb 0x100', '1:5: error: Data out of range for 8 bits');
    assertHasError('dfb 100000000b', '1:5: error: Data out of range for 8 bits');
    assertHasError('dfw 65536', '1:5: error: Data out of range for 16 bits');
    assertHasError('dfw 0x10000', '1:5: error: Data out of range for 16 bits');
    assertHasError('dfw 10000000000000000b', '1:5: error: Data out of range for 16 bits');
  });

  test('data numbers', function () {
    assertProgram('dfb 254, 253, 252', [0, 0, 0xFE, 0xFD, 0xFC]);
    assertProgram('dfb 254, 0xFE, 11111110b', [0, 0, 0xFE, 0xFE, 0xFE]);
    assertProgram('dfw 254, 0xFE, 0xFEDC', [0, 0, 0x00, 0xFE, 0x00, 0xFE, 0xFE, 0xDC]);
  });

  test('data string', function () {
    assertProgram('dfb "test"', [0, 0, 0x74, 0x65, 0x73, 0x74]);
    assertProgram('dfw "test"', [0, 0, 0x00, 0x74, 0x00, 0x65, 0x00, 0x73, 0x00, 0x74]);
  });

  test('data bad string', function () {
    assertHasError('dfb "tĕst"', '1:5: error: Data contains character out of range for 8 bits');
  });

  test('data strings', function () {
    assertProgram('dfb "test", "ING"', [0, 0, 0x74, 0x65, 0x73, 0x74, 0x49, 0x4E, 0x47]);
  });

  test('data mix', function () {
    assertProgram('dfb 254, 0xFC, 10001100b, "ING"', [0, 0, 0xFE, 0xFC, 0x8C, 0x49, 0x4E, 0x47]);
  });

  test('data fill', function () {
    assertProgram('dfs 4, 0', [0, 0, 0x00, 0x00, 0x00, 0x00]);
    assertProgram('dfs 3, 0xFE', [0, 0, 0xFE, 0xFE, 0xFE]);
    assertProgram('dfs 2, 11111110b', [0, 0, 0xFE, 0xFE]);
  });
});
