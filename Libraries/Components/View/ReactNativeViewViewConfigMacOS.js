/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

// TODO(macOS GH#774)

'use strict';

const ReactNativeViewViewConfigMacOS = {
  uiViewClassName: 'RCTView',
  directEventTypes: {
    topDoubleClick: {
      registrationName: 'onDoubleClick',
    },
    topDragEnter: {
      registrationName: 'onDragEnter',
    },
    topDragLeave: {
      registrationName: 'onDragLeave',
    },
    topDrop: {
      registrationName: 'onDrop',
    },
    topMouseEnter: {
      registrationName: 'onMouseEnter',
    },
    topMouseLeave: {
      registrationName: 'onMouseLeave',
    },
  },
  validAttributes: {
    acceptsFirstMouse: true,
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
    onKeyDown: true,
    onKeyUp: true,
    validKeysDown: true,
    validKeysUp: true,
    nextKeyViewTag: true,
    onMouseEnter: true,
    onMouseLeave: true,
    tooltip: true,
  },
};

module.exports = ReactNativeViewViewConfigMacOS;
