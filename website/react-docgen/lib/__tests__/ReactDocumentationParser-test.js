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
  var ReactDocumentationParser;
  var parser;
  var recast;

  beforeEach(function() {
    recast = require('recast');
    ReactDocumentationParser = require('../ReactDocumentationParser');
    parser = new ReactDocumentationParser();
  });

  function pathFromSource(source) {
    return new recast.types.NodePath(
      recast.parse(source).program.body[0].expression
    );
  }

  describe('parseSource', function() {

    it('allows custom component definition resolvers', function() {
      var path = pathFromSource('({foo: "bar"})');
      var resolver = jest.genMockFunction().mockReturnValue(path);
      var handler = jest.genMockFunction();
      parser.addHandler(handler);
      parser.parseSource('', resolver);

      expect(resolver).toBeCalled();
      expect(handler.mock.calls[0][1]).toBe(path);
    });

    it('errors if component definition is not found', function() {
      var handler = jest.genMockFunction();
      expect(function() {
        parser.parseSource('', handler);
      }).toThrow(ReactDocumentationParser.ERROR_MISSING_DEFINITION);
      expect(handler).toBeCalled();

      handler = jest.genMockFunction().mockReturnValue([]);
      expect(function() {
        parser.parseSource('', handler);
      }).toThrow(ReactDocumentationParser.ERROR_MISSING_DEFINITION);
      expect(handler).toBeCalled();
    });

  });

});
