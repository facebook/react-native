/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BugReporting
 * @flow
 */
'use strict';

const BatchedBridge = require('BatchedBridge');
const BugReportingNativeModule = require('NativeModules').BugReporting;

type ExtraData = { [key: string]: string };
type SourceCallback = () => string;

/**
 * A simple class for collecting bug report data. Components can add sources that will be queried when a bug report
 * is created via `collectExtraData`. For example, a list component might add a source that provides the list of rows
 * that are currently visible on screen. Components should also remember to call `remove()` on the object that is
 * returned by `addSource` when they are unmounted.
 */
class BugReporting {

  static _sources: Map<string, SourceCallback> = new Map();

  /**
   * `init` is called in `AppRegistry.runApplication`, so you shouldn't have to worry about it.
   */
  static init() {
    BatchedBridge.registerCallableModule( // idempotent
      'BugReporting',
      BugReporting,
    );
  }

  /**
   * Maps a string key to a simple callback that should return a string payload to be attached
   * to a bug report. Source callbacks are called when `collectExtraData` is called.
   *
   * Returns an object to remove the source when the component unmounts.
   *
   * Conflicts trample with a warning.
   */
  static addSource(key: string, callback: SourceCallback): {remove: () => void} {
    if (BugReporting._sources.has(key)) {
      console.warn(`BugReporting.addSource called multiple times for same key '${key}'`);
    }
    BugReporting._sources.set(key, callback);
    return {remove: () => { BugReporting._sources.delete(key); }};
  }

  /**
   * This can be called from a native bug reporting flow, or from JS code.
   *
   * If available, this will call `NativeModules.BugReporting.setExtraData(extraData)`
   * after collecting `extraData`.
   */
  static collectExtraData(): ExtraData {
    const extraData: ExtraData = {};
    for (const [key, callback] of BugReporting._sources) {
      extraData[key] = callback();
    }
    console.log('BugReporting extraData:', extraData);
    BugReportingNativeModule &&
      BugReportingNativeModule.setExtraData &&
      BugReportingNativeModule.setExtraData(extraData);
    return extraData;
  }
}

module.exports = BugReporting;
