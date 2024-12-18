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

import TextAncestor from '../../Text/TextAncestor';
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
const View: component(
  ref: React.RefSetter<React.ElementRef<typeof ViewNativeComponent>>,
  ...props: ViewProps
) = React.forwardRef(
  (
    {
      accessibilityElementsHidden,
      accessibilityLabel,
      accessibilityLabelledBy,
      accessibilityLiveRegion,
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
      tabIndex,
      ...otherProps
    }: ViewProps,
    forwardedRef,
  ) => {
    const hasTextAncestor = React.useContext(TextAncestor);
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

    const actualView = (
      <ViewNativeComponent
        {...otherProps}
        accessibilityLiveRegion={
          ariaLive === 'off' ? 'none' : ariaLive ?? accessibilityLiveRegion
        }
        accessibilityLabel={ariaLabel ?? accessibilityLabel}
        focusable={tabIndex !== undefined ? !tabIndex : focusable}
        accessibilityState={_accessibilityState}
        accessibilityElementsHidden={ariaHidden ?? accessibilityElementsHidden}
        accessibilityLabelledBy={_accessibilityLabelledBy}
        accessibilityValue={_accessibilityValue}
        importantForAccessibility={
          ariaHidden === true
            ? 'no-hide-descendants'
            : importantForAccessibility
        }
        nativeID={id ?? nativeID}
        ref={forwardedRef}
      />
    );

    if (hasTextAncestor) {
      return (
        <TextAncestor.Provider value={false}>
          {actualView}
        </TextAncestor.Provider>
      );
    }

    return actualView;
  },
);

View.displayName = 'View';

module.exports = View;
