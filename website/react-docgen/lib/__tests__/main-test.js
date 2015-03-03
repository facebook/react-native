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

var source = [
  'var React = require("React");',
  'var PropTypes = React.PropTypes;',
  '/**',
  ' * Example component description',
  ' */',
  'var Component = React.createClass({',
  '  propTypes: {',
  '    /**',
  '     * Example prop description',
  '     */',
  '    foo: PropTypes.bool',
  '  },',
  '  getDefaultProps: function() {',
  '    return {',
  '      foo: true',
  '    };',
  '  }',
  '});',
  'module.exports = Component;'
].join('\n');

describe('main', function() {
  var utils;
  var docgen;

  beforeEach(function() {
    utils = require('../../tests/utils');
    docgen = require('../main');
  });

  it('parses with default resolver/handlers', function() {
    var docs = docgen.parse(source);
    expect(docs).toEqual({
      description: 'Example component description',
      props: {
        foo: {
          type: {
            name: 'bool'
          },
          defaultValue: {
            computed: false,
            value: 'true'
          },
          description: 'Example prop description',
          required: false
        }
      }
    });
  });

  it('parses with custom handlers', function() {
    var docs = docgen.parse(source, null, [
      docgen.handlers.componentDocblockHandler,
    ]);
    expect(docs).toEqual({
      description: 'Example component description',
      props: {}
    });
  });
});
