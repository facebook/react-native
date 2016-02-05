/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationExperimental
 * @flow
 */
'use strict';

const NavigationAnimatedView = require('NavigationAnimatedView');
const NavigationCard = require('NavigationCard');
const NavigationContainer = require('NavigationContainer');
const NavigationHeader = require('NavigationHeader');
const NavigationRootContainer = require('NavigationRootContainer');
const NavigationReducer = require('NavigationReducer');
const NavigationState = require('NavigationState');
const NavigationView = require('NavigationView');

const NavigationExperimental = {
  // Core
  State: NavigationState,
  Reducer: NavigationReducer,

  // Containers
  Container: NavigationContainer,
  RootContainer: NavigationRootContainer,

  // Views
  View: NavigationView,
  AnimatedView: NavigationAnimatedView,

  // CustomComponents:
  Header: NavigationHeader,
  Card: NavigationCard,
};

module.exports = NavigationExperimental;
