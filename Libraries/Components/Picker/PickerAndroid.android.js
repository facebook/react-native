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

const AndroidDropdownPickerNativeComponent = require('AndroidDropdownPickerNativeComponent');
const AndroidDialogPickerNativeComponent = require('AndroidDialogPickerNativeComponent');
const React = require('React');
const StyleSheet = require('StyleSheet');

const processColor = require('processColor');

const REF_PICKER = 'picker';
const MODE_DROPDOWN = 'dropdown';

import type {SyntheticEvent} from 'CoreEventTypes';
import type {TextStyleProp} from 'StyleSheet';

type PickerAndroidChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    position: number,
  |}>,
>;

type PickerAndroidProps = $ReadOnly<{|
  children?: React.Node,
  style?: ?TextStyleProp,
  selectedValue?: ?(number | string),
  enabled?: ?boolean,
  mode?: ?('dialog' | 'dropdown'),
  onValueChange?: ?(itemValue: ?(string | number), itemIndex: number) => mixed,
  prompt?: ?string,
  testID?: string,
|}>;

type Item = $ReadOnly<{|
  label: string,
  value: ?(number | string),
  color?: ?number,
|}>;

type PickerAndroidState = {|
  selectedIndex: number,
  items: $ReadOnlyArray<Item>,
|};

/**
 * Not exposed as a public API - use <Picker> instead.
 */

class PickerAndroid extends React.Component<
  PickerAndroidProps,
  PickerAndroidState,
> {
  static getDerivedStateFromProps(
    props: PickerAndroidProps,
  ): PickerAndroidState {
    let selectedIndex = 0;
    const items = React.Children.map(props.children, (child, index) => {
      if (child.props.value === props.selectedValue) {
        selectedIndex = index;
      }
      const childProps = {
        value: child.props.value,
        label: child.props.label,
      };
      if (child.props.color) {
        /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
         * found when making Flow check .android.js files. */
        childProps.color = processColor(child.props.color);
      }
      return childProps;
    });
    return {selectedIndex, items};
  }

  state = PickerAndroid.getDerivedStateFromProps(this.props);

  render() {
    const Picker =
      this.props.mode === MODE_DROPDOWN
        ? AndroidDropdownPickerNativeComponent
        : AndroidDialogPickerNativeComponent;

    const nativeProps = {
      enabled: this.props.enabled,
      items: this.state.items,
      mode: this.props.mode,
      onSelect: this._onChange,
      prompt: this.props.prompt,
      selected: this.state.selectedIndex,
      testID: this.props.testID,
      style: [styles.pickerAndroid, this.props.style],
      /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
       * when making Flow check .android.js files. */
      accessibilityLabel: this.props.accessibilityLabel,
    };

    return <Picker ref={REF_PICKER} {...nativeProps} />;
  }

  _onChange = (event: PickerAndroidChangeEvent) => {
    if (this.props.onValueChange) {
      const position = event.nativeEvent.position;
      if (position >= 0) {
        const children = React.Children.toArray(this.props.children);
        const value = children[position].props.value;
        /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
         * found when making Flow check .android.js files. */
        this.props.onValueChange(value, position);
      } else {
        this.props.onValueChange(null, position);
      }
    }

    // The picker is a controlled component. This means we expect the
    // on*Change handlers to be in charge of updating our
    // `selectedValue` prop. That way they can also
    // disallow/undo/mutate the selection of certain values. In other
    // words, the embedder of this component should be the source of
    // truth, not the native component.
    if (
      this.refs[REF_PICKER] &&
      this.state.selectedIndex !== event.nativeEvent.position
    ) {
      this.refs[REF_PICKER].setNativeProps({
        selected: this.state.selectedIndex,
      });
    }
  };
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
