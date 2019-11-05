/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// This is a controlled component version of RCTDatePickerIOS.

'use strict';

import RCTDatePickerNativeComponent, {
  Commands as DatePickerCommands,
} from './RCTDatePickerNativeComponent';
const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const View = require('../View/View');

const invariant = require('invariant');

import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';

type Event = SyntheticEvent<
  $ReadOnly<{|
    timestamp: number,
  |}>,
>;

type Props = $ReadOnly<{|
  ...ViewProps,

  /**
   * The currently selected date.
   */
  date?: ?Date,

  /**
   * Provides an initial value that will change when the user starts selecting
   * a date. It is useful for simple use-cases where you do not want to deal
   * with listening to events and updating the date prop to keep the
   * controlled state in sync. The controlled state has known bugs which
   * causes it to go out of sync with native. The initialDate prop is intended
   * to allow you to have native be source of truth.
   */
  initialDate?: ?Date,

  /**
   * The date picker locale.
   */
  locale?: ?string,

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
   * The interval at which minutes can be selected.
   */
  minuteInterval?: ?(1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30),

  /**
   * The date picker mode.
   */
  mode?: ?('date' | 'time' | 'datetime'),

  /**
   * Date change handler.
   *
   * This is called when the user changes the date or time in the UI.
   * The first and only argument is an Event. For getting the date the picker
   * was changed to, use onDateChange instead.
   */
  onChange?: ?(event: Event) => void,

  /**
   * Date change handler.
   *
   * This is called when the user changes the date or time in the UI.
   * The first and only argument is a Date object representing the new
   * date and time.
   */
  onDateChange: (date: Date) => void,

  /**
   * Timezone offset in minutes.
   *
   * By default, the date picker will use the device's timezone. With this
   * parameter, it is possible to force a certain timezone offset. For
   * instance, to show times in Pacific Standard Time, pass -7 * 60.
   */
  timeZoneOffsetInMinutes?: ?number,
|}>;

/**
 * Use `DatePickerIOS` to render a date/time picker (selector) on iOS.  This is
 * a controlled component, so you must hook in to the `onDateChange` callback
 * and update the `date` prop in order for the component to update, otherwise
 * the user's change will be reverted immediately to reflect `props.date` as the
 * source of truth.
 */
class DatePickerIOS extends React.Component<Props> {
  static DefaultProps: {|mode: $TEMPORARY$string<'datetime'>|} = {
    mode: 'datetime',
  };

  _picker: ?React.ElementRef<typeof RCTDatePickerNativeComponent> = null;

  componentDidUpdate() {
    if (this.props.date) {
      const propsTimeStamp = this.props.date.getTime();
      if (this._picker) {
        DatePickerCommands.setNativeDate(this._picker, propsTimeStamp);
      }
    }
  }

  _onChange = (event: Event) => {
    const nativeTimeStamp = event.nativeEvent.timestamp;
    this.props.onDateChange &&
      this.props.onDateChange(new Date(nativeTimeStamp));
    this.props.onChange && this.props.onChange(event);
    this.forceUpdate();
  };

  render(): React.Node {
    const props = this.props;
    invariant(
      props.date || props.initialDate,
      'A selected date or initial date should be specified.',
    );
    return (
      <View style={props.style}>
        <RCTDatePickerNativeComponent
          testID={props.testID}
          ref={picker => {
            this._picker = picker;
          }}
          style={styles.datePickerIOS}
          date={
            props.date
              ? props.date.getTime()
              : props.initialDate
              ? props.initialDate.getTime()
              : undefined
          }
          locale={
            props.locale != null && props.locale !== ''
              ? props.locale
              : undefined
          }
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
}

const styles = StyleSheet.create({
  datePickerIOS: {
    height: 216,
  },
});

module.exports = DatePickerIOS;
