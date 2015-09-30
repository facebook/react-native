/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ApplicationShortcutsIOS
 * @flow
 */
'use strict';

var RCTApplicationShortcutsManager =
  require('NativeModules').ApplicationShortcutsManager;

var invariant = require('invariant');

type Shortcut = {
  type: string,
  title: string,
  subtitle?: string
  // icon: string // TODO
};

var _initialShortcutType = RCTApplicationShortcutsManager &&
  RCTApplicationShortcutsManager.initialShortcutType;

var ApplicationShortcutsIOS = {
  /**
   * Setups dynamic iOS Application Shortcuts (Triggered via 3d touch)
   *
   * You must pass a list of Actions that will be set on IOS Home Screen. Pass
   * an empty list if you want to unset the actions.
   *
   * Each action must have a title key and a type key used when opening the app.
   * An optional subtitle key can be added.
   */
  setApplicationShortcutsWithList(list: Array<Shortcut>) {
    invariant(
      list instanceof Array && list !== null,
      'The list must be a valid array'
    );
    invariant(
      list.filter(sh => sh.type && sh.title).length  === list.length,
      'The list must have each item with a type and a title key'
    );
    RCTApplicationShortcutsManager.setApplicationShortcutsWithList(list);
  },

  /**
   * If the app launch was triggered by a shortcut, it will pop the shortcut,
   * and return its type otherwise it will return `null`
   */
  popShortcutType(): ?string {
    var initialShortcutType= _initialShortcutType;
    _initialShortcutType = null;
    return initialShortcutType;
  }
};

module.exports = ApplicationShortcutsIOS;
