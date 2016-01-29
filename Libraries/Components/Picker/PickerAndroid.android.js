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
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');
var View = require('View');
var ViewStylePropTypes = require('ViewStylePropTypes');

var processColor = require('processColor');
var requireNativeComponent = require('requireNativeComponent');

var REF_PICKER = 'picker';
var MODE_DIALOG = 'dialog';
var MODE_DROPDOWN = 'dropdown';

var pickerStyleType = StyleSheetPropType({
  ...ViewStylePropTypes,
  color: ColorPropType,
});

type Event = Object;

/**
 * Not exposed as a public API - use <Picker> instead.
 */
var PickerAndroid = React.createClass({

  propTypes: {
    ...View.propTypes,
    style: pickerStyleType,
    selectedValue: React.PropTypes.any,
    enabled: ReactPropTypes.bool,
    mode: ReactPropTypes.oneOf(['dialog', 'dropdown']),
    onValueChange: ReactPropTypes.func,
    prompt: ReactPropTypes.string,
    testID: ReactPropTypes.string,
  },

  getInitialState: function() {
    return this._stateFromProps(this.props);
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState(this._stateFromProps(nextProps));
  },

  // Translate prop and children into stuff that the native picker understands.
  _stateFromProps: function(props) {
    var selectedIndex = 0;
    let items = ReactChildren.map(props.children, (child, index) => {
      if (child.props.value === props.selectedValue) {
        selectedIndex = index;
      }
      let childProps = {
        value: child.props.value,
        label: child.props.label,
      };
      if (child.props.color) {
        childProps.color = processColor(child.props.color);
      }
      return childProps;
    });
    return {selectedIndex, items};
  },

  render: function() {
    var Picker = this.props.mode === MODE_DROPDOWN ? DropdownPicker : DialogPicker;

    var nativeProps = {
      enabled: this.props.enabled,
      items: this.state.items,
      mode: this.props.mode,
      onSelect: this._onChange,
      prompt: this.props.prompt,
      selected: this.state.selectedIndex,
      testID: this.props.testID,
      style: [styles.pickerAndroid, this.props.style],
    };

    return <Picker ref={REF_PICKER} {...nativeProps} />;
  },

  _onChange: function(event: Event) {
    if (this.props.onValueChange) {
      var position = event.nativeEvent.position;
      if (position >= 0) {
        var value = this.props.children[position].props.value;
        this.props.onValueChange(value);
      } else {
        this.props.onValueChange(null);
      }
    }

    // The picker is a controlled component. This means we expect the
    // on*Change handlers to be in charge of updating our
    // `selectedValue` prop. That way they can also
    // disallow/undo/mutate the selection of certain values. In other
    // words, the embedder of this component should be the source of
    // truth, not the native component.
    if (this.refs[REF_PICKER] && this.state.selectedIndex !== event.nativeEvent.position) {
      this.refs[REF_PICKER].setNativeProps({selected: this.state.selectedIndex});
    }
  },
});

var styles = StyleSheet.create({
  pickerAndroid: {
    // The picker will conform to whatever width is given, but we do
    // have to set the component's height explicitly on the
    // surrounding view to ensure it gets rendered.
    // TODO would be better to export a native constant for this,
    // like in iOS the RCTDatePickerManager.m
    height: 50,
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
