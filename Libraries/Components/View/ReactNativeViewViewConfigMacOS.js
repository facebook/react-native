/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

// TODO(macOS ISS#2323203)

'use strict';

const ReactNativeViewViewConfigMacOS = {
  uiViewClassName: 'RCTView',
  directEventTypes: {
    topDoubleClick: {
      registrationName: 'topDoubleClick',
    },
    topDragEnter: {
      registrationName: 'topDragEnter',
    },
    topDragLeave: {
      registrationName: 'topDragLeave',
    },
    topDrop: {
      registrationName: 'topDrop',
    },
    topMouseEnter: {
      registrationName: 'topMouseEnter',
    },
    topMouseLeave: {
      registrationName: 'topMouseLeave',
    },
  },
  validAttributes: {
    acceptsKeyboardFocus: true,
    accessibilityTraits: true,
    draggedTypes: true,
    enableFocusRing: true,
    onBlur: true,
    onClick: true,
    onDoubleClick: true,
    onDragEnter: true,
    onDragLeave: true,
    onDrop: true,
    onFocus: true,
    onMouseEnter: true,
    onMouseLeave: true,
    tooltip: true,
  },
};

module.exports = ReactNativeViewViewConfigMacOS;
