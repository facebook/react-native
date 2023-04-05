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

import AnimatedNode from './AnimatedNode';
import AnimatedWithChildren from './AnimatedWithChildren';
import * as React from 'react';

const MAX_DEPTH = 5;

function isPlainObject(value: any): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value).isPrototypeOf(Object)
  );
}

// Recurse through values, executing fn for any AnimatedNodes
function visit(value: any, fn: any => void, depth: number = 0): void {
  if (depth >= MAX_DEPTH) {
    return;
  }

  if (value instanceof AnimatedNode) {
    fn(value);
  } else if (Array.isArray(value)) {
    value.forEach(element => {
      visit(element, fn, depth + 1);
    });
  } else if (isPlainObject(value)) {
    Object.values(value).forEach(element => {
      visit(element, fn, depth + 1);
    });
  }
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
    for (const key in value) {
      result[key] = mapAnimatedNodes(value[key], fn, depth + 1);
    }
    return result;
  } else {
    return value;
  }
}

export function hasAnimatedNode(value: any, depth: number = 0): boolean {
  if (depth >= MAX_DEPTH) {
    return false;
  }

  if (value instanceof AnimatedNode) {
    return true;
  } else if (Array.isArray(value)) {
    for (const element of value) {
      if (hasAnimatedNode(element, depth + 1)) {
        return true;
      }
    }
  } else if (isPlainObject(value)) {
    // Don't consider React elements
    if (React.isValidElement(value)) {
      return false;
    }
    for (const key in value) {
      if (hasAnimatedNode(value[key], depth + 1)) {
        return true;
      }
    }
  }
  return false;
}

export default class AnimatedObject extends AnimatedWithChildren {
  _value: any;

  constructor(value: any) {
    super();
    this._value = value;
  }

  __getValue(): any {
    return mapAnimatedNodes(this._value, node => {
      return node.__getValue();
    });
  }

  __getAnimatedValue(): any {
    return mapAnimatedNodes(this._value, node => {
      return node.__getAnimatedValue();
    });
  }

  __attach(): void {
    super.__attach();
    visit(this._value, node => {
      node.__addChild(this);
    });
  }

  __detach(): void {
    visit(this._value, node => {
      node.__removeChild(this);
    });
    super.__detach();
  }

  __makeNative(platformConfig: ?PlatformConfig): void {
    visit(this._value, value => {
      value.__makeNative(platformConfig);
    });
    super.__makeNative(platformConfig);
  }

  __getNativeConfig(): any {
    return {
      type: 'object',
      value: mapAnimatedNodes(this._value, node => {
        return {nodeTag: node.__getNativeTag()};
      }),
    };
  }
}
