/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type AnimatedNode from '../Animated/nodes/AnimatedNode';
import type {ImageResizeMode} from './../Image/ImageResizeMode';
import type {
  ____DangerouslyImpreciseStyle_InternalOverrides,
  ____ImageStyle_InternalOverrides,
  ____ShadowStyle_InternalOverrides,
  ____TextStyle_InternalOverrides,
  ____ViewStyle_InternalOverrides,
} from './private/_StyleSheetTypesOverrides';
import type {____TransformStyle_Internal} from './private/_TransformStyle';

declare export opaque type NativeColorValue;
export type ____ColorValue_Internal = null | string | number | NativeColorValue;
export type ColorArrayValue = null | $ReadOnlyArray<____ColorValue_Internal>;
export type PointValue = {
  x: number,
  y: number,
};
export type EdgeInsetsValue = {
  top: number,
  left: number,
  right: number,
  bottom: number,
};

export type DimensionValue = number | string | 'auto' | AnimatedNode | null;
export type AnimatableNumericValue = number | AnimatedNode;

export type CursorValue = 'auto' | 'pointer';

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
type ____LayoutStyle_Internal = $ReadOnly<{
  /** `display` sets the display type of this component.
   *
   *  It works similarly to `display` in CSS, but only support 'flex' and 'none'.
   *  'flex' is the default.
   */
  display?: 'none' | 'flex' | 'contents',

  /** `width` sets the width of this component.
   *
   *  It works similarly to `width` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/width for more details.
   */
  width?: DimensionValue,

  /** `height` sets the height of this component.
   *
   *  It works similarly to `height` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/height for more details.
   */
  height?: DimensionValue,

  /** `bottom` is the number of logical pixels to offset the bottom edge of
   *  this component.
   *
   *  It works similarly to `bottom` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/bottom
   *  for more details of how `bottom` affects layout.
   */
  bottom?: DimensionValue,

  /**
   * When the direction is `ltr`, `end` is equivalent to `right`.
   * When the direction is `rtl`, `end` is equivalent to `left`.
   *
   * This style takes precedence over the `left` and `right` styles.
   */
  end?: DimensionValue,

  /** `left` is the number of logical pixels to offset the left edge of
   *  this component.
   *
   *  It works similarly to `left` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/left
   *  for more details of how `left` affects layout.
   */
  left?: DimensionValue,

  /** `right` is the number of logical pixels to offset the right edge of
   *  this component.
   *
   *  It works similarly to `right` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/right
   *  for more details of how `right` affects layout.
   */
  right?: DimensionValue,

  /**
   * When the direction is `ltr`, `start` is equivalent to `left`.
   * When the direction is `rtl`, `start` is equivalent to `right`.
   *
   * This style takes precedence over the `left`, `right`, and `end` styles.
   */
  start?: DimensionValue,

  /** `top` is the number of logical pixels to offset the top edge of
   *  this component.
   *
   *  It works similarly to `top` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/top
   *  for more details of how `top` affects layout.
   */
  top?: DimensionValue,

  /** `inset` is a shorthand that corresponds to the top, right, bottom, and/or left properties.
   *
   *  It works similarly to `inset` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/inset
   *  for more details of how `inset` affects layout.
   */
  inset?: DimensionValue,

  /** `insetBlock` is a shorthand that corresponds to the `insetBlockStart` and `insetBlockEnd` properties.
   *
   *  It works similarly to `inset-block` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/inset-block
   *  for more details of how `inset-block` affects layout.
   */
  insetBlock?: DimensionValue,

  /** `insetBlockEnd` is a logical property that sets the length that an
   *  element is offset in the block direction from its ending edge.
   *
   *  It works similarly to `inset-block-end` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/inset-block-end
   *  for more details of how `inset-block-end` affects layout.
   */
  insetBlockEnd?: DimensionValue,

  /** `insetBlockStart` is a logical property that sets the length that an
   *  element is offset in the block direction from its starting edge.
   *
   *  It works similarly to `inset-block-start` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/inset-block-start
   *  for more details of how `inset-block-start` affects layout.
   */
  insetBlockStart?: DimensionValue,

  /** `insetInline` is a shorthand that corresponds to the `insetInlineStart` and `insetInlineEnd` properties.
   *
   *  It works similarly to `inset-inline` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/inset-inline
   *  for more details of how `inset-inline` affects layout.
   */
  insetInline?: DimensionValue,

  /** `insetInlineEnd` is a logical property that sets the length that an
   *  element is offset in the starting inline direction.
   *
   *  It works similarly to `inset-inline-end` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/inset-inline-end
   *  for more details of how `inset-inline-end` affects layout.
   */
  insetInlineEnd?: DimensionValue,

  /** `insetInlineStart` is a logical property that sets the length that an
   *  element is offset in the starting inline direction.
   *
   *  It works similarly to `inset-inline-start` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/inset-inline-start
   *  for more details of how `inset-inline-start` affects layout.
   */
  insetInlineStart?: DimensionValue,

  /** `minWidth` is the minimum width for this component, in logical pixels.
   *
   *  It works similarly to `min-width` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/min-width
   *  for more details.
   */
  minWidth?: DimensionValue,

  /** `maxWidth` is the maximum width for this component, in logical pixels.
   *
   *  It works similarly to `max-width` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/max-width
   *  for more details.
   */
  maxWidth?: DimensionValue,

  /** `minHeight` is the minimum height for this component, in logical pixels.
   *
   *  It works similarly to `min-height` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/min-height
   *  for more details.
   */
  minHeight?: DimensionValue,

  /** `maxHeight` is the maximum height for this component, in logical pixels.
   *
   *  It works similarly to `max-height` in CSS, but in React Native you
   *  must use points or percentages. Ems and other units are not supported.
   *
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/max-height
   *  for more details.
   */
  maxHeight?: DimensionValue,

  /** Setting `margin` has the same effect as setting each of
   *  `marginTop`, `marginLeft`, `marginBottom`, and `marginRight`.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/margin
   *  for more details.
   */
  margin?: DimensionValue,

  /** Setting `marginBlock` has the same effect as setting both
   *  `marginTop` and `marginBottom`.
   */
  marginBlock?: DimensionValue,

  /** `marginBlockEnd` works like `margin-block-end`in CSS. Because React
   *  Native doesn not support `writing-mode` this is always mapped to
   *  `margin-bottom`. See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-block-end
   *  for more details.
   */
  marginBlockEnd?: DimensionValue,

  /** `marginBlockEnd` works like `margin-block-end`in CSS. Because React
   *  Native doesn not support `writing-mode` this is always mapped to
   *  `margin-top`. See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-block-end
   *  for more details.
   */
  marginBlockStart?: DimensionValue,

  /** `marginBottom` works like `margin-bottom` in CSS.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-block-start
   *  for more details.
   */
  marginBottom?: DimensionValue,

  /**
   * When direction is `ltr`, `marginEnd` is equivalent to `marginRight`.
   * When direction is `rtl`, `marginEnd` is equivalent to `marginLeft`.
   */
  marginEnd?: DimensionValue,

  /** Setting `marginHorizontal` has the same effect as setting
   *  both `marginLeft` and `marginRight`.
   */
  marginHorizontal?: DimensionValue,

  /** Setting `marginInline` has the same effect as setting
   *  both `marginLeft` and `marginRight`.
   */
  marginInline?: DimensionValue,

  /**
   * When direction is `ltr`, `marginInlineEnd` is equivalent to `marginRight`.
   * When direction is `rtl`, `marginInlineEnd` is equivalent to `marginLeft`.
   */
  marginInlineEnd?: DimensionValue,

  /**
   * When direction is `ltr`, `marginInlineStart` is equivalent to `marginLeft`.
   * When direction is `rtl`, `marginInlineStart` is equivalent to `marginRight`.
   */
  marginInlineStart?: DimensionValue,

  /** `marginLeft` works like `margin-left` in CSS.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-left
   *  for more details.
   */
  marginLeft?: DimensionValue,

  /** `marginRight` works like `margin-right` in CSS.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-right
   *  for more details.
   */
  marginRight?: DimensionValue,

  /**
   * When direction is `ltr`, `marginStart` is equivalent to `marginLeft`.
   * When direction is `rtl`, `marginStart` is equivalent to `marginRight`.
   */
  marginStart?: DimensionValue,

  /** `marginTop` works like `margin-top` in CSS.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/margin-top
   *  for more details.
   */
  marginTop?: DimensionValue,

  /** Setting `marginVertical` has the same effect as setting both
   *  `marginTop` and `marginBottom`.
   */
  marginVertical?: DimensionValue,

  /** Setting `padding` has the same effect as setting each of
   *  `paddingTop`, `paddingBottom`, `paddingLeft`, and `paddingRight`.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/padding
   *  for more details.
   */
  padding?: DimensionValue,

  /** Setting `paddingBlock` is like setting both of
   *  `paddingTop` and `paddingBottom`.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-block
   * for more details.
   */
  paddingBlock?: DimensionValue,

  /** `paddingBlockEnd` works like `padding-bottom` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-block-end
   * for more details.
   */
  paddingBlockEnd?: DimensionValue,

  /** `paddingBlockStart` works like `padding-top` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-block-start
   * for more details.
   */
  paddingBlockStart?: DimensionValue,

  /** `paddingBottom` works like `padding-bottom` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-bottom
   * for more details.
   */
  paddingBottom?: DimensionValue,

  /**
   * When direction is `ltr`, `paddingEnd` is equivalent to `paddingRight`.
   * When direction is `rtl`, `paddingEnd` is equivalent to `paddingLeft`.
   */
  paddingEnd?: DimensionValue,

  /** Setting `paddingHorizontal` is like setting both of
   *  `paddingLeft` and `paddingRight`.
   */
  paddingHorizontal?: DimensionValue,

  /** Setting `paddingInline` is like setting both of
   *  `paddingLeft` and `paddingRight`.
   */
  paddingInline?: DimensionValue,

  /**
   * When direction is `ltr`, `paddingInlineEnd` is equivalent to `paddingRight`.
   * When direction is `rtl`, `paddingInlineEnd` is equivalent to `paddingLeft`.
   */
  paddingInlineEnd?: DimensionValue,

  /**
   * When direction is `ltr`, `paddingInlineStart` is equivalent to `paddingLeft`.
   * When direction is `rtl`, `paddingInlineStart` is equivalent to `paddingRight`.
   */
  paddingInlineStart?: DimensionValue,

  /** `paddingLeft` works like `padding-left` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-left
   * for more details.
   */
  paddingLeft?: DimensionValue,

  /** `paddingRight` works like `padding-right` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-right
   * for more details.
   */
  paddingRight?: DimensionValue,

  /**
   * When direction is `ltr`, `paddingStart` is equivalent to `paddingLeft`.
   * When direction is `rtl`, `paddingStart` is equivalent to `paddingRight`.
   */
  paddingStart?: DimensionValue,

  /** `paddingTop` works like `padding-top` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/padding-top
   * for more details.
   */
  paddingTop?: DimensionValue,

  /** Setting `paddingVertical` is like setting both of
   *  `paddingTop` and `paddingBottom`.
   */
  paddingVertical?: DimensionValue,

  /** `borderWidth` works like `border-width` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/border-width
   * for more details.
   */
  borderWidth?: number,

  /** `borderBottomWidth` works like `border-bottom-width` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/border-bottom-width
   * for more details.
   */
  borderBottomWidth?: number,

  /**
   * When direction is `ltr`, `borderEndWidth` is equivalent to `borderRightWidth`.
   * When direction is `rtl`, `borderEndWidth` is equivalent to `borderLeftWidth`.
   */
  borderEndWidth?: number,

  /** `borderLeftWidth` works like `border-left-width` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/border-left-width
   * for more details.
   */
  borderLeftWidth?: number,

  /** `borderRightWidth` works like `border-right-width` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/border-right-width
   * for more details.
   */
  borderRightWidth?: number,

  /**
   * When direction is `ltr`, `borderStartWidth` is equivalent to `borderLeftWidth`.
   * When direction is `rtl`, `borderStartWidth` is equivalent to `borderRightWidth`.
   */
  borderStartWidth?: number,

  /** `borderTopWidth` works like `border-top-width` in CSS.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/border-top-width
   * for more details.
   */
  borderTopWidth?: number,

  /** `position` in React Native is similar to regular CSS, but
   *  everything is set to `relative` by default.
   *
   *  If you want to position a child using specific numbers of logical
   *  pixels relative to its parent, set the child to have `absolute`
   *  position.
   *
   *  If you want to position a child relative to something
   *  that is not its parent, set the child to have `absolute` position and the
   *  nodes between to have `static` position.
   *
   *  Note that `static` is only available on the new renderer.
   *
   *  See https://github.com/facebook/yoga
   *  for more details on how `position` differs between React Native
   *  and CSS.
   */
  position?: 'absolute' | 'relative' | 'static',

  /** `flexDirection` controls which directions children of a container go.
   *  `row` goes left to right, `column` goes top to bottom, and you may
   *  be able to guess what the other two do. It works like `flex-direction`
   *  in CSS, except the default is `column`.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction
   *  for more details.
   */
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse',

  /** `flexWrap` controls whether children can wrap around after they
   *  hit the end of a flex container.
   *  It works like `flex-wrap` in CSS (default: nowrap).
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap
   *  for more details.
   */
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse',

  /** `justifyContent` aligns children in the main direction.
   *  For example, if children are flowing vertically, `justifyContent`
   *  controls how they align vertically.
   *  It works like `justify-content` in CSS (default: flex-start).
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content
   *  for more details.
   */
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly',

  /** `alignItems` aligns children in the cross direction.
   *  For example, if children are flowing vertically, `alignItems`
   *  controls how they align horizontally.
   *  It works like `align-items` in CSS (default: stretch).
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/align-items
   *  for more details.
   */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',

  /** `alignSelf` controls how a child aligns in the cross direction,
   *  overriding the `alignItems` of the parent. It works like `align-self`
   *  in CSS (default: auto).
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/align-self
   *  for more details.
   */
  alignSelf?:
    | 'auto'
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'baseline',

  /** `alignContent` controls how rows align in the cross direction,
   *  overriding the `alignContent` of the parent.
   *  See https://developer.mozilla.org/en-US/docs/Web/CSS/align-content
   *  for more details.
   */
  alignContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around'
    | 'space-evenly',

  /** `overflow` controls how children are measured and displayed.
   *  `overflow: hidden` causes views to be clipped while `overflow: scroll`
   *  causes views to be measured independently of their parents main axis.
   *  It works like `overflow` in CSS (default: visible).
   *  See https://developer.mozilla.org/en/docs/Web/CSS/overflow
   *  for more details.
   *  `overflow: visible` only works on iOS. On Android, all views will clip
   *  their children.
   */
  overflow?: 'visible' | 'hidden' | 'scroll',

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
  flex?: number,
  flexGrow?: number,
  flexShrink?: number,
  flexBasis?: number | string,

  /**
   * Aspect ratio control the size of the undefined dimension of a node.
   *
   * - On a node with a set width/height aspect ratio control the size of the unset dimension
   * - On a node with a set flex basis aspect ratio controls the size of the node in the cross axis
   *   if unset
   * - On a node with a measure function aspect ratio works as though the measure function measures
   *   the flex basis
   * - On a node with flex grow/shrink aspect ratio controls the size of the node in the cross axis
   *   if unset
   * - Aspect ratio takes min/max dimensions into account
   *
   * Supports a number or a ratio, e.g.:
   * - aspectRatio: '1 / 1'
   * - aspectRatio: '1'
   * - aspectRatio: '1'
   */
  aspectRatio?: number | string,

  /**
   * Box sizing controls whether certain size properties apply to the node's
   * content box or border box. The size properties in question include `width`,
   * `height`, `minWidth`, `minHeight`, `maxWidth`, `maxHeight`, and `flexBasis`.
   *
   * e.g: Say a node has 10px of padding and 10px of borders on all
   * sides and a defined `width` and `height` of 100px and 50px. Then the total
   * size of the node (content area + padding + border) would be 100px by 50px
   * under `boxSizing: border-box` and 120px by 70px under
   * `boxSizing: content-box`.
   */
  boxSizing?: 'border-box' | 'content-box',

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
  zIndex?: number,

  /** `direction` specifies the directional flow of the user interface.
   *  The default is `inherit`, except for root node which will have
   *  value based on the current locale.
   *  See https://yogalayout.dev/docs/layout-direction
   *  for more details.
   *  @platform ios
   */
  direction?: 'inherit' | 'ltr' | 'rtl',

  /**
   * In React Native, gap works the same way it does in CSS.
   * If there are two or more children in a container, they will be separated from each other
   * by the value of the gap - but the children will not be separated from the edges of their parent container.
   * For horizontal gaps, use columnGap, for vertical gaps, use rowGap, and to apply both at the same time, it's gap.
   * When align-content or justify-content are set to space-between or space-around, the separation
   * between children may be larger than the gap value.
   * See https://developer.mozilla.org/en-US/docs/Web/CSS/gap for more details.
   */
  rowGap?: number | string,
  columnGap?: number | string,
  gap?: number | string,
}>;

/**
 * These props can be used to dynamically generate shadows on views, images, text, etc.
 *
 * Because they are dynamically generated, they may cause performance regressions. Static
 * shadow image asset may be a better way to go for optimal performance.
 *
 * Shadow-related properties are not fully supported on Android.
 * To add a drop shadow to a view use the [`elevation` property](docs/viewstyleproptypes.html#elevation) (Android 5.0+).
 * To customize the color use the [`shadowColor` property](docs/shadow-props.html#shadowColor) (Android 9.0+).
 */
export type ____ShadowStyle_InternalCore = $ReadOnly<{
  /**
   * Sets the drop shadow color
   * @platform ios
   */
  shadowColor?: ____ColorValue_Internal,
  /**
   * Sets the drop shadow offset
   * @platform ios
   */
  shadowOffset?: $ReadOnly<{
    width?: number,
    height?: number,
  }>,
  /**
   * Sets the drop shadow opacity (multiplied by the color's alpha component)
   * @platform ios
   */
  shadowOpacity?: AnimatableNumericValue,
  /**
   * Sets the drop shadow blur radius
   * @platform ios
   */
  shadowRadius?: number,
}>;

export type ____ShadowStyle_Internal = $ReadOnly<{
  ...____ShadowStyle_InternalCore,
  ...____ShadowStyle_InternalOverrides,
}>;

export type FilterFunction =
  | {brightness: number | string}
  | {blur: number | string}
  | {contrast: number | string}
  | {grayscale: number | string}
  | {hueRotate: number | string}
  | {invert: number | string}
  | {opacity: number | string}
  | {saturate: number | string}
  | {sepia: number | string}
  | {dropShadow: DropShadowValue | string};

export type DropShadowValue = {
  offsetX: number | string,
  offsetY: number | string,
  standardDeviation?: number | string,
  color?: ____ColorValue_Internal,
};

export type GradientValue = {
  type: 'linearGradient',
  // Angle or direction enums
  direction?: string,
  colorStops: $ReadOnlyArray<{
    color: ____ColorValue_Internal,
    positions?: $ReadOnlyArray<string>,
  }>,
};

export type BoxShadowValue = {
  offsetX: number | string,
  offsetY: number | string,
  color?: ____ColorValue_Internal,
  blurRadius?: number | string,
  spreadDistance?: number | string,
  inset?: boolean,
};

type ____BlendMode_Internal =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export type ____ViewStyle_InternalCore = $ReadOnly<{
  ...$Exact<____LayoutStyle_Internal>,
  ...$Exact<____ShadowStyle_Internal>,
  ...$Exact<____TransformStyle_Internal>,
  backfaceVisibility?: 'visible' | 'hidden',
  backgroundColor?: ____ColorValue_Internal,
  borderColor?: ____ColorValue_Internal,
  borderCurve?: 'circular' | 'continuous',
  borderBottomColor?: ____ColorValue_Internal,
  borderEndColor?: ____ColorValue_Internal,
  borderLeftColor?: ____ColorValue_Internal,
  borderRightColor?: ____ColorValue_Internal,
  borderStartColor?: ____ColorValue_Internal,
  borderTopColor?: ____ColorValue_Internal,
  borderBlockColor?: ____ColorValue_Internal,
  borderBlockEndColor?: ____ColorValue_Internal,
  borderBlockStartColor?: ____ColorValue_Internal,
  borderRadius?: AnimatableNumericValue | string,
  borderBottomEndRadius?: AnimatableNumericValue | string,
  borderBottomLeftRadius?: AnimatableNumericValue | string,
  borderBottomRightRadius?: AnimatableNumericValue | string,
  borderBottomStartRadius?: AnimatableNumericValue | string,
  borderEndEndRadius?: AnimatableNumericValue | string,
  borderEndStartRadius?: AnimatableNumericValue | string,
  borderStartEndRadius?: AnimatableNumericValue | string,
  borderStartStartRadius?: AnimatableNumericValue | string,
  borderTopEndRadius?: AnimatableNumericValue | string,
  borderTopLeftRadius?: AnimatableNumericValue | string,
  borderTopRightRadius?: AnimatableNumericValue | string,
  borderTopStartRadius?: AnimatableNumericValue | string,
  borderStyle?: 'solid' | 'dotted' | 'dashed',
  borderWidth?: AnimatableNumericValue,
  borderBottomWidth?: AnimatableNumericValue,
  borderEndWidth?: AnimatableNumericValue,
  borderLeftWidth?: AnimatableNumericValue,
  borderRightWidth?: AnimatableNumericValue,
  borderStartWidth?: AnimatableNumericValue,
  borderTopWidth?: AnimatableNumericValue,
  opacity?: AnimatableNumericValue,
  outlineColor?: ____ColorValue_Internal,
  outlineOffset?: AnimatableNumericValue,
  outlineStyle?: 'solid' | 'dotted' | 'dashed',
  outlineWidth?: AnimatableNumericValue,
  elevation?: number,
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only',
  cursor?: CursorValue,
  boxShadow?: $ReadOnlyArray<BoxShadowValue> | string,
  filter?: $ReadOnlyArray<FilterFunction> | string,
  mixBlendMode?: ____BlendMode_Internal,
  experimental_backgroundImage?: $ReadOnlyArray<GradientValue> | string,
  isolation?: 'auto' | 'isolate',
}>;

export type ____ViewStyle_Internal = $ReadOnly<{
  ...____ViewStyle_InternalCore,
  ...____ViewStyle_InternalOverrides,
}>;

export type FontStyleType = {
  fontFamily: string,
  fontWeight: ____FontWeight_Internal,
};

export type FontStyleMap = {
  ultraLight: FontStyleType,
  thin: FontStyleType,
  light: FontStyleType,
  regular: FontStyleType,
  medium: FontStyleType,
  semibold: FontStyleType,
  bold: FontStyleType,
  heavy: FontStyleType,
  black: FontStyleType,
};

export type ____FontWeight_Internal =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'medium'
  | 'regular'
  | 'semibold'
  | 'condensedBold'
  | 'condensed'
  | 'heavy'
  | 'black';

export type ____FontVariantArray_Internal = $ReadOnlyArray<
  | 'small-caps'
  | 'oldstyle-nums'
  | 'lining-nums'
  | 'tabular-nums'
  | 'common-ligatures'
  | 'no-common-ligatures'
  | 'discretionary-ligatures'
  | 'no-discretionary-ligatures'
  | 'historical-ligatures'
  | 'no-historical-ligatures'
  | 'contextual'
  | 'no-contextual'
  | 'proportional-nums'
  | 'stylistic-one'
  | 'stylistic-two'
  | 'stylistic-three'
  | 'stylistic-four'
  | 'stylistic-five'
  | 'stylistic-six'
  | 'stylistic-seven'
  | 'stylistic-eight'
  | 'stylistic-nine'
  | 'stylistic-ten'
  | 'stylistic-eleven'
  | 'stylistic-twelve'
  | 'stylistic-thirteen'
  | 'stylistic-fourteen'
  | 'stylistic-fifteen'
  | 'stylistic-sixteen'
  | 'stylistic-seventeen'
  | 'stylistic-eighteen'
  | 'stylistic-nineteen'
  | 'stylistic-twenty',
>;

export type ____TextStyle_InternalCore = $ReadOnly<{
  ...$Exact<____ViewStyle_Internal>,
  color?: ____ColorValue_Internal,
  fontFamily?: string,
  fontSize?: number,
  fontStyle?: 'normal' | 'italic',
  fontWeight?: ____FontWeight_Internal,
  fontVariant?: ____FontVariantArray_Internal | string,
  textShadowOffset?: $ReadOnly<{
    width: number,
    height: number,
  }>,
  textShadowRadius?: number,
  textShadowColor?: ____ColorValue_Internal,
  letterSpacing?: number,
  lineHeight?: number,
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify',
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center',
  includeFontPadding?: boolean,
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through',
  textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed',
  textDecorationColor?: ____ColorValue_Internal,
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase',
  userSelect?: 'auto' | 'text' | 'none' | 'contain' | 'all',
  verticalAlign?: 'auto' | 'top' | 'bottom' | 'middle',
  writingDirection?: 'auto' | 'ltr' | 'rtl',
}>;

export type ____TextStyle_Internal = $ReadOnly<{
  ...____TextStyle_InternalCore,
  ...____TextStyle_InternalOverrides,
}>;

export type ____ImageStyle_InternalCore = $ReadOnly<{
  ...$Exact<____ViewStyle_Internal>,
  resizeMode?: ImageResizeMode,
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none',
  tintColor?: ____ColorValue_Internal,
  overlayColor?: string,
}>;

export type ____ImageStyle_Internal = $ReadOnly<{
  ...____ImageStyle_InternalCore,
  ...____ImageStyle_InternalOverrides,
}>;

export type ____DangerouslyImpreciseStyle_InternalCore = $ReadOnly<{
  ...$Exact<____TextStyle_Internal>,
  resizeMode?: ImageResizeMode,
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none',
  tintColor?: ____ColorValue_Internal,
  overlayColor?: string,
}>;

export type ____DangerouslyImpreciseStyle_Internal = $ReadOnly<{
  ...____DangerouslyImpreciseStyle_InternalCore,
  ...____DangerouslyImpreciseStyle_InternalOverrides,
  ...
}>;

type GenericStyleProp<+T> =
  | null
  | void
  | T
  | false
  | ''
  | $ReadOnlyArray<GenericStyleProp<T>>;

export type ____DangerouslyImpreciseStyleProp_Internal = GenericStyleProp<
  Partial<____DangerouslyImpreciseStyle_Internal>,
>;
export type ____ViewStyleProp_Internal = GenericStyleProp<
  $ReadOnly<Partial<____ViewStyle_Internal>>,
>;
export type ____TextStyleProp_Internal = GenericStyleProp<
  $ReadOnly<Partial<____TextStyle_Internal>>,
>;
export type ____ImageStyleProp_Internal = GenericStyleProp<
  $ReadOnly<Partial<____ImageStyle_Internal>>,
>;

export type ____Styles_Internal = {
  // $FlowFixMe[incompatible-exact]
  // $FlowFixMe[incompatible-type]
  +[key: string]: Partial<____DangerouslyImpreciseStyle_Internal>,
  ...
};

export type ____FlattenStyleProp_Internal<
  +TStyleProp: GenericStyleProp<mixed>,
> = TStyleProp extends null | void | false | ''
  ? empty
  : TStyleProp extends $ReadOnlyArray<infer V>
    ? ____FlattenStyleProp_Internal<V>
    : TStyleProp;
