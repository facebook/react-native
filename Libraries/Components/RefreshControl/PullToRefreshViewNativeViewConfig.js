
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');
const ReactNativeViewViewConfig = require('ReactNativeViewViewConfig');
const verifyComponentAttributeEquivalence = require('verifyComponentAttributeEquivalence');

const PullToRefreshViewViewConfig = {
  uiViewClassName: 'PullToRefreshView',
  Commands: {},

  bubblingEventTypes: {
    ...ReactNativeViewViewConfig.bubblingEventTypes,

    topRefresh: {
      phasedRegistrationNames: {
        captured: 'onRefreshCapture',
        bubbled: 'onRefresh',
      },
    },
  },

  directEventTypes: {
    ...ReactNativeViewViewConfig.directEventTypes,
  },

  validAttributes: {
    ...ReactNativeViewViewConfig.validAttributes,
    tintColor: { process: require('processColor') },
    titleColor: { process: require('processColor') },
    title: true,
    refreshing: true,
    onRefresh: true,
  },
};

verifyComponentAttributeEquivalence('PullToRefreshView', PullToRefreshViewViewConfig);

ReactNativeViewConfigRegistry.register(
  'PullToRefreshView',
  () => PullToRefreshViewViewConfig,
);

module.exports = 'PullToRefreshView';
