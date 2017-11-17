---
id: image-style-props
title: Image Style Props
layout: docs
category: APIs
permalink: docs/image-style-props.html
next: null
previous: text-style-props
---

[Image](docs/image.html) style props.

### Props

- [Layout Props...](docs/layout-props.html#props)
- [Shadow Props...](docs/shadow-props.html#props)
- [Transforms...](docs/transforms.html#props)
- [`borderTopRightRadius`](docs/image-style-props.html#bordertoprightradius)
- [`backfaceVisibility`](docs/image-style-props.html#backfacevisibility)
- [`borderBottomLeftRadius`](docs/image-style-props.html#borderbottomleftradius)
- [`borderBottomRightRadius`](docs/image-style-props.html#borderbottomrightradius)
- [`borderColor`](docs/image-style-props.html#bordercolor)
- [`borderRadius`](docs/image-style-props.html#borderradius)
- [`borderTopLeftRadius`](docs/image-style-props.html#bordertopleftradius)
- [`backgroundColor`](docs/image-style-props.html#backgroundcolor)
- [`borderWidth`](docs/image-style-props.html#borderwidth)
- [`opacity`](docs/image-style-props.html#opacity)
- [`overflow`](docs/image-style-props.html#overflow)
- [`resizeMode`](docs/image-style-props.html#resizemode)
- [`tintColor`](docs/image-style-props.html#tintcolor)
- [`overlayColor`](docs/image-style-props.html#overlaycolor)



---

# Reference

## Props

### `borderTopRightRadius`



| Type | Required |
| - | - |
| number | No |




---

### `backfaceVisibility`



| Type | Required |
| - | - |
| enum('visible', 'hidden') | No |




---

### `borderBottomLeftRadius`



| Type | Required |
| - | - |
| number | No |




---

### `borderBottomRightRadius`



| Type | Required |
| - | - |
| number | No |




---

### `borderColor`



| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `borderRadius`



| Type | Required |
| - | - |
| number | No |




---

### `borderTopLeftRadius`



| Type | Required |
| - | - |
| number | No |




---

### `backgroundColor`



| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `borderWidth`



| Type | Required |
| - | - |
| number | No |




---

### `opacity`



| Type | Required |
| - | - |
| number | No |




---

### `overflow`



| Type | Required |
| - | - |
| enum('visible', 'hidden') | No |




---

### `resizeMode`



| Type | Required |
| - | - |
| Object.keys(ImageResizeMode) | No |




---

### `tintColor`

Changes the color of all the non-transparent pixels to the tintColor.

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `overlayColor`

When the image has rounded corners, specifying an overlayColor will
cause the remaining space in the corners to be filled with a solid color.
This is useful in cases which are not supported by the Android
implementation of rounded corners:
  - Certain resize modes, such as 'contain'
  - Animated GIFs

A typical way to use this prop is with images displayed on a solid
background and setting the `overlayColor` to the same color
as the background.

For details of how this works under the hood, see
http://frescolib.org/docs/rounded-corners-and-circles.html



| Type | Required | Platform |
| - | - | - |
| string | No | Android  |






