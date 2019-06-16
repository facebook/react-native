
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const registerGeneratedViewConfig = require('../../Utilities/registerGeneratedViewConfig');

const PullToRefreshViewViewConfig = {
  uiViewClassName: 'PullToRefreshView',

  bubblingEventTypes: {
    topRefresh: {
      phasedRegistrationNames: {
        captured: 'onRefreshCapture',
        bubbled: 'onRefresh',
      },
    },
  },

  validAttributes: {
    tintColor: { process: require('../../StyleSheet/processColor') },
    titleColor: { process: require('../../StyleSheet/processColor') },
    title: true,
    refreshing: true,
    onRefresh: true,
  },
};

registerGeneratedViewConfig('PullToRefreshView', PullToRefreshViewViewConfig);

module.exports = 'PullToRefreshView';
