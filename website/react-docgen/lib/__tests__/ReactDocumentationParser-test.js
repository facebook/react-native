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

require('mock-modules').autoMockOff();

describe('React documentation parser', function() {
  var ReactDocumentationParser;
  var parser;

  beforeEach(function() {
    ReactDocumentationParser = require('../ReactDocumentationParser');
    parser = new ReactDocumentationParser();
  });

  it('errors if component definition is not found', function() {
    var source = 'var React = require("React");';

    expect(function() {
      parser.parseSource(source);
    }).toThrow(ReactDocumentationParser.ERROR_MISSING_DEFINITION);
  });

  it('finds React.createClass', function() {
    var source = [
      'var React = require("React");',
      'var Component = React.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    expect(function() {
      parser.parseSource(source);
    }).not.toThrow();
  });

  it('finds React.createClass, independent of the var name', function() {
    var source = [
      'var R = require("React");',
      'var Component = R.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    expect(function() {
      parser.parseSource(source);
    }).not.toThrow();
  });

  it('does not process X.createClass of other modules', function() {
    var source = [
      'var R = require("NoReact");',
      'var Component = R.createClass({});',
      'module.exports = Component;'
    ].join('\n');

    expect(function() {
      parser.parseSource(source);
    }).toThrow(ReactDocumentationParser.ERROR_MISSING_DEFINITION);
  });

  it('finds assignments to exports', function() {
    var source = [
      'var R = require("React");',
      'var Component = R.createClass({});',
      'exports.foo = 42;',
      'exports.Component = Component;'
    ].join('\n');

    expect(function() {
      parser.parseSource(source);
    }).not.toThrow();
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
      parser.parseSource(source);
    }).toThrow(ReactDocumentationParser.ERROR_MULTIPLE_DEFINITIONS);
  });

  it('accepts multiple definitions if only one is exported', function() {
    var source = [
      'var R = require("React");',
      'var ComponentA = R.createClass({});',
      'var ComponentB = R.createClass({});',
      'exports.ComponentB = ComponentB;'
    ].join('\n');

    expect(function() {
      parser.parseSource(source);
    }).not.toThrow();

    source = [
      'var R = require("React");',
      'var ComponentA = R.createClass({});',
      'var ComponentB = R.createClass({});',
      'module.exports = ComponentB;'
    ].join('\n');

    expect(function() {
      parser.parseSource(source);
    }).not.toThrow();
  });
});
