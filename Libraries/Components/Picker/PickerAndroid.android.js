/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import AndroidDropdownPickerNativeComponent, {
  Commands as AndroidDropdownPickerCommands,
} from './AndroidDropdownPickerNativeComponent';
import AndroidDialogPickerNativeComponent, {
  Commands as AndroidDialogPickerCommands,
} from './AndroidDialogPickerNativeComponent';
import * as React from 'react';
import StyleSheet from '../../StyleSheet/StyleSheet';
import invariant from 'invariant';
import processColor from '../../StyleSheet/processColor';

import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
} from '../View/ViewAccessibility';

import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {ColorValue, TextStyleProp} from '../../StyleSheet/StyleSheet';

type PickerItemSelectSyntheticEvent = SyntheticEvent<
  $ReadOnly<{|
    position: number,
  |}>,
>;

type PickerItemValue = number | string;

type Props = $ReadOnly<{|
  accessible?: ?boolean,
  accessibilityActions?: ?$ReadOnlyArray<AccessibilityActionInfo>,
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => mixed,
  accessibilityLabel?: ?Stringish,
  children?: React.Node,
  style?: ?TextStyleProp,
  backgroundColor?: ?ColorValue,
  selectedValue?: ?PickerItemValue,
  enabled?: ?boolean,
  mode?: ?('dialog' | 'dropdown'),
  onValueChange?: ?(itemValue: ?PickerItemValue, itemIndex: number) => mixed,
  prompt?: ?string,
  testID?: string,
|}>;

/**
 * Not exposed as a public API - use <Picker> instead.
 */
function PickerAndroid(props: Props): React.Node {
  const pickerRef = React.useRef(null);

  const [items, selected] = React.useMemo(() => {
    // eslint-disable-next-line no-shadow
    let selected = 0;
    // eslint-disable-next-line no-shadow
    const items = React.Children.map(props.children, (child, index) => {
      if (child === null) {
        return null;
      }
      if (child.props.value === props.selectedValue) {
        selected = index;
      }
      const {color, label} = child.props;
      const processedColor = processColor(color);
      invariant(
        processedColor == null || typeof processedColor === 'number',
        'Unexpected color given for PickerAndroid color prop',
      );
      return {
        color: color == null ? null : processedColor,
        label,
      };
    });
    return [items, selected];
  }, [props.children, props.selectedValue]);

  const onSelect = React.useCallback(
    ({nativeEvent}: PickerItemSelectSyntheticEvent) => {
      const {position} = nativeEvent;
      const onValueChange = props.onValueChange;

      if (onValueChange != null) {
        if (position >= 0) {
          const children = React.Children.toArray(props.children).filter(
            item => item != null,
          );
          const value = children[position].props.value;
          if (props.selectedValue !== value) {
            onValueChange(value, position);
          }
        } else {
          onValueChange(null, position);
        }
      }
      const {current} = pickerRef;
      if (current != null && position !== selected) {
        const Commands =
          props.mode === 'dropdown'
            ? AndroidDropdownPickerCommands
            : AndroidDialogPickerCommands;
        Commands.setNativeSelectedPosition(current, position);
      }
    },
    [
      props.children,
      props.onValueChange,
      props.selectedValue,
      props.mode,
      selected,
    ],
  );

  const rootProps = {
    accessible: props.accessible,
    accessibilityActions: props.accessibilityActions,
    onAccessibilityAction: props.onAccessibilityAction,
    accessibilityLabel: props.accessibilityLabel,
    enabled: props.enabled,
    items,
    onSelect,
    prompt: props.prompt,
    ref: pickerRef,
    selected,
    style: StyleSheet.compose(styles.pickerAndroid, props.style),
    backgroundColor: props.backgroundColor,
    testID: props.testID,
  };
  return props.mode === 'dropdown' ? (
    <AndroidDropdownPickerNativeComponent {...rootProps} />
  ) : (
    <AndroidDialogPickerNativeComponent {...rootProps} />
  );
}

const styles = StyleSheet.create({
  pickerAndroid: {
    // The picker will conform to whatever width is given, but we do
    // have to set the component's height explicitly on the
    // surrounding view to ensure it gets rendered.
    // TODO would be better to export a native constant for this,
    // like in iOS the RCTDatePickerManager.m
    height: 50,
  },
});

module.exports = PickerAndroid;
