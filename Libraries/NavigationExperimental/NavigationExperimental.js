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
const NavigationHeader = require('NavigationHeader');
const NavigationPropTypes = require('NavigationPropTypes');
const NavigationReducer = require('NavigationReducer');
const NavigationStateUtils = require('NavigationStateUtils');
const NavigationTransitioner = require('NavigationTransitioner');

const NavigationExperimental = {
  // Core
  StateUtils: NavigationStateUtils,
  Reducer: NavigationReducer,

  // Views
  AnimatedView: NavigationAnimatedView,
  Transitioner: NavigationTransitioner,

  // CustomComponents:
  Card: NavigationCard,
  CardStack: NavigationCardStack,
  Header: NavigationHeader,

  PropTypes: NavigationPropTypes,
};

module.exports = NavigationExperimental;
