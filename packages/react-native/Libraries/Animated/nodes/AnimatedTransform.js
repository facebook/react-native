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

import type {PlatformConfig} from '../AnimatedPlatformConfig';

import NativeAnimatedHelper from '../NativeAnimatedHelper';
import AnimatedNode from './AnimatedNode';
import AnimatedWithChildren from './AnimatedWithChildren';

type Transform<T = AnimatedNode> = {
  [string]:
    | number
    | string
    | T
    | $ReadOnlyArray<number | string | T>
    | {[string]: number | string | T},
};

export default class AnimatedTransform extends AnimatedWithChildren {
  _transforms: $ReadOnlyArray<Transform<>>;

  constructor(transforms: $ReadOnlyArray<Transform<>>) {
    super();
    this._transforms = transforms;
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          value.__makeNative(platformConfig);
        }
      }
    });
    super.__makeNative(platformConfig);
  }

  __getValue(): $ReadOnlyArray<Transform<any>> {
    return mapTransforms(this._transforms, animatedNode =>
      animatedNode.__getValue(),
    );
  }

  __getAnimatedValue(): $ReadOnlyArray<Transform<any>> {
    return mapTransforms(this._transforms, animatedNode =>
      animatedNode.__getAnimatedValue(),
    );
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
    const transConfigs: Array<any> = [];

    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        if (value instanceof AnimatedNode) {
          transConfigs.push({
            type: 'animated',
            property: key,
            nodeTag: value.__getNativeTag(),
          });
        } else {
          transConfigs.push({
            type: 'static',
            property: key,
            /* $FlowFixMe[incompatible-call] - `value` can be an array or an
               object. This is not currently handled by `transformDataType`.
               Migrating to `TransformObject` might solve this. */
            value: NativeAnimatedHelper.transformDataType(value),
          });
        }
      }
    });

    NativeAnimatedHelper.validateTransform(transConfigs);
    return {
      type: 'transform',
      transforms: transConfigs,
    };
  }
}

function mapTransforms<T>(
  transforms: $ReadOnlyArray<Transform<>>,
  mapFunction: AnimatedNode => T,
): $ReadOnlyArray<Transform<T>> {
  return transforms.map(transform => {
    const result: Transform<T> = {};
    for (const key in transform) {
      const value = transform[key];
      if (value instanceof AnimatedNode) {
        result[key] = mapFunction(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map(element =>
          element instanceof AnimatedNode ? mapFunction(element) : element,
        );
      } else if (typeof value === 'object') {
        const object: {[string]: number | string | T} = {};
        for (const propertyName in value) {
          const propertyValue = value[propertyName];
          object[propertyName] =
            propertyValue instanceof AnimatedNode
              ? mapFunction(propertyValue)
              : propertyValue;
        }
        result[key] = object;
      } else {
        result[key] = value;
      }
    }
    return result;
  });
}
