---
id: imagestyleproptypes
title: ImageStylePropTypes
---
### Props

- [`borderTopRightRadius`](docs/imagestyleproptypes.html#bordertoprightradius)
- [`backfaceVisibility`](docs/imagestyleproptypes.html#backfacevisibility)
- [`borderBottomLeftRadius`](docs/imagestyleproptypes.html#borderbottomleftradius)
- [`borderBottomRightRadius`](docs/imagestyleproptypes.html#borderbottomrightradius)
- [`borderColor`](docs/imagestyleproptypes.html#bordercolor)
- [`borderRadius`](docs/imagestyleproptypes.html#borderradius)
- [`borderTopLeftRadius`](docs/imagestyleproptypes.html#bordertopleftradius)
- [`backgroundColor`](docs/imagestyleproptypes.html#backgroundcolor)
- [`borderWidth`](docs/imagestyleproptypes.html#borderwidth)
- [`opacity`](docs/imagestyleproptypes.html#opacity)
- [`overflow`](docs/imagestyleproptypes.html#overflow)
- [`resizeMode`](docs/imagestyleproptypes.html#resizemode)
- [`tintColor`](docs/imagestyleproptypes.html#tintcolor)
- [`overlayColor`](docs/imagestyleproptypes.html#overlaycolor)






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






