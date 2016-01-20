/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PickerAndroid
 * @flow
 */

'use strict';

var ColorPropType = require('ColorPropType');
var React = require('React');
var ReactChildren = require('ReactChildren');
var ReactPropTypes = require('ReactPropTypes');
var StyleSheetPropType = require('StyleSheetPropType');
var View = require('View');
var ViewStylePropTypes = require('ViewStylePropTypes');

var processColor = require('processColor');
var requireNativeComponent = require('requireNativeComponent');

var MODE_DIALOG = 'dialog';
var MODE_DROPDOWN = 'dropdown';
var REF_PICKER = 'picker';

var pickerStyleType = StyleSheetPropType({
  ...ViewStylePropTypes,
  color: ColorPropType,
});

type Items = {
  selected: number;
  items: any[];
};

type Event = Object;

/**
 * Individual selectable item in a Picker.
 */
var Item = React.createClass({

  propTypes: {
    /**
     * Color of this item's text.
     */
    color: ColorPropType,
    /**
     * Text to display for this item.
     */
    text: ReactPropTypes.string.isRequired,
    /**
     * The value to be passed to picker's `onSelect` callback when this item is selected.
     */
    value: ReactPropTypes.string,
    /**
     * If `true`, this item is selected and shown in the picker.
     * Usually this is set based on state.
     */
    selected: ReactPropTypes.bool,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: ReactPropTypes.string,
  },

  render: function() {
    throw new Error('Picker items should never be rendered');
  },

});

/**
 * <PickerAndroid> - A React component that renders the native Picker widget on Android. The items
 * that can be selected are specified as children views of type Item. Example usage:
 *
 *     <PickerAndroid>
 *       <PickerAndroid.Item text="Java" value="js" />
 *       <PickerAndroid.Item text="JavaScript" value="java" selected={true} />
 *     </PickerAndroid>
 */
var PickerAndroid = React.createClass({

  propTypes: {
    ...View.propTypes,
    style: pickerStyleType,
    /**
     * If set to false, the picker will be disabled, i.e. the user will not be able to make a
     * selection.
     */
    enabled: ReactPropTypes.bool,
    /**
     * Specifies how to display the selection items when the user taps on the picker:
     *
     * - dialog: Show a modal dialog
     * - dropdown: Shows a dropdown anchored to the picker view
     */
    mode: ReactPropTypes.oneOf([MODE_DIALOG, MODE_DROPDOWN]),
    /**
     * Callback for when an item is selected. This is called with the following parameters:
     *
     * - `itemValue`: the `value` prop of the item that was selected
     * - `itemPosition`: the index of the selected item in this picker
     */
    onSelect: ReactPropTypes.func,
    /**
     * Prompt string for this picker, currently only used in `dialog` mode as the title of the
     * dialog.
     */
    prompt: ReactPropTypes.string,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: ReactPropTypes.string,
  },

  statics: {
    Item: Item,
    MODE_DIALOG: MODE_DIALOG,
    MODE_DROPDOWN: MODE_DROPDOWN,
  },

  getDefaultProps: function() {
    return {
      mode: MODE_DIALOG,
    };
  },

  render: function() {
    var Picker = this.props.mode === MODE_DROPDOWN ? DropdownPicker : DialogPicker;

    var { selected, items } = this._getItems();

    var nativeProps = {
      enabled: this.props.enabled,
      items: items,
      mode: this.props.mode,
      onSelect: this._onSelect,
      prompt: this.props.prompt,
      selected: selected,
      style: this.props.style,
      testID: this.props.testID,
    };

    return <Picker ref={REF_PICKER} {...nativeProps} />;
  },

  /**
   * Transform this view's children into an array of items to be passed to the native component.
   * Since we're traversing the children, also determine the selected position.
   *
   * @returns an object with two keys:
   *
   * - `selected` (number) - the index of the selected item
   * - `items` (array) - the items of this picker, as an array of strings
   */
  _getItems: function(): Items {
    var items = [];
    var selected = 0;
    ReactChildren.forEach(this.props.children, function(child, index) {
      var childProps = Object.assign({}, child.props);
      if (childProps.color) {
        childProps.color = processColor(childProps.color);
      }
      items.push(childProps);
      if (childProps.selected) {
        selected = index;
      }
    });
    return {
      selected: selected,
      items: items,
    };
  },

  _onSelect: function(event: Event) {
    if (this.props.onSelect) {
      var position = event.nativeEvent.position;
      if (position >= 0) {
        var value = this.props.children[position].props.value;
        this.props.onSelect(value, position);
      } else {
        this.props.onSelect(null, position);
      }
    }

    // The native Picker has changed, but the props haven't (yet). If
    // the handler decides to not accept the new value or do something
    // else with it we might end up in a bad state, so we reset the
    // selection on the native component.
    // tl;dr: PickerAndroid is a controlled component.
    var { selected } = this._getItems();
    if (this.refs[REF_PICKER]) {
      this.refs[REF_PICKER].setNativeProps({selected: selected});
    }
  },

});

var cfg = {
  nativeOnly: {
    items: true,
    selected: true,
  }
}
var DropdownPicker = requireNativeComponent('AndroidDropdownPicker', PickerAndroid, cfg);
var DialogPicker = requireNativeComponent('AndroidDialogPicker', PickerAndroid, cfg);

module.exports = PickerAndroid;
