/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

let logListeners;

type LogListeners = {
  +onDifferentFunctionsIgnored: (nameOne: ?string, nameTwo: ?string) => void,
};

type Options = {+unsafelyIgnoreFunctions?: boolean};

function unstable_setLogListeners(listeners: ?LogListeners) {
  logListeners = listeners;
}

/*
 * @returns {bool} true if different, false if equal
 */
const deepDiffer = function (
  one: any,
  two: any,
  maxDepthOrOptions: Options | number = -1,
  maybeOptions?: Options,
): boolean {
  const options =
    typeof maxDepthOrOptions === 'number' ? maybeOptions : maxDepthOrOptions;
  const maxDepth =
    typeof maxDepthOrOptions === 'number' ? maxDepthOrOptions : -1;
  if (maxDepth === 0) {
    return true;
  }
  if (one === two) {
    // Short circuit on identical object references instead of traversing them.
    return false;
  }
  if (typeof one === 'function' && typeof two === 'function') {
    // We consider all functions equal unless explicitly configured otherwise
    let unsafelyIgnoreFunctions = options?.unsafelyIgnoreFunctions;
    if (unsafelyIgnoreFunctions == null) {
      if (
        logListeners &&
        logListeners.onDifferentFunctionsIgnored &&
        (!options || !('unsafelyIgnoreFunctions' in options))
      ) {
        logListeners.onDifferentFunctionsIgnored(one.name, two.name);
      }
      unsafelyIgnoreFunctions = true;
    }
    return !unsafelyIgnoreFunctions;
  }
  if (typeof one !== 'object' || one === null) {
    // Primitives can be directly compared
    return one !== two;
  }
  if (typeof two !== 'object' || two === null) {
    // We know they are different because the previous case would have triggered
    // otherwise.
    return true;
  }
  if (one.constructor !== two.constructor) {
    return true;
  }
  if (Array.isArray(one)) {
    // We know two is also an array because the constructors are equal
    const len = one.length;
    if (two.length !== len) {
      return true;
    }
    for (let ii = 0; ii < len; ii++) {
      if (deepDiffer(one[ii], two[ii], maxDepth - 1, options)) {
        return true;
      }
    }
  } else {
    for (const key in one) {
      if (deepDiffer(one[key], two[key], maxDepth - 1, options)) {
        return true;
      }
    }
    for (const twoKey in two) {
      // The only case we haven't checked yet is keys that are in two but aren't
      // in one, which means they are different.
      if (one[twoKey] === undefined && two[twoKey] !== undefined) {
        return true;
      }
    }
  }
  return false;
};

deepDiffer.unstable_setLogListeners = unstable_setLogListeners;
module.exports = deepDiffer;
