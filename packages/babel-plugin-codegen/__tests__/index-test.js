/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const failures = require('../__test_fixtures__/failures.js');
const fixtures = require('../__test_fixtures__/fixtures.js');
const {transform: babelTransform} = require('@babel/core');

const transform = (fixture, filename) =>
  babelTransform(fixture, {
    babelrc: false,
    browserslistConfigFile: false,
    cwd: '/',
    filename: filename,
    highlightCode: false,
    plugins: [require('@babel/plugin-syntax-flow'), require('../index')],
  }).code;

describe('Babel plugin inline view configs', () => {
  Object.keys(fixtures)
    .sort()
    .forEach(fixtureName => {
      it(`can inline config for ${fixtureName}`, () => {
        expect(transform(fixtures[fixtureName], fixtureName)).toMatchSnapshot();
      });
    });

  Object.keys(failures)
    .sort()
    .forEach(fixtureName => {
      it(`fails on inline config for ${fixtureName}`, () => {
        expect(() => {
          try {
            transform(failures[fixtureName], fixtureName);
          } catch (err) {
            err.message = err.message.replace(/^[A-z]:\\/g, '/'); // Ensure platform consistent snapshots.
            throw err;
          }
        }).toThrowErrorMatchingSnapshot();
      });
    });
});
