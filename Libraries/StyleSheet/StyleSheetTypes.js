/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const AnimatedNode = require('AnimatedNode');

export type ColorValue = null | string;
export type DimensionValue = null | number | string | AnimatedNode;

export type ____LayoutStyle_Internal = $ReadOnly<{|
  display?: 'none' | 'flex',
  width?: DimensionValue,
  height?: DimensionValue,
  bottom?: DimensionValue,
  end?: DimensionValue,
  left?: DimensionValue,
  right?: DimensionValue,
  start?: DimensionValue,
  top?: DimensionValue,
  minWidth?: DimensionValue,
  maxWidth?: DimensionValue,
  minHeight?: DimensionValue,
  maxHeight?: DimensionValue,
  margin?: DimensionValue,
  marginBottom?: DimensionValue,
  marginEnd?: DimensionValue,
  marginHorizontal?: DimensionValue,
  marginLeft?: DimensionValue,
  marginRight?: DimensionValue,
  marginStart?: DimensionValue,
  marginTop?: DimensionValue,
  marginVertical?: DimensionValue,
  padding?: DimensionValue,
  paddingBottom?: DimensionValue,
  paddingEnd?: DimensionValue,
  paddingHorizontal?: DimensionValue,
  paddingLeft?: DimensionValue,
  paddingRight?: DimensionValue,
  paddingStart?: DimensionValue,
  paddingTop?: DimensionValue,
  paddingVertical?: DimensionValue,
  borderWidth?: number,
  borderBottomWidth?: number,
  borderEndWidth?: number,
  borderLeftWidth?: number,
  borderRightWidth?: number,
  borderStartWidth?: number,
  borderTopWidth?: number,
  position?: 'absolute' | 'relative',
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse',
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse',
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly',
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',
  alignSelf?:
    | 'auto'
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'baseline',
  alignContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around',
  overflow?: 'visible' | 'hidden' | 'scroll',
  flex?: number,
  flexGrow?: number,
  flexShrink?: number,
  flexBasis?: number | string,
  aspectRatio?: number,
  zIndex?: number,
  direction?: 'inherit' | 'ltr' | 'rtl',
|}>;

export type ____TransformStyle_Internal = $ReadOnly<{|
  transform?: $ReadOnlyArray<
    | {|+perspective: number | AnimatedNode|}
    | {|+rotate: string | AnimatedNode|}
    | {|+rotateX: string | AnimatedNode|}
    | {|+rotateY: string | AnimatedNode|}
    | {|+rotateZ: string | AnimatedNode|}
    | {|+scale: number | AnimatedNode|}
    | {|+scaleX: number | AnimatedNode|}
    | {|+scaleY: number | AnimatedNode|}
    | {|+translateX: number | AnimatedNode|}
    | {|+translateY: number | AnimatedNode|}
    | {|
        +translate:
          | [number | AnimatedNode, number | AnimatedNode]
          | AnimatedNode,
      |}
    | {|+skewX: string|}
    | {|+skewY: string|}
    // TODO: what is the actual type it expects?
    | {|
        +matrix: $ReadOnlyArray<number | AnimatedNode> | AnimatedNode,
      |},
  >,
|}>;

export type ____ShadowStyle_Internal = $ReadOnly<{|
  shadowColor?: ColorValue,
  shadowOffset?: $ReadOnly<{|
    width?: number,
    height?: number,
  |}>,
  shadowOpacity?: number | AnimatedNode,
  shadowRadius?: number,
|}>;

export type ____ViewStyle_Internal = $ReadOnly<{|
  ...$Exact<____LayoutStyle_Internal>,
  ...$Exact<____ShadowStyle_Internal>,
  ...$Exact<____TransformStyle_Internal>,
  backfaceVisibility?: 'visible' | 'hidden',
  backgroundColor?: ColorValue,
  borderColor?: ColorValue,
  borderBottomColor?: ColorValue,
  borderEndColor?: ColorValue,
  borderLeftColor?: ColorValue,
  borderRightColor?: ColorValue,
  borderStartColor?: ColorValue,
  borderTopColor?: ColorValue,
  borderRadius?: number | AnimatedNode,
  borderBottomEndRadius?: number | AnimatedNode,
  borderBottomLeftRadius?: number | AnimatedNode,
  borderBottomRightRadius?: number | AnimatedNode,
  borderBottomStartRadius?: number | AnimatedNode,
  borderTopEndRadius?: number | AnimatedNode,
  borderTopLeftRadius?: number | AnimatedNode,
  borderTopRightRadius?: number | AnimatedNode,
  borderTopStartRadius?: number | AnimatedNode,
  borderStyle?: 'solid' | 'dotted' | 'dashed',
  borderWidth?: number | AnimatedNode,
  borderBottomWidth?: number | AnimatedNode,
  borderEndWidth?: number | AnimatedNode,
  borderLeftWidth?: number | AnimatedNode,
  borderRightWidth?: number | AnimatedNode,
  borderStartWidth?: number | AnimatedNode,
  borderTopWidth?: number | AnimatedNode,
  opacity?: number | AnimatedNode,
  elevation?: number,
|}>;

export type ____TextStyle_Internal = $ReadOnly<{|
  ...$Exact<____ViewStyle_Internal>,
  color?: ColorValue,
  fontFamily?: string,
  fontSize?: number,
  fontStyle?: 'normal' | 'italic',
  fontWeight?:
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
    | '900',
  fontVariant?: $ReadOnlyArray<
    | 'small-caps'
    | 'oldstyle-nums'
    | 'lining-nums'
    | 'tabular-nums'
    | 'proportional-nums',
  >,
  textShadowOffset?: $ReadOnly<{|
    width: number,
    height: number,
  |}>,
  textShadowRadius?: number,
  textShadowColor?: ColorValue,
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
  textDecorationColor?: ColorValue,
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase',
  writingDirection?: 'auto' | 'ltr' | 'rtl',
|}>;

export type ____ImageStyle_Internal = $ReadOnly<{|
  ...$Exact<____ViewStyle_Internal>,
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center' | 'repeat',
  tintColor?: ColorValue,
  overlayColor?: string,
|}>;

export type ____DangerouslyImpreciseStyle_Internal = {
  ...$Exact<____TextStyle_Internal>,
  +resizeMode?: 'contain' | 'cover' | 'stretch' | 'center' | 'repeat',
  +tintColor?: ColorValue,
  +overlayColor?: string,
};

type GenericStyleProp<+T> =
  | null
  | void
  | T
  | false
  | ''
  | $ReadOnlyArray<GenericStyleProp<T>>;

export type ____DangerouslyImpreciseStyleProp_Internal = GenericStyleProp<
  $Shape<____DangerouslyImpreciseStyle_Internal>,
>;
export type ____ViewStyleProp_Internal = GenericStyleProp<
  $ReadOnly<$Shape<____ViewStyle_Internal>>,
>;
export type ____TextStyleProp_Internal = GenericStyleProp<
  $ReadOnly<$Shape<____TextStyle_Internal>>,
>;
export type ____ImageStyleProp_Internal = GenericStyleProp<
  $ReadOnly<$Shape<____ImageStyle_Internal>>,
>;

export type ____Styles_Internal = {
  +[key: string]: $Shape<____DangerouslyImpreciseStyle_Internal>,
};
