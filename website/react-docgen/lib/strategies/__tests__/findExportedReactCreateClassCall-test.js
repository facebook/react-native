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
  var findExportedReactCreateClass;
  var recast;

  function parse(source) {
    return findExportedReactCreateClass(
      recast.parse(source).program,
      recast
    );
  }

  beforeEach(function() {
    findExportedReactCreateClass =
      require('../findExportedReactCreateClassCall');
    recast = require('recast');
  });

  it('finds React.createClass', function() {
    var source = [
      'var React = require("React");',
      'var Component = React.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    expect(parse(source)).toBeDefined();
  });

  it('finds React.createClass, independent of the var name', function() {
    var source = [
      'var R = require("React");',
      'var Component = R.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    expect(parse(source)).toBeDefined();
  });

  it('does not process X.createClass of other modules', function() {
    var source = [
      'var R = require("NoReact");',
      'var Component = R.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    expect(parse(source)).toBeUndefined();
  });

  it('finds assignments to exports', function() {
    var source = [
      'var R = require("React");',
      'var Component = R.createClass({});',
      'exports.foo = 42;',
      'exports.Component = Component;'
    ].join('\n');

    expect(parse(source)).toBeDefined();
  });

  it('errors if multiple components are exported', function() {
    var source = [
      'var R = require("React");',
      'var ComponentA = R.createClass({});',
      'var ComponentB = R.createClass({});',
      'exports.ComponentA = ComponentA;',
      'exports.ComponentB = ComponentB;'
    ].join('\n');

    expect(function() {
      parse(source)
    }).toThrow();
  });

  it('accepts multiple definitions if only one is exported', function() {
    var source = [
      'var R = require("React");',
      'var ComponentA = R.createClass({});',
      'var ComponentB = R.createClass({});',
      'exports.ComponentB = ComponentB;'
    ].join('\n');

    expect(parse(source)).toBeDefined();

    source = [
      'var R = require("React");',
      'var ComponentA = R.createClass({});',
      'var ComponentB = R.createClass({});',
      'module.exports = ComponentB;'
    ].join('\n');

    expect(parse(source)).toBeDefined();
  });
});
