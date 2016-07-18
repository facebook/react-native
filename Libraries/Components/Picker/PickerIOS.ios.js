/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PickerIOS
 *
 * This is a controlled component version of RCTPickerIOS
 */
'use strict';

var NativeMethodsMixin = require('react/lib/NativeMethodsMixin');
var React = require('React');
var ReactChildren = require('react/lib/ReactChildren');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');
var TextStylePropTypes = require('TextStylePropTypes');
var View = require('View');

var itemStylePropType = StyleSheetPropType(TextStylePropTypes);
var requireNativeComponent = require('requireNativeComponent');

var PickerIOS = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    ...View.propTypes,
    itemStyle: itemStylePropType,
    onValueChange: React.PropTypes.func,
    selectedValue: React.PropTypes.any, // string or integer basically
  },

  getInitialState: function() {
    return this._stateFromProps(this.props);
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState(this._stateFromProps(nextProps));
  },

  // Translate PickerIOS prop and children into stuff that RCTPickerIOS understands.
  _stateFromProps: function(props) {
    var selectedIndex = 0;
    var items = [];
    ReactChildren.forEach(props.children, function (child, index) {
      if (child.props.value === props.selectedValue) {
        selectedIndex = index;
      }
      items.push({value: child.props.value, label: child.props.label});
    });
    return {selectedIndex, items};
  },

  render: function() {
    return (
      <View style={this.props.style}>
        <RCTPickerIOS
          ref={picker => this._picker = picker}
          style={[styles.pickerIOS, this.props.itemStyle]}
          items={this.state.items}
          selectedIndex={this.state.selectedIndex}
          onChange={this._onChange}
        />
      </View>
    );
  },

  _onChange: function(event) {
    if (this.props.onChange) {
      this.props.onChange(event);
    }
    if (this.props.onValueChange) {
      this.props.onValueChange(event.nativeEvent.newValue, event.nativeEvent.newIndex);
    }

    // The picker is a controlled component. This means we expect the
    // on*Change handlers to be in charge of updating our
    // `selectedValue` prop. That way they can also
    // disallow/undo/mutate the selection of certain values. In other
    // words, the embedder of this component should be the source of
    // truth, not the native component.
    if (this._picker && this.state.selectedIndex !== event.nativeEvent.newIndex) {
      this._picker.setNativeProps({
        selectedIndex: this.state.selectedIndex
      });
    }
  },
});

PickerIOS.Item = React.createClass({
  propTypes: {
    value: React.PropTypes.any, // string or integer basically
    label: React.PropTypes.string,
  },

  render: function() {
    // These items don't get rendered directly.
    return null;
  },
});

var styles = StyleSheet.create({
  pickerIOS: {
    // The picker will conform to whatever width is given, but we do
    // have to set the component's height explicitly on the
    // surrounding view to ensure it gets rendered.
    height: 216,
  },
});

var RCTPickerIOS = requireNativeComponent('RCTPicker', {
  propTypes: {
    style: itemStylePropType,
  },
}, {
  nativeOnly: {
    items: true,
    onChange: true,
    selectedIndex: true,
  },
});

module.exports = PickerIOS;
