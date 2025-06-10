/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type {AnimatedNodeConfig} from './AnimatedNode';

import {validateStyles} from '../../../src/private/animated/NativeAnimatedValidation';
import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import Platform from '../../Utilities/Platform';
import AnimatedNode from './AnimatedNode';
import AnimatedObject from './AnimatedObject';
import AnimatedTransform from './AnimatedTransform';
import AnimatedWithChildren from './AnimatedWithChildren';

export type AnimatedStyleAllowlist = $ReadOnly<{[string]: true}>;

type FlatStyle = {[string]: mixed};
type FlatStyleForWeb<TStyle: FlatStyle> = [mixed, TStyle];

function createAnimatedStyle(
  flatStyle: FlatStyle,
  allowlist: ?AnimatedStyleAllowlist,
  keepUnanimatedValues: boolean,
): [$ReadOnlyArray<string>, $ReadOnlyArray<AnimatedNode>, {[string]: mixed}] {
  const nodeKeys: Array<string> = [];
  const nodes: Array<AnimatedNode> = [];
  const style: {[string]: mixed} = {};

  const keys = Object.keys(flatStyle);
  for (let ii = 0, length = keys.length; ii < length; ii++) {
    const key = keys[ii];
    const value = flatStyle[key];

    if (allowlist == null || hasOwn(allowlist, key)) {
      let node;
      if (value != null && key === 'transform') {
        node = ReactNativeFeatureFlags.shouldUseAnimatedObjectForTransform()
          ? AnimatedObject.from(value)
          : // $FlowFixMe[incompatible-call] - `value` is mixed.
            AnimatedTransform.from(value);
      } else if (value instanceof AnimatedNode) {
        node = value;
      } else {
        node = AnimatedObject.from(value);
      }
      if (node == null) {
        if (keepUnanimatedValues) {
          style[key] = value;
        }
      } else {
        nodeKeys.push(key);
        nodes.push(node);
        style[key] = node;
      }
    } else {
      if (__DEV__) {
        // WARNING: This is a potentially expensive check that we should only
        // do in development. Without this check in development, it might be
        // difficult to identify which styles need to be allowlisted.
        if (AnimatedObject.from(flatStyle[key]) != null) {
          console.error(
            `AnimatedStyle: ${key} is not allowlisted for animation, but ` +
              'it contains AnimatedNode values; styles allowing animation: ',
            allowlist,
          );
        }
      }
      if (keepUnanimatedValues) {
        style[key] = value;
      }
    }
  }

  return [nodeKeys, nodes, style];
}

export default class AnimatedStyle extends AnimatedWithChildren {
  #originalStyleForWeb: ?mixed;
  #nodeKeys: $ReadOnlyArray<string>;
  #nodes: $ReadOnlyArray<AnimatedNode>;
  #style: {[string]: mixed};

  /**
   * Creates an `AnimatedStyle` if `value` contains `AnimatedNode` instances.
   * Otherwise, returns `null`.
   */
  static from(
    flatStyle: ?FlatStyle,
    allowlist: ?AnimatedStyleAllowlist,
    originalStyleForWeb: ?mixed,
  ): ?AnimatedStyle {
    if (flatStyle == null) {
      return null;
    }
    const [nodeKeys, nodes, style] = createAnimatedStyle(
      flatStyle,
      allowlist,
      Platform.OS !== 'web',
    );
    if (nodes.length === 0) {
      return null;
    }
    return new AnimatedStyle(nodeKeys, nodes, style, originalStyleForWeb);
  }

  constructor(
    nodeKeys: $ReadOnlyArray<string>,
    nodes: $ReadOnlyArray<AnimatedNode>,
    style: {[string]: mixed},
    originalStyleForWeb: ?mixed,
    config?: ?AnimatedNodeConfig,
  ) {
    super(config);
    this.#nodeKeys = nodeKeys;
    this.#nodes = nodes;
    this.#style = style;

    if ((Platform.OS as string) === 'web') {
      // $FlowIgnore[cannot-write] - Intentional shadowing.
      this.__getValueForStyle = resultStyle => [
        originalStyleForWeb,
        resultStyle,
      ];
    }
  }

  __getValue(): FlatStyleForWeb<FlatStyle> | FlatStyle {
    const style: {[string]: mixed} = {};

    const keys = Object.keys(this.#style);
    for (let ii = 0, length = keys.length; ii < length; ii++) {
      const key = keys[ii];
      const value = this.#style[key];

      if (value instanceof AnimatedNode) {
        style[key] = value.__getValue();
      } else {
        style[key] = value;
      }
    }

    return this.__getValueForStyle(style);
  }

  /**
   * See the constructor, where this is shadowed on web platforms.
   */
  __getValueForStyle<TStyle: FlatStyle>(
    style: TStyle,
  ): FlatStyleForWeb<TStyle> | TStyle {
    return style;
  }

  /**
   * Mutates the supplied `style` object such that animated nodes are replaced
   * with rasterized values.
   */
  __replaceAnimatedNodeWithValues(style: {[string]: mixed}): void {
    const keys = Object.keys(style);
    for (let ii = 0, length = keys.length; ii < length; ii++) {
      const key = keys[ii];
      const maybeNode = this.#style[key];

      if (key === 'transform' && maybeNode instanceof AnimatedTransform) {
        style[key] = maybeNode.__getValueWithStaticTransforms(
          // NOTE: This check should not be necessary, but the types are not
          // enforced as of this writing.
          Array.isArray(style[key]) ? style[key] : [],
        );
      } else if (maybeNode instanceof AnimatedObject) {
        style[key] = maybeNode.__getValueWithStaticObject(style[key]);
      } else if (maybeNode instanceof AnimatedNode) {
        style[key] = maybeNode.__getValue();
      }
    }
  }

  __getAnimatedValue(): Object {
    const style: {[string]: mixed} = {};

    const nodeKeys = this.#nodeKeys;
    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const key = nodeKeys[ii];
      const node = nodes[ii];
      style[key] = node.__getAnimatedValue();
    }

    return style;
  }

  __attach(): void {
    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__addChild(this);
    }
    super.__attach();
  }

  __detach(): void {
    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__removeChild(this);
    }
    super.__detach();
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__makeNative(platformConfig);
    }
    super.__makeNative(platformConfig);
  }

  __getNativeConfig(): Object {
    const platformConfig = this.__getPlatformConfig();
    const styleConfig: {[string]: ?number} = {};

    const nodeKeys = this.#nodeKeys;
    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const key = nodeKeys[ii];
      const node = nodes[ii];
      node.__makeNative(platformConfig);
      styleConfig[key] = node.__getNativeTag();
    }

    if (__DEV__) {
      validateStyles(styleConfig);
    }
    return {
      type: 'style',
      style: styleConfig,
      debugID: this.__getDebugID(),
    };
  }
}

// Supported versions of JSC do not implement the newer Object.hasOwn. Remove
// this shim when they do.
// $FlowIgnore[method-unbinding]
const _hasOwnProp = Object.prototype.hasOwnProperty;
const hasOwn: (obj: $ReadOnly<{...}>, prop: string) => boolean =
  // $FlowIgnore[method-unbinding]
  Object.hasOwn ?? ((obj, prop) => _hasOwnProp.call(obj, prop));
