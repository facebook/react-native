/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule StyleSheetTypes
 * @flow
 * @format
 */

'use strict';

import AnimatedNode from 'AnimatedNode';

export opaque type StyleSheetStyle: number = number;

export type ColorValue = null | string;
export type DimensionValue = null | number | string | AnimatedNode;

export type LayoutStyle<+Dimension = DimensionValue> = {
  +display?: 'none' | 'flex',
  +width?: Dimension,
  +height?: Dimension,
  +top?: Dimension,
  +bottom?: Dimension,
  +left?: Dimension,
  +right?: Dimension,
  +minWidth?: Dimension,
  +maxWidth?: Dimension,
  +minHeight?: Dimension,
  +maxHeight?: Dimension,
  +margin?: Dimension,
  +marginVertical?: Dimension,
  +marginHorizontal?: Dimension,
  +marginTop?: Dimension,
  +marginBottom?: Dimension,
  +marginLeft?: Dimension,
  +marginRight?: Dimension,
  +padding?: Dimension,
  +paddingVertical?: Dimension,
  +paddingHorizontal?: Dimension,
  +paddingTop?: Dimension,
  +paddingBottom?: Dimension,
  +paddingLeft?: Dimension,
  +paddingRight?: Dimension,
  +borderWidth?: number,
  +borderTopWidth?: number,
  +borderBottomWidth?: number,
  +borderLeftWidth?: number,
  +borderRightWidth?: number,
  +position?: 'absolute' | 'relative',
  +flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse',
  +flexWrap?: 'wrap' | 'nowrap',
  +justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around',
  +alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',
  +alignSelf?:
    | 'auto'
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'baseline',
  +alignContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around',
  +overflow?: 'visible' | 'hidden' | 'scroll',
  +flex?: number,
  +flexGrow?: number,
  +flexShrink?: number,
  +flexBasis?: number | string,
  +aspectRatio?: number,
  +zIndex?: number,
  +direction?: 'inherit' | 'ltr' | 'rtl',
};

export type TransformStyle = {
  +transform?: $ReadOnlyArray<
    | {+perspective: number | AnimatedNode}
    | {+rotate: string}
    | {+rotateX: string}
    | {+rotateY: string}
    | {+rotateZ: string}
    | {+scale: number | AnimatedNode}
    | {+scaleX: number | AnimatedNode}
    | {+scaleY: number | AnimatedNode}
    | {+translateX: number | AnimatedNode}
    | {+translateY: number | AnimatedNode}
    | {
      +translate: [number | AnimatedNode, number | AnimatedNode] | AnimatedNode,
    }
    | {+skewX: string}
    | {+skewY: string}
    // TODO: what is the actual type it expects?
    | {+matrix: $ReadOnlyArray<number | AnimatedNode> | AnimatedNode},
  >,
};

export type ShadowStyle<+Color = ColorValue> = {
  +shadowColor?: Color,
  +shadowOffset?: {
    +width?: number,
    +height?: number,
  },
  +shadowOpacity?: number | AnimatedNode,
  +shadowRadius?: number,
};

export type ViewStyle<+Dimension = DimensionValue, +Color = ColorValue> = {
  ...$Exact<LayoutStyle<Dimension>>,
  ...$Exact<ShadowStyle<Color>>,
  ...$Exact<TransformStyle>,
  +backfaceVisibility?: 'visible' | 'hidden',
  +backgroundColor?: Color,
  +borderColor?: Color,
  +borderTopColor?: Color,
  +borderRightColor?: Color,
  +borderBottomColor?: Color,
  +borderLeftColor?: Color,
  +borderRadius?: number,
  +borderTopLeftRadius?: number,
  +borderTopRightRadius?: number,
  +borderBottomLeftRadius?: number,
  +borderBottomRightRadius?: number,
  +borderStyle?: 'solid' | 'dotted' | 'dashed',
  +borderWidth?: number,
  +borderTopWidth?: number,
  +borderRightWidth?: number,
  +borderBottomWidth?: number,
  +borderLeftWidth?: number,
  +opacity?: number | AnimatedNode,
  +elevation?: number,
};

export type TextStyle<+Dimension = DimensionValue, +Color = ColorValue> = {
  ...$Exact<ViewStyle<Dimension, Color>>,
  +color?: Color,
  +fontFamily?: string,
  +fontSize?: number,
  +fontStyle?: 'normal' | 'italic',
  +fontWeight?:
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
  +fontVariant?: $ReadOnlyArray<
    | 'small-caps'
    | 'oldstyle-nums'
    | 'lining-nums'
    | 'tabular-nums'
    | 'proportional-nums',
  >,
  +textShadowOffset?: {+width?: number, +height?: number},
  +textShadowRadius?: number,
  +textShadowColor?: Color,
  +letterSpacing?: number,
  +lineHeight?: number,
  +textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify',
  +textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center',
  +includeFontPadding?: boolean,
  +textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through',
  +textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed',
  +textDecorationColor?: Color,
  +writingDirection?: 'auto' | 'ltr' | 'rtl',
};

export type ImageStyle<+Dimension = DimensionValue, +Color = ColorValue> = {
  ...$Exact<ViewStyle<Dimension, Color>>,
  +resizeMode?: 'contain' | 'cover' | 'stretch' | 'center' | 'repeat',
  +tintColor?: Color,
  +overlayColor?: string,
};

export type Style<+Dimension = DimensionValue, +Color = ColorValue> = {
  ...$Exact<TextStyle<Dimension, Color>>,
  +resizeMode?: 'contain' | 'cover' | 'stretch' | 'center' | 'repeat',
  +tintColor?: Color,
  +overlayColor?: string,
};

export type StyleProp<+T> =
  | null
  | void
  | T
  | StyleSheetStyle
  | number
  | false
  | ''
  | $ReadOnlyArray<StyleProp<T>>;

// export type ViewStyleProp = StyleProp<$Shape<ViewStyle<DimensionValue>>>;
// export type TextStyleProp = StyleProp<
//   $Shape<TextStyle<DimensionValue, ColorValue>>,
// >;
// export type ImageStyleProp = StyleProp<
//   $Shape<ImageStyle<DimensionValue, ColorValue>>,
// >;

export type StyleObj = StyleProp<$Shape<Style<DimensionValue, ColorValue>>>;
export type StyleValue = StyleObj;

export type ViewStyleProp = StyleObj;
export type TextStyleProp = StyleObj;
export type ImageStyleProp = StyleObj;

export type Styles = {
  +[key: string]: $Shape<Style<DimensionValue, ColorValue>>,
};
export type StyleSheet<+S: Styles> = $ObjMap<S, (Object) => StyleSheetStyle>;

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
export type TypeForStyleKey<+key: $Keys<Style<>>> = $ElementType<Style<>, key>;
