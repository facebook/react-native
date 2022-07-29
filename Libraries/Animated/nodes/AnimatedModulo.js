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

const AnimatedInterpolation = require('./AnimatedInterpolation');
const AnimatedNode = require('./AnimatedNode');
const AnimatedWithChildren = require('./AnimatedWithChildren');

import type {InterpolationConfigType} from './AnimatedInterpolation';
import type {PlatformConfig} from '../AnimatedPlatformConfig';

class AnimatedModulo extends AnimatedWithChildren {
  _a: AnimatedNode;
  _modulus: number;

  constructor(a: AnimatedNode, modulus: number) {
    super();
    this._a = a;
    this._modulus = modulus;
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this._a.__makeNative(platformConfig);
    super.__makeNative(platformConfig);
  }

  __getValue(): number {
    return (
      ((this._a.__getValue() % this._modulus) + this._modulus) % this._modulus
    );
  }

  interpolate<OutputT: number | string>(
    config: InterpolationConfigType<OutputT>,
  ): AnimatedInterpolation<OutputT> {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._a.__addChild(this);
  }

  __detach(): void {
    this._a.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'modulus',
      input: this._a.__getNativeTag(),
      modulus: this._modulus,
    };
  }
}

module.exports = AnimatedModulo;
