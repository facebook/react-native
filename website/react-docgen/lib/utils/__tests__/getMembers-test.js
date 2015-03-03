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

describe('getMembers', function() {
  var recast;
  var getMembers;
  var memberExpressionPath;

  function parse(src) {
    return new recast.types.NodePath(
      recast.parse(src).program.body[0].expression
    );
  }

  beforeEach(function() {
    getMembers = require('../getMembers');
    recast = require('recast');
    memberExpressionPath = parse('foo.bar(123)(456)[baz][42]');
  });


  it('finds all "members" "inside" a MemberExpression', function() {
    var b = recast.types.builders;
    var members = getMembers(memberExpressionPath);

    //bar(123)
    expect(members[0].path.node.name).toEqual('bar');
    expect(members[0].computed).toBe(false);
    expect(members[0].argumentsPath.get(0).node.value).toEqual(123);
    //[baz]
    expect(members[1].path.node.name).toEqual('baz');
    expect(members[1].computed).toBe(true);
    expect(members[1].argumentsPath).toBe(null);
    //[42]
    expect(members[2].path.node.value).toEqual(42);
    expect(members[2].computed).toBe(true);
    expect(members[2].argumentsPath).toBe(null);
  });

});
