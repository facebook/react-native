/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AccessibilityProps} from './ViewAccessibility';

export function extractAccessibilityProps<
  T: $ReadOnly<{...AccessibilityProps, ...}>,
>(props: T): [AccessibilityProps, T] {
  const {
    accessibilityState,
    accessibilityValue,
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-hidden': ariaHidden,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-live': ariaLive,
    'aria-selected': ariaSelected,
    'aria-valuemax': ariaValueMax,
    'aria-valuemin': ariaValueMin,
    'aria-valuenow': ariaValueNow,
    'aria-valuetext': ariaValueText,
    ...otherProps
  } = props;

  const accessibilityProps: {...AccessibilityProps} = {};

  const parsedAriaLabelledBy = ariaLabelledBy?.split(/\s*,\s*/g);
  if (parsedAriaLabelledBy !== undefined) {
    accessibilityProps.accessibilityLabelledBy = parsedAriaLabelledBy;
  }

  if (ariaLabel !== undefined) {
    accessibilityProps.accessibilityLabel = ariaLabel;
  }

  if (ariaLive !== undefined) {
    accessibilityProps.accessibilityLiveRegion =
      ariaLive === 'off' ? 'none' : ariaLive;
  }

  if (ariaHidden !== undefined) {
    accessibilityProps.accessibilityElementsHidden = ariaHidden;
    if (ariaHidden === true) {
      accessibilityProps.importantForAccessibility = 'no-hide-descendants';
    }
  }

  if (
    accessibilityState != null ||
    ariaBusy != null ||
    ariaChecked != null ||
    ariaDisabled != null ||
    ariaExpanded != null ||
    ariaSelected != null
  ) {
    accessibilityProps.accessibilityState = {
      busy: ariaBusy ?? accessibilityState?.busy,
      checked: ariaChecked ?? accessibilityState?.checked,
      disabled: ariaDisabled ?? accessibilityState?.disabled,
      expanded: ariaExpanded ?? accessibilityState?.expanded,
      selected: ariaSelected ?? accessibilityState?.selected,
    };
  }

  if (
    accessibilityValue != null ||
    ariaValueMax != null ||
    ariaValueMin != null ||
    ariaValueNow != null ||
    ariaValueText != null
  ) {
    accessibilityProps.accessibilityValue = {
      max: ariaValueMax ?? accessibilityValue?.max,
      min: ariaValueMin ?? accessibilityValue?.min,
      now: ariaValueNow ?? accessibilityValue?.now,
      text: ariaValueText ?? accessibilityValue?.text,
    };
  }
  return [accessibilityProps, otherProps];
}
