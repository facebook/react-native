/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

const optimizeModule = require('../optimize-module');
const transformModule = require('../transform-module');
const transform = require('../../../../../transformer.js');
const {SourceMapConsumer} = require('source-map');

const {objectContaining} = jasmine;

describe('optimizing JS modules', () => {
  const filename = 'arbitrary/file.js';
  const optimizationOptions = {
    dev: false,
    platform: 'android',
  };
  const originalCode =
    `if (Platform.OS !== 'android') {
      require('arbitrary-dev');
    } else {
      __DEV__ ? require('arbitrary-android-dev') : require('arbitrary-android-prod');
    }`;

  let transformResult;
  beforeAll(done => {
    transformModule(originalCode, {filename, transform}, (error, result) => {
      if (error) {
        throw error;
      }
      transformResult = JSON.stringify(result);
      done();
    });
  });

  it('copies everything from the transformed file, except for transform results', done => {
    optimizeModule(transformResult, optimizationOptions, (error, result) => {
      const expected = JSON.parse(transformResult);
      delete expected.transformed;
      expect(result).toEqual(objectContaining(expected));
      done();
    });
  });

  describe('code optimization', () => {
    let dependencyMapName, injectedVars, optimized, requireName;
    beforeAll(done => {
      optimizeModule(transformResult, optimizationOptions, (error, result) => {
        optimized = result.transformed.default;
        injectedVars = optimized.code.match(/function\(([^)]*)/)[1].split(',');
        [requireName,,,, dependencyMapName] = injectedVars;
        done();
      });
    });

    it('optimizes code', () => {
      expect(optimized.code)
        .toEqual(`__d(function(${injectedVars}){${requireName}(${dependencyMapName}[0])});`);
    });

    it('extracts dependencies', () => {
      expect(optimized.dependencies).toEqual(['arbitrary-android-prod']);
    });

    it('creates source maps', () => {
      const consumer = new SourceMapConsumer(optimized.map);
      const column = optimized.code.lastIndexOf(requireName + '(');
      const loc = findLast(originalCode, 'require');

      expect(consumer.originalPositionFor({line: 1, column}))
        .toEqual(objectContaining(loc));
    });

    it('does not extract dependencies for polyfills', done => {
      optimizeModule(
        transformResult,
        {...optimizationOptions, isPolyfill: true},
        (error, result) => {
          expect(result.transformed.default.dependencies).toEqual([]);
          done();
        },
      );
    });
  });
});

function findLast(code, needle) {
  const lines = code.split(/(?:(?!.)\s)+/);
  let line = lines.length;
  while (line--) {
    const column = lines[line].lastIndexOf(needle);
    if (column !== -1) {
      return {line: line + 1, column};
    }
  }
}
