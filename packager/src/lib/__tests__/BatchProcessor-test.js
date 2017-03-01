/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest
  .useRealTimers()
  .dontMock('../BatchProcessor');

const BatchProcessor = require('../BatchProcessor');

describe('BatchProcessor', () => {

  const options = {
    maximumDelayMs: 500,
    maximumItems: 3,
    concurrency: 2,
  };

  it('aggregate items concurrently', async () => {
    const input = [...Array(9).keys()].slice(1);
    const transform = e => e * 10;
    const batches = [];
    let concurrency = 0;
    let maxConcurrency = 0;
    const bp = new BatchProcessor(options, items => new Promise(resolve => {
      ++concurrency;
      expect(concurrency).toBeLessThanOrEqual(options.concurrency);
      maxConcurrency = Math.max(maxConcurrency, concurrency);
      batches.push(items);
      setTimeout(() => {
        resolve(items.map(transform));
        --concurrency;
      }, 0);
    }));
    const results = [];
    await Promise.all(input.map(e => bp.queue(e).then(
      res => results.push(res),
      error => process.nextTick(() => { throw error; }),
    )));
    expect(batches).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8],
    ]);
    expect(maxConcurrency).toEqual(options.concurrency);
    expect(results).toEqual(input.map(transform));
  });

  it('report errors', async () => {
    const error = new Error('oh noes');
    const bp = new BatchProcessor(options, items => new Promise((_, reject) => {
      setTimeout(reject.bind(null, error), 0);
    }));
    let receivedError;
    await bp.queue('foo').catch(
      err => { receivedError = err; },
    );
    expect(receivedError).toBe(error);
  });

});
