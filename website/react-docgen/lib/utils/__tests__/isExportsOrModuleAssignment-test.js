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

describe('isExportsOrModuleAssignment', function() {
  var recast;
  var isExportsOrModuleAssignment;

  function parse(src) {
    return new recast.types.NodePath(
      recast.parse(src).program.body[0]
    );
  }

  beforeEach(function() {
    isExportsOrModuleAssignment = require('../isExportsOrModuleAssignment');
    recast = require('recast');
  });

  it('detects "module.exports = ...;"', function() {
    expect(isExportsOrModuleAssignment(parse('module.exports = foo;')))
      .toBe(true);
  });

  it('detects "exports.foo = ..."', function() {
    expect(isExportsOrModuleAssignment(parse('exports.foo = foo;')))
      .toBe(true);
  });

  it('does not accept "exports = foo;"', function() {
    // That doesn't actually export anything
    expect(isExportsOrModuleAssignment(parse('exports = foo;')))
      .toBe(false);
  });

});
