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
const NavigationCardStack = require('NavigationCardStack');
const NavigationContainer = require('NavigationContainer');
const NavigationHeader = require('NavigationHeader');
const NavigationLegacyNavigator = require('NavigationLegacyNavigator');
const NavigationReducer = require('NavigationReducer');
const NavigationRootContainer = require('NavigationRootContainer');
const NavigationStateUtils = require('NavigationStateUtils');
const NavigationView = require('NavigationView');

const NavigationExperimental = {
  // Core
  StateUtils: NavigationStateUtils,
  Reducer: NavigationReducer,

  // Containers
  Container: NavigationContainer,
  RootContainer: NavigationRootContainer,

  // Views
  View: NavigationView,
  AnimatedView: NavigationAnimatedView,

  // CustomComponents:
  Card: NavigationCard,
  CardStack: NavigationCardStack,
  Header: NavigationHeader,
  LegacyNavigator: NavigationLegacyNavigator,
};

module.exports = NavigationExperimental;
