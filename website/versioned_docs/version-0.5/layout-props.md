---
id: version-0.5-layout-props
title: Layout Props
original_id: layout-props
---
### Props

- [`marginHorizontal`](docs/layout-props.html#marginhorizontal)
- [`alignContent`](docs/layout-props.html#aligncontent)
- [`alignSelf`](docs/layout-props.html#alignself)
- [`aspectRatio`](docs/layout-props.html#aspectratio)
- [`borderBottomWidth`](docs/layout-props.html#borderbottomwidth)
- [`borderEndWidth`](docs/layout-props.html#borderendwidth)
- [`borderLeftWidth`](docs/layout-props.html#borderleftwidth)
- [`borderRightWidth`](docs/layout-props.html#borderrightwidth)
- [`borderStartWidth`](docs/layout-props.html#borderstartwidth)
- [`borderTopWidth`](docs/layout-props.html#bordertopwidth)
- [`borderWidth`](docs/layout-props.html#borderwidth)
- [`bottom`](docs/layout-props.html#bottom)
- [`display`](docs/layout-props.html#display)
- [`end`](docs/layout-props.html#end)
- [`flex`](docs/layout-props.html#flex)
- [`flexBasis`](docs/layout-props.html#flexbasis)
- [`flexDirection`](docs/layout-props.html#flexdirection)
- [`flexGrow`](docs/layout-props.html#flexgrow)
- [`flexShrink`](docs/layout-props.html#flexshrink)
- [`flexWrap`](docs/layout-props.html#flexwrap)
- [`height`](docs/layout-props.html#height)
- [`justifyContent`](docs/layout-props.html#justifycontent)
- [`left`](docs/layout-props.html#left)
- [`margin`](docs/layout-props.html#margin)
- [`marginBottom`](docs/layout-props.html#marginbottom)
- [`marginEnd`](docs/layout-props.html#marginend)
- [`alignItems`](docs/layout-props.html#alignitems)
- [`marginLeft`](docs/layout-props.html#marginleft)
- [`marginRight`](docs/layout-props.html#marginright)
- [`marginStart`](docs/layout-props.html#marginstart)
- [`marginTop`](docs/layout-props.html#margintop)
- [`marginVertical`](docs/layout-props.html#marginvertical)
- [`maxHeight`](docs/layout-props.html#maxheight)
- [`maxWidth`](docs/layout-props.html#maxwidth)
- [`minHeight`](docs/layout-props.html#minheight)
- [`minWidth`](docs/layout-props.html#minwidth)
- [`overflow`](docs/layout-props.html#overflow)
- [`padding`](docs/layout-props.html#padding)
- [`paddingBottom`](docs/layout-props.html#paddingbottom)
- [`paddingEnd`](docs/layout-props.html#paddingend)
- [`paddingHorizontal`](docs/layout-props.html#paddinghorizontal)
- [`paddingLeft`](docs/layout-props.html#paddingleft)
- [`paddingRight`](docs/layout-props.html#paddingright)
- [`paddingStart`](docs/layout-props.html#paddingstart)
- [`paddingTop`](docs/layout-props.html#paddingtop)
- [`paddingVertical`](docs/layout-props.html#paddingvertical)
- [`position`](docs/layout-props.html#position)
- [`right`](docs/layout-props.html#right)
- [`start`](docs/layout-props.html#start)
- [`top`](docs/layout-props.html#top)
- [`width`](docs/layout-props.html#width)
- [`zIndex`](docs/layout-props.html#zindex)
- [`direction`](docs/layout-props.html#direction)






---

# Reference

## Props

### `marginHorizontal`

Setting `marginHorizontal` has the same effect as setting
 both `marginLeft` and `marginRight`.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `alignContent`

`alignContent` controls how rows align in the cross direction,
 overriding the `alignContent` of the parent.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/align-content
 for more details.

| Type | Required |
| - | - |
| enum('flex-start', 'flex-end', 'center', 'stretch', 'space-between', 'space-around') | No |




---

### `alignSelf`

`alignSelf` controls how a child aligns in the cross direction,
 overriding the `alignItems` of the parent. It works like `align-self`
 in CSS (default: auto).
 See https://developer.mozilla.org/en-US/docs/Web/CSS/align-self
 for more details.

| Type | Required |
| - | - |
| enum('auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline') | No |




---

### `aspectRatio`

Aspect ratio control the size of the undefined dimension of a node. Aspect ratio is a
non-standard property only available in react native and not CSS.

- On a node with a set width/height aspect ratio control the size of the unset dimension
- On a node with a set flex basis aspect ratio controls the size of the node in the cross axis
  if unset
- On a node with a measure function aspect ratio works as though the measure function measures
  the flex basis
- On a node with flex grow/shrink aspect ratio controls the size of the node in the cross axis
  if unset
- Aspect ratio takes min/max dimensions into account

| Type | Required |
| - | - |
| number | No |




---

### `borderBottomWidth`

`borderBottomWidth` works like `border-bottom-width` in CSS.
See https://developer.mozilla.org/en-US/docs/Web/CSS/border-bottom-width
for more details.

| Type | Required |
| - | - |
| number | No |




---

### `borderEndWidth`

When direction is `ltr`, `borderEndWidth` is equivalent to `borderRightWidth`.
When direction is `rtl`, `borderEndWidth` is equivalent to `borderLeftWidth`.

| Type | Required |
| - | - |
| number | No |




---

### `borderLeftWidth`

`borderLeftWidth` works like `border-left-width` in CSS.
See https://developer.mozilla.org/en-US/docs/Web/CSS/border-left-width
for more details.

| Type | Required |
| - | - |
| number | No |




---

### `borderRightWidth`

`borderRightWidth` works like `border-right-width` in CSS.
See https://developer.mozilla.org/en-US/docs/Web/CSS/border-right-width
for more details.

| Type | Required |
| - | - |
| number | No |




---

### `borderStartWidth`

When direction is `ltr`, `borderStartWidth` is equivalent to `borderLeftWidth`.
When direction is `rtl`, `borderStartWidth` is equivalent to `borderRightWidth`.

| Type | Required |
| - | - |
| number | No |




---

### `borderTopWidth`

`borderTopWidth` works like `border-top-width` in CSS.
See https://developer.mozilla.org/en-US/docs/Web/CSS/border-top-width
for more details.

| Type | Required |
| - | - |
| number | No |




---

### `borderWidth`

`borderWidth` works like `border-width` in CSS.
See https://developer.mozilla.org/en-US/docs/Web/CSS/border-width
for more details.

| Type | Required |
| - | - |
| number | No |




---

### `bottom`

`bottom` is the number of logical pixels to offset the bottom edge of
 this component.

 It works similarly to `bottom` in CSS, but in React Native you
 must use points or percentages. Ems and other units are not supported.

 See https://developer.mozilla.org/en-US/docs/Web/CSS/bottom
 for more details of how `bottom` affects layout.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `display`

`display` sets the display type of this component.

 It works similarly to `display` in CSS, but only support 'flex' and 'none'.
 'flex' is the default.

| Type | Required |
| - | - |
| enum('none', 'flex') | No |




---

### `end`

When the direction is `ltr`, `end` is equivalent to `right`.
When the direction is `rtl`, `end` is equivalent to `left`.

This style takes precedence over the `left` and `right` styles.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `flex`

In React Native `flex` does not work the same way that it does in CSS.
 `flex` is a number rather than a string, and it works
 according to the `Yoga` library
 at https://github.com/facebook/yoga

 When `flex` is a positive number, it makes the component flexible
 and it will be sized proportional to its flex value. So a
 component with `flex` set to 2 will take twice the space as a
 component with `flex` set to 1.

 When `flex` is 0, the component is sized according to `width`
 and `height` and it is inflexible.

 When `flex` is -1, the component is normally sized according
 `width` and `height`. However, if there's not enough space,
 the component will shrink to its `minWidth` and `minHeight`.

flexGrow, flexShrink, and flexBasis work the same as in CSS.

| Type | Required |
| - | - |
| number | No |




---

### `flexBasis`



| Type | Required |
| - | - |
| number, ,string | No |




---

### `flexDirection`

`flexDirection` controls which directions children of a container go.
 `row` goes left to right, `column` goes top to bottom, and you may
 be able to guess what the other two do. It works like `flex-direction`
 in CSS, except the default is `column`.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction
 for more details.

| Type | Required |
| - | - |
| enum('row', 'row-reverse', 'column', 'column-reverse') | No |




---

### `flexGrow`



| Type | Required |
| - | - |
| number | No |




---

### `flexShrink`



| Type | Required |
| - | - |
| number | No |




---

### `flexWrap`

`flexWrap` controls whether children can wrap around after they
 hit the end of a flex container.
 It works like `flex-wrap` in CSS (default: nowrap).
 See https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap
 for more details.

| Type | Required |
| - | - |
| enum('wrap', 'nowrap') | No |




---

### `height`

`height` sets the height of this component.

 It works similarly to `height` in CSS, but in React Native you
 must use points or percentages. Ems and other units are not supported.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/height for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `justifyContent`

`justifyContent` aligns children in the main direction.
 For example, if children are flowing vertically, `justifyContent`
 controls how they align vertically.
 It works like `justify-content` in CSS (default: flex-start).
 See https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content
 for more details.

| Type | Required |
| - | - |
| enum('flex-start', 'flex-end', 'center', 'space-between', 'space-around') | No |




---

### `left`

`left` is the number of logical pixels to offset the left edge of
 this component.

 It works similarly to `left` in CSS, but in React Native you
 must use points or percentages. Ems and other units are not supported.

 See https://developer.mozilla.org/en-US/docs/Web/CSS/left
 for more details of how `left` affects layout.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `margin`

Setting `margin` has the same effect as setting each of
 `marginTop`, `marginLeft`, `marginBottom`, and `marginRight`.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/margin
 for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `marginBottom`

`marginBottom` works like `margin-bottom` in CSS.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-bottom
 for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `marginEnd`

When direction is `ltr`, `marginEnd` is equivalent to `marginRight`.
When direction is `rtl`, `marginEnd` is equivalent to `marginLeft`.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `alignItems`

`alignItems` aligns children in the cross direction.
 For example, if children are flowing vertically, `alignItems`
 controls how they align horizontally.
 It works like `align-items` in CSS (default: stretch).
 See https://developer.mozilla.org/en-US/docs/Web/CSS/align-items
 for more details.

| Type | Required |
| - | - |
| enum('flex-start', 'flex-end', 'center', 'stretch', 'baseline') | No |




---

### `marginLeft`

`marginLeft` works like `margin-left` in CSS.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-left
 for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `marginRight`

`marginRight` works like `margin-right` in CSS.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-right
 for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `marginStart`

When direction is `ltr`, `marginStart` is equivalent to `marginLeft`.
When direction is `rtl`, `marginStart` is equivalent to `marginRight`.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `marginTop`

`marginTop` works like `margin-top` in CSS.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-top
 for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `marginVertical`

Setting `marginVertical` has the same effect as setting both
 `marginTop` and `marginBottom`.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `maxHeight`

`maxHeight` is the maximum height for this component, in logical pixels.

 It works similarly to `max-height` in CSS, but in React Native you
 must use points or percentages. Ems and other units are not supported.

 See https://developer.mozilla.org/en-US/docs/Web/CSS/max-height
 for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `maxWidth`

`maxWidth` is the maximum width for this component, in logical pixels.

 It works similarly to `max-width` in CSS, but in React Native you
 must use points or percentages. Ems and other units are not supported.

 See https://developer.mozilla.org/en-US/docs/Web/CSS/max-width
 for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `minHeight`

`minHeight` is the minimum height for this component, in logical pixels.

 It works similarly to `min-height` in CSS, but in React Native you
 must use points or percentages. Ems and other units are not supported.

 See https://developer.mozilla.org/en-US/docs/Web/CSS/min-height
 for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `minWidth`

`minWidth` is the minimum width for this component, in logical pixels.

 It works similarly to `min-width` in CSS, but in React Native you
 must use points or percentages. Ems and other units are not supported.

 See https://developer.mozilla.org/en-US/docs/Web/CSS/min-width
 for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `overflow`

`overflow` controls how children are measured and displayed.
 `overflow: hidden` causes views to be clipped while `overflow: scroll`
 causes views to be measured independently of their parents main axis.
 It works like `overflow` in CSS (default: visible).
 See https://developer.mozilla.org/en/docs/Web/CSS/overflow
 for more details.
 `overflow: visible` only works on iOS. On Android, all views will clip
 their children.

| Type | Required |
| - | - |
| enum('visible', 'hidden', 'scroll') | No |




---

### `padding`

Setting `padding` has the same effect as setting each of
 `paddingTop`, `paddingBottom`, `paddingLeft`, and `paddingRight`.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/padding
 for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `paddingBottom`

`paddingBottom` works like `padding-bottom` in CSS.
See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-bottom
for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `paddingEnd`

When direction is `ltr`, `paddingEnd` is equivalent to `paddingRight`.
When direction is `rtl`, `paddingEnd` is equivalent to `paddingLeft`.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `paddingHorizontal`

Setting `paddingHorizontal` is like setting both of
 `paddingLeft` and `paddingRight`.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `paddingLeft`

`paddingLeft` works like `padding-left` in CSS.
See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-left
for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `paddingRight`

`paddingRight` works like `padding-right` in CSS.
See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-right
for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `paddingStart`

When direction is `ltr`, `paddingStart` is equivalent to `paddingLeft`.
When direction is `rtl`, `paddingStart` is equivalent to `paddingRight`.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `paddingTop`

`paddingTop` works like `padding-top` in CSS.
See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-top
for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `paddingVertical`

Setting `paddingVertical` is like setting both of
 `paddingTop` and `paddingBottom`.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `position`

`position` in React Native is similar to regular CSS, but
 everything is set to `relative` by default, so `absolute`
 positioning is always just relative to the parent.

 If you want to position a child using specific numbers of logical
 pixels relative to its parent, set the child to have `absolute`
 position.

 If you want to position a child relative to something
 that is not its parent, just don't use styles for that. Use the
 component tree.

 See https://github.com/facebook/yoga
 for more details on how `position` differs between React Native
 and CSS.

| Type | Required |
| - | - |
| enum('absolute', 'relative') | No |




---

### `right`

`right` is the number of logical pixels to offset the right edge of
 this component.

 It works similarly to `right` in CSS, but in React Native you
 must use points or percentages. Ems and other units are not supported.

 See https://developer.mozilla.org/en-US/docs/Web/CSS/right
 for more details of how `right` affects layout.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `start`

When the direction is `ltr`, `start` is equivalent to `left`.
When the direction is `rtl`, `start` is equivalent to `right`.

This style takes precedence over the `left`, `right`, and `end` styles.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `top`

`top` is the number of logical pixels to offset the top edge of
 this component.

 It works similarly to `top` in CSS, but in React Native you
 must use points or percentages. Ems and other units are not supported.

 See https://developer.mozilla.org/en-US/docs/Web/CSS/top
 for more details of how `top` affects layout.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `width`

`width` sets the width of this component.

 It works similarly to `width` in CSS, but in React Native you
 must use points or percentages. Ems and other units are not supported.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/width for more details.

| Type | Required |
| - | - |
| number, ,string | No |




---

### `zIndex`

`zIndex` controls which components display on top of others.
 Normally, you don't use `zIndex`. Components render according to
 their order in the document tree, so later components draw over
 earlier ones. `zIndex` may be useful if you have animations or custom
 modal interfaces where you don't want this behavior.

 It works like the CSS `z-index` property - components with a larger
 `zIndex` will render on top. Think of the z-direction like it's
 pointing from the phone into your eyeball.
 See https://developer.mozilla.org/en-US/docs/Web/CSS/z-index for
 more details.

| Type | Required |
| - | - |
| number | No |




---

### `direction`

`direction` specifies the directional flow of the user interface.
 The default is `inherit`, except for root node which will have
 value based on the current locale.
 See https://facebook.github.io/yoga/docs/rtl/
 for more details.
 

| Type | Required | Platform |
| - | - | - |
| enum('inherit', 'ltr', 'rtl') | No | iOS  |






