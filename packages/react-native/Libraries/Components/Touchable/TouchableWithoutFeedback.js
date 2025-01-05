/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
} from '../../Components/View/ViewAccessibility';
import type {EdgeInsetsOrSizeProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {
  BlurEvent,
  FocusEvent,
  LayoutEvent,
  PressEvent,
} from '../../Types/CoreEventTypes';

import View from '../../Components/View/View';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import usePressability from '../../Pressability/usePressability';
import * as React from 'react';
import {useMemo} from 'react';

type Props = $ReadOnly<{|
  accessibilityActions?: ?$ReadOnlyArray<AccessibilityActionInfo>,
  accessibilityElementsHidden?: ?boolean,
  accessibilityHint?: ?Stringish,
  accessibilityLanguage?: ?Stringish,
  accessibilityIgnoresInvertColors?: ?boolean,
  accessibilityLabel?: ?Stringish,
  accessibilityLiveRegion?: ?('none' | 'polite' | 'assertive'),
  accessibilityRole?: ?AccessibilityRole,
  accessibilityState?: ?AccessibilityState,
  accessibilityValue?: ?AccessibilityValue,
  'aria-valuemax'?: AccessibilityValue['max'],
  'aria-valuemin'?: AccessibilityValue['min'],
  'aria-valuenow'?: AccessibilityValue['now'],
  'aria-valuetext'?: AccessibilityValue['text'],
  accessibilityViewIsModal?: ?boolean,
  'aria-modal'?: ?boolean,
  accessible?: ?boolean,
  /**
   * alias for accessibilityState
   *
   * see https://reactnative.dev/docs/accessibility#accessibilitystate
   */
  'aria-busy'?: ?boolean,
  'aria-checked'?: ?boolean | 'mixed',
  'aria-disabled'?: ?boolean,
  'aria-expanded'?: ?boolean,
  'aria-selected'?: ?boolean,
  'aria-hidden'?: ?boolean,
  'aria-live'?: ?('polite' | 'assertive' | 'off'),
  'aria-label'?: ?Stringish,
  children?: ?React.Node,
  delayLongPress?: ?number,
  delayPressIn?: ?number,
  delayPressOut?: ?number,
  disabled?: ?boolean,
  focusable?: ?boolean,
  hitSlop?: ?EdgeInsetsOrSizeProp,
  id?: string,
  importantForAccessibility?: ?('auto' | 'yes' | 'no' | 'no-hide-descendants'),
  nativeID?: ?string,
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => mixed,
  onBlur?: ?(event: BlurEvent) => mixed,
  onFocus?: ?(event: FocusEvent) => mixed,
  onLayout?: ?(event: LayoutEvent) => mixed,
  onLongPress?: ?(event: PressEvent) => mixed,
  onPress?: ?(event: PressEvent) => mixed,
  onPressIn?: ?(event: PressEvent) => mixed,
  onPressOut?: ?(event: PressEvent) => mixed,
  pressRetentionOffset?: ?EdgeInsetsOrSizeProp,
  rejectResponderTermination?: ?boolean,
  testID?: ?string,
  touchSoundDisabled?: ?boolean,
|}>;

const PASSTHROUGH_PROPS = [
  'accessibilityActions',
  'accessibilityElementsHidden',
  'accessibilityHint',
  'accessibilityLanguage',
  'accessibilityIgnoresInvertColors',
  'accessibilityLabel',
  'accessibilityLiveRegion',
  'accessibilityRole',
  'accessibilityValue',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
  'accessibilityViewIsModal',
  'aria-modal',
  'hitSlop',
  'importantForAccessibility',
  'nativeID',
  'onAccessibilityAction',
  'onBlur',
  'onFocus',
  'onLayout',
  'testID',
];

module.exports = function TouchableWithoutFeedback(props: Props): React.Node {
  const {
    disabled,
    rejectResponderTermination,
    'aria-disabled': ariaDisabled,
    accessibilityState,
    hitSlop,
    delayLongPress,
    delayPressIn,
    delayPressOut,
    pressRetentionOffset,
    touchSoundDisabled,
    onBlur: _onBlur,
    onFocus: _onFocus,
    onLongPress,
    onPress,
    onPressIn,
    onPressOut,
  } = props;

  const pressabilityConfig = useMemo(
    () => ({
      cancelable: !rejectResponderTermination,
      disabled:
        disabled !== null
          ? disabled
          : ariaDisabled ?? accessibilityState?.disabled,
      hitSlop: hitSlop,
      delayLongPress: delayLongPress,
      delayPressIn: delayPressIn,
      delayPressOut: delayPressOut,
      minPressDuration: 0,
      pressRectOffset: pressRetentionOffset,
      android_disableSound: touchSoundDisabled,
      onBlur: _onBlur,
      onFocus: _onFocus,
      onLongPress: onLongPress,
      onPress: onPress,
      onPressIn: onPressIn,
      onPressOut: onPressOut,
    }),
    [
      rejectResponderTermination,
      disabled,
      ariaDisabled,
      accessibilityState?.disabled,
      hitSlop,
      delayLongPress,
      delayPressIn,
      delayPressOut,
      pressRetentionOffset,
      touchSoundDisabled,
      _onBlur,
      _onFocus,
      onLongPress,
      onPress,
      onPressIn,
      onPressOut,
    ],
  );

  const eventHandlers = usePressability(pressabilityConfig);

  const element = React.Children.only<$FlowFixMe>(props.children);
  const children: Array<React.Node> = [element.props.children];
  const ariaLive = props['aria-live'];

  if (__DEV__) {
    if (element.type === View) {
      children.push(
        <PressabilityDebugView color="red" hitSlop={props.hitSlop} />,
      );
    }
  }

  let _accessibilityState = {
    busy: props['aria-busy'] ?? props.accessibilityState?.busy,
    checked: props['aria-checked'] ?? props.accessibilityState?.checked,
    disabled: props['aria-disabled'] ?? props.accessibilityState?.disabled,
    expanded: props['aria-expanded'] ?? props.accessibilityState?.expanded,
    selected: props['aria-selected'] ?? props.accessibilityState?.selected,
  };

  // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
  // adopting `Pressability`, so preserve that behavior.
  const {onBlur, onFocus, ...eventHandlersWithoutBlurAndFocus} = eventHandlers;

  const elementProps: {[string]: mixed, ...} = {
    ...eventHandlersWithoutBlurAndFocus,
    accessible: props.accessible !== false,
    accessibilityState:
      props.disabled != null
        ? {
            ..._accessibilityState,
            disabled: props.disabled,
          }
        : _accessibilityState,
    focusable:
      props.focusable !== false &&
      props.onPress !== undefined &&
      !props.disabled,

    accessibilityElementsHidden:
      props['aria-hidden'] ?? props.accessibilityElementsHidden,
    importantForAccessibility:
      props['aria-hidden'] === true
        ? 'no-hide-descendants'
        : props.importantForAccessibility,
    accessibilityLiveRegion:
      ariaLive === 'off' ? 'none' : ariaLive ?? props.accessibilityLiveRegion,
    nativeID: props.id ?? props.nativeID,
  };

  for (const prop of PASSTHROUGH_PROPS) {
    if (props[prop] !== undefined) {
      elementProps[prop] = props[prop];
    }
  }

  // $FlowFixMe[incompatible-call]
  return React.cloneElement(element, elementProps, ...children);
};
