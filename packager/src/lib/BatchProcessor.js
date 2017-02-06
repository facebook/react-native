/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const invariant = require('fbjs/lib/invariant');

type ProcessBatch<TItem, TResult> = (
  batch: Array<TItem>,
  callback: (error?: Error, orderedResults?: Array<TResult>) => mixed,
) => mixed;

type BatchProcessorOptions = {
  maximumDelayMs: number,
  maximumItems: number,
  concurrency: number,
};

/**
 * We batch items together trying to minimize their processing, for example as
 * network queries. For that we wait a small moment before processing a batch.
 * We limit also the number of items we try to process in a single batch so that
 * if we have many items pending in a short amount of time, we can start
 * processing right away.
 */
class BatchProcessor<TItem, TResult> {

  _options: BatchProcessorOptions;
  _processBatch: ProcessBatch<TItem, TResult>;
  _queue: Array<{
    item: TItem,
    callback: (error?: Error, result?: TResult) => mixed,
  }>;
  _timeoutHandle: ?number;
  _currentProcessCount: number;

  constructor(
    options: BatchProcessorOptions,
    processBatch: ProcessBatch<TItem, TResult>,
  ) {
    this._options = options;
    this._processBatch = processBatch;
    this._queue = [];
    this._timeoutHandle = null;
    this._currentProcessCount = 0;
    (this: any)._processQueue = this._processQueue.bind(this);
  }

  _processQueue() {
    this._timeoutHandle = null;
    while (
      this._queue.length > 0 &&
      this._currentProcessCount < this._options.concurrency
    ) {
      this._currentProcessCount++;
      const jobs = this._queue.splice(0, this._options.maximumItems);
      const items = jobs.map(job => job.item);
      this._processBatch(items, (error, results) => {
        invariant(
          results == null || results.length === items.length,
          'Not enough results returned.',
        );
        for (let i = 0; i < items.length; ++i) {
          jobs[i].callback(error, results && results[i]);
        }
        this._currentProcessCount--;
        this._processQueueOnceReady();
      });
    }
  }

  _processQueueOnceReady() {
    if (this._queue.length >= this._options.maximumItems) {
      clearTimeout(this._timeoutHandle);
      process.nextTick(this._processQueue);
      return;
    }
    if (this._timeoutHandle == null) {
      this._timeoutHandle = setTimeout(
        this._processQueue,
        this._options.maximumDelayMs,
      );
    }
  }

  queue(
    item: TItem,
    callback: (error?: Error, result?: TResult) => mixed,
  ) {
    this._queue.push({item, callback});
    this._processQueueOnceReady();
  }

}

module.exports = BatchProcessor;
