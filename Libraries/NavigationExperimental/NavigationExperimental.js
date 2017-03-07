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

const NavigationCard = require('NavigationCard');
const NavigationCardStack = require('NavigationCardStack');
const NavigationHeader = require('NavigationHeader');
const NavigationPropTypes = require('NavigationPropTypes');
const NavigationStateUtils = require('NavigationStateUtils');
const NavigationTransitioner = require('NavigationTransitioner');

const warning = require('fbjs/lib/warning');

// This warning will only be reached if the user has required the module
warning(
  false,
  'NavigationExperimental is deprecated and will be removed in a future ' +
  'version of React Native. The NavigationExperimental views live on in ' +
  'the React-Navigation project, which also makes it easy to declare ' +
  'navigation logic for your app. Learn more at https://reactnavigation.org/'
);


const NavigationExperimental = {
  // Core
  StateUtils: NavigationStateUtils,

  // Views
  Transitioner: NavigationTransitioner,

  // CustomComponents:
  Card: NavigationCard,
  CardStack: NavigationCardStack,
  Header: NavigationHeader,

  PropTypes: NavigationPropTypes,
};

module.exports = NavigationExperimental;
