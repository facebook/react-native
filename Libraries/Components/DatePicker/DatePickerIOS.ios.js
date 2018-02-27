/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule DatePickerIOS
 * @flow
 *
 * This is a controlled component version of RCTDatePickerIOS
 */
'use strict';

const NativeMethodsMixin = require('NativeMethodsMixin');
const React = require('React');
const invariant = require('fbjs/lib/invariant');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const View = require('View');
const ViewPropTypes = require('ViewPropTypes');

const createReactClass = require('create-react-class');
const requireNativeComponent = require('requireNativeComponent');

type DefaultProps = {
  mode: 'date' | 'time' | 'datetime',
};

type Event = Object;

/**
 * Use `DatePickerIOS` to render a date/time picker (selector) on iOS.  This is
 * a controlled component, so you must hook in to the `onDateChange` callback
 * and update the `date` prop in order for the component to update, otherwise
 * the user's change will be reverted immediately to reflect `props.date` as the
 * source of truth.
 */
const DatePickerIOS = createReactClass({
  displayName: 'DatePickerIOS',
  // TOOD: Put a better type for _picker
  _picker: (undefined: ?$FlowFixMe),

  mixins: [NativeMethodsMixin],

  propTypes: {
    ...ViewPropTypes,
    /**
     * The currently selected date.
     */
    date: PropTypes.instanceOf(Date),

    /**
     * Provides an initial value that will change when the user starts selecting
     * a date. It is useful for simple use-cases where you do not want to deal
     * with listening to events and updating the date prop to keep the
     * controlled state in sync. The controlled state has known bugs which
     * causes it to go out of sync with native. The initialDate prop is intended
     * to allow you to have native be source of truth.
     */
    initialDate: PropTypes.instanceOf(Date),

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
    mode: PropTypes.oneOf(['date', 'time', 'datetime']),

    /**
     * The date picker locale.
     */
    locale: PropTypes.string,

    /**
     * The interval at which minutes can be selected.
     */
    minuteInterval: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30]),

    /**
     * Timezone offset in minutes.
     *
     * By default, the date picker will use the device's timezone. With this
     * parameter, it is possible to force a certain timezone offset. For
     * instance, to show times in Pacific Standard Time, pass -7 * 60.
     */
    timeZoneOffsetInMinutes: PropTypes.number,
  },

  getDefaultProps: function(): DefaultProps {
    return {
      mode: 'datetime',
    };
  },

  componentDidUpdate: function() {
    if (this.props.date) {
      const propsTimeStamp = this.props.date.getTime();
      if (this._picker) {
        this._picker.setNativeProps({
          date: propsTimeStamp,
        });
      }
    }
  },

  _onChange: function(event: Event) {
    const nativeTimeStamp = event.nativeEvent.timestamp;
    this.props.onDateChange && this.props.onDateChange(
      new Date(nativeTimeStamp)
    );
    // $FlowFixMe(>=0.41.0)
    this.props.onChange && this.props.onChange(event);
  },

  render: function() {
    const props = this.props;
    invariant(
      props.date || props.initialDate,
      'A selected date or initial date should be specified.',
    );
    return (
      <View style={props.style}>
        <RCTDatePickerIOS
          ref={ picker => { this._picker = picker; } }
          style={styles.datePickerIOS}
          date={props.date ? props.date.getTime() : props.initialDate ? props.initialDate.getTime() : undefined}
          locale={props.locale ? props.locale : undefined}
          maximumDate={
            props.maximumDate ? props.maximumDate.getTime() : undefined
          }
          minimumDate={
            props.minimumDate ? props.minimumDate.getTime() : undefined
          }
          mode={props.mode}
          minuteInterval={props.minuteInterval}
          timeZoneOffsetInMinutes={props.timeZoneOffsetInMinutes}
          onChange={this._onChange}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        />
      </View>
    );
  }
});

const styles = StyleSheet.create({
  datePickerIOS: {
    height: 216,
  },
});

const RCTDatePickerIOS = requireNativeComponent('RCTDatePicker', {
  propTypes: {
    ...DatePickerIOS.propTypes,
    date: PropTypes.number,
    locale: PropTypes.string,
    minimumDate: PropTypes.number,
    maximumDate: PropTypes.number,
    onDateChange: () => null,
    onChange: PropTypes.func,
  }
});

module.exports = DatePickerIOS;
