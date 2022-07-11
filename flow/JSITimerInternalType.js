/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// Declarations for functionality exposed by Hermes' TimerStats decorator.
//
// For backwards-compatibility, code that uses such functionality must also
// check explicitly at run-time whether the object(s) and method(s) exist, and
// fail safely if not.

/**
 * JSITimerInternalType is the global object installed by Hermes' TimedRuntime
 * decorator, and it is used to extract runtime timing information.
 */
declare type $JSITimerInternalType = {
  /**
   * Returns the counters that TimedRuntime keep track.
   * There are no guarantees about what keys exist in it, but they can be
   * printed for informational purposes.
   * @return An object that maps strings to various types of performance
   *    statistics.
   */
  +getTimes?: () => {[string]: number | string, ...},
};
