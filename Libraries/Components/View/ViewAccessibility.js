/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {SyntheticEvent} from '../../Types/CoreEventTypes';

// This must be kept in sync with the AccessibilityRolesMask in RCTViewManager.m
export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'togglebutton'
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
  | 'tabbar'
  | 'tablist'
  | 'timer'
  | 'list'
  | 'toolbar';

// the info associated with an accessibility action
export type AccessibilityActionInfo = $ReadOnly<{
  name: string,
  label?: string,
  ...
}>;

// The info included in the event sent to onAccessibilityAction
export type AccessibilityActionEvent = SyntheticEvent<
  $ReadOnly<{actionName: string, ...}>,
>;

export type AccessibilityState = {
  disabled?: boolean,
  selected?: boolean,
  checked?: ?boolean | 'mixed',
  busy?: boolean,
  expanded?: boolean,
  ...
};

export type AccessibilityValue = $ReadOnly<{|
  /**
   * The minimum value of this component's range. (should be an integer)
   */
  min?: number,

  /**
   * The maximum value of this component's range. (should be an integer)
   */
  max?: number,

  /**
   * The current value of this component's range. (should be an integer)
   */
  now?: number,

  /**
   * A textual description of this component's value. (will override minimum, current, and maximum if set)
   */
  text?: string,
|}>;
