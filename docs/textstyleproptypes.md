---
id: textstyleproptypes
title: TextStylePropTypes
layout: docs
category: APIs
permalink: docs/textstyleproptypes.html
next: imagestyleproptypes
previous: viewstyleproptypes
---
### Props

- [`textShadowOffset`](docs/textstyleproptypes.html#textshadowoffset)
- [`color`](docs/textstyleproptypes.html#color)
- [`fontSize`](docs/textstyleproptypes.html#fontsize)
- [`fontStyle`](docs/textstyleproptypes.html#fontstyle)
- [`fontWeight`](docs/textstyleproptypes.html#fontweight)
- [`lineHeight`](docs/textstyleproptypes.html#lineheight)
- [`textAlign`](docs/textstyleproptypes.html#textalign)
- [`textDecorationLine`](docs/textstyleproptypes.html#textdecorationline)
- [`textShadowColor`](docs/textstyleproptypes.html#textshadowcolor)
- [`fontFamily`](docs/textstyleproptypes.html#fontfamily)
- [`textShadowRadius`](docs/textstyleproptypes.html#textshadowradius)
- [`includeFontPadding`](docs/textstyleproptypes.html#includefontpadding)
- [`textAlignVertical`](docs/textstyleproptypes.html#textalignvertical)
- [`fontVariant`](docs/textstyleproptypes.html#fontvariant)
- [`letterSpacing`](docs/textstyleproptypes.html#letterspacing)
- [`textDecorationColor`](docs/textstyleproptypes.html#textdecorationcolor)
- [`textDecorationStyle`](docs/textstyleproptypes.html#textdecorationstyle)
- [`writingDirection`](docs/textstyleproptypes.html#writingdirection)






---

# Reference

## Props

### `textShadowOffset`



| Type | Required |
| - | - |
| object: {width: number,height: number} | No |




---

### `color`



| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `fontSize`



| Type | Required |
| - | - |
| number | No |




---

### `fontStyle`



| Type | Required |
| - | - |
| enum('normal', 'italic') | No |




---

### `fontWeight`

Specifies font weight. The values 'normal' and 'bold' are supported for
most fonts. Not all fonts have a variant for each of the numeric values,
in that case the closest one is chosen.

| Type | Required |
| - | - |
| enum('normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900') | No |




---

### `lineHeight`



| Type | Required |
| - | - |
| number | No |




---

### `textAlign`

Specifies text alignment. The value 'justify' is only supported on iOS and
fallbacks to `left` on Android.

| Type | Required |
| - | - |
| enum('auto', 'left', 'right', 'center', 'justify') | No |




---

### `textDecorationLine`



| Type | Required |
| - | - |
| enum('none', 'underline', 'line-through', 'underline line-through') | No |




---

### `textShadowColor`



| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `fontFamily`



| Type | Required |
| - | - |
| string | No |




---

### `textShadowRadius`



| Type | Required |
| - | - |
| number | No |




---

### `includeFontPadding`

Set to `false` to remove extra font padding intended to make space for certain ascenders / descenders.
With some fonts, this padding can make text look slightly misaligned when centered vertically.
For best results also set `textAlignVertical` to `center`. Default is true.


| Type | Required | Platform |
| - | - | - |
| bool | No | Android  |




---

### `textAlignVertical`



| Type | Required | Platform |
| - | - | - |
| enum('auto', 'top', 'bottom', 'center') | No | Android  |




---

### `fontVariant`



| Type | Required | Platform |
| - | - | - |
| array of enum('small-caps', 'oldstyle-nums', 'lining-nums', 'tabular-nums', 'proportional-nums') | No | iOS  |




---

### `letterSpacing`



| Type | Required | Platform |
| - | - | - |
| number | No | iOS  |




---

### `textDecorationColor`



| Type | Required | Platform |
| - | - | - |
| [color](docs/colors.html) | No | iOS  |




---

### `textDecorationStyle`



| Type | Required | Platform |
| - | - | - |
| enum('solid', 'double', 'dotted', 'dashed') | No | iOS  |




---

### `writingDirection`



| Type | Required | Platform |
| - | - | - |
| enum('auto', 'ltr', 'rtl') | No | iOS  |






