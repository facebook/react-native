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
  },

  getInitialState: function() {
    return this._stateFromProps(this.props);
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState(this._stateFromProps(nextProps));
  },

  // Translate PickerIOS prop and children into stuff that RCTPickerIOS understands.
  _stateFromProps: function(props) {
    var children = React.Children.toArray(props.children);
    var selectedIndexes = new Array(children.length).fill(0);
    var components = [];

    children.forEach(function (componentChild, componentIndex) {
      React.Children
        .toArray(componentChild.props.children)
        .forEach(function (child, index) {
          if (!components[componentIndex]) {
            components[componentIndex] = [];
          }

          if (child.props.value === componentChild.props.selectedValue) {
            selectedIndexes[componentIndex] = index;
          }

          components[componentIndex].push({
            value: child.props.value,
            label: child.props.label
          });
        });
    });
    return {selectedIndexes, components};
  },

  render: function() {
    return (
      <View style={this.props.style}>
        <RCTPickerIOS
          ref={picker => this._picker = picker}
          style={[styles.pickerIOS, this.props.itemStyle]}
          components={this.state.components}
          onChange={this._onChange}
          selectedIndexes={this.state.selectedIndexes}
        />
      </View>
    );
  },

  _onChange: function(event) {
    if (this.props.onChange) {
      this.props.onChange(event);
    }
    if (this.props.onValueChange) {
      this.props.onValueChange(
        event.nativeEvent.component,
        event.nativeEvent.newValue,
        event.nativeEvent.newIndex
      );
    }

    // The picker is a controlled component. This means we expect the
    // on*Change handlers to be in charge of updating our
    // `selectedValue` prop. That way they can also
    // disallow/undo/mutate the selection of certain values. In other
    // words, the embedder of this component should be the source of
    // truth, not the native component.
    if (this._picker) {
      var component = event.nativeEvent.component;
      var newIndex = event.nativeEvent.newIndex;
      // object is frozen, we have to create mutable copy
      var selectedIndexes = this.state.selectedIndexes.slice();
      if (selectedIndexes[component] !== newIndex) {
        selectedIndexes[component] = newIndex;

        this._picker.setNativeProps({ selectedIndexes });
      }
    }
  },
});

PickerIOS.Item = class extends React.Component {
  static propTypes = {
    value: React.PropTypes.any, // string or integer basically
    label: React.PropTypes.string,
  };

  render() {
    // These items don't get rendered directly.
    return null;
  }
};

PickerIOS.Component = class extends React.Component {
  static propTypes = {
    selectedValue: React.PropTypes.any, // string or integer basically
  };

  render() {
    // These items don't get rendered directly.
    return null;
  }
};

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
    components: true,
    onChange: true,
    selectedIndexes: true,
  },
});

module.exports = PickerIOS;
