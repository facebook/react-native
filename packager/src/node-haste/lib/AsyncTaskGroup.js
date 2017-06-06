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

module.exports = class AsyncTaskGroup<TTaskHandle> {
  _runningTasks: Set<TTaskHandle>;
  _resolve: ?() => void;
  done: Promise<void>;

  constructor() {
    this._runningTasks = new Set();
    this._resolve = null;
    this.done = new Promise(resolve => this._resolve = resolve);
  }

  start(taskHandle: TTaskHandle) {
    this._runningTasks.add(taskHandle);
  }

  end(taskHandle: TTaskHandle) {
    const runningTasks = this._runningTasks;
    if (runningTasks.delete(taskHandle) && runningTasks.size === 0) {
      /* $FlowFixMe: could be null */
      this._resolve();
    }
  }
};
