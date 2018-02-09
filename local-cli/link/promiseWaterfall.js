/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Given an array of promise creators, executes them in a sequence.
 *
 * If any of the promises in the chain fails, all subsequent promises
 * will be skipped
 *
 * Returns the value last promise from a sequence resolved
 */
module.exports = function promiseWaterfall(tasks) {
  return tasks.reduce(
    (prevTaskPromise, task) => prevTaskPromise.then(task),
    Promise.resolve()
  );
};
