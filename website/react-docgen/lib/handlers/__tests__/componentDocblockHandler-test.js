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

describe('React documentation parser', function() {
  var parser;

  beforeEach(function() {
    parser = new (require('../../ReactDocumentationParser'));
    parser.addHandler(require('../componentDocblockHandler'));
  });

  it('finds docblocks for component definitions', function() {
    var source = [
      'var React = require("React");',
      '/**',
      ' * Component description',
      ' */',
      'var Component = React.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    var expectedResult = {
      props: {},
      description: 'Component description'
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('ignores other types of comments', function() {
    var source = [
      'var React = require("React");',
      '/*',
      ' * This is not a docblock',
      ' */',
      'var Component = React.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    var expectedResult = {
      props: {},
      description: ''
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);


    source = [
      'var React = require("React");',
      '// Inline comment',
      'var Component = React.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    expectedResult = {
      props: {},
      description: ''
    };

    result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });

  it('only considers the docblock directly above the definition', function() {
    var source = [
      'var React = require("React");',
      '/**',
      ' * This is the wrong docblock',
      ' */',
      'var something_else = "foo";',
      'var Component = React.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    var expectedResult = {
      props: {},
      description: ''
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });
});
