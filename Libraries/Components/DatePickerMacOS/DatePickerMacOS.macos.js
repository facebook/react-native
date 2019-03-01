/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This is a controlled component version of RCTDatePicker
 *
 */

// TODO(macOS ISS#2323203)

'use strict';

const NativeMethodsMixin = require('NativeMethodsMixin');
const React = require('React');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const View = require('View');
const ViewPropTypes = require('ViewPropTypes');

const createReactClass = require('create-react-class');
const requireNativeComponent = require('requireNativeComponent');

type DefaultProps = {
  mode: 'single' | 'range',
};

type Event = Object;

/**
 * Use `DatePickerMacOS` to render a date/time picker (selector) on macOS.  This is
 * a controlled component, so you must hook in to the `onDateChange` callback
 * and update the `date` prop in order for the component to update, otherwise
 * the user's change will be reverted immediately to reflect `props.date` as the
 * source of truth.
 */
// $FlowFixMe(>=0.41.0)
const DatePickerMacOS = createReactClass({
  // TOOD: Put a better type for _picker
  _picker: (undefined: ?$FlowFixMe),

  mixins: [NativeMethodsMixin],

  propTypes: {
    ...ViewPropTypes,
    /**
     * The currently selected date.
     */
    date: PropTypes.instanceOf(Date).isRequired,

    /**
     * Date change handler.
     *
     * This is called when the user changes the date or time in the UI.
     * The first and only argument is a Date object representing the new
     * date and time.
     */
    onDateChange: PropTypes.func.isRequired,

    /**
     * Maximum date.
     *
     * Restricts the range of possible date/time values.
     */
    maximumDate: PropTypes.instanceOf(Date),

    /**
     * Minimum date.
     *
     * Restricts the range of possible date/time values.
     */
    minimumDate: PropTypes.instanceOf(Date),

    /**
     * The date picker mode.
     */
    mode: PropTypes.oneOf(['single', 'range']),

    /**
     * The date picker style.
     */
    pickerStyle: PropTypes.oneOf(['textfield-stepper', 'clock-calendar', 'textfield']),

    /**
     * Timezone offset in minutes.
     *
     * By default, the date picker will use the device's timezone. With this
     * parameter, it is possible to force a certain timezone offset. For
     * instance, to show times in Pacific Standard Time, pass -7 * 60.
     */
    timeZoneOffsetInMinutes: PropTypes.number,

    /**
     *
     * [Styles](docs/style.html)
     */
    style: ViewPropTypes.style,
  },

  getDefaultProps: function(): DefaultProps {
    return {
      mode: 'range',
    };
  },

  _onChange: function(event: Event) {
    const nativeTimeStamp = event.nativeEvent.timestamp;
    this.props.onDateChange && this.props.onDateChange(
      new Date(nativeTimeStamp)
    );
    // $FlowFixMe(>=0.41.0)
    this.props.onChange && this.props.onChange(event);

    // We expect the onChange* handlers to be in charge of updating our `date`
    // prop. That way they can also disallow/undo/mutate the selection of
    // certain values. In other words, the embedder of this component should
    // be the source of truth, not the native component.
    const propsTimeStamp = this.props.date.getTime();
    if (this._picker && nativeTimeStamp !== propsTimeStamp) {
      this._picker.setNativeProps({
        date: propsTimeStamp,
      });
    }
  },

  render: function() {
    const props = this.props;
    return (
      <View style={props.style}>
        <RCTDatePickerMacOS
          ref={ picker => { this._picker = picker; } }
          style={props.style}
          date={props.date.getTime()}
          maximumDate={
            props.maximumDate ? props.maximumDate.getTime() : undefined
          }
          minimumDate={
            props.minimumDate ? props.minimumDate.getTime() : undefined
          }
          mode={props.mode}
          pickerStyle={props.pickerStyle}
          timeZoneOffsetInMinutes={props.timeZoneOffsetInMinutes}
          onChange={this._onChange}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        />
      </View>
    );
  }
});

const RCTDatePickerMacOS = requireNativeComponent('RCTDatePicker' /* TODO refactor as class that extends React.Component<Props>, {
  propTypes: {
    ...DatePickerMacOS.propTypes,
    date: PropTypes.number,
    minimumDate: PropTypes.number,
    maximumDate: PropTypes.number,
    onDateChange: () => null,
    onChange: PropTypes.func,
  }
}*/);

module.exports = DatePickerMacOS;
