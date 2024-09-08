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

import {findNodeHandle} from '../../ReactNative/RendererProxy';
import {AnimatedEvent} from '../AnimatedEvent';
import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import AnimatedNode from './AnimatedNode';
import AnimatedObject from './AnimatedObject';
import AnimatedStyle from './AnimatedStyle';
import invariant from 'invariant';

function createAnimatedProps(inputProps: {
  [string]: mixed,
}): [$ReadOnlyArray<string>, $ReadOnlyArray<AnimatedNode>, {[string]: mixed}] {
  const nodeKeys: Array<string> = [];
  const nodes: Array<AnimatedNode> = [];
  const props: {[string]: mixed} = {};

  const keys = Object.keys(inputProps);
  for (let ii = 0, length = keys.length; ii < length; ii++) {
    const key = keys[ii];
    const value = inputProps[key];

    if (key === 'style') {
      const node = AnimatedStyle.from(value);
      if (node == null) {
        props[key] = value;
      } else {
        nodeKeys.push(key);
        nodes.push(node);
        props[key] = node;
      }
    } else if (value instanceof AnimatedNode) {
      const node = value;
      nodeKeys.push(key);
      nodes.push(node);
      props[key] = node;
    } else {
      const node = AnimatedObject.from(value);
      if (node == null) {
        props[key] = value;
      } else {
        nodeKeys.push(key);
        nodes.push(node);
        props[key] = node;
      }
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

  constructor(inputProps: {[string]: mixed}, callback: () => void) {
    super();
    const [nodeKeys, nodes, props] = createAnimatedProps(inputProps);
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
    const nativeViewTag: ?number = findNodeHandle(this.#animatedView);
    invariant(
      nativeViewTag != null,
      'Unable to locate attached view in the native tree',
    );
    NativeAnimatedHelper.API.connectAnimatedNodeToView(
      this.__getNativeTag(),
      nativeViewTag,
    );
  }

  __disconnectAnimatedView(): void {
    invariant(this.__isNative, 'Expected node to be marked as "native"');
    const nativeViewTag: ?number = findNodeHandle(this.#animatedView);
    invariant(
      nativeViewTag != null,
      'Unable to locate attached view in the native tree',
    );
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
    };
  }
}
