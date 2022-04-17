'use strict';

import * as assert from 'assert';
import * as asm from '../src/asm'

function assertProgram(code: string, data: number[], debug: boolean = false) {
  let result = asm.assemble(code);
  if (debug) console.log(JSON.stringify(result));
  assert.deepEqual(result.prg, Uint8Array.from(data));
}

suite('rcasm - Compiler Decls', () => {

  test('data number', function () {
    assertProgram('dfb 254', [0, 0, 0xFE]);
    assertProgram('dfb 0xFE', [0, 0, 0xFE]);
    assertProgram('dfb 11111110b', [0, 0, 0xFE]);
  });

  test('data numbers', function () {
    assertProgram('dfb 254, 253, 252', [0, 0, 0xFE, 0xFD, 0xFC]);
  });
});
