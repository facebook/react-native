/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {ImageStyle, TextStyle, ViewStyle} from './StyleSheetTypes';

export interface StyleSheetProperties {
  hairlineWidth: number;
  flatten<T extends string>(style: T): T;
}

type Falsy = undefined | null | false;
interface RecursiveArray<T>
  extends Array<T | ReadonlyArray<T> | RecursiveArray<T>> {}
/** Keep a brand of 'T' so that calls to `StyleSheet.flatten` can take `RegisteredStyle<T>` and return `T`. */
type RegisteredStyle<T> = number & {__registeredStyleBrand: T};
export type StyleProp<T> =
  | T
  | RegisteredStyle<T>
  | RecursiveArray<T | RegisteredStyle<T> | Falsy>
  | Falsy;

type OpaqueColorValue = symbol & {__TYPE__: 'Color'};
export type ColorValue = string | OpaqueColorValue;

export namespace StyleSheet {
  type NamedStyles<T> = {[P in keyof T]: ViewStyle | TextStyle | ImageStyle};

  /**
   * Creates a StyleSheet style reference from the given object.
   */
  export function create<T extends NamedStyles<T> | NamedStyles<any>>(
    styles: T | NamedStyles<T>,
  ): T;

  /**
   * Flattens an array of style objects, into one aggregated style object.
   * Alternatively, this method can be used to lookup IDs, returned by
   * StyleSheet.register.
   *
   * > **NOTE**: Exercise caution as abusing this can tax you in terms of
   * > optimizations.
   * >
   * > IDs enable optimizations through the bridge and memory in general. Referring
   * > to style objects directly will deprive you of these optimizations.
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
   * Alternative use:
   * ```
   * StyleSheet.flatten(styles.listItem);
   * // return { flex: 1, fontSize: 16, color: 'white' }
   * // Simply styles.listItem would return its ID (number)
   * ```
   * This method internally uses `StyleSheetRegistry.getStyleByID(style)`
   * to resolve style objects represented by IDs. Thus, an array of style
   * objects (instances of StyleSheet.create), are individually resolved to,
   * their respective objects, merged as one and then returned. This also explains
   * the alternative use.
   */
  export function flatten<T>(
    style?: StyleProp<T>,
  ): T extends (infer U)[] ? U : T;

  /**
   * Combines two styles such that style2 will override any styles in style1.
   * If either style is falsy, the other one is returned without allocating
   * an array, saving allocations and maintaining reference equality for
   * PureComponent checks.
   */
  export function compose<T>(
    style1: StyleProp<T> | Array<StyleProp<T>>,
    style2: StyleProp<T> | Array<StyleProp<T>>,
  ): StyleProp<T>;

  /**
   * WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will
   * not be reliably announced. The whole thing might be deleted, who knows? Use
   * at your own risk.
   *
   * Sets a function to use to pre-process a style property value. This is used
   * internally to process color and transform values. You should not use this
   * unless you really know what you are doing and have exhausted other options.
   */
  export function setStyleAttributePreprocessor(
    property: string,
    process: (nextProp: any) => any,
  ): void;

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
   */
  export const hairlineWidth: number;

  interface AbsoluteFillStyle {
    position: 'absolute';
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }

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
  export const absoluteFillObject: AbsoluteFillStyle;

  /**
   * A very common pattern is to create overlays with position absolute and zero positioning,
   * so `absoluteFill` can be used for convenience and to reduce duplication of these repeated
   * styles.
   */
  export const absoluteFill: RegisteredStyle<AbsoluteFillStyle>;
}
