/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Platform = require('Platform');
const StyleSheet = require('StyleSheet');
const React = require('React');
const ReactNative = require('ReactNative');
const View = require('View');
const UnimplementedView = require('UnimplementedView');
const requireNativeComponent = require('requireNativeComponent');

const DropdownPicker = requireNativeComponent('AndroidDropdownPicker');
const DialogPicker = requireNativeComponent('AndroidDialogPicker');

import type {ViewStyleProp, TextStyleProp} from 'StyleSheet';
import type {ColorValue} from 'StyleSheetTypes';
import type {SyntheticEvent} from 'CoreEventTypes';

const processColor = require('processColor');

const MODE_DIALOG = 'dialog';
const MODE_DROPDOWN = 'dropdown';

type PickerItemProps = $ReadOnly<{|
  /**
   * Text to display for this item.
   */
  label: string,

  /**
   * The value to be passed to picker's `onValueChange` callback when
   * this item is selected. Can be a string or an integer.
   */
  value?: ?(number | string),

  /**
   * Color of this item's text.
   * @platform android
   */
  color?: ?(number | string),

  /**
   * Color of this item's text.
   * @platform ios
   */
  textColor?: ?number,

  /**
   * Used to locate the item in end-to-end tests.
   */
  testID?: string,
|}>;

/**
 * Individual selectable item in a Picker.
 */
class PickerItem extends React.Component<PickerItemProps> {
  render() {
    // The items are not rendered directly
    throw null;
  }
}

type PickerIOSChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    newValue: any,
    newIndex: number,
  |}>,
>;

type PickerProps = $ReadOnly<{|
  children?: React.Node,
  style?: ?ViewStyleProp,

  /**
   * Value matching value of one of the items. Can be a string or an integer.
   */
  selectedValue?: ?(number | string),

  /**
   * Callback for when an item is selected. This is called with the following parameters:
   *   - `itemValue`: the `value` prop of the item that was selected
   *   - `itemIndex`: the index of the selected item in this picker
   */
  onValueChange?: ?(itemValue: string | number, itemIndex: number) => mixed,

  /**
   * If set to false, the picker will be disabled, i.e. the user will not be able to make a
   * selection.
   * @platform android
   */
  enabled?: ?boolean,

  /**
   * On Android, specifies how to display the selection items when the user taps on the picker:
   *
   *   - 'dialog': Show a modal dialog. This is the default.
   *   - 'dropdown': Shows a dropdown anchored to the picker view
   *
   * @platform android
   */
  mode?: ?('dialog' | 'dropdown'),

  /**
   * Style to apply to each of the item labels.
   * @platform ios
   */
  itemStyle?: ?TextStyleProp,

  /**
   * Method to call on change
   * @platform ios
   */
  onChange?: ?(event: PickerIOSChangeEvent) => mixed,

  /**
   * Prompt string for this picker, used on Android in dialog mode as the title of the dialog.
   * @platform android
   */
  prompt?: ?string,

  /**
   * accessibility Label string for this picker, used on Android when accessibility setting is on.
   * @platform android
   */
  accessibilityLabel?: ?string,

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: ?string,
|}>;

type State = {|
  selectedIndex: number,
  items: $ReadOnlyArray<PickerItemProps>,
|};

type RCTPickerIOSType = Class<
  ReactNative.NativeComponent<
    $ReadOnly<{|
      items: $ReadOnlyArray<PickerItemProps>,
      onChange: (event: PickerIOSChangeEvent) => void,
      onResponderTerminationRequest: () => boolean,
      onStartShouldSetResponder: () => boolean,
      selectedIndex: number,
      style?: ?TextStyleProp,
      testID?: ?string,
    |}>,
  >,
>;

type PickerAndroidChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    position: number,
  |}>,
>;

const RCTPickerIOS: RCTPickerIOSType = (requireNativeComponent(
  'RCTPicker',
): any);

/**
 * Renders the native picker component on iOS and Android. Example:
 *
 *     <Picker
 *       selectedValue={this.state.language}
 *       onValueChange={(itemValue, itemIndex) => this.setState({language: itemValue})}>
 *       <Picker.Item label="Java" value="java" />
 *       <Picker.Item label="JavaScript" value="js" />
 *     </Picker>
 */
class Picker extends React.Component<PickerProps, State> {
  _picker: any = null;
  _lastNativePosition: number = 0;

  state = {
    selectedIndex: 0,
    items: [],
  };

  /**
   * On Android, display the options in a dialog.
   */
  static MODE_DIALOG = MODE_DIALOG;

  /**
   * On Android, display the options in a dropdown (this is the default).
   */
  static MODE_DROPDOWN = MODE_DROPDOWN;

  static Item = PickerItem;

  static defaultProps = {
    mode: MODE_DIALOG,
  };

  componentDidMount() {
    if (Platform.OS === 'ios') {
      return;
    }
    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    this._lastNativePosition = this.state.selectedIndex;
  }

  componentDidUpdate() {
    if (Platform.OS === 'ios') {
      return;
    }
    // The picker is a controlled component. This means we expect the
    // on*Change handlers to be in charge of updating our
    // `selectedValue` prop. That way they can also
    // disallow/undo/mutate the selection of certain values. In other
    // words, the embedder of this component should be the source of
    // truth, not the native component.
    if (
      this._picker &&
      /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
       * when making Flow check .android.js files. */
      this.state.selectedIndex !== this._lastNativePosition
    ) {
      this._picker.setNativeProps({
        selected: this.state.selectedIndex,
      });
      /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
       * when making Flow check .android.js files. */
      this._lastNativePosition = this.state.selectedIndex;
    }
  }

  static getDerivedStateFromProps(props: PickerProps): State {
    let selectedIndex = 0;
    const items = [];
    React.Children.toArray(props.children).forEach(function(child, index) {
      if (child.props.value === props.selectedValue) {
        selectedIndex = index;
      }
      items.push({
        value: child.props.value,
        label: child.props.label,
        textColor: processColor(child.props.color),
        color: processColor(child.props.color),
      });
    });
    return {selectedIndex, items};
  }

  _onChangeAndroid = (event: PickerAndroidChangeEvent) => {
    const position = event.nativeEvent.position;
    if (position >= 0) {
      const children = React.Children.toArray(this.props.children);
      const value = children[position].props.value;
      /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was
         * found when making Flow check .android.js files. */
      if (this.props.onValueChange) {
        this.props.onValueChange(value, position);
      }
    } else {
      if (this.props.onValueChange) {
        this.props.onValueChange(0, position);
      }
    }

    /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
     * when making Flow check .android.js files. */
    this._lastNativePosition = event.nativeEvent.position;
    this.forceUpdate();
  };

  _onChangeIOS = event => {
    if (this.props.onChange) {
      this.props.onChange(event);
    }
    if (this.props.onValueChange) {
      this.props.onValueChange(
        event.nativeEvent.newValue,
        event.nativeEvent.newIndex,
      );
    }

    // The picker is a controlled component. This means we expect the
    // on*Change handlers to be in charge of updating our
    // `selectedValue` prop. That way they can also
    // disallow/undo/mutate the selection of certain values. In other
    // words, the embedder of this component should be the source of
    // truth, not the native component.
    if (
      this._picker &&
      this.state.selectedIndex !== event.nativeEvent.newIndex
    ) {
      this._picker.setNativeProps({
        selectedIndex: this.state.selectedIndex,
      });
    }
  };

  render() {
    if (Platform.OS === 'ios') {
      /* $FlowFixMe(>=0.81.0 site=react_native_ios_fb) This suppression was
       * added when renaming suppression sites. */
      return (
        <View style={this.props.style}>
          <RCTPickerIOS
            ref={picker => {
              this._picker = picker;
            }}
            testID={this.props.testID}
            style={[styles.picker, this.props.itemStyle]}
            items={this.state.items}
            selectedIndex={this.state.selectedIndex}
            onChange={this._onChangeIOS}
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
          />
        </View>
      );
    } else if (Platform.OS === 'android') {
      const PickerComponentForAndroid =
        this.props.mode === MODE_DROPDOWN ? DropdownPicker : DialogPicker;

      const nativeProps = {
        enabled: this.props.enabled,
        items: this.state.items,
        mode: this.props.mode,
        onSelect: this._onChangeAndroid,
        prompt: this.props.prompt,
        selected: this.state.selectedIndex,
        testID: this.props.testID,
        style: [styles.picker, this.props.style],
        /* $FlowFixMe(>=0.78.0 site=react_native_android_fb) This issue was found
       * when making Flow check .android.js files. */
        accessibilityLabel: this.props.accessibilityLabel,
      };

      return (
        <PickerComponentForAndroid
          ref={picker => {
            this._picker = picker;
          }}
          {...nativeProps}
        />
      );
    } else {
      return <UnimplementedView />;
    }
  }
}

const styles = StyleSheet.create({
  picker: {
    // The picker will conform to whatever width is given, but we do
    // have to set the component's height explicitly on the
    // surrounding view to ensure it gets rendered.
    // TODO would be better to export a native constant for this,
    // like in iOS the RCTDatePickerManager.m
    ...Platform.select({
      ios: {
        height: 216,
      },
      android: {
        height: 50,
      },
    }),
  },
});

module.exports = Picker;
