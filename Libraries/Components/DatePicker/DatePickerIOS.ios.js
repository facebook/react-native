/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DatePickerIOS
 * @flow
 *
 * This is a controlled component version of RCTDatePickerIOS
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var RCTDatePickerIOSConsts = require('NativeModules').UIManager.RCTDatePicker.Constants;
var StyleSheet = require('StyleSheet');
var View = require('View');

var createReactIOSNativeComponentClass =
  require('createReactIOSNativeComponentClass');
var merge = require('merge');

var DATEPICKER = 'datepicker';

type DefaultProps = {
  mode: 'date' | 'time' | 'datetime';
};

type Event = Object;

/**
 * Use `DatePickerIOS` to render a date/time picker (selector) on iOS.  This is
 * a controlled component, so you must hook in to the `onDateChange` callback
 * and update the `date` prop in order for the component to update, otherwise
 * the user's change will be reverted immediately to reflect `props.date` as the
 * source of truth.
 */
var DatePickerIOS = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
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
    mode: PropTypes.oneOf(['date', 'time', 'datetime']),

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

  _onChange: function(event: Event) {
    var nativeTimeStamp = event.nativeEvent.timestamp;
    this.props.onDateChange && this.props.onDateChange(
      new Date(nativeTimeStamp)
    );
    this.props.onChange && this.props.onChange(event);

    // We expect the onChange* handlers to be in charge of updating our `date`
    // prop. That way they can also disallow/undo/mutate the selection of
    // certain values. In other words, the embedder of this component should
    // be the source of truth, not the native component.
    var propsTimeStamp = this.props.date.getTime();
    if (nativeTimeStamp !== propsTimeStamp) {
      this.refs[DATEPICKER].setNativeProps({
        date: propsTimeStamp,
      });
    }
  },

  render: function() {
    var props = this.props;
    return (
      <View style={props.style}>
        <RCTDatePickerIOS
          ref={DATEPICKER}
          style={styles.rkDatePickerIOS}
          date={props.date.getTime()}
          maximumDate={
            props.maximumDate ? props.maximumDate.getTime() : undefined
          }
          minimumDate={
            props.minimumDate ? props.minimumDate.getTime() : undefined
          }
          mode={RCTDatePickerIOSConsts.DatePickerModes[props.mode]}
          minuteInterval={props.minuteInterval}
          timeZoneOffsetInMinutes={props.timeZoneOffsetInMinutes}
          onChange={this._onChange}
        />
      </View>
    );
  }
});

var styles = StyleSheet.create({
  rkDatePickerIOS: {
    height: RCTDatePickerIOSConsts.ComponentHeight,
    width: RCTDatePickerIOSConsts.ComponentWidth,
  },
});

var rkDatePickerIOSAttributes = merge(ReactIOSViewAttributes.UIView, {
  date: true,
  maximumDate: true,
  minimumDate: true,
  mode: true,
  minuteInterval: true,
  timeZoneOffsetInMinutes: true,
});

var RCTDatePickerIOS = createReactIOSNativeComponentClass({
  validAttributes: rkDatePickerIOSAttributes,
  uiViewClassName: 'RCTDatePicker',
});

module.exports = DatePickerIOS;
