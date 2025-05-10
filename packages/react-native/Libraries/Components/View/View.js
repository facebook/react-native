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
  ref?: React.RefSetter<React.ElementRef<typeof ViewNativeComponent>>,
  ...props: ViewProps
) = React.forwardRef(
  (
    {
      accessibilityElementsHidden,
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
      id,
      tabIndex,
      ...otherProps
    }: ViewProps,
    forwardedRef,
  ) => {
    const hasTextAncestor = React.useContext(TextAncestor);
    const processedProps = otherProps as {...ViewProps};

    const parsedAriaLabelledBy = ariaLabelledBy?.split(/\s*,\s*/g);
    if (parsedAriaLabelledBy != null) {
      processedProps.accessibilityLabelledBy = parsedAriaLabelledBy;
    }

    if (ariaLabel !== undefined) {
      processedProps.accessibilityLabel = ariaLabel;
    }

    if (ariaLive !== undefined) {
      processedProps.accessibilityLiveRegion =
        ariaLive === 'off' ? 'none' : ariaLive;
    }

    if (ariaHidden !== undefined) {
      processedProps.accessibilityElementsHidden = ariaHidden;
      if (ariaHidden === true) {
        processedProps.importantForAccessibility = 'no-hide-descendants';
      }
    }

    if (id !== undefined) {
      processedProps.nativeID = id;
    }

    if (tabIndex !== undefined) {
      processedProps.focusable = !tabIndex;
    }

    const _accessibilityState =
      accessibilityState != null ||
      ariaBusy != null ||
      ariaChecked != null ||
      ariaDisabled != null ||
      ariaExpanded != null ||
      ariaSelected != null
        ? {
            busy: ariaBusy ?? accessibilityState?.busy,
            checked: ariaChecked ?? accessibilityState?.checked,
            disabled: ariaDisabled ?? accessibilityState?.disabled,
            expanded: ariaExpanded ?? accessibilityState?.expanded,
            selected: ariaSelected ?? accessibilityState?.selected,
          }
        : undefined;
    if (_accessibilityState !== undefined) {
      processedProps.accessibilityState = _accessibilityState;
    }

    const _accessibilityValue =
      accessibilityValue != null ||
      ariaValueMax != null ||
      ariaValueMin != null ||
      ariaValueNow != null ||
      ariaValueText != null
        ? {
            max: ariaValueMax ?? accessibilityValue?.max,
            min: ariaValueMin ?? accessibilityValue?.min,
            now: ariaValueNow ?? accessibilityValue?.now,
            text: ariaValueText ?? accessibilityValue?.text,
          }
        : undefined;

    if (_accessibilityValue !== undefined) {
      processedProps.accessibilityValue = _accessibilityValue;
    }

    const actualView = (
      <ViewNativeComponent {...processedProps} ref={forwardedRef} />
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

export default View;
