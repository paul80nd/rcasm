'use strict';

import * as assert from 'assert';

var parser = require('../src/g_parser')

suite('rcasm - Parser', () => {

  test('Comment', function () {

    let result = parser.parse('; comment');
    assert.ok(false, 'test');
    // 		let parser = new Parser();
    // 		assertNode('; comment', parser, parser._parseProgram.bind(parser));
    // 		assertNode('; comment\n; comment2', parser, parser._parseProgram.bind(parser));
  });

});
