'use strict';

import * as assert from 'assert';
import * as ast from '../src/ast';

const parser = require('../src/g_parser');

export function parse(source: string): ast.Line[] {
  const program = <ast.Program>parser.parse(source);
  if (!program || !program.lines) { assert.fail('no program or no lines'); }
  return program.lines;
}

export function assertNoop(node: ast.Line) {
  assert.ok(node.stmt === null, 'node has statement');
}

export function assertNoLabel(node: ast.Line) {
  assert.ok(node.label === null, 'node has label');
}

export function assertLabel(node: ast.Line, label: string, from: number, to: number) {
  assert.equal(node.label?.name, label, 'label incorrect');
  assert.equal(node.label?.loc.start.column, from);
  assert.equal(node.label?.loc.end.column, to);
}

export function assertInstruction(code: string, mnemonic: string, op1: number | string | null, op2: number | string | null, debug = false) {
  const result = parse(code);
  if (debug) { console.log(JSON.stringify(result)); }
  assert.equal(result.length, 1);
  if (result[0].stmt?.type !== 'insn') { assert.fail('expected instruction'); }
  assert.equal(result[0].stmt?.mnemonic, mnemonic);
  if (op1 !== null) {
    const op = result[0].stmt?.p1;
    if (op?.type === 'ident') { assert.equal(op.name, op1); }
    if (op?.type === 'literal') { assert.equal(op.lit, op1); }
  }
  if (op2 !== null) {
    const op = result[0].stmt?.p2;
    if (op?.type === 'ident') { assert.equal(op.name, op2); }
    if (op?.type === 'literal') { assert.equal(op.lit, op2); }
  }
}

export function assertData(code: string, dataSize: ast.DataSize, debug = false) {
  const result = parse(code);
  if (debug) { console.log(JSON.stringify(result)); }
  assert.equal(result.length, 1);
  if (result[0].stmt?.type !== 'data') { assert.fail('expected data'); }
  const data = result[0].stmt;
  assert.equal(data.dataSize, dataSize);
}

export function assertError(code: string, message: string, offset: number) {
  try {
    parse(code);
    assert.fail('no error thrown');
  } catch (err) {
    if ('name' in err && err.name === 'SyntaxError') {
      assert.equal(err.message, message);
      assert.equal(err.location.start.offset, offset);
    } else {
      throw err;
    }
  }
}

suite('rcasm - Parser', () => {

  test('Empty Orchestra', function () {
    const result = parse('');
    assertNoop(result[0]);
  });

  test('No-ops', function () {
    const result = parse('    \n   ');
    assertNoop(result[0]);
    assertNoop(result[1]);
  });

  test('Comments Only', function () {
    const result = parse('; comment\n; comment2');
    assert.equal(result.length, 2);
    assertNoop(result[0]);
    assertNoLabel(result[0]);
    assertNoop(result[1]);
    assertNoLabel(result[1]);
  });

  test('Label No Stmt', function () {
    const result = parse('xyz:');
    assertLabel(result[0], 'xyz', 1, 5);
    assertNoop(result[0]);
  });

  test('Instructions', function () {
    assertInstruction('inc', 'inc', null, null);
    assertInstruction('and d', 'and', 'd', null);
    assertInstruction('ldi a,12', 'ldi', 'a', 12);
    assertInstruction('ldi a,-12', 'ldi', 'a', -12);
    assertInstruction('mov a,d', 'mov', 'a', 'd');
    assertInstruction('mov a,d ; comment', 'mov', 'a', 'd');
    assertInstruction('mov xy,m2 ; comment', 'mov', 'xy', 'm2');
    assertInstruction('loop: mov a,d', 'mov', 'a', 'd');
    assertInstruction('loop: mov a,d ; comment', 'mov', 'a', 'd');
    assertError('loop2: loop3:', 'Expected ",", comment, end of input, or end of line but ":" found.', 12);
    assertError('loop2: 45', 'Expected comment, directive, end of input, end of line, or mnemonic but "4" found.', 7);
  });

  test('Data', function () {
    assertData('dfb "test"', ast.DataSize.Byte);
  });

  test('Program Loc', function () {
    const program = <ast.Program>parser.parse('test: inc\n   and d \n mov a,d ;end');
    if (!program || !program.lines) { assert.fail('no program or no lines'); }
    assert.strictEqual(3, program.lines.length);
    assert.strictEqual(3, program.loc.end.line);
    assert.strictEqual(14, program.loc.end.column);
    assert.strictEqual(33, program.loc.end.offset);
  });

});
