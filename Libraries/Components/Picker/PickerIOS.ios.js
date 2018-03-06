/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule PickerIOS
 *
 * This is a controlled component version of RCTPickerIOS
 */
'use strict';

const NativeMethodsMixin = require('NativeMethodsMixin');
const React = require('React');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const StyleSheetPropType = require('StyleSheetPropType');
const TextStylePropTypes = require('TextStylePropTypes');
const View = require('View');
const ViewPropTypes = require('ViewPropTypes');
const processColor = require('processColor');

const createReactClass = require('create-react-class');
const itemStylePropType = StyleSheetPropType(TextStylePropTypes);
const requireNativeComponent = require('requireNativeComponent');

const PickerIOS = createReactClass({
  displayName: 'PickerIOS',
  mixins: [NativeMethodsMixin],

  propTypes: {
    ...ViewPropTypes,
    itemStyle: itemStylePropType,
    onValueChange: PropTypes.func,
    selectedValue: PropTypes.any, // string or integer basically
  },

  getInitialState: function() {
    return this._stateFromProps(this.props);
  },

  UNSAFE_componentWillReceiveProps: function(nextProps) {
    this.setState(this._stateFromProps(nextProps));
  },

  // Translate PickerIOS prop and children into stuff that RCTPickerIOS understands.
  _stateFromProps: function(props) {
    let selectedIndex = 0;
    const items = [];
    React.Children.toArray(props.children).forEach(function (child, index) {
      if (child.props.value === props.selectedValue) {
        selectedIndex = index;
      }
      items.push({
        value: child.props.value,
        label: child.props.label,
        textColor: processColor(child.props.color),
      });
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
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
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

PickerIOS.Item = class extends React.Component {
  static propTypes = {
    value: PropTypes.any, // string or integer basically
    label: PropTypes.string,
    color: PropTypes.string,
  };

  render() {
    // These items don't get rendered directly.
    return null;
  }
};

const styles = StyleSheet.create({
  pickerIOS: {
    // The picker will conform to whatever width is given, but we do
    // have to set the component's height explicitly on the
    // surrounding view to ensure it gets rendered.
    height: 216,
  },
});

const RCTPickerIOS = requireNativeComponent('RCTPicker', {
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
