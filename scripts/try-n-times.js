/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* globals echo:false */

'use strict';

/**
 * Try executing a function n times recursively.
 * Return 0 the first time it succeeds
 * Return code of the last failed commands if not more retries left
 * @funcToRetry - function that gets retried
 * @retriesLeft - number of retries to execute funcToRetry
 * @onEveryError - func to execute if funcToRetry returns non 0
 */
function tryExecNTimes(funcToRetry, retriesLeft, onEveryError) {
  const exitCode = funcToRetry();
  if (exitCode === 0) {
    return exitCode;
  } else {
    if (onEveryError) {
      onEveryError();
    }
    retriesLeft--;
    echo(`Command failed, ${retriesLeft} retries left`);
    if (retriesLeft === 0) {
      return exitCode;
    } else {
      return tryExecNTimes(funcToRetry, retriesLeft, onEveryError);
    }
  }
}

module.exports = tryExecNTimes;
