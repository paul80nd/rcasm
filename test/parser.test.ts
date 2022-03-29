'use strict';

import * as assert from 'assert';
import * as ast from '../src/ast'

var parser = require('../src/g_parser')

export function parse(source: string): ast.AsmLine[] {
  return parser.parse(source);
}

export function assertNoop(node: ast.AsmLine) {
  assert.ok(node.label === null, 'node has label');
  assert.ok(node.stmt === null, 'node has statement');
}

suite('rcasm - Parser', () => {

  test('Comment', function () {
    let result = parse('; comment\n; comment2');
    assert.equal(result.length, 2);
    assertNoop(result[0]);
    assertNoop(result[1]);

    // console.log(JSON.stringify(result, null, 4));
  });

});
