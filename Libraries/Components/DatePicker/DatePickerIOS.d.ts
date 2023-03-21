/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Constructor} from '../../../types/private/Utilities';
import {NativeMethods} from '../../../types/public/ReactNativeTypes';
import {ViewProps} from '../View/ViewPropTypes';

export interface DatePickerIOSProps extends ViewProps {
  /**
   * The currently selected date.
   */
  date?: Date | null | undefined;

  /**
   * Provides an initial value that will change when the user starts selecting
   * a date. It is useful for simple use-cases where you do not want to deal
   * with listening to events and updating the date prop to keep the
   * controlled state in sync. The controlled state has known bugs which
   * causes it to go out of sync with native. The initialDate prop is intended
   * to allow you to have native be source of truth.
   */
  initialDate?: Date | null | undefined;

  /**
   * The date picker locale.
   */
  locale?: string | undefined;

  /**
   * Maximum date.
   * Restricts the range of possible date/time values.
   */
  maximumDate?: Date | undefined;

  /**
   * Maximum date.
   * Restricts the range of possible date/time values.
   */
  minimumDate?: Date | undefined;

  /**
   *  enum(1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30)
   *  The interval at which minutes can be selected.
   */
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30 | undefined;

  /**
   *  enum('date', 'time', 'datetime')
   *  The date picker mode.
   */
  mode?: 'date' | 'time' | 'datetime' | undefined;

  /**
   * Date change handler.
   * This is called when the user changes the date or time in the UI.
   * The first and only argument is a Date object representing the new date and time.
   */
  onDateChange: (newDate: Date) => void;

  /**
   * Timezone offset in minutes.
   * By default, the date picker will use the device's timezone. With this parameter, it is possible to force a certain timezone offset.
   * For instance, to show times in Pacific Standard Time, pass -7 * 60.
   */
  timeZoneOffsetInMinutes?: number | undefined;

  /**
   * The date picker style
   * This is only available on devices with iOS 14.0 and later.
   * 'spinner' is the default style if this prop isn't set.
   */
  pickerStyle?: 'compact' | 'spinner' | 'inline' | undefined;
}

declare class DatePickerIOSComponent extends React.Component<DatePickerIOSProps> {}
declare const DatePickerIOSBase: Constructor<NativeMethods> &
  typeof DatePickerIOSComponent;

/**
 * DatePickerIOS has been merged with DatePickerAndroid and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/datetimepicker` instead of 'react-native'.
 * @see https://github.com/react-native-community/datetimepicker
 * @deprecated
 */
export class DatePickerIOS extends DatePickerIOSBase {}
