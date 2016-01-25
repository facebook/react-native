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

var deadModuleElimintation = require('../dead-module-elimination');
var babel = require('babel-core');

const compile = (code) =>
  babel.transform(code, {
    plugins: [deadModuleElimintation],
  }).code;

const compare = (source, output) => {
  const out = trim(compile(source))
    // workaround babel/source map bug
    .replace(/^false;/, '');

  expect(out).toEqual(trim(output));
};


const trim = (str) =>
  str.replace(/\s/g, '');

describe('dead-module-elimination', () => {
  it('should inline __DEV__', () => {
    compare(
      `global.__DEV__ = false;
      var foo = __DEV__;`,
      `var foo = false;`
    );
  });

  it('should accept unary operators with literals', () => {
    compare(
      `global.__DEV__ = !1;
      var foo = __DEV__;`,
      `var foo = false;`
    );
  });

  it('should kill dead branches', () => {
    compare(
      `global.__DEV__ = false;
      if (__DEV__) {
        doSomething();
      }`,
      ``
    );
  });

  it('should kill unreferenced modules', () => {
    compare(
      `__d('foo', function() {})`,
      ``
    );
  });

  it('should kill unreferenced modules at multiple levels', () => {
    compare(
      `__d('bar', function() {});
      __d('foo', function() { require('bar'); });`,
      ``
    );
  });

  it('should kill modules referenced only from dead branches', () => {
    compare(
      `global.__DEV__ = false;
      __d('bar', function() {});
      if (__DEV__) { require('bar'); }`,
      ``
    );
  });

  it('should replace logical expressions with the result', () => {
    compare(
      `global.__DEV__ = false;
      __d('bar', function() {});
      __DEV__ && require('bar');`,
      `false;`
    );
  });

  it('should keep if result branch', () => {
    compare(
      `global.__DEV__ = false;
      __d('bar', function() {});
      if (__DEV__) {
        killWithFire();
      } else {
        require('bar');
      }`,
      `__d('bar', function() {});
      require('bar');`
    );
  });

  it('should replace falsy ternaries with alternate expression', () => {
    compare(
      `global.__DEV__ = false;
      __DEV__ ? foo() : bar();
      `,
      `bar();`
    );
  });
});
