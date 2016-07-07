/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LayoutPropTypes
 * @flow
 */
'use strict';

var ReactPropTypes = require('react/lib/ReactPropTypes');

/**
 * React Native's layout system is based on Flexbox and is powered both
 * on iOS and Android by an open source project called css-layout:
 * https://github.com/facebook/css-layout
 *
 * The implementation in css-layout is slightly different from what the
 * Flexbox spec defines - for example, we chose more sensible default
 * values. Since our layout docs are generated from the comments in this
 * file, please keep a brief comment describing each prop type.
 *
 * These properties are a subset of our styles that are consumed by the layout
 * algorithm and affect the positioning and sizing of views.
 */
var LayoutPropTypes = {
  /** `width` sets the width of this component.
   *
   *  It works similarly to `width` in CSS, but in React Native you
   *  must use logical pixel units, rather than percents, ems, or any of that.
   *  See http://www.w3schools.com/cssref/pr_dim_width.asp for more details.
   */
  width: ReactPropTypes.number,

  /** `height` sets the height of this component.
   *
   *  It works similarly to `height` in CSS, but in React Native you
   *  must use logical pixel units, rather than percents, ems, or any of that.
   *  See http://www.w3schools.com/cssref/pr_dim_width.asp for more details.
   */
  height: ReactPropTypes.number,

  /** `top` is the number of logical pixels to offset the top edge of
   *  this component.
   *
   *  It works similarly to `top` in CSS, but in React Native you must
   *  use logical pixel units, rather than percents, ems, or any of that.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/top
   *  for more details of how `top` affects layout.
   */
  top: ReactPropTypes.number,

  /** `left` is the number of logical pixels to offset the left edge of
   *  this component.
   *
   *  It works similarly to `left` in CSS, but in React Native you must
   *  use logical pixel units, rather than percents, ems, or any of that.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/left
   *  for more details of how `left` affects layout.
   */
  left: ReactPropTypes.number,

  /** `right` is the number of logical pixels to offset the right edge of
   *  this component.
   *
   *  It works similarly to `right` in CSS, but in React Native you must
   *  use logical pixel units, rather than percents, ems, or any of that.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/right
   *  for more details of how `right` affects layout.
   */
  right: ReactPropTypes.number,

  /** `bottom` is the number of logical pixels to offset the bottom edge of
   *  this component.
   *
   *  It works similarly to `bottom` in CSS, but in React Native you must
   *  use logical pixel units, rather than percents, ems, or any of that.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/bottom
   *  for more details of how `top` affects layout.
   */
  bottom: ReactPropTypes.number,

  /** `minWidth` is the minimum width for this component, in logical pixels.
   *
   *  It works similarly to `min-width` in CSS, but in React Native you
   *  must use logical pixel units, rather than percents, ems, or any of that.
   *
   *  See http://www.w3schools.com/cssref/pr_dim_min-width.asp
   *  for more details.
   */
  minWidth: ReactPropTypes.number,

  /** `maxWidth` is the maximum width for this component, in logical pixels.
   *
   *  It works similarly to `max-width` in CSS, but in React Native you
   *  must use logical pixel units, rather than percents, ems, or any of that.
   *
   *  See http://www.w3schools.com/cssref/pr_dim_max-width.asp
   *  for more details.
   */
  maxWidth: ReactPropTypes.number,

  /** `minHeight` is the minimum height for this component, in logical pixels.
   *
   *  It works similarly to `min-height` in CSS, but in React Native you
   *  must use logical pixel units, rather than percents, ems, or any of that.
   *
   *  See http://www.w3schools.com/cssref/pr_dim_min-height.asp
   *  for more details.
   */
  minHeight: ReactPropTypes.number,

  /** `maxHeight` is the maximum height for this component, in logical pixels.
   *
   *  It works similarly to `max-height` in CSS, but in React Native you
   *  must use logical pixel units, rather than percents, ems, or any of that.
   *
   *  See http://www.w3schools.com/cssref/pr_dim_max-height.asp
   *  for more details.
   */
  maxHeight: ReactPropTypes.number,

  /** Setting `margin` has the same effect as setting each of
   *  `marginTop`, `marginLeft`, `marginBottom`, and `marginRight`.
   */
  margin: ReactPropTypes.number,

  /** Setting `marginVertical` has the same effect as setting both
   *  `marginTop` and `marginBottom`.
   */
  marginVertical: ReactPropTypes.number,

  /** Setting `marginHorizontal` has the same effect as setting
   *  both `marginLeft` and `marginRight`.
   */
  marginHorizontal: ReactPropTypes.number,

  /** `marginTop` works like `margin-top` in CSS.
   *  See http://www.w3schools.com/cssref/pr_margin-top.asp
   *  for more details.
   */
  marginTop: ReactPropTypes.number,

  /** `marginBottom` works like `margin-bottom` in CSS.
   *  See http://www.w3schools.com/cssref/pr_margin-bottom.asp
   *  for more details.
   */
  marginBottom: ReactPropTypes.number,

  /** `marginLeft` works like `margin-left` in CSS.
   *  See http://www.w3schools.com/cssref/pr_margin-left.asp
   *  for more details.
   */
  marginLeft: ReactPropTypes.number,

  /** `marginRight` works like `margin-right` in CSS.
   *  See http://www.w3schools.com/cssref/pr_margin-right.asp
   *  for more details.
   */
  marginRight: ReactPropTypes.number,

  /** `padding` works like `padding` in CSS.
   *  It's like setting each of `paddingTop`, `paddingBottom`,
   *  `paddingLeft`, and `paddingRight` to the same thing.
   *  See http://www.w3schools.com/css/css_padding.asp
   *  for more details.
   */
  padding: ReactPropTypes.number,

  /** Setting `paddingVertical` is like setting both of
   *  `paddingTop` and `paddingBottom`.
   */
  paddingVertical: ReactPropTypes.number,

  /** Setting `paddingHorizontal` is like setting both of
   *  `paddingLeft` and `paddingRight`.
   */
  paddingHorizontal: ReactPropTypes.number,

  /** `paddingTop` works like `padding-top` in CSS.
   * See http://www.w3schools.com/cssref/pr_padding-top.asp
   * for more details.
   */
  paddingTop: ReactPropTypes.number,

  /** `paddingBottom` works like `padding-bottom` in CSS.
   * See http://www.w3schools.com/cssref/pr_padding-bottom.asp
   * for more details.
   */
  paddingBottom: ReactPropTypes.number,

  /** `paddingLeft` works like `padding-left` in CSS.
   * See http://www.w3schools.com/cssref/pr_padding-left.asp
   * for more details.
   */
  paddingLeft: ReactPropTypes.number,

  /** `paddingRight` works like `padding-right` in CSS.
   * See http://www.w3schools.com/cssref/pr_padding-right.asp
   * for more details.
   */
  paddingRight: ReactPropTypes.number,

  /** `borderWidth` works like `border-width` in CSS.
   * See http://www.w3schools.com/cssref/pr_border-width.asp
   * for more details.
   */
  borderWidth: ReactPropTypes.number,

  /** `borderTopWidth` works like `border-top-width` in CSS.
   * See http://www.w3schools.com/cssref/pr_border-top_width.asp
   * for more details.
   */
  borderTopWidth: ReactPropTypes.number,

  /** `borderRightWidth` works like `border-right-width` in CSS.
   * See http://www.w3schools.com/cssref/pr_border-right_width.asp
   * for more details.
   */
  borderRightWidth: ReactPropTypes.number,

  /** `borderBottomWidth` works like `border-bottom-width` in CSS.
   * See http://www.w3schools.com/cssref/pr_border-bottom_width.asp
   * for more details.
   */
  borderBottomWidth: ReactPropTypes.number,

  /** `borderLeftWidth` works like `border-left-width` in CSS.
   * See http://www.w3schools.com/cssref/pr_border-bottom_width.asp
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
   *  See https://github.com/facebook/css-layout
   *  for more details on how `position` differs between React Native
   *  and CSS.
   */
  position: ReactPropTypes.oneOf([
    'absolute',
    'relative'
  ]),

  /** `flexDirection` controls which directions children of a container go.
   *  `row` goes left to right, `column` goes top to bottom, and you may
   *  be able to guess what the other two do. It works like `flex-direction`
   *  in CSS, except the default is `column`. See
   *  https://css-tricks.com/almanac/properties/f/flex-direction/
   *  for more detail.
   */
  flexDirection: ReactPropTypes.oneOf([
    'row',
    'row-reverse',
    'column',
    'column-reverse'
  ]),

  /** `flexWrap` controls whether children can wrap around after they
   *  hit the end of a flex container.
   *  It works like `flex-wrap` in CSS. See
   *  https://css-tricks.com/almanac/properties/f/flex-wrap/
   *  for more detail.
   */
  flexWrap: ReactPropTypes.oneOf([
    'wrap',
    'nowrap'
  ]),

  /** `justifyContent` aligns children in the main direction.
   *  For example, if children are flowing vertically, `justifyContent`
   *  controls how they align vertically.
   *  It works like `justify-content` in CSS. See
   *  https://css-tricks.com/almanac/properties/j/justify-content/
   *  for more detail.
   */
  justifyContent: ReactPropTypes.oneOf([
    'flex-start',
    'flex-end',
    'center',
    'space-between',
    'space-around'
  ]),

  /** `alignItems` aligns children in the cross direction.
   *  For example, if children are flowing vertically, `alignItems`
   *  controls how they align horizontally.
   *  It works like `align-items` in CSS, except the default value
   *  is `stretch` instead of `flex-start`. See
   *  https://css-tricks.com/almanac/properties/a/align-items/
   *  for more detail.
   */
  alignItems: ReactPropTypes.oneOf([
    'flex-start',
    'flex-end',
    'center',
    'stretch'
  ]),

  /** `alignSelf` controls how a child aligns in the cross direction,
   *  overriding the `alignItems` of the parent. It works like `align-self`
   *  in CSS. See
   *  https://css-tricks.com/almanac/properties/a/align-self/
   *  for more detail.
   */
  alignSelf: ReactPropTypes.oneOf([
    'auto',
    'flex-start',
    'flex-end',
    'center',
    'stretch'
  ]),

  /** In React Native `flex` does not work the same way that it does in CSS.
   *  `flex` is a number rather than a string, and it works
   *  according to the `css-layout` library
   *  at https://github.com/facebook/css-layout .
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
   */
  flex: ReactPropTypes.number,

  /** `zIndex` controls which components display on top of others.
   *  Normally, you don't use `zIndex`. Components render according to
   *  their order in the document tree, so later components draw over
   *  earlier ones. `zIndex` may be useful if you have animations or custom
   *  modal interfaces where you don't want this behavior.
   *
   *  It works like the CSS `z-index` property - components with a larger
   *  `zIndex` will render on top. Think of the z-direction like it's
   *  pointing from the phone into your eyeball. See
   *  https://developer.mozilla.org/en-US/docs/Web/CSS/z-index for
   *  more detail.
   */
  zIndex: ReactPropTypes.number,
};

module.exports = LayoutPropTypes;
