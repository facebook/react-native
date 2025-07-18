/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from './ViewPropTypes';

import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import TextAncestorContext from '../../Text/TextAncestorContext';
import ViewNativeComponent from './ViewNativeComponent';
import * as React from 'react';
import {use} from 'react';

/**
 * The most fundamental component for building a UI, View is a container that
 * supports layout with flexbox, style, some touch handling, and accessibility
 * controls.
 *
 * @see https://reactnative.dev/docs/view
 */
component View(
  ref?: React.RefSetter<React.ElementRef<typeof ViewNativeComponent>>,
  ...props: ViewProps
) {
  const hasTextAncestor = use(TextAncestorContext);

  let actualView;
  if (ReactNativeFeatureFlags.reduceDefaultPropsInView()) {
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
      id,
      tabIndex,
      ...otherProps
    } = props;

    // Since we destructured props, we can now treat it as mutable
    const processedProps = otherProps as {...ViewProps};

    const parsedAriaLabelledBy = ariaLabelledBy?.split(/\s*,\s*/g);
    if (parsedAriaLabelledBy !== undefined) {
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

    if (
      accessibilityState != null ||
      ariaBusy != null ||
      ariaChecked != null ||
      ariaDisabled != null ||
      ariaExpanded != null ||
      ariaSelected != null
    ) {
      processedProps.accessibilityState = {
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
      processedProps.accessibilityValue = {
        max: ariaValueMax ?? accessibilityValue?.max,
        min: ariaValueMin ?? accessibilityValue?.min,
        now: ariaValueNow ?? accessibilityValue?.now,
        text: ariaValueText ?? accessibilityValue?.text,
      };
    }

    actualView =
      ref == null ? (
        <ViewNativeComponent {...processedProps} />
      ) : (
        <ViewNativeComponent {...processedProps} ref={ref} />
      );
  } else {
    const {
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
    } = props;
    const _accessibilityLabelledBy =
      ariaLabelledBy?.split(/\s*,\s*/g) ?? accessibilityLabelledBy;

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

    actualView = (
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
        ref={ref}
      />
    );
  }

  if (hasTextAncestor) {
    return (
      <TextAncestorContext value={false}>{actualView}</TextAncestorContext>
    );
  }
  return actualView;
}

View.displayName = 'View';

export default View;
