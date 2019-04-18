/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

module.exports = {
  // This must be kept in sync with the AccessibilityRolesMask in RCTViewManager.m
  DeprecatedAccessibilityRoles: [
    'none',
    'button',
    'link',
    'search',
    'image',
    'keyboardkey',
    'text',
    'adjustable',
    'imagebutton',
    'header',
    'summary',
  ],
  // This must be kept in sync with the AccessibilityStatesMask in RCTViewManager.m
  DeprecatedAccessibilityStates: ['selected', 'disabled'],
};
