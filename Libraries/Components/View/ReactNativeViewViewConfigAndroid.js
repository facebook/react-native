/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const ReactNativeViewViewConfigAndroid = {
  uiViewClassName: 'RCTView',
  bubblingEventTypes: {
    topSelect: {
      phasedRegistrationNames: {
        bubbled: 'onSelect',
        captured: 'onSelectCapture',
      },
    },
  },
  directEventTypes: {
    topClick: {
      registrationName: 'onClick',
    },
    topContentSizeChange: {
      registrationName: 'onContentSizeChange',
    },
    topLoadingError: {
      registrationName: 'onLoadingError',
    },
    topLoadingFinish: {
      registrationName: 'onLoadingFinish',
    },
    topLoadingStart: {
      registrationName: 'onLoadingStart',
    },
    topMessage: {
      registrationName: 'onMessage',
    },
    topMomentumScrollBegin: {
      registrationName: 'onMomentumScrollBegin',
    },
    topMomentumScrollEnd: {
      registrationName: 'onMomentumScrollEnd',
    },
    topScroll: {
      registrationName: 'onScroll',
    },
    topScrollBeginDrag: {
      registrationName: 'onScrollBeginDrag',
    },
    topScrollEndDrag: {
      registrationName: 'onScrollEndDrag',
    },
    topSelectionChange: {
      registrationName: 'onSelectionChange',
    },
  },
  validAttributes: {
    hasTVPreferredFocus: true,
    focusable: true,
    nativeBackgroundAndroid: true,
    nativeForegroundAndroid: true,
    nextFocusDown: true,
    nextFocusForward: true,
    nextFocusLeft: true,
    nextFocusRight: true,
    nextFocusUp: true,
  },
};

module.exports = ReactNativeViewViewConfigAndroid;
