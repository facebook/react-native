/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const TRACE_TAG_REACT_APPS = 1 << 17; // eslint-disable-line no-bitwise

let _enabled = false;
let _asyncCookie = 0;

const Systrace = {
  setEnabled(enabled: boolean) {
    _enabled = enabled;
  },

  isEnabled(): boolean {
    return _enabled;
  },

  /**
   * beginEvent/endEvent for starting and then ending a profile within the same call stack frame
   **/
  beginEvent(
    profileName?: string | (() => string),
    args?: {[string]: string, ...},
  ) {
    if (_enabled) {
      const profileNameString =
        typeof profileName === 'function' ? profileName() : profileName;
      global.nativeTraceBeginSection(
        TRACE_TAG_REACT_APPS,
        profileNameString,
        args,
      );
    }
  },

  endEvent() {
    if (_enabled) {
      global.nativeTraceEndSection(TRACE_TAG_REACT_APPS);
    }
  },

  /**
   * beginAsyncEvent/endAsyncEvent for starting and then ending a profile where the end can either
   * occur on another thread or out of the current stack frame, eg await
   * the returned cookie variable should be used as input into the endAsyncEvent call to end the profile
   **/
  beginAsyncEvent(profileName?: string | (() => string)): number {
    const cookie = _asyncCookie;
    if (_enabled) {
      _asyncCookie++;
      const profileNameString =
        typeof profileName === 'function' ? profileName() : profileName;
      global.nativeTraceBeginAsyncSection(
        TRACE_TAG_REACT_APPS,
        profileNameString,
        cookie,
      );
    }
    return cookie;
  },

  endAsyncEvent(profileName?: string | (() => string), cookie?: number) {
    if (_enabled) {
      const profileNameString =
        typeof profileName === 'function' ? profileName() : profileName;
      global.nativeTraceEndAsyncSection(
        TRACE_TAG_REACT_APPS,
        profileNameString,
        cookie,
      );
    }
  },

  /**
   * counterEvent registers the value to the profileName on the systrace timeline
   **/
  counterEvent(profileName?: string | (() => string), value?: number) {
    if (_enabled) {
      const profileNameString =
        typeof profileName === 'function' ? profileName() : profileName;
      global.nativeTraceCounter &&
        global.nativeTraceCounter(
          TRACE_TAG_REACT_APPS,
          profileNameString,
          value,
        );
    }
  },
};

if (__DEV__) {
  // The metro require polyfill can not have dependencies (true for all polyfills).
  // Ensure that `Systrace` is available in polyfill by exposing it globally.
  global[(global.__METRO_GLOBAL_PREFIX__ || '') + '__SYSTRACE'] = Systrace;
}

if (global.__RCTProfileIsProfiling) {
  Systrace.setEnabled(true);
}

module.exports = Systrace;
