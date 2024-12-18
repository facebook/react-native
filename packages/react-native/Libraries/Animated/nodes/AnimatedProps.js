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
import type {AnimatedStyleAllowlist} from './AnimatedStyle';

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import {findNodeHandle} from '../../ReactNative/RendererProxy';
import {AnimatedEvent} from '../AnimatedEvent';
import AnimatedNode from './AnimatedNode';
import AnimatedObject from './AnimatedObject';
import AnimatedStyle from './AnimatedStyle';
import invariant from 'invariant';

export type AnimatedPropsAllowlist = $ReadOnly<{
  style?: ?AnimatedStyleAllowlist,
  [string]: true,
}>;

function createAnimatedProps(
  inputProps: {[string]: mixed},
  allowlist: ?AnimatedPropsAllowlist,
): [$ReadOnlyArray<string>, $ReadOnlyArray<AnimatedNode>, {[string]: mixed}] {
  const nodeKeys: Array<string> = [];
  const nodes: Array<AnimatedNode> = [];
  const props: {[string]: mixed} = {};

  const keys = Object.keys(inputProps);
  for (let ii = 0, length = keys.length; ii < length; ii++) {
    const key = keys[ii];
    const value = inputProps[key];

    if (allowlist == null || hasOwn(allowlist, key)) {
      let node;
      if (key === 'style') {
        node = AnimatedStyle.from(value, allowlist?.style);
      } else if (value instanceof AnimatedNode) {
        node = value;
      } else {
        node = AnimatedObject.from(value);
      }
      if (node == null) {
        props[key] = value;
      } else {
        nodeKeys.push(key);
        nodes.push(node);
        props[key] = node;
      }
    } else {
      if (__DEV__) {
        // WARNING: This is a potentially expensive check that we should only
        // do in development. Without this check in development, it might be
        // difficult to identify which props need to be allowlisted.
        if (AnimatedObject.from(inputProps[key]) != null) {
          console.error(
            `AnimatedProps: ${key} is not allowlisted for animation, but it ` +
              'contains AnimatedNode values; props allowing animation: ',
            allowlist,
          );
        }
      }
      props[key] = value;
    }
  }

  return [nodeKeys, nodes, props];
}

export default class AnimatedProps extends AnimatedNode {
  #animatedView: any = null;
  #callback: () => void;
  #nodeKeys: $ReadOnlyArray<string>;
  #nodes: $ReadOnlyArray<AnimatedNode>;
  #props: {[string]: mixed};

  constructor(
    inputProps: {[string]: mixed},
    callback: () => void,
    allowlist?: ?AnimatedPropsAllowlist,
    config?: ?AnimatedNodeConfig,
  ) {
    super(config);
    const [nodeKeys, nodes, props] = createAnimatedProps(inputProps, allowlist);
    this.#nodeKeys = nodeKeys;
    this.#nodes = nodes;
    this.#props = props;
    this.#callback = callback;
  }

  __getValue(): Object {
    const props: {[string]: mixed} = {};

    const keys = Object.keys(this.#props);
    for (let ii = 0, length = keys.length; ii < length; ii++) {
      const key = keys[ii];
      const value = this.#props[key];

      if (value instanceof AnimatedNode) {
        props[key] = value.__getValue();
      } else if (value instanceof AnimatedEvent) {
        props[key] = value.__getHandler();
      } else {
        props[key] = value;
      }
    }

    return props;
  }

  /**
   * Creates a new `props` object that contains the same props as the supplied
   * `staticProps` object, except with animated nodes for any props that were
   * created by this `AnimatedProps` instance.
   */
  __getValueWithStaticProps(staticProps: Object): Object {
    const props: {[string]: mixed} = {...staticProps};

    const keys = Object.keys(staticProps);
    for (let ii = 0, length = keys.length; ii < length; ii++) {
      const key = keys[ii];
      const maybeNode = this.#props[key];

      if (key === 'style' && maybeNode instanceof AnimatedStyle) {
        props[key] = maybeNode.__getValueWithStaticStyle(staticProps.style);
      } else if (maybeNode instanceof AnimatedNode) {
        props[key] = maybeNode.__getValue();
      } else if (maybeNode instanceof AnimatedEvent) {
        props[key] = maybeNode.__getHandler();
      }
    }

    return props;
  }

  __getAnimatedValue(): Object {
    const props: {[string]: mixed} = {};

    const nodeKeys = this.#nodeKeys;
    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const key = nodeKeys[ii];
      const node = nodes[ii];
      props[key] = node.__getAnimatedValue();
    }

    return props;
  }

  __attach(): void {
    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__addChild(this);
    }
  }

  __detach(): void {
    if (this.__isNative && this.#animatedView) {
      this.__disconnectAnimatedView();
    }
    this.#animatedView = null;

    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__removeChild(this);
    }

    super.__detach();
  }

  update(): void {
    this.#callback();
  }

  __makeNative(platformConfig: ?PlatformConfig): void {
    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__makeNative(platformConfig);
    }

    if (!this.__isNative) {
      this.__isNative = true;

      // Since this does not call the super.__makeNative, we need to store the
      // supplied platformConfig here, before calling __connectAnimatedView
      // where it will be needed to traverse the graph of attached values.
      super.__setPlatformConfig(platformConfig);

      if (this.#animatedView) {
        this.__connectAnimatedView();
      }
    }
  }

  setNativeView(animatedView: any): void {
    if (this.#animatedView === animatedView) {
      return;
    }
    this.#animatedView = animatedView;
    if (this.__isNative) {
      this.__connectAnimatedView();
    }
  }

  __connectAnimatedView(): void {
    invariant(this.__isNative, 'Expected node to be marked as "native"');
    let nativeViewTag: ?number = findNodeHandle(this.#animatedView);
    if (nativeViewTag == null) {
      if (process.env.NODE_ENV === 'test') {
        nativeViewTag = -1;
      } else {
        throw new Error('Unable to locate attached view in the native tree');
      }
    }
    NativeAnimatedHelper.API.connectAnimatedNodeToView(
      this.__getNativeTag(),
      nativeViewTag,
    );
  }

  __disconnectAnimatedView(): void {
    invariant(this.__isNative, 'Expected node to be marked as "native"');
    let nativeViewTag: ?number = findNodeHandle(this.#animatedView);
    if (nativeViewTag == null) {
      if (process.env.NODE_ENV === 'test') {
        nativeViewTag = -1;
      } else {
        throw new Error('Unable to locate attached view in the native tree');
      }
    }
    NativeAnimatedHelper.API.disconnectAnimatedNodeFromView(
      this.__getNativeTag(),
      nativeViewTag,
    );
  }

  __restoreDefaultValues(): void {
    // When using the native driver, view properties need to be restored to
    // their default values manually since react no longer tracks them. This
    // is needed to handle cases where a prop driven by native animated is removed
    // after having been changed natively by an animation.
    if (this.__isNative) {
      NativeAnimatedHelper.API.restoreDefaultValues(this.__getNativeTag());
    }
  }

  __getNativeConfig(): Object {
    const platformConfig = this.__getPlatformConfig();
    const propsConfig: {[string]: number} = {};

    const nodeKeys = this.#nodeKeys;
    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const key = nodeKeys[ii];
      const node = nodes[ii];
      node.__makeNative(platformConfig);
      propsConfig[key] = node.__getNativeTag();
    }

    return {
      type: 'props',
      props: propsConfig,
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
