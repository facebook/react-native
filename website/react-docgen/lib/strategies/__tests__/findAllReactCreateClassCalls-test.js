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
  var findAllReactCreateClassCalls;
  var recast;

  function parse(source) {
    return findAllReactCreateClassCalls(
      recast.parse(source).program,
      recast
    );
  }

  beforeEach(function() {
    findAllReactCreateClassCalls = require('../findAllReactCreateClassCalls');
    recast = require('recast');
  });


  it('finds React.createClass', function() {
    var source = [
      'var React = require("React");',
      'var Component = React.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    var result = parse(source);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0] instanceof recast.types.NodePath).toBe(true);
    expect(result[0].node.type).toBe('ObjectExpression');
  });

  it('finds React.createClass, independent of the var name', function() {
    var source = [
      'var R = require("React");',
      'var Component = R.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    var result = parse(source);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });

  it('does not process X.createClass of other modules', function() {
    var source = [
      'var R = require("NoReact");',
      'var Component = R.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    var result = parse(source);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('finds assignments to exports', function() {
    var source = [
      'var R = require("React");',
      'var Component = R.createClass({});',
      'exports.foo = 42;',
      'exports.Component = Component;'
    ].join('\n');

    var result = parse(source);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });

  it('accepts multiple definitions', function() {
    var source = [
      'var R = require("React");',
      'var ComponentA = R.createClass({});',
      'var ComponentB = R.createClass({});',
      'exports.ComponentB = ComponentB;'
    ].join('\n');

    var result = parse(source);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);

    source = [
      'var R = require("React");',
      'var ComponentA = R.createClass({});',
      'var ComponentB = R.createClass({});',
      'module.exports = ComponentB;'
    ].join('\n');

    result = parse(source);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });
});
