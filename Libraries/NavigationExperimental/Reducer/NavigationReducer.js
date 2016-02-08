/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationReducer
 * @flow
 */
'use strict';

var NavigationFindReducer = require('NavigationFindReducer');
var NavigationStackReducer = require('NavigationStackReducer');
var NavigationTabsReducer = require('NavigationTabsReducer');

const NavigationReducer = {
  FindReducer: NavigationFindReducer,
  StackReducer: NavigationStackReducer,
  TabsReducer: NavigationTabsReducer,
};

module.exports = NavigationReducer;
