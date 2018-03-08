/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule StyleSheetTypes
 * @flow
 * @format
 */

'use strict';

import AnimatedNode from 'AnimatedNode';

export opaque type ____StyleSheetInternalStyleIdentifier_Internal: number = number;

export type ColorValue = null | string;
export type DimensionValue = null | number | string | AnimatedNode;

export type LayoutStyle = $ReadOnly<{|
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
  flexWrap?: 'wrap' | 'nowrap',
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

export type TransformStyle = $ReadOnly<{|
  transform?: $ReadOnlyArray<
    | {|+perspective: number | AnimatedNode|}
    | {|+rotate: string|}
    | {|+rotateX: string|}
    | {|+rotateY: string|}
    | {|+rotateZ: string|}
    | {|+scale: number | AnimatedNode|}
    | {|+scaleX: number | AnimatedNode|}
    | {|+scaleY: number | AnimatedNode|}
    | {|+translateX: number | AnimatedNode|}
    | {|+translateY: number | AnimatedNode|}
    | {|
      +translate: [number | AnimatedNode, number | AnimatedNode] | AnimatedNode,
    |}
    | {|+skewX: string|}
    | {|+skewY: string|}
    // TODO: what is the actual type it expects?
    | {|
      +matrix: $ReadOnlyArray<number | AnimatedNode> | AnimatedNode,
    |},
  >,
|}>;

export type ShadowStyle = $ReadOnly<{|
  shadowColor?: ColorValue,
  shadowOffset?: $ReadOnly<{|
    width?: number,
    height?: number,
  |}>,
  shadowOpacity?: number | AnimatedNode,
  shadowRadius?: number,
|}>;

export type ViewStyle = $ReadOnly<{|
  ...$Exact<LayoutStyle>,
  ...$Exact<ShadowStyle>,
  ...$Exact<TransformStyle>,
  backfaceVisibility?: 'visible' | 'hidden',
  backgroundColor?: ColorValue,
  borderColor?: ColorValue,
  borderBottomColor?: ColorValue,
  borderEndColor?: ColorValue,
  borderLeftColor?: ColorValue,
  borderRightColor?: ColorValue,
  borderStartColor?: ColorValue,
  borderTopColor?: ColorValue,
  borderRadius?: number,
  borderBottomEndRadius?: number,
  borderBottomLeftRadius?: number,
  borderBottomRightRadius?: number,
  borderBottomStartRadius?: number,
  borderTopEndRadius?: number,
  borderTopLeftRadius?: number,
  borderTopRightRadius?: number,
  borderTopStartRadius?: number,
  borderStyle?: 'solid' | 'dotted' | 'dashed',
  borderWidth?: number,
  borderBottomWidth?: number,
  borderEndWidth?: number,
  borderLeftWidth?: number,
  borderRightWidth?: number,
  borderStartWidth?: number,
  borderTopWidth?: number,
  opacity?: number | AnimatedNode,
  elevation?: number,
|}>;

export type TextStyle = $ReadOnly<{|
  ...$Exact<ViewStyle>,
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
    width?: number,
    height?: number,
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
  writingDirection?: 'auto' | 'ltr' | 'rtl',
|}>;

export type ImageStyle = $ReadOnly<{|
  ...$Exact<ViewStyle>,
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center' | 'repeat',
  tintColor?: ColorValue,
  overlayColor?: string,
|}>;

export type DangerouslyImpreciseStyle = {
  ...$Exact<TextStyle>,
  +resizeMode?: 'contain' | 'cover' | 'stretch' | 'center' | 'repeat',
  +tintColor?: ColorValue,
  +overlayColor?: string,
};

type GenericStyleProp<+T> =
  | null
  | void
  | T
  | ____StyleSheetInternalStyleIdentifier_Internal
  | number
  | false
  | ''
  | $ReadOnlyArray<GenericStyleProp<T>>;

export type ____DangerouslyImpreciseStyleProp_Internal = GenericStyleProp<
  $Shape<DangerouslyImpreciseStyle>,
>;
export type ____ViewStyleProp_Internal = GenericStyleProp<
  $ReadOnly<$Shape<ViewStyle>>,
>;
export type ____TextStyleProp_Internal = GenericStyleProp<
  $ReadOnly<$Shape<TextStyle>>,
>;
export type ____ImageStyleProp_Internal = GenericStyleProp<
  $ReadOnly<$Shape<ImageStyle>>,
>;

export type ____Styles_Internal = {
  +[key: string]: $Shape<DangerouslyImpreciseStyle>,
};

/*
Utility type get non-nullable types for specific style keys.
Useful when a component requires values for certain Style Keys.
So Instead:
```
type Props = {position: string};
```
You should use:
```
type Props = {position: TypeForStyleKey<'position'>};
```

This will correctly give you the type 'absolute' | 'relative' instead of the
weak type of just string;
*/
export type TypeForStyleKey<
  +key: $Keys<DangerouslyImpreciseStyle>,
> = $ElementType<DangerouslyImpreciseStyle, key>;
