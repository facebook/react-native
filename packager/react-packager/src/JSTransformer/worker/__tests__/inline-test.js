/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();
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
    }`
    const {ast} = inline('arbitrary.js', {code}, {dev: true});
    expect(toString(ast)).toEqual(normalize(code.replace(/__DEV__/, 'true')));
  });

  it('replaces Platform.OS in the code if Platform is a global', () => {
    const code = `function a() {
      var a = Platform.OS;
      var b = a.Platform.OS;
    }`
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/Platform\.OS/, '"ios"')));
  });

  it('replaces Platform.OS in the code if Platform is a top level import', () => {
    const code = `
      var Platform = require('Platform');
      function a() {
        if (Platform.OS === 'android') a = function() {};
        var b = a.Platform.OS;
      }`
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/Platform\.OS/, '"ios"')));
  });

  it('replaces require("Platform").OS in the code', () => {
    const code = `function a() {
      var a = require('Platform').OS;
      var b = a.require('Platform').OS;
    }`
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/require\('Platform'\)\.OS/, '"android"')));
  });

  it('replaces React.Platform.OS in the code if React is a global', () => {
    const code = `function a() {
      var a = React.Platform.OS;
      var b = a.React.Platform.OS;
    }`
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/React\.Platform\.OS/, '"ios"')));
  });

  it('replaces React.Platform.OS in the code if React is a top level import', () => {
    const code = `
      var React = require('React');
      function a() {
        if (React.Platform.OS === 'android') a = function() {};
        var b = a.React.Platform.OS;
      }`
    const {ast} = inline('arbitrary.js', {code}, {platform: 'ios'});
    expect(toString(ast)).toEqual(normalize(code.replace(/React.Platform\.OS/, '"ios"')));
  });

  it('replaces require("React").Platform.OS in the code', () => {
    const code = `function a() {
      var a = require('React').Platform.OS;
      var b = a.require('React').Platform.OS;
    }`
    const {ast} = inline('arbitrary.js', {code}, {platform: 'android'});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/require\('React'\)\.Platform\.OS/, '"android"')));
  });

  it('replaces process.env.NODE_ENV in the code', () => {
    const code = `function a() {
      if (process.env.NODE_ENV === 'production') {
        return require('Prod');
      }
      return require('Dev');
    }`
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
    }`
    const {ast} = inline('arbitrary.js', {code}, {dev: true});
    expect(toString(ast)).toEqual(
      normalize(code.replace(/process\.env\.NODE_ENV/, '"development"')));
  });

  it('accepts an AST as input', function() {
    const code = `function ifDev(a,b){return __DEV__?a:b;}`;
    const {ast} = inline('arbitrary.hs', {ast: toAst(code)}, {dev: false});
    expect(toString(ast)).toEqual(code.replace(/__DEV__/, 'false'))
  });
});

