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

describe('parse', function() {
  var utils;
  var parse;

  beforeEach(function() {
    utils = require('../../tests/utils');
    parse = require('../parse');
  });

  function pathFromSource(source) {
    return utils.parse(source).get('body', 0, 'expression');
  }

  it('allows custom component definition resolvers', function() {
    var path = pathFromSource('({foo: "bar"})');
    var resolver = jest.genMockFunction().mockReturnValue(path);
    var handler = jest.genMockFunction();
    parse('', resolver, [handler]);

    expect(resolver).toBeCalled();
    expect(handler.mock.calls[0][1]).toBe(path);
  });

  it('errors if component definition is not found', function() {
    var resolver = jest.genMockFunction();
    expect(function() {
      parse('', resolver);
    }).toThrow(parse.ERROR_MISSING_DEFINITION);
    expect(resolver).toBeCalled();

    handler = jest.genMockFunction().mockReturnValue([]);
    expect(function() {
      parse('', resolver);
    }).toThrow(parse.ERROR_MISSING_DEFINITION);
    expect(resolver).toBeCalled();
  });

});
