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

type ProcessBatch<TItem, TResult> = (batch: Array<TItem>) => Promise<Array<TResult>>;

type BatchProcessorOptions = {
  maximumDelayMs: number,
  maximumItems: number,
  concurrency: number,
};

type QueueItem<TItem, TResult> = {
  item: TItem,
  reject: (error: mixed) => mixed,
  resolve: (result: TResult) => mixed,
};

/**
 * We batch items together trying to minimize their processing, for example as
 * network queries. For that we wait a small moment before processing a batch.
 * We limit also the number of items we try to process in a single batch so that
 * if we have many items pending in a short amount of time, we can start
 * processing right away.
 */
class BatchProcessor<TItem, TResult> {

  _currentProcessCount: number;
  _options: BatchProcessorOptions;
  _processBatch: ProcessBatch<TItem, TResult>;
  _queue: Array<QueueItem<TItem, TResult>>;
  _timeoutHandle: ?number;

  constructor(options: BatchProcessorOptions, processBatch: ProcessBatch<TItem, TResult>) {
    this._options = options;
    this._processBatch = processBatch;
    this._queue = [];
    this._timeoutHandle = null;
    this._currentProcessCount = 0;
    (this: any)._processQueue = this._processQueue.bind(this);
  }

  _onBatchFinished() {
    this._currentProcessCount--;
    this._processQueueOnceReady();
  }

  _onBatchResults(jobs: Array<QueueItem<TItem, TResult>>, results: Array<TResult>) {
    invariant(results.length === jobs.length, 'Not enough results returned.');
    for (let i = 0; i < jobs.length; ++i) {
      jobs[i].resolve(results[i]);
    }
    this._onBatchFinished();
  }

  _onBatchError(jobs: Array<QueueItem<TItem, TResult>>, error: mixed) {
    for (let i = 0; i < jobs.length; ++i) {
      jobs[i].reject(error);
    }
    this._onBatchFinished();
  }

  _processQueue() {
    this._timeoutHandle = null;
    const {concurrency} = this._options;
    while (this._queue.length > 0 && this._currentProcessCount < concurrency) {
      this._currentProcessCount++;
      const jobs = this._queue.splice(0, this._options.maximumItems);
      this._processBatch(jobs.map(job => job.item)).then(
        this._onBatchResults.bind(this, jobs),
        this._onBatchError.bind(this, jobs),
      );
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

  queue(item: TItem): Promise<TResult> {
    return new Promise((resolve, reject) => {
      this._queue.push({item, resolve, reject});
      this._processQueueOnceReady();
    });
  }

}

module.exports = BatchProcessor;
