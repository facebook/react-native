/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {ImageResizeMode} from '../Image/ImageResizeMode';
import {ColorValue} from './StyleSheet';

type FlexAlignType =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'stretch'
  | 'baseline';

/**
 * Flex Prop Types
 * @see https://reactnative.dev/docs/flexbox
 * @see https://reactnative.dev/docs/layout-props
 */
export interface FlexStyle {
  alignContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around'
    | undefined;
  alignItems?: FlexAlignType | undefined;
  alignSelf?: 'auto' | FlexAlignType | undefined;
  aspectRatio?: number | string | undefined;
  borderBottomWidth?: number | undefined;
  borderEndWidth?: number | string | undefined;
  borderLeftWidth?: number | undefined;
  borderRightWidth?: number | undefined;
  borderStartWidth?: number | string | undefined;
  borderTopWidth?: number | undefined;
  borderWidth?: number | undefined;
  bottom?: number | string | undefined;
  display?: 'none' | 'flex' | undefined;
  end?: number | string | undefined;
  flex?: number | undefined;
  flexBasis?: number | string | undefined;
  flexDirection?:
    | 'row'
    | 'column'
    | 'row-reverse'
    | 'column-reverse'
    | undefined;
  rowGap?: number | undefined;
  gap?: number | undefined;
  columnGap?: number | undefined;
  flexGrow?: number | undefined;
  flexShrink?: number | undefined;
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse' | undefined;
  height?: number | string | undefined;
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
    | undefined;
  left?: number | string | undefined;
  margin?: number | string | undefined;
  marginBlock?: number | string | undefined;
  marginBlockEnd?: number | string | undefined;
  marginBlockStart?: number | string | undefined;
  marginBottom?: number | string | undefined;
  marginEnd?: number | string | undefined;
  marginHorizontal?: number | string | undefined;
  marginInline?: number | string | undefined;
  marginInlineEnd?: number | string | undefined;
  marginInlineStart?: number | string | undefined;
  marginLeft?: number | string | undefined;
  marginRight?: number | string | undefined;
  marginStart?: number | string | undefined;
  marginTop?: number | string | undefined;
  marginVertical?: number | string | undefined;
  maxHeight?: number | string | undefined;
  maxWidth?: number | string | undefined;
  minHeight?: number | string | undefined;
  minWidth?: number | string | undefined;
  overflow?: 'visible' | 'hidden' | 'scroll' | undefined;
  padding?: number | string | undefined;
  paddingBottom?: number | string | undefined;
  paddingBlock?: number | string | undefined;
  paddingBlockEnd?: number | string | undefined;
  paddingBlockStart?: number | string | undefined;
  paddingEnd?: number | string | undefined;
  paddingHorizontal?: number | string | undefined;
  paddingInline?: number | string | undefined;
  paddingInlineEnd?: number | string | undefined;
  paddingInlineStart?: number | string | undefined;
  paddingLeft?: number | string | undefined;
  paddingRight?: number | string | undefined;
  paddingStart?: number | string | undefined;
  paddingTop?: number | string | undefined;
  paddingVertical?: number | string | undefined;
  position?: 'absolute' | 'relative' | undefined;
  right?: number | string | undefined;
  start?: number | string | undefined;
  top?: number | string | undefined;
  width?: number | string | undefined;
  zIndex?: number | undefined;

  /**
   * @platform ios
   */
  direction?: 'inherit' | 'ltr' | 'rtl' | undefined;
}

export interface ShadowStyleIOS {
  shadowColor?: ColorValue | undefined;
  shadowOffset?: {width: number; height: number} | undefined;
  shadowOpacity?: number | undefined;
  shadowRadius?: number | undefined;
}

interface PerpectiveTransform {
  perspective: number;
}

interface RotateTransform {
  rotate: string;
}

interface RotateXTransform {
  rotateX: string;
}

interface RotateYTransform {
  rotateY: string;
}

interface RotateZTransform {
  rotateZ: string;
}

interface ScaleTransform {
  scale: number;
}

interface ScaleXTransform {
  scaleX: number;
}

interface ScaleYTransform {
  scaleY: number;
}

interface TranslateXTransform {
  translateX: number;
}

interface TranslateYTransform {
  translateY: number;
}

interface SkewXTransform {
  skewX: string;
}

interface SkewYTransform {
  skewY: string;
}

interface MatrixTransform {
  matrix: number[];
}

export interface TransformsStyle {
  transform?:
    | (
        | PerpectiveTransform
        | RotateTransform
        | RotateXTransform
        | RotateYTransform
        | RotateZTransform
        | ScaleTransform
        | ScaleXTransform
        | ScaleYTransform
        | TranslateXTransform
        | TranslateYTransform
        | SkewXTransform
        | SkewYTransform
        | MatrixTransform
      )[]
    | undefined;
  /**
   * @deprecated Use matrix in transform prop instead.
   */
  transformMatrix?: Array<number> | undefined;
  /**
   * @deprecated Use rotate in transform prop instead.
   */
  rotation?: number | undefined;
  /**
   * @deprecated Use scaleX in transform prop instead.
   */
  scaleX?: number | undefined;
  /**
   * @deprecated Use scaleY in transform prop instead.
   */
  scaleY?: number | undefined;
  /**
   * @deprecated Use translateX in transform prop instead.
   */
  translateX?: number | undefined;
  /**
   * @deprecated Use translateY in transform prop instead.
   */
  translateY?: number | undefined;
}

/**
 * @see https://reactnative.dev/docs/view#style
 */
export interface ViewStyle extends FlexStyle, ShadowStyleIOS, TransformsStyle {
  backfaceVisibility?: 'visible' | 'hidden' | undefined;
  backgroundColor?: ColorValue | undefined;
  borderBottomColor?: ColorValue | undefined;
  borderBottomEndRadius?: number | undefined;
  borderBottomLeftRadius?: number | undefined;
  borderBottomRightRadius?: number | undefined;
  borderBottomStartRadius?: number | undefined;
  borderBottomWidth?: number | undefined;
  borderColor?: ColorValue | undefined;
  borderEndColor?: ColorValue | undefined;
  borderLeftColor?: ColorValue | undefined;
  borderLeftWidth?: number | undefined;
  borderRadius?: number | undefined;
  borderRightColor?: ColorValue | undefined;
  borderRightWidth?: number | undefined;
  borderStartColor?: ColorValue | undefined;
  borderStyle?: 'solid' | 'dotted' | 'dashed' | undefined;
  borderTopColor?: ColorValue | undefined;
  borderTopEndRadius?: number | undefined;
  borderTopLeftRadius?: number | undefined;
  borderTopRightRadius?: number | undefined;
  borderTopStartRadius?: number | undefined;
  borderTopWidth?: number | undefined;
  borderWidth?: number | undefined;
  opacity?: number | undefined;
  testID?: string | undefined;
  /**
   * Sets the elevation of a view, using Android's underlying
   * [elevation API](https://developer.android.com/training/material/shadows-clipping.html#Elevation).
   * This adds a drop shadow to the item and affects z-order for overlapping views.
   * Only supported on Android 5.0+, has no effect on earlier versions.
   *
   * @platform android
   */
  elevation?: number | undefined;
}

export type FontVariant =
  | 'small-caps'
  | 'oldstyle-nums'
  | 'lining-nums'
  | 'tabular-nums'
  | 'proportional-nums';
export interface TextStyleIOS extends ViewStyle {
  fontVariant?: FontVariant[] | undefined;
  letterSpacing?: number | undefined;
  textDecorationColor?: ColorValue | undefined;
  textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed' | undefined;
  writingDirection?: 'auto' | 'ltr' | 'rtl' | undefined;
}

export interface TextStyleAndroid extends ViewStyle {
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center' | undefined;
  verticalAlign?: 'auto' | 'top' | 'bottom' | 'middle' | undefined;
  includeFontPadding?: boolean | undefined;
}

// @see https://reactnative.dev/docs/text#style
export interface TextStyle extends TextStyleIOS, TextStyleAndroid, ViewStyle {
  color?: ColorValue | undefined;
  fontFamily?: string | undefined;
  fontSize?: number | undefined;
  fontStyle?: 'normal' | 'italic' | undefined;
  /**
   * Specifies font weight. The values 'normal' and 'bold' are supported
   * for most fonts. Not all fonts have a variant for each of the numeric
   * values, in that case the closest one is chosen.
   */
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
    | '900'
    | undefined;
  letterSpacing?: number | undefined;
  lineHeight?: number | undefined;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify' | undefined;
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through'
    | undefined;
  textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed' | undefined;
  textDecorationColor?: ColorValue | undefined;
  textShadowColor?: ColorValue | undefined;
  textShadowOffset?: {width: number; height: number} | undefined;
  textShadowRadius?: number | undefined;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined;
  testID?: string | undefined;
}

/**
 * Image style
 * @see https://reactnative.dev/docs/image#style
 */
export interface ImageStyle extends FlexStyle, ShadowStyleIOS, TransformsStyle {
  resizeMode?: ImageResizeMode | undefined;
  backfaceVisibility?: 'visible' | 'hidden' | undefined;
  borderBottomLeftRadius?: number | undefined;
  borderBottomRightRadius?: number | undefined;
  backgroundColor?: ColorValue | undefined;
  borderColor?: ColorValue | undefined;
  borderWidth?: number | undefined;
  borderRadius?: number | undefined;
  borderTopLeftRadius?: number | undefined;
  borderTopRightRadius?: number | undefined;
  overflow?: 'visible' | 'hidden' | undefined;
  overlayColor?: ColorValue | undefined;
  tintColor?: ColorValue | undefined;
  opacity?: number | undefined;
}
