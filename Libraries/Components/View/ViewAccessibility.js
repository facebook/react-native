/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ViewAccessibility
 * @flow
 */
'use strict';

export type AccessibilityTrait =
  'none' |
  'button' |
  'link' |
  'header' |
  'search' |
  'image' |
  'selected' |
  'plays' |
  'key' |
  'text' |
  'summary' |
  'disabled' |
  'frequentUpdates' |
  'startsMedia' |
  'adjustable' |
  'allowsDirectInteraction' |
  'pageTurn';

export type AccessibilityComponentType =
  'none' |
  'button' |
  'radiobutton_checked' |
  'radiobutton_unchecked';

module.exports = {
  AccessibilityTraits: [
    'none',
    'button',
    'link',
    'header',
    'search',
    'image',
    'selected',
    'plays',
    'key',
    'text',
    'summary',
    'disabled',
    'frequentUpdates',
    'startsMedia',
    'adjustable',
    'allowsDirectInteraction',
    'pageTurn',
  ],
  AccessibilityComponentTypes: [
    'none',
    'button',
    'radiobutton_checked',
    'radiobutton_unchecked',
  ],
};
