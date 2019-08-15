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

<<<<<<< HEAD
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
  | 'pageTurn' // [TODO(macOS ISS#2323203)
  | 'group'
  | 'list'; // ]TODO(macOS ISS#2323203)

export type AccessibilityTraits =
  | AccessibilityTrait
  | $ReadOnlyArray<AccessibilityTrait>;

export type AccessibilityComponentType =
  | 'none'
  | 'button'
  | 'radiobutton_checked'
  | 'radiobutton_unchecked';
=======
import type {SyntheticEvent} from 'CoreEventTypes';
>>>>>>> v0.60.0

// [TODO(android ISS)
export type AccessibilityNodeInfoProp = {
  clickable: boolean,
}; // ]TODO(android ISS)

// This must be kept in sync with the AccessibilityRolesMask in RCTViewManager.m
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
  | 'summary'
  | 'alert'
  | 'checkbox'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'timer'
  | 'toolbar';
<<<<<<< HEAD

export type AccessibilityState =
  | 'selected'
  | 'disabled'
  | 'checked'
  | 'unchecked'
  | 'busy'
  | 'expanded'
  | 'collapsed';

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
    'group', // [TODO(macOS ISS#2323203)
    'list', // ]TODO(macOS ISS#2323203)
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
    'alert',
    'checkbox',
    'combobox',
    'menu',
    'menubar',
    'menuitem',
    'progressbar',
    'radio',
    'radiogroup',
    'scrollbar',
    'spinbutton',
    'switch',
    'tab',
    'tablist',
    'timer',
    'toolbar',
  ],
  AccessibilityStates: [
    'selected',
    'disabled',
    'checked',
    'unchecked',
    'busy',
    'expanded',
    'collapsed',
  ],
};
=======

// This must be kept in sync with the AccessibilityStatesMask in RCTViewManager.m
export type AccessibilityStates = $ReadOnlyArray<
  | 'disabled'
  | 'selected'
  | 'checked'
  | 'unchecked'
  | 'busy'
  | 'expanded'
  | 'collapsed'
  | 'hasPopup',
>;

// the info associated with an accessibility action
export type AccessibilityActionInfo = $ReadOnly<{
  name: string,
  label?: string,
}>;

// The info included in the event sent to onAccessibilityAction
export type AccessibilityActionEvent = SyntheticEvent<
  $ReadOnly<{
    actionName: string,
  }>,
>;
>>>>>>> v0.60.0
