---
id: keyboardavoidingview
title: KeyboardAvoidingView
layout: docs
category: components
permalink: docs/keyboardavoidingview.html
next: listview
previous: image
---
It is a component to solve the common problem of views that need to move out of the way of the virtual keyboard.
It can automatically adjust either its position or bottom padding based on the position of the keyboard.

### Props

- [ViewPropTypes props...](docs/viewproptypes.html#props)
- [`keyboardVerticalOffset`](docs/keyboardavoidingview.html#keyboardverticaloffset)
- [`behavior`](docs/keyboardavoidingview.html#behavior)
- [`contentContainerStyle`](docs/keyboardavoidingview.html#contentcontainerstyle)




### Methods

- [`relativeKeyboardHeight`](docs/keyboardavoidingview.html#relativekeyboardheight)
- [`onKeyboardChange`](docs/keyboardavoidingview.html#onkeyboardchange)
- [`onLayout`](docs/keyboardavoidingview.html#onlayout)




---

# Reference

## Props

### `keyboardVerticalOffset`

This is the distance between the top of the user screen and the react native view,
may be non-zero in some use cases.

| Type | Required |
| - | - |
| number | Yes |




---

### `behavior`



| Type | Required |
| - | - |
| enum('height', 'position', 'padding') | No |




---

### `contentContainerStyle`

The style of the content container(View) when behavior is 'position'.

| Type | Required |
| - | - |
| [ViewPropTypes.style](docs/viewproptypes.html#style) | No |






## Methods

### `relativeKeyboardHeight()`

```javascript
relativeKeyboardHeight(keyboardFrame: object): 
```



---

### `onKeyboardChange()`

```javascript
onKeyboardChange(event: object)
```



---

### `onLayout()`

```javascript
onLayout(event: ViewLayoutEvent)
```



