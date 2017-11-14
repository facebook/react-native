---
id: checkbox
title: CheckBox
---
Renders a boolean input (Android only).

This is a controlled component that requires an `onValueChange` callback that
updates the `value` prop in order for the component to reflect user actions.
If the `value` prop is not updated, the component will continue to render
the supplied `value` prop instead of the expected result of any user actions.

@keyword checkbox
@keyword toggle

### Props

- [View props...](docs/view-props.html)
- [`disabled`](docs/checkbox.html#disabled)
- [`onChange`](docs/checkbox.html#onchange)
- [`onValueChange`](docs/checkbox.html#onvaluechange)
- [`testID`](docs/checkbox.html#testid)
- [`value`](docs/checkbox.html#value)






---

# Reference

## Props

### `disabled`

If true the user won't be able to toggle the checkbox.
Default value is false.

| Type | Required |
| - | - |
| bool | No |




---

### `onChange`

Used in case the props change removes the component.

| Type | Required |
| - | - |
| function | No |




---

### `onValueChange`

Invoked with the new value when the value changes.

| Type | Required |
| - | - |
| function | No |




---

### `testID`

Used to locate this view in end-to-end tests.

| Type | Required |
| - | - |
| string | No |




---

### `value`

The value of the checkbox.  If true the checkbox will be turned on.
Default value is false.

| Type | Required |
| - | - |
| bool | No |






