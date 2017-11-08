---
id: datepickerios
title: DatePickerIOS
layout: docs
category: components
permalink: docs/datepickerios.html
next: drawerlayoutandroid
previous: checkbox
---
Use `DatePickerIOS` to render a date/time picker (selector) on iOS.  This is
a controlled component, so you must hook in to the `onDateChange` callback
and update the `date` prop in order for the component to update, otherwise
the user's change will be reverted immediately to reflect `props.date` as the
source of truth.

### Props

* [ViewPropTypes props...](docs/viewproptypes.html#props)
- [`date`](docs/datepickerios.html#date)
- [`onDateChange`](docs/datepickerios.html#ondatechange)
- [`maximumDate`](docs/datepickerios.html#maximumdate)
- [`minimumDate`](docs/datepickerios.html#minimumdate)
- [`minuteInterval`](docs/datepickerios.html#minuteinterval)
- [`mode`](docs/datepickerios.html#mode)
- [`timeZoneOffsetInMinutes`](docs/datepickerios.html#timezoneoffsetinminutes)






---

# Reference

## Props

### `date`

The currently selected date.

| Type | Required |
| - | - |
| Date | Yes |




---

### `onDateChange`

Date change handler.

This is called when the user changes the date or time in the UI.
The first and only argument is a Date object representing the new
date and time.

| Type | Required |
| - | - |
| function | Yes |




---

### `maximumDate`

Maximum date.

Restricts the range of possible date/time values.

| Type | Required |
| - | - |
| Date | No |




---

### `minimumDate`

Minimum date.

Restricts the range of possible date/time values.

| Type | Required |
| - | - |
| Date | No |




---

### `minuteInterval`

The interval at which minutes can be selected.

| Type | Required |
| - | - |
| enum(1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30) | No |




---

### `mode`

The date picker mode.

| Type | Required |
| - | - |
| enum('date', 'time', 'datetime') | No |




---

### `timeZoneOffsetInMinutes`

Timezone offset in minutes.

By default, the date picker will use the device's timezone. With this
parameter, it is possible to force a certain timezone offset. For
instance, to show times in Pacific Standard Time, pass -7 * 60.

| Type | Required |
| - | - |
| number | No |






