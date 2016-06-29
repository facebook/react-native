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

const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
const Map = require('Map');
const infoLog = require('infoLog');

import type EmitterSubscription from 'EmitterSubscription';

type ExtraData = { [key: string]: string };
type SourceCallback = () => string;
type DebugData = { extras: ExtraData, files: ExtraData };

function defaultExtras() {
  BugReporting.addFileSource('react_hierarchy.txt', () => require('dumpReactTree')());
}

/**
 * A simple class for collecting bug report data. Components can add sources that will be queried when a bug report
 * is created via `collectExtraData`. For example, a list component might add a source that provides the list of rows
 * that are currently visible on screen. Components should also remember to call `remove()` on the object that is
 * returned by `addSource` when they are unmounted.
 */
class BugReporting {
  static _extraSources: Map<string, SourceCallback> = new Map();
  static _fileSources: Map<string, SourceCallback> = new Map();
  static _subscription: ?EmitterSubscription = null;

  static _maybeInit() {
    if (!BugReporting._subscription) {
      BugReporting._subscription = RCTDeviceEventEmitter
          .addListener('collectBugExtraData', BugReporting.collectExtraData, null);
      defaultExtras();
    }
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
    return this._addSource(key, callback, BugReporting._extraSources);
  }

  /**
   * Maps a string key to a simple callback that should return a string payload to be attached
   * to a bug report. Source callbacks are called when `collectExtraData` is called.
   *
   * Returns an object to remove the source when the component unmounts.
   *
   * Conflicts trample with a warning.
   */
  static addFileSource(key: string, callback: SourceCallback): {remove: () => void} {
    return this._addSource(key, callback, BugReporting._fileSources);
  }

  static _addSource(key: string, callback: SourceCallback, source: Map<string, SourceCallback>): {remove: () => void} {
    BugReporting._maybeInit();
    if (source.has(key)) {
      console.warn(`BugReporting.add* called multiple times for same key '${key}'`);
    }
    source.set(key, callback);
    return {remove: () => { source.delete(key); }};
  }

  /**
   * This can be called from a native bug reporting flow, or from JS code.
   *
   * If available, this will call `NativeModules.BugReporting.setExtraData(extraData)`
   * after collecting `extraData`.
   */
  static collectExtraData(): DebugData {
    const extraData: ExtraData = {};
    for (const [key, callback] of BugReporting._extraSources) {
      extraData[key] = callback();
    }
    const fileData: ExtraData = {};
    for (const [key, callback] of BugReporting._fileSources) {
      fileData[key] = callback();
    }
    infoLog('BugReporting extraData:', extraData);
    const BugReportingNativeModule = require('NativeModules').BugReporting;
    BugReportingNativeModule &&
      BugReportingNativeModule.setExtraData &&
      BugReportingNativeModule.setExtraData(extraData, fileData);

    return { extras: extraData, files: fileData };
  }
}

module.exports = BugReporting;
