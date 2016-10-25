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
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');
var View = require('View');
var ViewStylePropTypes = require('ViewStylePropTypes');

var processColor = require('processColor');
var requireNativeComponent = require('requireNativeComponent');

var ReactPropTypes = React.PropTypes;

var REF_PICKER = 'picker';
var MODE_DROPDOWN = 'dropdown';

var pickerStyleType = StyleSheetPropType({
  ...ViewStylePropTypes,
  color: ColorPropType,
});

type Event = Object;

/**
 * Not exposed as a public API - use <Picker> instead.
 */
class PickerAndroid extends React.Component {
  props: {
    style?: $FlowFixMe,
    selectedValue?: any,
    enabled?: boolean,
    mode?: 'dialog' | 'dropdown',
    onValueChange?: Function,
    prompt?: string,
    testID?: string,
  };

  state: *;

  static propTypes = {
    ...View.propTypes,
    style: pickerStyleType,
    selectedValue: React.PropTypes.any,
    enabled: ReactPropTypes.bool,
    mode: ReactPropTypes.oneOf(['dialog', 'dropdown']),
    onValueChange: ReactPropTypes.func,
    prompt: ReactPropTypes.string,
    testID: ReactPropTypes.string,
  };

  constructor(props, context) {
    super(props, context);
    var state = this._stateFromProps(props);

    this.state = {
      ...state,
      initialSelectedIndex: state.selectedIndex,
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this._stateFromProps(nextProps));
  }

  // Translate prop and children into stuff that the native picker understands.
  _stateFromProps = (props) => {
    var selectedIndex = 0;
    const items = React.Children.map(props.children, (child, index) => {
      if (child.props.value === props.selectedValue) {
        selectedIndex = index;
      }
      const childProps = {
        value: child.props.value,
        label: child.props.label,
      };
      if (child.props.color) {
        childProps.color = processColor(child.props.color);
      }
      return childProps;
    });
    return {selectedIndex, items};
  };

  render() {
    var Picker = this.props.mode === MODE_DROPDOWN ? DropdownPicker : DialogPicker;

    var nativeProps = {
      enabled: this.props.enabled,
      items: this.state.items,
      mode: this.props.mode,
      onSelect: this._onChange,
      prompt: this.props.prompt,
      selected: this.state.initialSelectedIndex,
      testID: this.props.testID,
      style: [styles.pickerAndroid, this.props.style],
      accessibilityLabel: this.props.accessibilityLabel,
    };

    return <Picker ref={REF_PICKER} {...nativeProps} />;
  }

  _onChange = (event: Event) => {
    if (this.props.onValueChange) {
      var position = event.nativeEvent.position;
      if (position >= 0) {
        var value = this.props.children[position].props.value;
        this.props.onValueChange(value, position);
      } else {
        this.props.onValueChange(null, position);
      }
    }
    this._lastNativePosition = event.nativeEvent.position;
    this.forceUpdate();
  };

  componentDidMount() {
    this._lastNativePosition = this.state.initialSelectedIndex;
  }

  componentDidUpdate() {
    // The picker is a controlled component. This means we expect the
    // on*Change handlers to be in charge of updating our
    // `selectedValue` prop. That way they can also
    // disallow/undo/mutate the selection of certain values. In other
    // words, the embedder of this component should be the source of
    // truth, not the native component.
    if (this.refs[REF_PICKER] && this.state.selectedIndex !== this._lastNativePosition) {
      this.refs[REF_PICKER].setNativeProps({selected: this.state.selectedIndex});
      this._lastNativePosition = this.state.selectedIndex;
    }
  }
}

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
};

var DropdownPicker = requireNativeComponent('AndroidDropdownPicker', PickerAndroid, cfg);
var DialogPicker = requireNativeComponent('AndroidDialogPicker', PickerAndroid, cfg);

module.exports = PickerAndroid;
