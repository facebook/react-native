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

describe('defaultPropsHandler', function() {
  var utils;
  var documentation;
  var defaultValueHandler;

  function parse(src) {
    return utils.parse(src).get('body', 0, 'expression');
  }

  beforeEach(function() {
    utils = require('../../../tests/utils');
    documentation = new (require('../../Documentation'));
    defaultPropsHandler = require('../defaultPropsHandler');
  });

  it ('should find prop default values that are literals', function() {
    var definition = parse([
      '({',
      '  getDefaultProps: function() {',
      '    return {',
      '      foo: "bar",',
      '      bar: 42,',
      '      baz: ["foo", "bar"],',
      '      abc: {xyz: abc.def, 123: 42}',
      '    };',
      '  }',
      '});'
    ].join('\n'));

    defaultPropsHandler(documentation, definition);
    expect(documentation.descriptors).toEqual({
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
    });
  });
});
