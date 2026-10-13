'use strict';

import * as assert from 'assert';
import * as asm from '../src/asm';

suite('rcasm - Compiler Macros', () => {

  test('error in body reports expansion sites', function () {
    const result = asm.assemble([
      '!macro inner() {',
      '  bogus',
      '}',
      '!macro outer() {',
      '  +inner()',
      '}',
      '  +outer()'
    ].join('\n'));
    assert.equal(result.errors.length, 1);
    const [e] = result.errors;
    assert.equal(e.msg, "Unknown mnemonic 'bogus'");
    assert.equal(e.loc.start.line, 2);
    assert.deepEqual(e.expansions?.map(x => [x.name, x.loc.start.line, x.loc.start.column]), [
      ['inner', 5, 3],
      ['outer', 7, 3]
    ]);
    assert.equal(e.formatted, "2:3: error: Unknown mnemonic 'bogus' (in macro 'inner' expanded at 5:3) (in macro 'outer' expanded at 7:3)");
  });

  test('error outside a macro has no expansions', function () {
    const result = asm.assemble('bogus');
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].expansions, undefined);
  });

  test('register name as argument is rejected', function () {
    const result = asm.assemble('!macro bad(v, X) {\n}');
    assert.deepEqual(result.errors.map(e => e.formatted), [
      "1:15: error: Syntax error: Macro argument 'X' clashes with a register name"
    ]);
  });

  test('register name followed by digits is rejected', function () {
    const result = asm.assemble('!macro bad(b1) {\n}');
    assert.deepEqual(result.errors.map(e => e.formatted), [
      "1:12: error: Syntax error: Macro argument 'b1' clashes with a register name"
    ]);
  });

  test('identifier starting with a register name is a valid argument', function () {
    const result = asm.assemble('!macro m(ax, dv) {\n  ldi a,ax+dv\n}\n  +m(2, 3)');
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.prg, Uint8Array.from([0, 0, 0x45]));
  });

  test('unused macro warns', function () {
    const result = asm.assemble('!macro unused(v) {\n  ldi a,v\n}\n  add');
    assert.deepEqual(result.warnings.map(w => w.formatted), ["1:8: warning: Macro 'unused' is never used"]);
  });

  test('used macro does not warn', function () {
    const result = asm.assemble('!macro m() {\n  add\n}\n  +m()');
    assert.deepEqual(result.warnings, []);
  });

  test('macro only used by an unused macro warns for both', function () {
    const result = asm.assemble('!macro a1() {\n  add\n}\n!macro a2() {\n  +a1()\n}');
    assert.deepEqual(result.warnings.map(w => w.formatted), [
      "1:8: warning: Macro 'a1' is never used",
      "4:8: warning: Macro 'a2' is never used"
    ]);
  });

});
