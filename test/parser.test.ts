'use strict';

import * as assert from 'assert';
import * as ast from '../src/ast'

var parser = require('../src/g_parser')

export function parse(source: string): ast.AsmLine[] {
  return parser.parse(source);
}

export function assertNoop(node: ast.AsmLine) {
  assert.ok(node.stmt === null, 'node has statement');
}

export function assertNoLabel(node: ast.AsmLine) {
  assert.ok(node.label === null, 'node has label');
}

export function assertLabel(node: ast.AsmLine, label: string, from: number, to: number) {
  assert.equal(node.label?.name, label, 'label incorrect');
  assert.equal(node.label?.loc.start.column, from);
  assert.equal(node.label?.loc.end.column, to);
}

suite('rcasm - Parser', () => {

  test('Comments', function () {
    let result = parse('; comment\n; comment2');
    assert.equal(result.length, 2);
    assertNoop(result[0]);
    assertNoLabel(result[0]);
    assertNoop(result[1]);
    assertNoLabel(result[1]);
  });

  test('Label No Stmt', function () {
    let result = parse('xyz:');
    assertLabel(result[0], 'xyz', 1, 5);
    assertNoop(result[0]);
    console.log(JSON.stringify(result, null, 4));
  });

});
