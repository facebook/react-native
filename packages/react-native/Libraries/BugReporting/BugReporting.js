/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import NativeRedBox from '../NativeModules/specs/NativeRedBox';
import {type EventSubscription} from '../vendor/emitter/EventEmitter';
import NativeBugReporting from './NativeBugReporting';

type ExtraData = {[key: string]: string, ...};
type SourceCallback = () => string;
type DebugData = {
  extras: ExtraData,
  files: ExtraData,
  ...
};

function defaultExtras() {
  BugReporting.addFileSource('react_hierarchy.txt', () =>
    require('./dumpReactTree').default(),
  );
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
  static _subscription: ?EventSubscription = null;
  static _redboxSubscription: ?EventSubscription = null;

  static _maybeInit() {
    if (!BugReporting._subscription) {
      BugReporting._subscription = RCTDeviceEventEmitter.addListener(
        'collectBugExtraData',
        // $FlowFixMe[method-unbinding]
        BugReporting.collectExtraData,
        null,
      );
      defaultExtras();
    }

    if (!BugReporting._redboxSubscription) {
      BugReporting._redboxSubscription = RCTDeviceEventEmitter.addListener(
        'collectRedBoxExtraData',
        // $FlowFixMe[method-unbinding]
        BugReporting.collectExtraData,
        null,
      );
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
  static addSource(
    key: string,
    callback: SourceCallback,
  ): {remove: () => void, ...} {
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
  static addFileSource(
    key: string,
    callback: SourceCallback,
  ): {remove: () => void, ...} {
    return this._addSource(key, callback, BugReporting._fileSources);
  }

  static _addSource(
    key: string,
    callback: SourceCallback,
    source: Map<string, SourceCallback>,
  ): {remove: () => void, ...} {
    BugReporting._maybeInit();
    if (source.has(key)) {
      console.warn(
        `BugReporting.add* called multiple times for same key '${key}'`,
      );
    }
    source.set(key, callback);
    return {
      remove: () => {
        source.delete(key);
      },
    };
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

    if (NativeBugReporting != null && NativeBugReporting.setExtraData != null) {
      NativeBugReporting.setExtraData(extraData, fileData);
    }

    if (NativeRedBox != null && NativeRedBox.setExtraData != null) {
      NativeRedBox.setExtraData(extraData, 'From BugReporting.js');
    }

    return {extras: extraData, files: fileData};
  }
}

export default BugReporting;
