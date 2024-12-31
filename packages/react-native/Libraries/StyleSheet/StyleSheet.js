/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {
  ____ColorValue_Internal,
  ____DangerouslyImpreciseStyle_Internal,
  ____DangerouslyImpreciseStyleProp_Internal,
  ____ImageStyle_Internal,
  ____ImageStyleProp_Internal,
  ____Styles_Internal,
  ____TextStyle_Internal,
  ____TextStyleProp_Internal,
  ____ViewStyle_Internal,
  ____ViewStyleProp_Internal,
} from './StyleSheetTypes';

import composeStyles from '../../src/private/styles/composeStyles';

const ReactNativeStyleAttributes = require('../Components/View/ReactNativeStyleAttributes');
const PixelRatio = require('../Utilities/PixelRatio').default;
const flatten = require('./flattenStyle');

export type {NativeColorValue} from './StyleSheetTypes';

/**
 * This type should be used as the type for anything that is a color. It is
 * most useful when using DynamicColorIOS which can be a string or a dynamic
 * color object.
 *
 * type props = {backgroundColor: ColorValue};
 */
export type ColorValue = ____ColorValue_Internal;

/**
 * This type should be used as the type for a prop that is passed through
 * to a <View>'s `style` prop. This ensures call sites of the component
 * can't pass styles that View doesn't support such as `fontSize`.`
 *
 * type Props = {style: ViewStyleProp}
 * const MyComponent = (props: Props) => <View style={props.style} />
 */
export type ViewStyleProp = ____ViewStyleProp_Internal;

/**
 * This type should be used as the type for a prop that is passed through
 * to a <Text>'s `style` prop. This ensures call sites of the component
 * can't pass styles that Text doesn't support such as `resizeMode`.`
 *
 * type Props = {style: TextStyleProp}
 * const MyComponent = (props: Props) => <Text style={props.style} />
 */
export type TextStyleProp = ____TextStyleProp_Internal;

/**
 * This type should be used as the type for a prop that is passed through
 * to an <Image>'s `style` prop. This ensures call sites of the component
 * can't pass styles that Image doesn't support such as `fontSize`.`
 *
 * type Props = {style: ImageStyleProp}
 * const MyComponent = (props: Props) => <Image style={props.style} />
 */
export type ImageStyleProp = ____ImageStyleProp_Internal;

/**
 * WARNING: You probably shouldn't be using this type. This type
 * is similar to the ones above except it allows styles that are accepted
 * by all of View, Text, or Image. It is therefore very unsafe to pass this
 * through to an underlying component. Using this is almost always a mistake
 * and using one of the other more restrictive types is likely the right choice.
 */
export type DangerouslyImpreciseStyleProp =
  ____DangerouslyImpreciseStyleProp_Internal;

/**
 * Utility type for getting the values for specific style keys.
 *
 * The following is bad because position is more restrictive than 'string':
 * ```
 * type Props = {position: string};
 * ```
 *
 * You should use the following instead:
 *
 * ```
 * type Props = {position: TypeForStyleKey<'position'>};
 * ```
 *
 * This will correctly give you the type 'absolute' | 'relative'
 */
export type TypeForStyleKey<
  +key: $Keys<____DangerouslyImpreciseStyle_Internal>,
> = $ElementType<____DangerouslyImpreciseStyle_Internal, key>;

/**
 * This type is an object of the different possible style
 * properties that can be specified for View.
 *
 * Note that this isn't a safe way to type a style prop for a component as
 * results from StyleSheet.create return an internal identifier, not
 * an object of styles.
 *
 * If you want to type the style prop of a function,
 * consider using ViewStyleProp.
 *
 * A reasonable usage of this type is for helper functions that return an
 * object of styles to pass to a View that can't be precomputed with
 * StyleSheet.create.
 */
export type ViewStyle = ____ViewStyle_Internal;

/**
 * This type is an object of the different possible style
 * properties that can be specified for Text.
 *
 * Note that this isn't a safe way to type a style prop for a component as
 * results from StyleSheet.create return an internal identifier, not
 * an object of styles.
 *
 * If you want to type the style prop of a function,
 * consider using TextStyleProp.
 *
 * A reasonable usage of this type is for helper functions that return an
 * object of styles to pass to a Text that can't be precomputed with
 * StyleSheet.create.
 */
export type TextStyle = ____TextStyle_Internal;

/**
 * This type is an object of the different possible style
 * properties that can be specified for Image.
 *
 * Note that this isn't a safe way to type a style prop for a component as
 * results from StyleSheet.create return an internal identifier, not
 * an object of styles.
 *
 * If you want to type the style prop of a function,
 * consider using ImageStyleProp.
 *
 * A reasonable usage of this type is for helper functions that return an
 * object of styles to pass to an Image that can't be precomputed with
 * StyleSheet.create.
 */
export type ImageStyle = ____ImageStyle_Internal;

/**
 * WARNING: You probably shouldn't be using this type. This type is an object
 * with all possible style keys and their values. Note that this isn't
 * a safe way to type a style prop for a component as results from
 * StyleSheet.create return an internal identifier, not an object of styles.
 *
 * If you want to type the style prop of a function, consider using
 * ViewStyleProp, TextStyleProp, or ImageStyleProp.
 *
 * This should only be used by very core utilities that operate on an object
 * containing any possible style value.
 */
export type DangerouslyImpreciseStyle = ____DangerouslyImpreciseStyle_Internal;

let hairlineWidth: number = PixelRatio.roundToNearestPixel(0.4);
if (hairlineWidth === 0) {
  hairlineWidth = 1 / PixelRatio.get();
}

const absoluteFill: {
  +bottom: 0,
  +left: 0,
  +position: 'absolute',
  +right: 0,
  +top: 0,
} = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};
if (__DEV__) {
  Object.freeze(absoluteFill);
}

/**
 * A StyleSheet is an abstraction similar to CSS StyleSheets
 *
 * Create a new StyleSheet:
 *
 * ```
 * const styles = StyleSheet.create({
 *   container: {
 *     borderRadius: 4,
 *     borderWidth: 0.5,
 *     borderColor: '#d6d7da',
 *   },
 *   title: {
 *     fontSize: 19,
 *     fontWeight: 'bold',
 *   },
 *   activeTitle: {
 *     color: 'red',
 *   },
 * });
 * ```
 *
 * Use a StyleSheet:
 *
 * ```
 * <View style={styles.container}>
 *   <Text style={[styles.title, this.props.isActive && styles.activeTitle]} />
 * </View>
 * ```
 *
 * Code quality:
 *
 *  - By moving styles away from the render function, you're making the code
 *    easier to understand.
 *  - Naming the styles is a good way to add meaning to the low level components
 *  in the render function, and encourage reuse.
 *  - In most IDEs, using `StyleSheet.create()` will offer static type checking
 *  and suggestions to help you write valid styles.
 *
 */
module.exports = {
  /**
   * This is defined as the width of a thin line on the platform. It can be
   * used as the thickness of a border or division between two elements.
   * Example:
   * ```
   *   {
   *     borderBottomColor: '#bbb',
   *     borderBottomWidth: StyleSheet.hairlineWidth
   *   }
   * ```
   *
   * This constant will always be a round number of pixels (so a line defined
   * by it look crisp) and will try to match the standard width of a thin line
   * on the underlying platform. However, you should not rely on it being a
   * constant size, because on different platforms and screen densities its
   * value may be calculated differently.
   *
   * A line with hairline width may not be visible if your simulator is downscaled.
   */
  hairlineWidth,

  /**
   * A very common pattern is to create overlays with position absolute and zero positioning,
   * so `absoluteFill` can be used for convenience and to reduce duplication of these repeated
   * styles.
   */
  absoluteFill: (absoluteFill: any), // TODO: This should be updated after we fix downstream Flow sites.

  /**
   * Sometimes you may want `absoluteFill` but with a couple tweaks - `absoluteFillObject` can be
   * used to create a customized entry in a `StyleSheet`, e.g.:
   *
   *   const styles = StyleSheet.create({
   *     wrapper: {
   *       ...StyleSheet.absoluteFillObject,
   *       top: 10,
   *       backgroundColor: 'transparent',
   *     },
   *   });
   */
  absoluteFillObject: absoluteFill,

  /**
   * Combines two styles such that `style2` will override any styles in `style1`.
   * If either style is falsy, the other one is returned without allocating an
   * array, saving allocations and maintaining reference equality for
   * PureComponent checks.
   */
  compose: composeStyles,

  /**
   * Flattens an array of style objects, into one aggregated style object.
   *
   * Example:
   * ```
   * const styles = StyleSheet.create({
   *   listItem: {
   *     flex: 1,
   *     fontSize: 16,
   *     color: 'white'
   *   },
   *   selectedListItem: {
   *     color: 'green'
   *   }
   * });
   *
   * StyleSheet.flatten([styles.listItem, styles.selectedListItem])
   * // returns { flex: 1, fontSize: 16, color: 'green' }
   * ```
   */
  flatten,

  /**
   * WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will
   * not be reliably announced. The whole thing might be deleted, who knows? Use
   * at your own risk.
   *
   * Sets a function to use to pre-process a style property value. This is used
   * internally to process color and transform values. You should not use this
   * unless you really know what you are doing and have exhausted other options.
   */
  setStyleAttributePreprocessor(
    property: string,
    process: (nextProp: mixed) => mixed,
  ) {
    let value;

    if (ReactNativeStyleAttributes[property] === true) {
      value = {process};
    } else if (typeof ReactNativeStyleAttributes[property] === 'object') {
      value = {...ReactNativeStyleAttributes[property], process};
    } else {
      console.error(`${property} is not a valid style attribute`);
      return;
    }

    if (
      __DEV__ &&
      typeof value.process === 'function' &&
      typeof ReactNativeStyleAttributes[property]?.process === 'function' &&
      value.process !== ReactNativeStyleAttributes[property]?.process
    ) {
      console.warn(`Overwriting ${property} style attribute preprocessor`);
    }

    ReactNativeStyleAttributes[property] = value;
  },

  /**
   * An identity function for creating style sheets.
   */
  // $FlowFixMe[unsupported-variance-annotation]
  create<+S: ____Styles_Internal>(obj: S): $ReadOnly<S> {
    // TODO: This should return S as the return type. But first,
    // we need to codemod all the callsites that are typing this
    // return value as a number (even though it was opaque).
    if (__DEV__) {
      for (const key in obj) {
        if (obj[key]) {
          Object.freeze(obj[key]);
        }
      }
    }
    return obj;
  },
};
