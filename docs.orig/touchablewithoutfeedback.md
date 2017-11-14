---
id: touchablewithoutfeedback
title: TouchableWithoutFeedback
---
Do not use unless you have a very good reason. All elements that
respond to press should have a visual feedback when touched.

TouchableWithoutFeedback supports only one child.
If you wish to have several child components, wrap them in a View.

### Props

- [`hitSlop`](docs/touchablewithoutfeedback.html#hitslop)
- [`accessibilityComponentType`](docs/touchablewithoutfeedback.html#accessibilitycomponenttype)
- [`accessible`](docs/touchablewithoutfeedback.html#accessible)
- [`delayLongPress`](docs/touchablewithoutfeedback.html#delaylongpress)
- [`delayPressIn`](docs/touchablewithoutfeedback.html#delaypressin)
- [`delayPressOut`](docs/touchablewithoutfeedback.html#delaypressout)
- [`disabled`](docs/touchablewithoutfeedback.html#disabled)
- [`accessibilityTraits`](docs/touchablewithoutfeedback.html#accessibilitytraits)
- [`onLayout`](docs/touchablewithoutfeedback.html#onlayout)
- [`onLongPress`](docs/touchablewithoutfeedback.html#onlongpress)
- [`onPress`](docs/touchablewithoutfeedback.html#onpress)
- [`onPressIn`](docs/touchablewithoutfeedback.html#onpressin)
- [`onPressOut`](docs/touchablewithoutfeedback.html#onpressout)
- [`pressRetentionOffset`](docs/touchablewithoutfeedback.html#pressretentionoffset)




### Type Definitions

- [`Event`](docs/touchablewithoutfeedback.html#event)




---

# Reference

## Props

### `hitSlop`

This defines how far your touch can start away from the button. This is added to `pressRetentionOffset` when moving off of the button.

> Note:
> The touch area never extends past the parent view bounds and the Z-index of sibling views always takes precedence if a touch hits two overlapping views.

| Type | Required |
| - | - |
| object: {top: number, left: number, bottom: number, right: number} | No |




---

### `accessibilityComponentType`



| Type | Required |
| - | - |
| AccessibilityComponentTypes | No |




---

### `accessible`



| Type | Required |
| - | - |
| bool | No |




---

### `delayLongPress`

Delay in ms, from onPressIn, before onLongPress is called.

| Type | Required |
| - | - |
| number | No |




---

### `delayPressIn`

Delay in ms, from the start of the touch, before onPressIn is called.

| Type | Required |
| - | - |
| number | No |




---

### `delayPressOut`

Delay in ms, from the release of the touch, before onPressOut is called.

| Type | Required |
| - | - |
| number | No |




---

### `disabled`

If true, disable all interactions for this component.

| Type | Required |
| - | - |
| bool | No |




---

### `accessibilityTraits`



| Type | Required |
| - | - |
| AccessibilityTraits, ,array of AccessibilityTraits | No |




---

### `onLayout`

Invoked on mount and layout changes with

  `{nativeEvent: {layout: {x, y, width, height}}}`

| Type | Required |
| - | - |
| function | No |




---

### `onLongPress`



| Type | Required |
| - | - |
| function | No |




---

### `onPress`

Called when the touch is released, but not if cancelled (e.g. by a scroll
that steals the responder lock).

| Type | Required |
| - | - |
| function | No |




---

### `onPressIn`

Called as soon as the touchable element is pressed and invoked even before onPress.
This can be useful when making network requests.

| Type | Required |
| - | - |
| function | No |




---

### `onPressOut`

Called as soon as the touch is released even before onPress.

| Type | Required |
| - | - |
| function | No |




---

### `pressRetentionOffset`

When the scroll view is disabled, this defines how far your touch may
move off of the button, before deactivating the button. Once deactivated,
try moving it back and you'll see that the button is once again
reactivated! Move it back and forth several times while the scroll view
is disabled. Ensure you pass in a constant to reduce memory allocations.

| Type | Required |
| - | - |
| object: {top: number, left: number, bottom: number, right: number} | No |






## Type Definitions

### Event

| Type |
| - |
| Object |




