/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule QuickActionsIOS
 * @flow
 */
'use strict';

var RCTQuickActionsManager = require('NativeModules').QuickActionsManager;

var invariant = require('invariant');

type Action = {
  type: String,
  title: String,
  subtitle?: String
  // icon: String // TODO
};

var QuickActionsIOS = {
  /**
   * Setups dynamic iOS Quick Actions (Triggered via 3d touch)
   *
   * You must pass a list of Actions that will be set on IOS Home Screen. Pass
   * an empty list if you want to unset the actions.
   *
   * Each action must have a title key and a type key used when opening the app.
   * An optional subtitle key can be added.
   */
  setQuickActionsWithActionList(actionList: Array<Action>) {
    invariant(
      actionList instanceof Array && actionList !== null,
      'The action list must be a valid array'
    );
    invariant(
      actionList.filter(action => action.type && action.title).length
        === actionList.length,
      'The action list must have each item with a type and a title key'
    );
    RCTQuickActionsManager.setQuickActionsWithActionList(actionList);
  }
};

module.exports = QuickActionsIOS;
