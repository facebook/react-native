/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.dontMock('../BatchProcessor');

const BatchProcessor = require('../BatchProcessor');

describe('BatchProcessor', () => {

  const options = {
    maximumDelayMs: 500,
    maximumItems: 3,
    concurrency: 2,
  };

  it('aggregate items concurrently', () => {
    const input = [...Array(9).keys()].slice(1);
    const transform = e => e * 10;
    const batches = [];
    let concurrency = 0;
    let maxConcurrency = 0;
    const bp = new BatchProcessor(options, (items, callback) => {
      ++concurrency;
      expect(concurrency).toBeLessThanOrEqual(options.concurrency);
      maxConcurrency = Math.max(maxConcurrency, concurrency);
      batches.push(items);
      setTimeout(() => {
        callback(null, items.map(transform));
        --concurrency;
      }, 0);
    });
    const results = [];
    const callback = (error, res) => {
      expect(error).toBe(null);
      results.push(res);
    };
    input.forEach(e => bp.queue(e, callback));
    jest.runAllTimers();
    expect(batches).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8],
    ]);
    expect(maxConcurrency).toEqual(options.concurrency);
    expect(results).toEqual(input.map(transform));
  });

  it('report errors', () => {
    const error = new Error('oh noes');
    const bp = new BatchProcessor(options, (items, callback) => {
      process.nextTick(callback.bind(null, error));
    });
    let receivedError;
    bp.queue('foo', err => { receivedError = err; });
    jest.runAllTimers();
    jest.runAllTicks();
    expect(receivedError).toBe(error);
  });

});
