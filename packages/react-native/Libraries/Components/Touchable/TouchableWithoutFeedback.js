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
import Pressability, {
  type PressabilityConfig,
} from '../../Pressability/Pressability';
import {PressabilityDebugView} from '../../Pressability/PressabilityDebug';
import * as React from 'react';

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

type State = $ReadOnly<{|
  pressability: Pressability,
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

class TouchableWithoutFeedback extends React.Component<Props, State> {
  state: State = {
    pressability: new Pressability(createPressabilityConfig(this.props)),
  };

  render(): React.Node {
    const element = React.Children.only<$FlowFixMe>(this.props.children);
    const children: Array<React.Node> = [element.props.children];
    const ariaLive = this.props['aria-live'];

    if (__DEV__) {
      if (element.type === View) {
        children.push(
          <PressabilityDebugView color="red" hitSlop={this.props.hitSlop} />,
        );
      }
    }

    let _accessibilityState = {
      busy: this.props['aria-busy'] ?? this.props.accessibilityState?.busy,
      checked:
        this.props['aria-checked'] ?? this.props.accessibilityState?.checked,
      disabled:
        this.props['aria-disabled'] ?? this.props.accessibilityState?.disabled,
      expanded:
        this.props['aria-expanded'] ?? this.props.accessibilityState?.expanded,
      selected:
        this.props['aria-selected'] ?? this.props.accessibilityState?.selected,
    };

    // BACKWARD-COMPATIBILITY: Focus and blur events were never supported before
    // adopting `Pressability`, so preserve that behavior.
    const {onBlur, onFocus, ...eventHandlersWithoutBlurAndFocus} =
      this.state.pressability.getEventHandlers();

    const elementProps: {[string]: mixed, ...} = {
      ...eventHandlersWithoutBlurAndFocus,
      accessible: this.props.accessible !== false,
      accessibilityState:
        this.props.disabled != null
          ? {
              ..._accessibilityState,
              disabled: this.props.disabled,
            }
          : _accessibilityState,
      focusable:
        this.props.focusable !== false && this.props.onPress !== undefined,

      accessibilityElementsHidden:
        this.props['aria-hidden'] ?? this.props.accessibilityElementsHidden,
      importantForAccessibility:
        this.props['aria-hidden'] === true
          ? 'no-hide-descendants'
          : this.props.importantForAccessibility,
      accessibilityLiveRegion:
        ariaLive === 'off'
          ? 'none'
          : ariaLive ?? this.props.accessibilityLiveRegion,
      nativeID: this.props.id ?? this.props.nativeID,
    };
    for (const prop of PASSTHROUGH_PROPS) {
      if (this.props[prop] !== undefined) {
        elementProps[prop] = this.props[prop];
      }
    }

    // $FlowFixMe[incompatible-call]
    return React.cloneElement(element, elementProps, ...children);
  }

  componentDidUpdate(): void {
    this.state.pressability.configure(createPressabilityConfig(this.props));
  }

  componentDidMount(): mixed {
    this.state.pressability.configure(createPressabilityConfig(this.props));
  }

  componentWillUnmount(): void {
    this.state.pressability.reset();
  }
}

function createPressabilityConfig({
  'aria-disabled': ariaDisabled,
  ...props
}: Props): PressabilityConfig {
  const accessibilityStateDisabled =
    ariaDisabled ?? props.accessibilityState?.disabled;
  return {
    cancelable: !props.rejectResponderTermination,
    disabled:
      props.disabled !== null ? props.disabled : accessibilityStateDisabled,
    hitSlop: props.hitSlop,
    delayLongPress: props.delayLongPress,
    delayPressIn: props.delayPressIn,
    delayPressOut: props.delayPressOut,
    minPressDuration: 0,
    pressRectOffset: props.pressRetentionOffset,
    android_disableSound: props.touchSoundDisabled,
    onBlur: props.onBlur,
    onFocus: props.onFocus,
    onLongPress: props.onLongPress,
    onPress: props.onPress,
    onPressIn: props.onPressIn,
    onPressOut: props.onPressOut,
  };
}

TouchableWithoutFeedback.displayName = 'TouchableWithoutFeedback';

module.exports = TouchableWithoutFeedback;
