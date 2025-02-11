/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

'use strict';

import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type {AnimatedNodeConfig} from './AnimatedNode';

import AnimatedNode from './AnimatedNode';
import AnimatedWithChildren from './AnimatedWithChildren';
import * as React from 'react';

const MAX_DEPTH = 5;

export function isPlainObject(
  value: mixed,
  /* $FlowIssue[incompatible-type-guard] - Flow does not know that the prototype
     and ReactElement checks preserve the type refinement of `value`. */
): value is $ReadOnly<{[string]: mixed}> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value).isPrototypeOf(Object) &&
    !React.isValidElement(value)
  );
}

function flatAnimatedNodes(
  value: mixed,
  nodes: Array<AnimatedNode> = [],
  depth: number = 0,
): Array<AnimatedNode> {
  if (depth >= MAX_DEPTH) {
    return nodes;
  }
  if (value instanceof AnimatedNode) {
    nodes.push(value);
  } else if (Array.isArray(value)) {
    for (let ii = 0, length = value.length; ii < length; ii++) {
      const element = value[ii];
      flatAnimatedNodes(element, nodes, depth + 1);
    }
  } else if (isPlainObject(value)) {
    const keys = Object.keys(value);
    for (let ii = 0, length = keys.length; ii < length; ii++) {
      const key = keys[ii];
      flatAnimatedNodes(value[key], nodes, depth + 1);
    }
  }
  return nodes;
}

// Returns a copy of value with a transformation fn applied to any AnimatedNodes
function mapAnimatedNodes(value: any, fn: any => any, depth: number = 0): any {
  if (depth >= MAX_DEPTH) {
    return value;
  }

  if (value instanceof AnimatedNode) {
    return fn(value);
  } else if (Array.isArray(value)) {
    return value.map(element => mapAnimatedNodes(element, fn, depth + 1));
  } else if (isPlainObject(value)) {
    const result: {[string]: any} = {};
    const keys = Object.keys(value);
    for (let ii = 0, length = keys.length; ii < length; ii++) {
      const key = keys[ii];
      result[key] = mapAnimatedNodes(value[key], fn, depth + 1);
    }
    return result;
  } else {
    return value;
  }
}

export default class AnimatedObject extends AnimatedWithChildren {
  #nodes: $ReadOnlyArray<AnimatedNode>;
  _value: mixed;

  /**
   * Creates an `AnimatedObject` if `value` contains `AnimatedNode` instances.
   * Otherwise, returns `null`.
   */
  static from(value: mixed): ?AnimatedObject {
    const nodes = flatAnimatedNodes(value);
    if (nodes.length === 0) {
      return null;
    }
    return new AnimatedObject(nodes, value);
  }

  /**
   * Should only be called by `AnimatedObject.from`.
   */
  constructor(
    nodes: $ReadOnlyArray<AnimatedNode>,
    value: mixed,
    config?: ?AnimatedNodeConfig,
  ) {
    super(config);
    this.#nodes = nodes;
    this._value = value;
  }

  __getValue(): any {
    return mapAnimatedNodes(this._value, node => {
      return node.__getValue();
    });
  }

  __getValueWithStaticObject(staticObject: mixed): any {
    const nodes = this.#nodes;
    let index = 0;
    // NOTE: We can depend on `this._value` and `staticObject` sharing a
    // structure because of `useAnimatedPropsMemo`.
    return mapAnimatedNodes(staticObject, () => nodes[index++].__getValue());
  }

  __getAnimatedValue(): any {
    return mapAnimatedNodes(this._value, node => {
      return node.__getAnimatedValue();
    });
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

  __makeNative(platformConfig: ?PlatformConfig): void {
    const nodes = this.#nodes;
    for (let ii = 0, length = nodes.length; ii < length; ii++) {
      const node = nodes[ii];
      node.__makeNative(platformConfig);
    }
    super.__makeNative(platformConfig);
  }

  __getNativeConfig(): any {
    return {
      type: 'object',
      value: mapAnimatedNodes(this._value, node => {
        return {nodeTag: node.__getNativeTag()};
      }),
      debugID: this.__getDebugID(),
    };
  }
}
