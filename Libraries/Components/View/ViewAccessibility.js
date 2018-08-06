/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

export type AccessibilityTrait =
  | 'none'
  | 'button'
  | 'link'
  | 'header'
  | 'search'
  | 'image'
  | 'selected'
  | 'plays'
  | 'key'
  | 'text'
  | 'summary'
  | 'disabled'
  | 'frequentUpdates'
  | 'startsMedia'
  | 'adjustable'
  | 'allowsDirectInteraction'
  | 'pageTurn';

export type AccessibilityTraits =
  | AccessibilityTrait
  | $ReadOnlyArray<AccessibilityTrait>;

export type AccessibilityComponentType =
  | 'none'
  | 'button'
  | 'radiobutton_checked'
  | 'radiobutton_unchecked';

export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'link'
  | 'search'
  | 'image'
  | 'keyboardkey'
  | 'text'
  | 'adjustable'
  | 'imagebutton'
  | 'header'
  | 'summary';

export type AccessibilityState = 'selected' | 'disabled';

export type AccessibilityStates =
  | AccessibilityState
  | $ReadOnlyArray<AccessibilityState>;

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
  AccessibilityRoles: [
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
  AccessibilityStates: ['selected', 'disabled'],
};
