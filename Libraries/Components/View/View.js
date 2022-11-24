/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import type {ViewProps} from './ViewPropTypes';

import flattenStyle from '../../StyleSheet/flattenStyle';
import TextAncestor from '../../Text/TextAncestor';
import {getAccessibilityRoleFromRole} from '../../Utilities/AcessibilityMapping';
import ViewNativeComponent from './ViewNativeComponent';
import * as React from 'react';

export type Props = ViewProps;

/**
 * The most fundamental component for building a UI, View is a container that
 * supports layout with flexbox, style, some touch handling, and accessibility
 * controls.
 *
 * @see https://reactnative.dev/docs/view
 */
const View: React.AbstractComponent<
  ViewProps,
  React.ElementRef<typeof ViewNativeComponent>,
> = React.forwardRef(
  (
    {
      accessibilityElementsHidden,
      accessibilityLabel,
      accessibilityLabelledBy,
      accessibilityLiveRegion,
      accessibilityRole,
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
      focusable,
      id,
      importantForAccessibility,
      nativeID,
      pointerEvents,
      role,
      tabIndex,
      ...otherProps
    }: ViewProps,
    forwardedRef,
  ) => {
    const _accessibilityLabelledBy =
      ariaLabelledBy?.split(/\s*,\s*/g) ?? accessibilityLabelledBy;

    let _accessibilityState;
    if (
      accessibilityState != null ||
      ariaBusy != null ||
      ariaChecked != null ||
      ariaDisabled != null ||
      ariaExpanded != null ||
      ariaSelected != null
    ) {
      _accessibilityState = {
        busy: ariaBusy ?? accessibilityState?.busy,
        checked: ariaChecked ?? accessibilityState?.checked,
        disabled: ariaDisabled ?? accessibilityState?.disabled,
        expanded: ariaExpanded ?? accessibilityState?.expanded,
        selected: ariaSelected ?? accessibilityState?.selected,
      };
    }
    let _accessibilityValue;
    if (
      accessibilityValue != null ||
      ariaValueMax != null ||
      ariaValueMin != null ||
      ariaValueNow != null ||
      ariaValueText != null
    ) {
      _accessibilityValue = {
        max: ariaValueMax ?? accessibilityValue?.max,
        min: ariaValueMin ?? accessibilityValue?.min,
        now: ariaValueNow ?? accessibilityValue?.now,
        text: ariaValueText ?? accessibilityValue?.text,
      };
    }

    let style = flattenStyle(otherProps.style);

    const newPointerEvents = style?.pointerEvents || pointerEvents;
    const defaultProps = {
      ...otherProps,
      accessibilityLabel: ariaLabel ?? accessibilityLabel,
      focusable: tabIndex !== undefined ? !tabIndex : focusable,
      accessibilityState: _accessibilityState,
      accessibilityRole: role
        ? getAccessibilityRoleFromRole(role)
        : accessibilityRole,
      accessibilityElementsHidden: ariaHidden ?? accessibilityElementsHidden,
      accessibilityLabelledBy: _accessibilityLabelledBy,
      accessibilityValue: _accessibilityValue,
      importantForAccessibility:
        ariaHidden === true ? 'no-hide-descendants' : importantForAccessibility,
      nativeID: id ?? nativeID,
      style,
      pointerEvents: newPointerEvents,
      ref: forwardedRef,
    };

    // add accessibilityLiveRegion to focusable children on iOS
    // move this to separate PR if can not be done clean
    // requires additional Platform check for iOS
    // should also check if children is focusable and add only
    // liveRegion to first children
    // a simple loop that retrieves the first focusable children
    // for now just search for first Text component which is focusable as that is the
    // iOS exception not covered
    if (accessibilityLiveRegion != null && accessibilityLabel == null) {
      return (
        <TextAncestor.Provider value={false}>
          <ViewNativeComponent {...defaultProps}>
            {React.cloneElement(otherProps.children, {
              accessibilityLiveRegion,
            })}
          </ViewNativeComponent>
        </TextAncestor.Provider>
      );
    }

    return (
      <TextAncestor.Provider value={false}>
        <ViewNativeComponent {...defaultProps} />
      </TextAncestor.Provider>
    );
  },
);

View.displayName = 'View';

module.exports = View;
