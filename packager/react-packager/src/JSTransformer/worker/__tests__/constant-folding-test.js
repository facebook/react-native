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
const babel = require('babel-core');
const constantFolding = require('../constant-folding');

function parse(code) {
  return babel.transform(code, {code: false, babelrc: false, compact: true});
}

const babelOptions = {
  babelrc: false,
  compact: true,
  retainLines: false,
};

function normalize({code}) {
  return babel.transform(code, babelOptions).code;
}

describe('constant expressions', () => {
  it('can optimize conditional expressions with constant conditions', () => {
    const code = `
      a(
        'production'=="production",
        'production'!=='development',
        false && 1 || 0 || 2,
        true || 3,
        'android'==='ios' ? null : {},
        'android'==='android' ? {a:1} : {a:0},
        'foo'==='bar' ? b : c,
        f() ? g() : h()
      );`;
    expect(normalize(constantFolding('arbitrary.js', parse(code))))
      .toEqual(`a(true,true,2,true,{},{a:1},c,f()?g():h());`);
  });

  it('can optimize ternary expressions with constant conditions', () => {
    const code =
      `var a = true ? 1 : 2;
       var b = 'android' == 'android'
         ? ('production' != 'production' ? 'a' : 'A')
         : 'i';`;
    expect(normalize(constantFolding('arbitrary.js', parse(code))))
      .toEqual(`var a=1;var b='A';`);
  });

  it('can optimize logical operator expressions with constant conditions', () => {
    const code = `
      var a = true || 1;
      var b = 'android' == 'android' &&
        'production' != 'production' || null || "A";`;
    expect(normalize(constantFolding('arbitrary.js', parse(code))))
      .toEqual(`var a=true;var b="A";`);
  });

  it('can optimize logical operators with partly constant operands', () => {
    const code = `
      var a = "truthy" || z();
      var b = "truthy" && z();
      var c = null && z();
      var d = null || z();
      var e = !1 && z();
    `;
    expect(normalize(constantFolding('arbitrary.js', parse(code))))
      .toEqual(`var a="truthy";var b=z();var c=null;var d=z();var e=false;`);
  });

  it('can remode an if statement with a falsy constant test', () => {
    const code = `
      if ('production' === 'development' || false) {
        var a = 1;
      }
    `;
    expect(normalize(constantFolding('arbitrary.js', parse(code))))
      .toEqual(``);
  });

  it('can optimize if-else-branches with constant conditions', () => {
    const code = `
      if ('production' == 'development') {
        var a = 1;
        var b = a + 2;
      } else if ('development' == 'development') {
        var a = 3;
        var b = a + 4;
      } else {
        var a = 'b';
      }
    `;
    expect(normalize(constantFolding('arbitrary.js', parse(code))))
      .toEqual(`{var a=3;var b=a+4;}`);
  });

  it('can optimize nested if-else constructs', () => {
    const code = `
      if ('ios' === "android") {
        if (true) {
          require('a');
        } else {
          require('b');
        }
      } else if ('android' === 'android') {
        if (true) {
          require('c');
        } else {
          require('d');
        }
      }
    `;
    expect(normalize(constantFolding('arbitrary.js', parse(code))))
      .toEqual(`{{require('c');}}`);
  });
});
