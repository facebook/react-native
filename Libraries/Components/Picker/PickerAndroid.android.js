/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ColorPropType = require('ColorPropType');
const React = require('React');
const ReactPropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const StyleSheetPropType = require('StyleSheetPropType');
const ViewPropTypes = require('ViewPropTypes');
const ViewStylePropTypes = require('ViewStylePropTypes');

const processColor = require('processColor');
const requireNativeComponent = require('requireNativeComponent');

const REF_PICKER = 'picker';
const MODE_DROPDOWN = 'dropdown';

const pickerStyleType = StyleSheetPropType({
  ...ViewStylePropTypes,
  color: ColorPropType,
});

type Event = Object;

/**
 * Not exposed as a public API - use <Picker> instead.
 */
class PickerAndroid extends React.Component<
  {
    style?: $FlowFixMe,
    selectedValue?: any,
    enabled?: boolean,
    mode?: 'dialog' | 'dropdown',
    onValueChange?: Function,
    prompt?: string,
    testID?: string,
  },
  *,
> {
  static propTypes = {
    ...ViewPropTypes,
    style: pickerStyleType,
    selectedValue: ReactPropTypes.any,
    enabled: ReactPropTypes.bool,
    mode: ReactPropTypes.oneOf(['dialog', 'dropdown']),
    onValueChange: ReactPropTypes.func,
    prompt: ReactPropTypes.string,
    testID: ReactPropTypes.string,
  };

  constructor(props, context) {
    super(props, context);
    const state = this._stateFromProps(props);

    this.state = {
      ...state,
      initialSelectedIndex: state.selectedIndex,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState(this._stateFromProps(nextProps));
  }

  // Translate prop and children into stuff that the native picker understands.
  _stateFromProps = props => {
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
        childProps.color = processColor(child.props.color);
      }
      return childProps;
    });
    return {selectedIndex, items};
  };

  render() {
    const Picker =
      this.props.mode === MODE_DROPDOWN ? DropdownPicker : DialogPicker;

    const nativeProps = {
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
      const position = event.nativeEvent.position;
      if (position >= 0) {
        const children = React.Children.toArray(this.props.children);
        const value = children[position].props.value;
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
    if (
      this.refs[REF_PICKER] &&
      this.state.selectedIndex !== this._lastNativePosition
    ) {
      this.refs[REF_PICKER].setNativeProps({
        selected: this.state.selectedIndex,
      });
      this._lastNativePosition = this.state.selectedIndex;
    }
  }
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

const cfg = {
  nativeOnly: {
    items: true,
    selected: true,
  },
};

const DropdownPicker = requireNativeComponent(
  'AndroidDropdownPicker',
  PickerAndroid,
  cfg,
);
const DialogPicker = requireNativeComponent(
  'AndroidDialogPicker',
  PickerAndroid,
  cfg,
);

module.exports = PickerAndroid;
