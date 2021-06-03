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

import * as React from 'react';
import PickerAndroid from './PickerAndroid';
import PickerIOS from './PickerIOS';
import Platform from '../../Utilities/Platform';
import UnimplementedView from '../UnimplementedViews/UnimplementedView';

import type {TextStyleProp, ColorValue} from '../../StyleSheet/StyleSheet';

import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
} from '../View/ViewAccessibility';

const MODE_DIALOG = 'dialog';
const MODE_DROPDOWN = 'dropdown';

type PickerItemProps = $ReadOnly<{|
  /**
   * Text to display for this item.
   */
  label: string,

  /**
   * The value to be passed to picker's `onValueChange` callback when
   * this item is selected.
   */
  value?: ?string,

  /**
   * Color of this item's text.
   * @platform android
   */
  color?: ColorValue,

  /**
   * Used to locate the item in end-to-end tests.
   */
  testID?: string,
|}>;

/**
 * Individual selectable item in a Picker.
 */
export type {PickerItem};
class PickerItem extends React.Component<PickerItemProps> {
  render() {
    // The items are not rendered directly
    throw null;
  }
}

type PickerProps = $ReadOnly<{|
  children?: React.Node,
  style?: ?TextStyleProp,

  /**
   * Value matching value of one of the items.
   */
  selectedValue?: ?string,

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
   * Color of the item background.
   * @platform android
   */
  backgroundColor?: ColorValue,

  /**
   * Prompt string for this picker, used on Android in dialog mode as the title of the dialog.
   * @platform android
   */
  prompt?: ?string,

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: ?string,
  /**
   * The string used for the accessibility label. Will be read once focused on the picker but not on change.
   */
  accessibilityLabel?: ?string,

  /**
   * When `true`, indicates that the view is an accessibility element.
   * By default, all the touchable elements are accessible.
   *
   * See https://reactnative.dev/docs/view.html#accessible
   */
  accessible?: ?boolean,

  /**
   * Provides an array of custom actions available for accessibility.
   *
   */
  accessibilityActions?: ?$ReadOnlyArray<AccessibilityActionInfo>,

  /**
   * When `accessible` is true, the system will try to invoke this function
   * when the user performs an accessibility custom action.
   *
   */
  onAccessibilityAction?: ?(event: AccessibilityActionEvent) => mixed,
|}>;

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
class Picker extends React.Component<PickerProps> {
  /**
   * On Android, display the options in a dialog.
   */
  static MODE_DIALOG: $TEMPORARY$string<'dialog'> = MODE_DIALOG;

  /**
   * On Android, display the options in a dropdown (this is the default).
   */
  static MODE_DROPDOWN: $TEMPORARY$string<'dropdown'> = MODE_DROPDOWN;

  static Item: typeof PickerItem = PickerItem;

  static defaultProps: {|mode: $TEMPORARY$string<'dialog'>|} = {
    mode: MODE_DIALOG,
  };

  render(): React.Node {
    if (Platform.OS === 'ios') {
      /* $FlowFixMe[prop-missing] (>=0.81.0 site=react_native_ios_fb) This
       * suppression was added when renaming suppression sites. */
      /* $FlowFixMe[incompatible-type] (>=0.81.0 site=react_native_ios_fb) This
       * suppression was added when renaming suppression sites. */
      return <PickerIOS {...this.props}>{this.props.children}</PickerIOS>;
    } else if (Platform.OS === 'android') {
      return (
        /* $FlowFixMe[incompatible-type] (>=0.81.0 site=react_native_android_fb) This
         * suppression was added when renaming suppression sites. */
        /* $FlowFixMe[prop-missing] (>=0.81.0 site=react_native_android_fb) This
         * suppression was added when renaming suppression sites. */
        <PickerAndroid {...this.props}>{this.props.children}</PickerAndroid>
      );
    } else {
      return <UnimplementedView />;
    }
  }
}

module.exports = Picker;
