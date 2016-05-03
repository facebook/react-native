/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Picker
 * @flow
 */

'use strict';

var ColorPropType = require('ColorPropType');
var PickerIOS = require('PickerIOS');
var PickerAndroid = require('PickerAndroid');
var Platform = require('Platform');
var React = require('React');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');
var TextStylePropTypes = require('TextStylePropTypes');
var UnimplementedView = require('UnimplementedView');
var View = require('View');
var ViewStylePropTypes = require('ViewStylePropTypes');

var itemStylePropType = StyleSheetPropType(TextStylePropTypes);

var pickerStyleType = StyleSheetPropType({
  ...ViewStylePropTypes,
  color: ColorPropType,
});

var MODE_DIALOG = 'dialog';
var MODE_DROPDOWN = 'dropdown';

/**
 * Renders the native picker component on iOS and Android. Example:
 *
 *     <Picker
 *       selectedValue={this.state.language}
 *       onValueChange={(lang) => this.setState({language: lang})}>
 *       <Picker.Item label="Java" value="java" />
 *       <Picker.Item label="JavaScript" value="js" />
 *     </Picker>
 */
var Picker = React.createClass({

  statics: {
    /**
     * On Android, display the options in a dialog.
     */
    MODE_DIALOG: MODE_DIALOG,
    /**
     * On Android, display the options in a dropdown (this is the default).
     */
    MODE_DROPDOWN: MODE_DROPDOWN,
  },

  getDefaultProps: function() {
    return {
      mode: MODE_DIALOG,
    };
  },

  propTypes: {
    ...View.propTypes,
    style: pickerStyleType,
    /**
     * Value matching value of one of the items. Can be a string or an integer.
     */
    selectedValue: React.PropTypes.any,
    /**
     * Callback for when an item is selected. This is called with the following parameters:
     *   - `itemValue`: the `value` prop of the item that was selected
     *   - `itemPosition`: the index of the selected item in this picker
     */
    onValueChange: React.PropTypes.func,
    /**
     * If set to false, the picker will be disabled, i.e. the user will not be able to make a
     * selection.
     * @platform android
     */
    enabled: React.PropTypes.bool,
    /**
     * On Android, specifies how to display the selection items when the user taps on the picker:
     *
     *   - 'dialog': Show a modal dialog. This is the default.
     *   - 'dropdown': Shows a dropdown anchored to the picker view
     *
     * @platform android
     */
    mode: React.PropTypes.oneOf(['dialog', 'dropdown']),
    /**
     * Style to apply to each of the item labels.
     * @platform ios
     */
    itemStyle: itemStylePropType,
    /**
     * Prompt string for this picker, used on Android in dialog mode as the title of the dialog.
     * @platform android
     */
    prompt: React.PropTypes.string,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: React.PropTypes.string,
  },

  render: function() {
      if (Platform.OS === 'ios') {
        return <PickerIOS {...this.props}>{this.props.children}</PickerIOS>;
      } else if (Platform.OS === 'android') {
        return <PickerAndroid {...this.props}>{this.props.children}</PickerAndroid>;
      } else {
        return <UnimplementedView />;
      }
  },
});

/**
 * Individual selectable item in a Picker.
 */
Picker.Item = React.createClass({

  propTypes: {
    /**
     * Text to display for this item.
     */
    label: React.PropTypes.string.isRequired,
    /**
     * The value to be passed to picker's `onValueChange` callback when
     * this item is selected. Can be a string or an integer.
     */
    value: React.PropTypes.any,
    /**
     * Color of this item's text.
     * @platform android
     */
    color: ColorPropType,
    /**
     * Used to locate the item in end-to-end tests.
     */
    testID: React.PropTypes.string,
  },

  render: function() {
    // The items are not rendered directly
    throw null;
  },
});

module.exports = Picker;
