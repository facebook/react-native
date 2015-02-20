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

var module_template = [
  'var React = require("React");',
  'var PropTypes = React.PropTypes;',
  'var Component = React.createClass(%s);',
  'module.exports = Component;'
].join('\n');

function getSource(definition) {
  return module_template.replace('%s', definition);
}

describe('React documentation parser', function() {
  var parser;

  beforeEach(function() {
    parser = new (require('../../ReactDocumentationParser'));
    parser.addHandler(require('../defaultValueHandler'), 'getDefaultProps');
  });

  it ('should find prop default values that are literals', function() {
    var source = getSource([
      '{',
      '  getDefaultProps: function() {',
      '    return {',
      '      foo: "bar",',
      '      bar: 42,',
      '      baz: ["foo", "bar"],',
      '      abc: {xyz: abc.def, 123: 42}',
      '    };',
      '  }',
      '}'
    ].join('\n'));

    var expectedResult = {
      description: '',
      props: {
        foo: {
          defaultValue: {
            value: '"bar"',
            computed: false
          }
        },
        bar: {
          defaultValue: {
            value: '42',
            computed: false
          }
        },
        baz: {
          defaultValue: {
            value: '["foo", "bar"]',
            computed: false
          }
        },
        abc: {
          defaultValue: {
            value: '{xyz: abc.def, 123: 42}',
            computed: false
          }
        }
      }
    };

    var result = parser.parseSource(source);
    expect(result).toEqual(expectedResult);
  });
});
