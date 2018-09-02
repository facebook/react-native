/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const AnimatedNode = require('./AnimatedNode');
const AnimatedWithChildren = require('./AnimatedWithChildren');
const NativeAnimatedHelper = require('../NativeAnimatedHelper');

const areEqual = require('fbjs/lib/areEqual');

function createNativeConfig(inputTransform) {
  const transConfigs = [];

  inputTransform.forEach(transform => {
    for (const key in transform) {
      const value = transform[key];
      if (value instanceof AnimatedNode && value.__isNative) {
        transConfigs.push({
          type: 'animated',
          property: key,
          nodeTag: value.__getNativeTag(),
        });
      } else {
        transConfigs.push({
          type: 'static',
          property: key,
          value,
        });
      }
    }
  });
  return transConfigs;
}

function createOrReuseTransformNode(
  transform: $ReadOnlyArray<Object>,
  oldNode: ?AnimatedTransform,
) {
  if (oldNode && oldNode.__isNative) {
    const config = createNativeConfig(transform);
    if (areEqual(config, oldNode._nativeConfig)) {
      return oldNode;
    }
  }
  return new AnimatedTransform(transform);
}

class AnimatedTransform extends AnimatedWithChildren {
  _transforms: $ReadOnlyArray<Object>;
  _nativeConfig: $ReadOnlyArray<Object>;

  constructor(transforms: $ReadOnlyArray<Object>) {
    super();

    this._transforms = transforms;
  }

  __makeNative() {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          value.__makeNative();
        }
      }
    });

    super.__makeNative();
  }

  __getValue(): $ReadOnlyArray<Object> {
    return this._transforms.map(transform => {
      const result = {};
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          result[key] = value.__getValue();
        } else {
          result[key] = value;
        }
      }
      return result;
    });
  }

  __getAnimatedValue(): $ReadOnlyArray<Object> {
    return this._transforms.map(transform => {
      const result = {};
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          result[key] = value.__getAnimatedValue();
        } else {
          // All transform components needed to recompose matrix
          result[key] = value;
        }
      }
      return result;
    });
  }

  __attach(): void {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          value.__addChild(this);
        }
      }
    });
  }

  __detach(): void {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          value.__removeChild(this);
        }
      }
    });
    super.__detach();
  }

  __getNativeConfig(): any {
    if (this._nativeConfig == null) {
      this._nativeConfig = createNativeConfig(this._transforms);
    }

    NativeAnimatedHelper.validateTransform(this._nativeConfig);

    return {
      type: 'transform',
      transforms: this._nativeConfig,
    };
  }
}

module.exports = {createOrReuseTransformNode, AnimatedTransform};
