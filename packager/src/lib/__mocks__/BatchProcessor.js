/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {EventEmitter} = require('events');

class BatchProcessorMock {

  constructor(_, processBatch) {
    this._processBatch = processBatch;
    this._queue = [];
    BatchProcessorMock.mocks.emit('new', this);
  }

  queue(item, callback) {
    this._queue.push([item, callback]);
  }

  flushMock() {
    const {_queue} = this;
    this._queue = [];
    process.nextTick(() => {
      this._processBatch(_queue.map(pair => pair[0]), (error, res) => {
        _queue.forEach((pair, i) => pair[1](error, res && res[i]));
      });
    });
  }

}

BatchProcessorMock.mocks = new EventEmitter();

module.exports = BatchProcessorMock;
