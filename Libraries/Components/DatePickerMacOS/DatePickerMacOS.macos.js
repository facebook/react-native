/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This is a controlled component version of RCTDatePicker
 *
 */

// TODO(macOS GH#774)

'use strict';

const React = require('react');
const View = require('../View/View');

const RCTDatePickerNativeComponentMacOS = require('./RCTDatePickerNativeComponentMacOS');

type Event = Object;

type Props = $ReadOnly<{|
  ...ViewProps,

  /**
   * The currently selected date.
   */
  date?: ?Date,

  /**
   * Maximum date.
   *
   * Restricts the range of possible date/time values.
   */
  maximumDate?: ?Date,

  /**
   * Minimum date.
   *
   * Restricts the range of possible date/time values.
   */
  minimumDate?: ?Date,

  /**
   * The date picker mode.
   */
  mode?: ?('single' | 'range'),

  /**
   * Date change handler.
   *
   * This is called when the user changes the date or time in the UI.
   * The first and only argument is a Date object representing the new
   * date and time.
   */
  onDateChange: (date: Date) => void,

  /**
   * The date picker style.
   */
  pickerStyle: ?(['textfield-stepper', 'clock-calendar', 'textfield']),

  /**
   * Timezone offset in minutes.
   *
   * By default, the date picker will use the device's timezone. With this
   * parameter, it is possible to force a certain timezone offset. For
   * instance, to show times in Pacific Standard Time, pass -7 * 60.
   */
  timeZoneOffsetInMinutes?: ?number,

  /**
   *
   * [Styles](docs/style.html)
   */
  style: ?style,
|}>;

/**
 * Use `DatePickerMacOS` to render a date/time picker (selector) on macOS.  This is
 * a controlled component, so you must hook in to the `onDateChange` callback
 * and update the `date` prop in order for the component to update, otherwise
 * the user's change will be reverted immediately to reflect `props.date` as the
 * source of truth.
 */
// $FlowFixMe(>=0.41.0)
class DatePickerMacOS extends React.Component<Props> {
    static DefaultProps = {
      mode: 'range',
  };

  _picker: ?React.ElementRef<typeof RCTDatePickerNativeComponentMacOS> = null;

  _onChange = (event: Event) => {
    const nativeTimeStamp = event.nativeEvent.timestamp;
    this.props.onDateChange &&
      this.props.onDateChange(new Date(nativeTimeStamp));
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
  }

  render() {
    const props = this.props;
    return (
      <View style={props.style}>
        <RCTDatePickerNativeComponentMacOS
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
}

module.exports = DatePickerMacOS;
