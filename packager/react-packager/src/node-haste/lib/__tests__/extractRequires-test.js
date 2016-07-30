/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../extractRequires');
jest.dontMock('../replacePatterns');

const extractRequires = require('../extractRequires');

describe('extractRequires', () => {
  it('should extract both requires and imports from code', () => {
    const code = `
      import module1 from 'module1';
      const module2 = require('module2');
      const module3 = require(\`module3\`);
    `;

    expect(extractRequires(code)).toEqual({
      code,
      deps: {sync: ['module1', 'module2', 'module3']},
    });
  });

  it('should extract requires in order', () => {
    const code = `
      const module1 = require('module1');
      const module2 = require('module2');
      const module3 = require('module3');
    `;

    expect(extractRequires(code)).toEqual({
      code,
      deps: {sync: ['module1', 'module2', 'module3']},
    });
  });

  it('should strip out comments from code', () => {
    const code = '// comment';

    expect(extractRequires(code)).toEqual({
      code: '',
      deps: {sync: []},
    });
  });

  it('should ignore requires in comments', () => {
    const code = [
      '// const module1 = require("module1");',
      '/**',
      ' * const module2 = require("module2");',
      ' */',
    ].join('\n');

    expect(extractRequires(code)).toEqual({
      code: '\n',
      deps: {sync: []},
    });
  });

  it('should ignore requires in comments with Windows line endings', () => {
    const code = [
      '// const module1 = require("module1");',
      '/**',
      ' * const module2 = require("module2");',
      ' */',
    ].join('\r\n');

    expect(extractRequires(code)).toEqual({
      code: '\r\n',
      deps: {sync: []},
    });
  });

  it('should ignore requires in comments with unicode line endings', () => {
    const code = [
      '// const module1 = require("module1");\u2028',
      '// const module1 = require("module2");\u2029',
      '/*\u2028',
      'const module2 = require("module3");\u2029',
      ' */',
    ].join('');

    expect(extractRequires(code)).toEqual({
      code: '\u2028\u2029',
      deps: {sync: []},
    });
  });

  it('should dedup duplicated requires', () => {
    const code = `
      const module1 = require('module1');
      const module1Dup = require('module1');
    `;

    expect(extractRequires(code)).toEqual({
      code,
      deps: {sync: ['module1']},
    });
  });
});
