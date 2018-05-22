/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ReactPropTypes = require('prop-types');

/**
 * React Native's layout system is based on Flexbox and is powered both
 * on iOS and Android by an open source project called `Yoga`:
 * https://github.com/facebook/yoga
 *
 * The implementation in Yoga is slightly different from what the
 * Flexbox spec defines - for example, we chose more sensible default
 * values. Since our layout docs are generated from the comments in this
 * file, please keep a brief comment describing each prop type.
 *
 * These properties are a subset of our styles that are consumed by the layout
 * algorithm and affect the positioning and sizing of views.
 */
const LayoutPropTypes = {
  /** `display` sets the display type of this component.
   *
   *  It works similarly to `display` in CSS, but only support 'flex' and 'none'.
   *  'flex' is the default.
   */
  display: ReactPropTypes.oneOf(['none', 'flex']),

  /** `width` sets the width of this component.
   *
   *  It works similarly to `width` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/width for more details.
   */
  width: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `height` sets the height of this component.
   *
   *  It works similarly to `height` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/height for more details.
   */
  height: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /**
   * When the direction is `ltr`, `start` is equivalent to `left`.
   * When the direction is `rtl`, `start` is equivalent to `right`.
   *
   * This style takes precedence over the `left`, `right`, and `end` styles.
   */
  start: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /**
   * When the direction is `ltr`, `end` is equivalent to `right`.
   * When the direction is `rtl`, `end` is equivalent to `left`.
   *
   * This style takes precedence over the `left` and `right` styles.
   */
  end: ReactPropTypes.oneOfType([ReactPropTypes.number, ReactPropTypes.string]),

  /** `top` is the number of logical pixels to offset the top edge of
   *  this component.
   *
   *  It works similarly to `top` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/top
   *  for more details of how `top` affects layout.
   */
  top: ReactPropTypes.oneOfType([ReactPropTypes.number, ReactPropTypes.string]),

  /** `left` is the number of logical pixels to offset the left edge of
   *  this component.
   *
   *  It works similarly to `left` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/left
   *  for more details of how `left` affects layout.
   */
  left: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `right` is the number of logical pixels to offset the right edge of
   *  this component.
   *
   *  It works similarly to `right` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/right
   *  for more details of how `right` affects layout.
   */
  right: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `bottom` is the number of logical pixels to offset the bottom edge of
   *  this component.
   *
   *  It works similarly to `bottom` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/bottom
   *  for more details of how `bottom` affects layout.
   */
  bottom: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `minWidth` is the minimum width for this component, in logical pixels.
   *
   *  It works similarly to `min-width` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/min-width
   *  for more details.
   */
  minWidth: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `maxWidth` is the maximum width for this component, in logical pixels.
   *
   *  It works similarly to `max-width` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/max-width
   *  for more details.
   */
  maxWidth: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `minHeight` is the minimum height for this component, in logical pixels.
   *
   *  It works similarly to `min-height` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/min-height
   *  for more details.
   */
  minHeight: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `maxHeight` is the maximum height for this component, in logical pixels.
   *
   *  It works similarly to `max-height` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/max-height
   *  for more details.
   */
  maxHeight: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** Setting `margin` has the same effect as setting each of
   *  `marginTop`, `marginLeft`, `marginBottom`, and `marginRight`.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/margin
   *  for more details.
   */
  margin: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** Setting `marginVertical` has the same effect as setting both
   *  `marginTop` and `marginBottom`.
   */
  marginVertical: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** Setting `marginHorizontal` has the same effect as setting
   *  both `marginLeft` and `marginRight`.
   */
  marginHorizontal: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `marginTop` works like `margin-top` in CSS.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-top
   *  for more details.
   */
  marginTop: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `marginBottom` works like `margin-bottom` in CSS.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-bottom
   *  for more details.
   */
  marginBottom: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `marginLeft` works like `margin-left` in CSS.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-left
   *  for more details.
   */
  marginLeft: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `marginRight` works like `margin-right` in CSS.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-right
   *  for more details.
   */
  marginRight: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /**
   * When direction is `ltr`, `marginStart` is equivalent to `marginLeft`.
   * When direction is `rtl`, `marginStart` is equivalent to `marginRight`.
   */
  marginStart: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /**
   * When direction is `ltr`, `marginEnd` is equivalent to `marginRight`.
   * When direction is `rtl`, `marginEnd` is equivalent to `marginLeft`.
   */
  marginEnd: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** Setting `padding` has the same effect as setting each of
   *  `paddingTop`, `paddingBottom`, `paddingLeft`, and `paddingRight`.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/padding
   *  for more details.
   */
  padding: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** Setting `paddingVertical` is like setting both of
   *  `paddingTop` and `paddingBottom`.
   */
  paddingVertical: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** Setting `paddingHorizontal` is like setting both of
   *  `paddingLeft` and `paddingRight`.
   */
  paddingHorizontal: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `paddingTop` works like `padding-top` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-top
   * for more details.
   */
  paddingTop: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `paddingBottom` works like `padding-bottom` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-bottom
   * for more details.
   */
  paddingBottom: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `paddingLeft` works like `padding-left` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-left
   * for more details.
   */
  paddingLeft: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `paddingRight` works like `padding-right` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-right
   * for more details.
   */
  paddingRight: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /**
   * When direction is `ltr`, `paddingStart` is equivalent to `paddingLeft`.
   * When direction is `rtl`, `paddingStart` is equivalent to `paddingRight`.
   */
  paddingStart: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /**
   * When direction is `ltr`, `paddingEnd` is equivalent to `paddingRight`.
   * When direction is `rtl`, `paddingEnd` is equivalent to `paddingLeft`.
   */
  paddingEnd: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /** `borderWidth` works like `border-width` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/border-width
   * for more details.
   */
  borderWidth: ReactPropTypes.number,

  /** `borderTopWidth` works like `border-top-width` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/border-top-width
   * for more details.
   */
  borderTopWidth: ReactPropTypes.number,

  /**
   * When direction is `ltr`, `borderStartWidth` is equivalent to `borderLeftWidth`.
   * When direction is `rtl`, `borderStartWidth` is equivalent to `borderRightWidth`.
   */
  borderStartWidth: ReactPropTypes.number,

  /**
   * When direction is `ltr`, `borderEndWidth` is equivalent to `borderRightWidth`.
   * When direction is `rtl`, `borderEndWidth` is equivalent to `borderLeftWidth`.
   */
  borderEndWidth: ReactPropTypes.number,

  /** `borderRightWidth` works like `border-right-width` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/border-right-width
   * for more details.
   */
  borderRightWidth: ReactPropTypes.number,

  /** `borderBottomWidth` works like `border-bottom-width` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/border-bottom-width
   * for more details.
   */
  borderBottomWidth: ReactPropTypes.number,

  /** `borderLeftWidth` works like `border-left-width` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/border-left-width
   * for more details.
   */
  borderLeftWidth: ReactPropTypes.number,

  /** `position` in React Native is similar to regular CSS, but
   *  everything is set to `relative` by default, so `absolute`
   *  positioning is always just relative to the parent.
   *
   *  If you want to position a child using specific numbers of logical
   *  pixels relative to its parent, set the child to have `absolute`
   *  position.
   *
   *  If you want to position a child relative to something
   *  that is not its parent, just don't use styles for that. Use the
   *  component tree.
   *
   *  See https://github.com/facebook/yoga
   *  for more details on how `position` differs between React Native
   *  and CSS.
   */
  position: ReactPropTypes.oneOf(['absolute', 'relative']),

  /** `flexDirection` controls which directions children of a container go.
   *  `row` goes left to right, `column` goes top to bottom, and you may
   *  be able to guess what the other two do. It works like `flex-direction`
   *  in CSS, except the default is `column`.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction
   *  for more details.
   */
  flexDirection: ReactPropTypes.oneOf([
    'row',
    'row-reverse',
    'column',
    'column-reverse',
  ]),

  /** `flexWrap` controls whether children can wrap around after they
   *  hit the end of a flex container.
   *  It works like `flex-wrap` in CSS (default: nowrap).
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap
   *  for more details.
   */
  flexWrap: ReactPropTypes.oneOf(['wrap', 'nowrap', 'wrap-reverse']),

  /** `justifyContent` aligns children in the main direction.
   *  For example, if children are flowing vertically, `justifyContent`
   *  controls how they align vertically.
   *  It works like `justify-content` in CSS (default: flex-start).
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content
   *  for more details.
   */
  justifyContent: ReactPropTypes.oneOf([
    'flex-start',
    'flex-end',
    'center',
    'space-between',
    'space-around',
    'space-evenly',
  ]),

  /** `alignItems` aligns children in the cross direction.
   *  For example, if children are flowing vertically, `alignItems`
   *  controls how they align horizontally.
   *  It works like `align-items` in CSS (default: stretch).
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/align-items
   *  for more details.
   */
  alignItems: ReactPropTypes.oneOf([
    'flex-start',
    'flex-end',
    'center',
    'stretch',
    'baseline',
  ]),

  /** `alignSelf` controls how a child aligns in the cross direction,
   *  overriding the `alignItems` of the parent. It works like `align-self`
   *  in CSS (default: auto).
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/align-self
   *  for more details.
   */
  alignSelf: ReactPropTypes.oneOf([
    'auto',
    'flex-start',
    'flex-end',
    'center',
    'stretch',
    'baseline',
  ]),

  /** `alignContent` controls how rows align in the cross direction,
   *  overriding the `alignContent` of the parent.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/align-content
   *  for more details.
   */
  alignContent: ReactPropTypes.oneOf([
    'flex-start',
    'flex-end',
    'center',
    'stretch',
    'space-between',
    'space-around',
  ]),

  /** `overflow` controls how children are measured and displayed.
   *  `overflow: hidden` causes views to be clipped while `overflow: scroll`
   *  causes views to be measured independently of their parents main axis.
   *  It works like `overflow` in CSS (default: visible).
   *  See https://developer.mozilla.org/en/docs/Web/CSS/overflow
   *  for more details.
   *  `overflow: visible` only works on iOS. On Android, all views will clip
   *  their children.
   */
  overflow: ReactPropTypes.oneOf(['visible', 'hidden', 'scroll']),

  /** In React Native `flex` does not work the same way that it does in CSS.
   *  `flex` is a number rather than a string, and it works
   *  according to the `Yoga` library
   *  at https://github.com/facebook/yoga
   *
   *  When `flex` is a positive number, it makes the component flexible
   *  and it will be sized proportional to its flex value. So a
   *  component with `flex` set to 2 will take twice the space as a
   *  component with `flex` set to 1.
   *
   *  When `flex` is 0, the component is sized according to `width`
   *  and `height` and it is inflexible.
   *
   *  When `flex` is -1, the component is normally sized according
   *  `width` and `height`. However, if there's not enough space,
   *  the component will shrink to its `minWidth` and `minHeight`.
   *
   * flexGrow, flexShrink, and flexBasis work the same as in CSS.
   */
  flex: ReactPropTypes.number,
  flexGrow: ReactPropTypes.number,
  flexShrink: ReactPropTypes.number,
  flexBasis: ReactPropTypes.oneOfType([
    ReactPropTypes.number,
    ReactPropTypes.string,
  ]),

  /**
   * Aspect ratio control the size of the undefined dimension of a node. Aspect ratio is a
   * non-standard property only available in react native and not CSS.
   *
   * - On a node with a set width/height aspect ratio control the size of the unset dimension
   * - On a node with a set flex basis aspect ratio controls the size of the node in the cross axis
   *   if unset
   * - On a node with a measure function aspect ratio works as though the measure function measures
   *   the flex basis
   * - On a node with flex grow/shrink aspect ratio controls the size of the node in the cross axis
   *   if unset
   * - Aspect ratio takes min/max dimensions into account
   */
  aspectRatio: ReactPropTypes.number,

  /** `zIndex` controls which components display on top of others.
   *  Normally, you don't use `zIndex`. Components render according to
   *  their order in the document tree, so later components draw over
   *  earlier ones. `zIndex` may be useful if you have animations or custom
   *  modal interfaces where you don't want this behavior.
   *
   *  It works like the CSS `z-index` property - components with a larger
   *  `zIndex` will render on top. Think of the z-direction like it's
   *  pointing from the phone into your eyeball.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/z-index for
   *  more details.
   */
  zIndex: ReactPropTypes.number,

  /** `direction` specifies the directional flow of the user interface.
   *  The default is `inherit`, except for root node which will have
   *  value based on the current locale.
   *  See https://facebook.github.io/yoga/docs/rtl/
   *  for more details.
   *  @platform ios
   */
  direction: ReactPropTypes.oneOf(['inherit', 'ltr', 'rtl']),
};

module.exports = LayoutPropTypes;
