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

const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');

const RCTSegmentedControlNativeComponent = require('./RCTSegmentedControlNativeComponent');

import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';

type Event = SyntheticEvent<
  $ReadOnly<{|
    value: number,
    selectedSegmentIndex: number,
  |}>,
>;

type SegmentedControlIOSProps = $ReadOnly<{|
  ...ViewProps,
  /**
   * The labels for the control's segment buttons, in order.
   */
  values?: $ReadOnlyArray<string>,
  /**
   * The index in `props.values` of the segment to be (pre)selected.
   */
  selectedIndex?: ?number,
  /**
   * Callback that is called when the user taps a segment;
   * passes the segment's value as an argument
   */
  onValueChange?: ?(value: number) => mixed,
  /**
   * Callback that is called when the user taps a segment;
   * passes the event as an argument
   */
  onChange?: ?(event: Event) => mixed,
  /**
   * If false the user won't be able to interact with the control.
   * Default value is true.
   */
  enabled?: boolean,
  /**
   * Accent color of the control.
   */
  tintColor?: ?string,
  /**
   * If true, then selecting a segment won't persist visually.
   * The `onValueChange` callback will still work as expected.
   */
  momentary?: ?boolean,
|}>;

type Props = $ReadOnly<{|
  ...SegmentedControlIOSProps,
  forwardedRef: ?React.Ref<typeof RCTSegmentedControlNativeComponent>,
|}>;

/**
 * Use `SegmentedControlIOS` to render a UISegmentedControl iOS.
 *
 * #### Programmatically changing selected index
 *
 * The selected index can be changed on the fly by assigning the
 * selectedIndex prop to a state variable, then changing that variable.
 * Note that the state variable would need to be updated as the user
 * selects a value and changes the index, as shown in the example below.
 *
 * ````
 * <SegmentedControlIOS
 *   values={['One', 'Two']}
 *   selectedIndex={this.state.selectedIndex}
 *   onChange={(event) => {
 *     this.setState({selectedIndex: event.nativeEvent.selectedSegmentIndex});
 *   }}
 * />
 * ````
 */

class SegmentedControlIOS extends React.Component<Props> {
  static defaultProps = {
    values: [],
    enabled: true,
  };

  _onChange = (event: Event) => {
    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange &&
      this.props.onValueChange(event.nativeEvent.value);
  };

  render() {
    const {forwardedRef, ...props} = this.props;
    return (
      <RCTSegmentedControlNativeComponent
        {...props}
        ref={forwardedRef}
        style={[styles.segmentedControl, this.props.style]}
        onChange={this._onChange}
      />
    );
  }
}

const styles = StyleSheet.create({
  segmentedControl: {
    height: 28,
  },
});

const SegmentedControlIOSWithRef = React.forwardRef(
  (
    props: SegmentedControlIOSProps,
    forwardedRef: ?React.Ref<typeof RCTSegmentedControlNativeComponent>,
  ) => {
    return <SegmentedControlIOS {...props} forwardedRef={forwardedRef} />;
  },
);

/* $FlowFixMe(>=0.89.0 site=react_native_ios_fb) This comment suppresses an
 * error found when Flow v0.89 was deployed. To see the error, delete this
 * comment and run Flow. */
module.exports = (SegmentedControlIOSWithRef: NativeSegmentedControlIOS);
