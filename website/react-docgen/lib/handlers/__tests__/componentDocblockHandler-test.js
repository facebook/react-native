/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

"use strict";

jest.autoMockOff();
jest.mock('../../Documentation');

describe('componentDocblockHandler', function() {
  var utils;
  var documentation;
  var componentDocblockHandler;

  function parse(src) {
    var programPath = utils.parse(src);
    return programPath.get(
      'body',
      programPath.node.body.length - 1,
      'declarations',
      0,
      'init',
      'arguments',
      0
    );
  }

  beforeEach(function() {
    utils = require('../../../tests/utils');
    documentation = new (require('../../Documentation'));
    componentDocblockHandler = require('../componentDocblockHandler');
  });

  it('finds docblocks for component definitions', function() {
    var definition = parse([
      '/**',
      ' * Component description',
      ' */',
      'var Component = React.createClass({});',
    ].join('\n'));

    componentDocblockHandler(documentation, definition);
    expect(documentation.description).toBe('Component description');
  });

  it('ignores other types of comments', function() {
    var definition = parse([
      '/*',
      ' * This is not a docblock',
      ' */',
      'var Component = React.createClass({});',
    ].join('\n'));

    componentDocblockHandler(documentation, definition);
    expect(documentation.description).toBe('');

    definition = parse([
      '// Inline comment',
      'var Component = React.createClass({});',
    ].join('\n'));

    componentDocblockHandler(documentation, definition);
    expect(documentation.description).toBe('');
  });

  it('only considers the docblock directly above the definition', function() {
    var definition = parse([
      '/**',
      ' * This is the wrong docblock',
      ' */',
      'var something_else = "foo";',
      'var Component = React.createClass({});',
    ].join('\n'));

    componentDocblockHandler(documentation, definition);
    expect(documentation.description).toBe('');
  });
});
