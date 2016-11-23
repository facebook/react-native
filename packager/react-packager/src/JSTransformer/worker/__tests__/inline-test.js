/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();
const inline = require('../inline');
const {transform, transformFromAst} = require('babel-core');

const babelOptions = {
  babelrc: false,
  compact: true,
};

function toString(ast) {
  return normalize(transformFromAst(ast, babelOptions).code);
}

function normalize(code) {
  return transform(code, babelOptions).code;
}

function toAst(code) {
  return transform(code, {...babelOptions, code: false}).ast;
}

describe('inline constants', () => {
  it('replaces __DEV__ in the code', () => {
    const code = `function a() {
      var a = __DEV__ ? 1 : 2;
      var b = a.__DEV__;
      var c = function __DEV__(__DEV__) {};
    }`;
    const {ast} = inline('arbitrary.js', {code}, {dev: true});
    expect(toString(ast)).toEqual(normalize(code.replace(/__DEV__/, 'true')));
  });

  it('replaces Platform.OS in the code if Platform is a global', () => {
    const code = `function a() {
      var a = Platform.OS;
      var b = a.Platform.OS;
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/Platform\.OS/, '"ios"')));
  });

  it('replaces Platform.OS in the code if Platform is a top level import', () => {
    const code = `
      var Platform = require('Platform');
      function a() {
        if (Platform.OS === 'android') a = function() {};
        var b = a.Platform.OS;
      }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/Platform\.OS/, '"ios"')));
  });

  it('replaces Platform.OS in the code if Platform is a top level import from react-native', () => {
    const code = `
      var Platform = require('react-native').Platform;
      function a() {
        if (Platform.OS === 'android') a = function() {};
        var b = a.Platform.OS;
      }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/Platform\.OS/, '"ios"')));
  });

  it('replaces require("Platform").OS in the code', () => {
    const code = `function a() {
      var a = require('Platform').OS;
      var b = a.require('Platform').OS;
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/require\('Platform'\)\.OS/, '"android"')));
  });

  it('replaces React.Platform.OS in the code if React is a global', () => {
    const code = `function a() {
      var a = React.Platform.OS;
      var b = a.React.Platform.OS;
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/React\.Platform\.OS/, '"ios"')));
  });

  it('replaces ReactNative.Platform.OS in the code if ReactNative is a global', () => {
    const code = `function a() {
      var a = ReactNative.Platform.OS;
      var b = a.ReactNative.Platform.OS;
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/ReactNative\.Platform\.OS/, '"ios"')));
  });

  it('replaces React.Platform.OS in the code if React is a top level import', () => {
    const code = `
      var React = require('React');
      function a() {
        if (React.Platform.OS === 'android') a = function() {};
        var b = a.React.Platform.OS;
      }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/React.Platform\.OS/, '"ios"')));
  });

  it('replaces require("React").Platform.OS in the code', () => {
    const code = `function a() {
      var a = require('React').Platform.OS;
      var b = a.require('React').Platform.OS;
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/require\('React'\)\.Platform\.OS/, '"android"')));
  });

  it('replaces ReactNative.Platform.OS in the code if ReactNative is a top level import', () => {
    const code = `
      var ReactNative = require('react-native');
      function a() {
        if (ReactNative.Platform.OS === 'android') a = function() {};
        var b = a.ReactNative.Platform.OS;
      }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(normalize(code.replace(/ReactNative.Platform\.OS/, '"android"')));
  });

  it('replaces require("react-native").Platform.OS in the code', () => {
    const code = `function a() {
      var a = require('react-native').Platform.OS;
      var b = a.require('react-native').Platform.OS;
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/require\('react-native'\)\.Platform\.OS/, '"android"')));
  });

  it('inlines Platform.select in the code if Platform is a global and the argument is an object literal', () => {
    const code = `function a() {
      var a = Platform.select({ios: 1, android: 2});
      var b = a.Platform.select({ios: 1, android: 2});
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/Platform\.select[^;]+/, '1')));
  });

  it('replaces Platform.select in the code if Platform is a top level import', () => {
    const code = `
      var Platform = require('Platform');
      function a() {
        Platform.select({ios: 1, android: 2});
        var b = a.Platform.select({});
      }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(normalize(code.replace(/Platform\.select[^;]+/, '2')));
  });

  it('replaces Platform.select in the code if Platform is a top level import from react-native', () => {
    const code = `
      var Platform = require('react-native').Platform;
      function a() {
        Platform.select({ios: 1, android: 2});
        var b = a.Platform.select({});
      }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/Platform\.select[^;]+/, '1')));
  });

  it('replaces require("Platform").select in the code', () => {
    const code = `function a() {
      var a = require('Platform').select({ios: 1, android: 2});
      var b = a.require('Platform').select({});
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(normalize(code.replace(/Platform\.select[^;]+/, '2')));
  });

  it('replaces React.Platform.select in the code if React is a global', () => {
    const code = `function a() {
      var a = React.Platform.select({ios: 1, android: 2});
      var b = a.React.Platform.select({});
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/React\.Platform\.select[^;]+/, '1')));
  });

  it('replaces ReactNative.Platform.select in the code if ReactNative is a global', () => {
    const code = `function a() {
      var a = ReactNative.Platform.select({ios: 1, android: 2});
      var b = a.ReactNative.Platform.select({});
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/ReactNative\.Platform\.select[^;]+/, '1')));
  });

  it('replaces React.Platform.select in the code if React is a top level import', () => {
    const code = `
      var React = require('React');
      function a() {
        var a = React.Platform.select({ios: 1, android: 2});
        var b = a.React.Platform.select({});
      }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/React\.Platform\.select[^;]+/, '1')));
  });

  it('replaces require("React").Platform.select in the code', () => {
    const code = `function a() {
      var a = require('React').Platform.select({ios: 1, android: 2});
      var b = a.require('React').Platform.select({});
    }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/require\('React'\)\.Platform\.select[^;]+/, '2')));
  });

  it('replaces ReactNative.Platform.select in the code if ReactNative is a top level import', () => {
    const code = `
      var ReactNative = require('react-native');
      function a() {
        var a = ReactNative.Plaftform.select({ios: 1, android: 2});
        var b = a.ReactNative.Platform.select;
      }`;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(normalize(code.replace(/ReactNative.Platform\.select[^;]+/, '2')));
  });

  it('replaces require("react-native").Platform.select in the code', () => {
    const code = `
      var a = require('react-native').Platform.select({ios: 1, android: 2});
      var b = a.require('react-native').Platform.select({});
    `;
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/require\('react-native'\)\.Platform\.select[^;]+/, '2')));
  });

  it('replaces non-existing properties with `undefined`', () => {
    const code = 'var a = Platform.select({ios: 1, android: 2})';
    const {ast} = inline('arbitrary.js', {code}, {platform: 'doesnotexist'});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/Platform\.select[^;]+/, 'undefined')));
  });

  it('replaces process.env.NODE_ENV in the code', () => {
    const code = `function a() {
      if (process.env.NODE_ENV === 'production') {
        return require('Prod');
      }
      return require('Dev');
    }`;
    const {ast} = inline('arbitrary.js', {code}, {dev: false});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/process\.env\.NODE_ENV/, '"production"')));
  });

  it('replaces process.env.NODE_ENV in the code', () => {
    const code = `function a() {
      if (process.env.NODE_ENV === 'production') {
        return require('Prod');
      }
      return require('Dev');
    }`;
    const {ast} = inline('arbitrary.js', {code}, {dev: true});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/process\.env\.NODE_ENV/, '"development"')));
  });

  it('accepts an AST as input', function() {
    const code = 'function ifDev(a,b){return __DEV__?a:b;}';
    const {ast} = inline('arbitrary.hs', {ast: toAst(code)}, {dev: false});
    expect(toString(ast)).toEqual(code.replace(/__DEV__/, 'false'));
  });

  it('can work with wrapped modules', () => {
    const code = `__arbitrary(function() {
      var Platform = require('react-native').Platform;
      var a = Platform.OS, b = Platform.select({android: 1, ios: 2});
    });`;
    const {ast} = inline(
      'arbitrary', {code}, {dev: true, platform: 'android', isWrapped: true});
    expect(toString(ast)).toEqual(
      normalize(
        code
          .replace(/Platform\.OS/, '"android"')
          .replace(/Platform\.select[^)]+\)/, 1)
      )
    );
  });

  it('can work with transformed require calls', () => {
    const code = `__arbitrary(require, function(arbitraryMapName) {
      var a = require(arbitraryMapName[123], 'react-native').Platform.OS;
    });`;
    const {ast} = inline(
      'arbitrary', {code}, {dev: true, platform: 'android', isWrapped: true});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/require\([^)]+\)\.Platform\.OS/, '"android"')));
  });
});
