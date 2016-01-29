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

jest.mock('babel-core');

const worker = require('../worker');
const babel = require('babel-core');

const code = 'code';

describe('Resolver', function() {
  beforeEach(() => {
    babel.transform.mockImpl((source, options) => source);
  });

  describe('when no external transform is provided', () => {
    xit('should invoke internal transform if available', () => {
      transform({
        sourceCode: 'code',
        filename: 'test',
        options: options({opts: {}, internalTransformsEnabled: true}),
      });
      expect(babel.transform.mock.calls.length).toBe(1);
    });

    it('should not invoke internal transform if unavailable', () => {
      transform({
        sourceCode: 'code',
        filename: 'test',
        options: options({opts: {}, internalTransformsEnabled: false}),
      });
      expect(babel.transform.mock.calls.length).toBe(0);
    });
  });

  describe('when external transform is provided', () => {
    xit('should invoke both transformers if internal is available', () => {
      transform({
        sourceCode: code,
        filename: 'test',
        options: options({
          opts: {
            externalTransformModulePath: require.resolve(
              '../../../../transformer.js'
            ),
          },
          internalTransformsEnabled: true,
        }),
      });
      expect(babel.transform.mock.calls.length).toBe(2);
    });

    it('should invoke only external transformer if internal is not available', () => {
      transform({
        sourceCode: 'code',
        filename: 'test',
        options: options({
          opts: {
            externalTransformModulePath: require.resolve(
              '../../../../transformer.js'
            ),
          },
          internalTransformsEnabled: false,
        }),
      });
      expect(babel.transform.mock.calls.length).toBe(1);
    });

    xit('should pipe errors through transform pipeline', () => {
      const error = new Error('transform error');
      babel.transform.mockImpl((source, options) => {
        throw error;
      });

      const callback = transform({
        sourceCode: 'code',
        filename: 'test',
        options: options({
          opts: {
            externalTransformModulePath: require.resolve(
              '../../../../transformer.js'
            ),
          },
          internalTransformsEnabled: true,
        }),
      });
      expect(callback.mock.calls[0][0]).toBe(error);
    });
  });
});

function transform(data) {
  const callback = jest.genMockFunction();
  worker(data, callback);
  return callback;
}

function options({opts, internalTransformsEnabled}) {
  return Object.assign(opts, {hot: internalTransformsEnabled});
}
